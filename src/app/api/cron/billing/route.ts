import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function periodNow() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function dueDateFor(period: string, dueDay = 10) {
  const [year, month] = period.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return new Date(Date.UTC(year, month - 1, Math.min(dueDay, lastDay), 16, 59, 59));
}

function parseImportedPrice(value?: string | null) {
  if (!value) return 0;
  const beforeTax = value.split(/exc\s*ppn/i)[0];
  const tokens = beforeTax.match(/\d{2,3}(?:[.,]\d{3,4})/g);
  if (tokens?.length) {
    const token = tokens[tokens.length - 1];
    const normalized = Number(token.replace(/[.,]/g, '').slice(0, 6));
    if (normalized >= 50000) return normalized;
  }
  const kMatch = value.match(/(?:^|\s)(\d{2,4})k(?:\s|$)/i);
  if (kMatch) return Number(kMatch[1]) * 1000;
  return 0;
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized cron request' }, { status: 401 });
  }

  try {
    const period = periodNow();
    const customers = await db.customer.findMany({
      where: { status: { notIn: ['TERMINATED', 'INACTIVE'] } },
      include: { package: true },
    });

    let createdOrUpdated = 0;
    for (const customer of customers) {
      const amount = customer.package?.price ?? parseImportedPrice(customer.packageExcel);
      await db.invoice.upsert({
        where: { customerId_period: { customerId: customer.id, period } },
        update: {
          ...(amount > 0 ? { amount } : {}),
          dueDate: dueDateFor(period, customer.dueDay ?? 10),
        },
        create: {
          customerId: customer.id,
          period,
          amount,
          dueDate: dueDateFor(period, customer.dueDay ?? 10),
        },
      });
      createdOrUpdated++;
    }

    const now = new Date();
    const unpaid = await db.invoice.findMany({
      where: { status: 'UNPAID', dueDate: { lt: now } },
      select: { id: true, customerId: true, dueDate: true, customer: { select: { gracePeriod: true } } },
    });

    const expired = unpaid.filter((invoice) => {
      const isolateAt = new Date(invoice.dueDate);
      isolateAt.setUTCDate(isolateAt.getUTCDate() + (invoice.customer.gracePeriod ?? 3));
      return now > isolateAt;
    });

    if (expired.length) {
      const invoiceIds = expired.map((item) => item.id);
      const customerIds = [...new Set(expired.map((item) => item.customerId))];
      await db.$transaction([
        db.invoice.updateMany({ where: { id: { in: invoiceIds } }, data: { status: 'OVERDUE' } }),
        db.customer.updateMany({ where: { id: { in: customerIds } }, data: { serviceStatus: 'ISOLIR' } }),
      ]);
    }

    return NextResponse.json({
      success: true,
      period,
      customersProcessed: createdOrUpdated,
      isolated: expired.length,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Billing cron error:', error);
    return NextResponse.json({ success: false, error: 'Billing cron failed' }, { status: 500 });
  }
}
