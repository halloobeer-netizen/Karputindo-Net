import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';

export async function POST(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const { customerNumbers } = body as { customerNumbers: string[] };

    if (!Array.isArray(customerNumbers)) {
      return NextResponse.json(
        { success: false, error: 'Format request tidak valid' },
        { status: 400 }
      );
    }

    const existing = await db.customer.findMany({
      where: { customerNumber: { in: customerNumbers } },
      select: { customerNumber: true },
    });

    return NextResponse.json({
      success: true,
      data: existing.map((c) => c.customerNumber),
    });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    return NextResponse.json(
      { success: false, error: 'Gagal mengecek duplikat' },
      { status: 500 }
    );
  }
}
