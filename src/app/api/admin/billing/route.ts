import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { getMikrotikProvider } from '@/lib/mikrotik/provider';

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
    select: {
      id: true,
      customerId: true,
      dueDate: true,
      customer: { select: { gracePeriod: true, pppoeUsername: true } },
    },
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

  const provider = getMikrotikProvider();
  await Promise.allSettled(
    expired
      .map((item) => item.customer.pppoeUsername?.trim())
      .filter((username): username is string => Boolean(username))
      .map((username) => provider.setPppoeService(username, 'ISOLIR'))
  );
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

    let snapshot: Awaited<ReturnType<ReturnType<typeof getMikrotikProvider>['getSnapshot']>> | null = null;
    let providerError: string | null = null;
    try {
      snapshot = await getMikrotikProvider().getSnapshot();
    } catch (error) {
      providerError = error instanceof Error ? error.message : 'MIKROTIK_UNAVAILABLE';
    }

    const sessionMap = new Map(
      (snapshot?.sessions ?? []).map((session) => [session.username.toLowerCase(), session])
    );

    const invoicesWithNetwork = invoices.map((invoice) => {
      const username = invoice.customer.pppoeUsername?.trim();
      if (!username) {
        return {
          ...invoice,
          networkSync: {
            status: 'UNMAPPED' as const,
            pppoeStatus: null,
            mode: snapshot?.router.mode ?? null,
            message: 'Username PPPoE belum diatur.',
          },
        };
      }

      if (providerError) {
        return {
          ...invoice,
          networkSync: {
            status: 'FAILED' as const,
            pppoeStatus: null,
            mode: null,
            message: providerError,
          },
        };
      }

      const session = sessionMap.get(username.toLowerCase());
      if (!session) {
        return {
          ...invoice,
          networkSync: {
            status: 'NOT_FOUND' as const,
            pppoeStatus: null,
            mode: snapshot?.router.mode ?? null,
            message: 'PPPoE belum ditemukan di MikroTik.',
          },
        };
      }

      const desiredIsolated = invoice.customer.serviceStatus === 'ISOLIR';
      const routerIsolated = session.status === 'ISOLATED' || session.status === 'DISABLED';
      const synced = desiredIsolated === routerIsolated;

      return {
        ...invoice,
        networkSync: {
          status: synced ? ('SYNCED' as const) : ('PENDING' as const),
          pppoeStatus: session.status,
          mode: snapshot?.router.mode ?? null,
          message: synced
            ? 'Status layanan dan MikroTik sesuai.'
            : 'Status layanan menunggu sinkronisasi MikroTik.',
        },
      };
    });

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
      invoices: invoicesWithNetwork,
      stats,
      period,
      mikrotik: {
        mode: snapshot?.router.mode ?? null,
        routerStatus: snapshot?.router.status ?? 'OFFLINE',
        generatedAt: snapshot?.generatedAt ?? null,
        error: providerError,
      },
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
      const existing = await db.invoice.findUnique({
        where: { customerId_period: { customerId: customer.id, period } },
        select: { id: true, status: true, amount: true },
      });

      if (existing) {
        if (existing.status !== 'PAID' && existing.amount === 0 && amount > 0) {
          await db.invoice.update({ where: { id: existing.id }, data: { amount } });
        }
      } else {
        await db.invoice.create({
          data: {
            customerId: customer.id,
            period,
            amount,
            dueDate: dueDateFor(period, customer.dueDay ?? 10),
          },
        });
      }
      processed++;
    }

    return NextResponse.json({ success: true, processed, period });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    console.error('Billing POST error:', error);
    return NextResponse.json({ error: 'Gagal membuat tagihan' }, { status: 500 });
  }
}
