import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';

export async function GET() {
  try {
    await requireAuth();

    const customers = await db.customer.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        customerNumber: true,
        fullName: true,
        address: true,
        phone1: true,
        status: true,
        latitude: true,
        longitude: true,
        packageExcel: true,
        package: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data peta' },
      { status: 500 }
    );
  }
}
