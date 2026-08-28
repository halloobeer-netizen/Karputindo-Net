import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });

  if (body.action === 'PAY') {
    await prisma.$transaction([
      prisma.invoice.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } }),
      prisma.customer.update({ where: { id: invoice.customerId }, data: { serviceStatus: 'ACTIVE' } }),
    ]);
    return NextResponse.json({ success: true, status: 'PAID', serviceStatus: 'ACTIVE' });
  }

  if (body.action === 'ISOLATE') {
    await prisma.customer.update({ where: { id: invoice.customerId }, data: { serviceStatus: 'ISOLIR' } });
    return NextResponse.json({ success: true, serviceStatus: 'ISOLIR' });
  }

  if (body.action === 'ACTIVATE') {
    await prisma.customer.update({ where: { id: invoice.customerId }, data: { serviceStatus: 'ACTIVE' } });
    return NextResponse.json({ success: true, serviceStatus: 'ACTIVE' });
  }

  return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 });
}
