import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';

function periodNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function dueDateFor(period: string, dueDay = 10) {
  const [year, month] = period.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return new Date(year, month - 1, Math.min(dueDay, lastDay), 23, 59, 59);
}

function parsePackageExcelPrice(packageExcel?: string | null) {
  if (!packageExcel) return 0;

  // Most imported package names contain the monthly base price immediately
  // before "exc PPN", e.g. "Home 20 199.000 exc PPN 11%".
  const explicitPrice = packageExcel.match(/(\d{2,3}[.,]\d{3,4})\s*exc\s*PPN/i)?.[1];
  if (explicitPrice) {
    let digits = explicitPrice.replace(/\D/g, '');

    // Correct a known imported typo such as 237.5000 -> 237.500.
    if (digits.length === 7 && digits.endsWith('0')) {
      digits = digits.slice(0, 6);
    }

    const amount = Number(digits);
    return Number.isFinite(amount) ? amount : 0;
  }

  // Fallback for imported names that only encode price using "k",
  // e.g. "wireless 280k 10Mbps".
  const kPrice = packageExcel.match(/(?:^|\s)(\d{2,3})k(?:\s|$)/i)?.[1];
  if (kPrice) return Number(kPrice) * 1000;

  return 0;
}

function resolveCustomerAmount(customer: {
  package?: { price: number } | null;
  packageExcel?: string | null;
}) {
  const linkedPrice = customer.package?.price ?? 0;
  if (linkedPrice > 0) return linkedPrice;
  return parsePackageExcelPrice(customer.packageExcel);
}

async function refreshOverdue() {
  const now = new Date();
  const unpaid = await db.invoice.findMany({ where: { status: 'UNPAID' }, include: { customer: true } });

  for (const invoice of unpaid) {
    const grace = invoice.customer.gracePeriod ?? 3;
    const isolateAt = new Date(invoice.dueDate);
    isolateAt.setDate(isolateAt.getDate() + grace);

    if (now > isolateAt) {
      await db.$transaction([
        db.invoice.update({ where: { id: invoice.id }, data: { status: 'OVERDUE' } }),
        db.customer.update({ where: { id: invoice.customerId }, data: { serviceStatus: 'ISOLIR' } }),
      ]);
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await refreshOverdue();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const period = searchParams.get('period') || periodNow();

    const invoices = await db.invoice.findMany({
      where: {
        period,
        ...(status ? { status } : {}),
        ...(search
          ? {
              customer: {
                OR: [
                  { fullName: { contains: search, mode: 'insensitive' } },
                  { customerNumber: { contains: search, mode: 'insensitive' } },
                  { pppoeUsername: { contains: search, mode: 'insensitive' } },
                ],
              },
            }
          : {}),
      },
      include: { customer: { include: { package: true } } },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });

    const all = await db.invoice.findMany({ where: { period }, select: { status: true, amount: true } });
    const stats = {
      total: all.length,
      unpaid: all.filter((i) => i.status === 'UNPAID').length,
      overdue: all.filter((i) => i.status === 'OVERDUE').length,
      paid: all.filter((i) => i.status === 'PAID').length,
      revenue: all.filter((i) => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0),
    };

    return NextResponse.json({ invoices, stats, period });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    console.error('Billing GET error:', error);
    return NextResponse.json({ error: 'Gagal memuat billing' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const period = body.period || periodNow();

    const customers = await db.customer.findMany({
      where: { status: { notIn: ['TERMINATED', 'INACTIVE'] } },
      include: { package: true },
    });

    let processed = 0;
    let repaired = 0;
    let missingPrice = 0;

    for (const customer of customers) {
      const amount = resolveCustomerAmount(customer);
      if (amount <= 0) missingPrice++;

      const existing = await db.invoice.findUnique({
        where: { customerId_period: { customerId: customer.id, period } },
      });

      if (!existing) {
        await db.invoice.create({
          data: {
            customerId: customer.id,
            period,
            amount,
            dueDate: dueDateFor(period, customer.dueDay ?? 10),
          },
        });
      } else if (existing.amount === 0 && amount > 0) {
        await db.invoice.update({ where: { id: existing.id }, data: { amount } });
        repaired++;
      }

      processed++;
    }

    return NextResponse.json({ success: true, processed, repaired, missingPrice, period });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    console.error('Billing POST error:', error);
    return NextResponse.json({ error: 'Gagal membuat tagihan' }, { status: 500 });
  }
}
