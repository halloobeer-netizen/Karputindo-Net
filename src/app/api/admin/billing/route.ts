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

async function refreshOverdue() {
  const now = new Date();
  const candidates = await db.invoice.findMany({
    where: { status: 'UNPAID', dueDate: { lt: now } },
    select: { id: true, customerId: true, dueDate: true, customer: { select: { gracePeriod: true } } },
  });

  const expired = candidates.filter((invoice) => {
    const isolateAt = new Date(invoice.dueDate);
    isolateAt.setDate(isolateAt.getDate() + (invoice.customer.gracePeriod ?? 3));
    return now > isolateAt;
  });

  if (!expired.length) return;

  const invoiceIds = expired.map((item) => item.id);
  const customerIds = [...new Set(expired.map((item) => item.customerId))];
  await db.$transaction([
    db.invoice.updateMany({ where: { id: { in: invoiceIds } }, data: { status: 'OVERDUE' } }),
    db.customer.updateMany({ where: { id: { in: customerIds } }, data: { serviceStatus: 'ISOLIR' } }),
  ]);
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await refreshOverdue();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const period = searchParams.get('period') || periodNow();
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.min(100, Math.max(10, Number(searchParams.get('pageSize') || 50)));

    const where = {
      period,
      ...(status ? { status } : {}),
      ...(search
        ? {
            customer: {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' as const } },
                { customerNumber: { contains: search, mode: 'insensitive' as const } },
                { pppoeUsername: { contains: search, mode: 'insensitive' as const } },
              ],
            },
          }
        : {}),
    };

    const [invoices, filteredTotal, grouped] = await Promise.all([
      db.invoice.findMany({
        where,
        include: { customer: { include: { package: true } } },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.invoice.count({ where }),
      db.invoice.groupBy({
        by: ['status'],
        where: { period },
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);

    const count = (key: string) => grouped.find((g) => g.status === key)?._count._all ?? 0;
    const paidGroup = grouped.find((g) => g.status === 'PAID');
    const total = grouped.reduce((sum, g) => sum + g._count._all, 0);
    const stats = {
      total,
      unpaid: count('UNPAID'),
      overdue: count('OVERDUE'),
      paid: count('PAID'),
      revenue: paidGroup?._sum.amount ?? 0,
    };

    return NextResponse.json({
      invoices,
      stats,
      period,
      pagination: {
        page,
        pageSize,
        total: filteredTotal,
        totalPages: Math.max(1, Math.ceil(filteredTotal / pageSize)),
      },
    });
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
    for (const customer of customers) {
      const amount = customer.package?.price ?? parseImportedPrice(customer.packageExcel);
      await db.invoice.upsert({
        where: { customerId_period: { customerId: customer.id, period } },
        update: { ...(amount > 0 ? { amount } : {}) },
        create: {
          customerId: customer.id,
          period,
          amount,
          dueDate: dueDateFor(period, customer.dueDay ?? 10),
        },
      });
      processed++;
    }

    return NextResponse.json({ success: true, processed, period });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    console.error('Billing POST error:', error);
    return NextResponse.json({ error: 'Gagal membuat tagihan' }, { status: 500 });
  }
}
