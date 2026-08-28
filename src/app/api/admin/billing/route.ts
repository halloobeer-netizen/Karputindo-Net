import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function periodNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function dueDateFor(period: string, dueDay = 10) {
  const [year, month] = period.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return new Date(year, month - 1, Math.min(dueDay, lastDay), 23, 59, 59);
}

async function refreshOverdue() {
  const now = new Date();
  const unpaid = await prisma.invoice.findMany({ where: { status: 'UNPAID' }, include: { customer: true } });
  for (const invoice of unpaid) {
    const grace = invoice.customer.gracePeriod ?? 3;
    const isolateAt = new Date(invoice.dueDate);
    isolateAt.setDate(isolateAt.getDate() + grace);
    if (now > isolateAt) {
      await prisma.$transaction([
        prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'OVERDUE' } }),
        prisma.customer.update({ where: { id: invoice.customerId }, data: { serviceStatus: 'ISOLIR' } }),
      ]);
    }
  }
}

export async function GET(request: NextRequest) {
  await refreshOverdue();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  const period = searchParams.get('period') || periodNow();

  const invoices = await prisma.invoice.findMany({
    where: {
      period,
      ...(status ? { status } : {}),
      ...(search ? { customer: { OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { customerNumber: { contains: search, mode: 'insensitive' } },
        { pppoeUsername: { contains: search, mode: 'insensitive' } },
      ] } } : {}),
    },
    include: { customer: { include: { package: true } } },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
  });

  const all = await prisma.invoice.findMany({ where: { period }, select: { status: true, amount: true } });
  const stats = {
    total: all.length,
    unpaid: all.filter(i => i.status === 'UNPAID').length,
    overdue: all.filter(i => i.status === 'OVERDUE').length,
    paid: all.filter(i => i.status === 'PAID').length,
    revenue: all.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0),
  };
  return NextResponse.json({ invoices, stats, period });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const period = body.period || periodNow();
  const customers = await prisma.customer.findMany({
    where: { status: { notIn: ['TERMINATED', 'INACTIVE'] } },
    include: { package: true },
  });
  let created = 0;
  for (const customer of customers) {
    const amount = customer.package?.price ?? 0;
    await prisma.invoice.upsert({
      where: { customerId_period: { customerId: customer.id, period } },
      update: {},
      create: {
        customerId: customer.id,
        period,
        amount,
        dueDate: dueDateFor(period, customer.dueDay ?? 10),
      },
    });
    created++;
  }
  return NextResponse.json({ success: true, processed: created, period });
}
