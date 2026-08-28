import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getMikrotikProvider, type DesiredServiceStatus } from '@/lib/mikrotik/provider';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized cron request' }, { status: 401 });
  }

  try {
    const customers = await db.customer.findMany({
      where: {
        status: { notIn: ['TERMINATED', 'INACTIVE'] },
        pppoeUsername: { not: null },
      },
      select: {
        id: true,
        fullName: true,
        pppoeUsername: true,
        serviceStatus: true,
      },
      orderBy: { updatedAt: 'asc' },
      take: 500,
    });

    const provider = getMikrotikProvider();
    let snapshot;
    try {
      snapshot = await provider.getSnapshot();
    } catch (error) {
      return NextResponse.json({
        success: false,
        status: 'ROUTER_UNAVAILABLE',
        message: error instanceof Error ? error.message : 'MikroTik tidak dapat dihubungi.',
        checked: customers.length,
        attempted: 0,
        synced: 0,
        failed: 0,
        skipped: customers.length,
        ranAt: new Date().toISOString(),
      }, { status: 503 });
    }

    const sessionMap = new Map(
      snapshot.sessions.map((session) => [session.username.trim().toLowerCase(), session])
    );

    let attempted = 0;
    let synced = 0;
    let failed = 0;
    let alreadySynced = 0;
    let notFound = 0;
    const failures: Array<{ customerId: string; username: string; message: string }> = [];

    for (const customer of customers) {
      const username = customer.pppoeUsername?.trim();
      if (!username) continue;

      const session = sessionMap.get(username.toLowerCase());
      if (!session) {
        notFound++;
        continue;
      }

      const desiredStatus: DesiredServiceStatus = customer.serviceStatus === 'ISOLIR' ? 'ISOLIR' : 'ACTIVE';
      const routerIsolated = session.status === 'ISOLATED' || session.status === 'DISABLED';
      const isSynced = (desiredStatus === 'ISOLIR') === routerIsolated;

      if (isSynced) {
        alreadySynced++;
        continue;
      }

      attempted++;
      try {
        const result = await provider.setPppoeService(username, desiredStatus);
        if (result.success) synced++;
        else {
          failed++;
          failures.push({ customerId: customer.id, username, message: result.message });
        }
      } catch (error) {
        failed++;
        failures.push({
          customerId: customer.id,
          username,
          message: error instanceof Error ? error.message : 'Sinkronisasi gagal.',
        });
      }
    }

    return NextResponse.json({
      success: failed === 0,
      mode: snapshot.router.mode,
      routerStatus: snapshot.router.status,
      checked: customers.length,
      attempted,
      synced,
      failed,
      alreadySynced,
      notFound,
      failures: failures.slice(0, 20),
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('MikroTik auto retry cron error:', error);
    return NextResponse.json({ success: false, error: 'MikroTik auto retry cron failed' }, { status: 500 });
  }
}
