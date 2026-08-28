import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { getMikrotikProvider, type DesiredServiceStatus } from '@/lib/mikrotik/provider';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json().catch(() => ({}));
    const invoiceId = typeof body.invoiceId === 'string' ? body.invoiceId : null;
    const limit = Math.min(100, Math.max(1, Number(body.limit || 50)));

    const invoices = await db.invoice.findMany({
      where: invoiceId ? { id: invoiceId } : { customer: { pppoeUsername: { not: null } } },
      select: {
        id: true,
        customer: { select: { fullName: true, pppoeUsername: true, serviceStatus: true } },
      },
      orderBy: { updatedAt: 'asc' },
      take: invoiceId ? 1 : limit,
    });

    const provider = getMikrotikProvider();
    let snapshot;
    try {
      snapshot = await provider.getSnapshot();
    } catch (error) {
      return NextResponse.json({
        success: false,
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'MikroTik tidak dapat dihubungi.',
        attempted: 0,
        synced: 0,
        failed: 0,
        skipped: invoices.length,
      }, { status: 503 });
    }

    const sessionMap = new Map(snapshot.sessions.map((session) => [session.username.toLowerCase(), session]));
    const results: Array<Record<string, unknown>> = [];

    for (const invoice of invoices) {
      const username = invoice.customer.pppoeUsername?.trim();
      if (!username) {
        results.push({ invoiceId: invoice.id, customer: invoice.customer.fullName, status: 'UNMAPPED' });
        continue;
      }

      const session = sessionMap.get(username.toLowerCase());
      if (!session) {
        results.push({ invoiceId: invoice.id, customer: invoice.customer.fullName, username, status: 'NOT_FOUND' });
        continue;
      }

      const desiredStatus: DesiredServiceStatus = invoice.customer.serviceStatus === 'ISOLIR' ? 'ISOLIR' : 'ACTIVE';
      const routerIsolated = session.status === 'ISOLATED' || session.status === 'DISABLED';
      const alreadySynced = (desiredStatus === 'ISOLIR') === routerIsolated;

      if (alreadySynced) {
        results.push({ invoiceId: invoice.id, customer: invoice.customer.fullName, username, status: 'SYNCED', changed: false });
        continue;
      }

      try {
        const result = await provider.setPppoeService(username, desiredStatus);
        results.push({
          invoiceId: invoice.id,
          customer: invoice.customer.fullName,
          username,
          status: result.success ? (result.mode === 'SIMULATION' ? 'SIMULATED' : 'SYNCED') : 'FAILED',
          changed: result.success,
          message: result.message,
        });
      } catch (error) {
        results.push({
          invoiceId: invoice.id,
          customer: invoice.customer.fullName,
          username,
          status: 'FAILED',
          changed: false,
          message: error instanceof Error ? error.message : 'Sinkronisasi gagal.',
        });
      }
    }

    const failed = results.filter((item) => item.status === 'FAILED').length;
    const synced = results.filter((item) => item.status === 'SYNCED' || item.status === 'SIMULATED').length;
    const skipped = results.filter((item) => item.status === 'UNMAPPED' || item.status === 'NOT_FOUND').length;

    return NextResponse.json({
      success: failed === 0,
      mode: snapshot.router.mode,
      routerStatus: snapshot.router.status,
      attempted: results.length,
      synced,
      failed,
      skipped,
      results,
    });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    console.error('Billing sync retry error:', error);
    return NextResponse.json({ error: 'Gagal menjalankan sinkronisasi MikroTik' }, { status: 500 });
  }
}
