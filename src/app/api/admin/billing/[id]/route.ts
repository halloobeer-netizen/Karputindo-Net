import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await context.params;
    const body = await request.json();
    const invoice = await db.invoice.findUnique({ where: { id } });

    if (!invoice) {
      return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });
    }

    if (body.action === 'PAY') {
      await db.$transaction([
        db.invoice.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } }),
        db.customer.update({ where: { id: invoice.customerId }, data: { serviceStatus: 'ACTIVE' } }),
      ]);
      return NextResponse.json({ success: true, status: 'PAID', serviceStatus: 'ACTIVE' });
    }

    if (body.action === 'ISOLATE') {
      await db.customer.update({ where: { id: invoice.customerId }, data: { serviceStatus: 'ISOLIR' } });
      return NextResponse.json({ success: true, serviceStatus: 'ISOLIR' });
    }

    if (body.action === 'ACTIVATE') {
      await db.customer.update({ where: { id: invoice.customerId }, data: { serviceStatus: 'ACTIVE' } });
      return NextResponse.json({ success: true, serviceStatus: 'ACTIVE' });
    }

    return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    console.error('Billing PATCH error:', error);
    return NextResponse.json({ error: 'Gagal memproses aksi billing' }, { status: 500 });
  }
}
