import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { getMikrotikProvider } from '@/lib/mikrotik/provider';

export async function GET() {
  try {
    await requireAuth();
    const provider = getMikrotikProvider();
    const snapshot = await provider.getSnapshot();

    return NextResponse.json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    console.error('MikroTik simulation error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data MikroTik' },
      { status: 500 }
    );
  }
}
