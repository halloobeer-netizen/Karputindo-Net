import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    const session = await requireAuth();

    const packages = await db.internetPackage.findMany({
      orderBy: { price: 'asc' },
      include: {
        _count: {
          select: { customers: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: packages });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    return NextResponse.json(
      { success: false, error: 'Gagal memuat paket' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { name, speed, price, description } = body;

    if (!name || !speed || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'Nama, kecepatan, dan harga wajib diisi' },
        { status: 400 }
      );
    }

    const pkg = await db.internetPackage.create({
      data: {
        name,
        speed,
        price: Number(price),
        description: description || null,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE_CUSTOMER',
      entity: 'InternetPackage',
      entityId: pkg.id,
    });

    return NextResponse.json({ success: true, data: pkg }, { status: 201 });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    return NextResponse.json(
      { success: false, error: 'Gagal menambah paket' },
      { status: 500 }
    );
  }
}
