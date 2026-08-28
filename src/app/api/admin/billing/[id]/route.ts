import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { getMikrotikProvider, type DesiredServiceStatus } from '@/lib/mikrotik/provider';

async function syncNetwork(username: string | null, desiredStatus: DesiredServiceStatus) {
  if (!username) {
    return {
      status: 'SKIPPED',
      message: 'PPPoE username belum diatur untuk pelanggan ini.',
    };
  }

  try {
    const result = await getMikrotikProvider().setPppoeService(username, desiredStatus);
    return {
      status: result.mode === 'SIMULATION' ? 'SIMULATED' : 'SYNCED',
      message: result.message,
    };
  } catch (error) {
    console.error('MikroTik sync error:', error);
    return {
      status: 'FAILED',
      message: 'Status aplikasi tersimpan, tetapi sinkronisasi MikroTik gagal.',
    };
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await context.params;
    const body = await request.json();
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: { customer: { select: { pppoeUsername: true } } },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });
    }

    if (body.action === 'PAY') {
      await db.$transaction([
        db.invoice.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } }),
        db.customer.update({ where: { id: invoice.customerId }, data: { serviceStatus: 'ACTIVE' } }),
      ]);
      const networkSync = await syncNetwork(invoice.customer.pppoeUsername, 'ACTIVE');
      return NextResponse.json({
        success: true,
        status: 'PAID',
        serviceStatus: 'ACTIVE',
        networkSync,
      });
    }

    if (body.action === 'ISOLATE') {
      await db.customer.update({ where: { id: invoice.customerId }, data: { serviceStatus: 'ISOLIR' } });
      const networkSync = await syncNetwork(invoice.customer.pppoeUsername, 'ISOLIR');
      return NextResponse.json({ success: true, serviceStatus: 'ISOLIR', networkSync });
    }

    if (body.action === 'ACTIVATE') {
      await db.customer.update({ where: { id: invoice.customerId }, data: { serviceStatus: 'ACTIVE' } });
      const networkSync = await syncNetwork(invoice.customer.pppoeUsername, 'ACTIVE');
      return NextResponse.json({ success: true, serviceStatus: 'ACTIVE', networkSync });
    }

    return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    console.error('Billing PATCH error:', error);
    return NextResponse.json({ error: 'Gagal memproses aksi billing' }, { status: 500 });
  }
}
