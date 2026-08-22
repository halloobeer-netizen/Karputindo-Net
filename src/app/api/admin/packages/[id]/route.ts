import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const pkg = await db.internetPackage.findUnique({
      where: { id },
      include: {
        _count: { select: { customers: true } },
      },
    });

    if (!pkg) {
      return NextResponse.json(
        { success: false, error: 'Paket tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: pkg });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    return NextResponse.json(
      { success: false, error: 'Gagal memuat paket' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { name, speed, price, description, status } = body;

    const existing = await db.internetPackage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Paket tidak ditemukan' },
        { status: 404 }
      );
    }

    const pkg = await db.internetPackage.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(speed !== undefined && { speed }),
        ...(price !== undefined && { price: Number(price) }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
      },
      include: { _count: { select: { customers: true } } },
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE_CUSTOMER',
      entity: 'InternetPackage',
      entityId: pkg.id,
    });

    return NextResponse.json({ success: true, data: pkg });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    return NextResponse.json(
      { success: false, error: 'Gagal mengupdate paket' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const existing = await db.internetPackage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Paket tidak ditemukan' },
        { status: 404 }
      );
    }

    const newStatus = existing.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const pkg = await db.internetPackage.update({
      where: { id },
      data: { status: newStatus },
      include: { _count: { select: { customers: true } } },
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE_CUSTOMER',
      entity: 'InternetPackage',
      entityId: pkg.id,
    });

    return NextResponse.json({ success: true, data: pkg });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    return NextResponse.json(
      { success: false, error: 'Gagal mengubah status paket' },
      { status: 500 }
    );
  }
}
