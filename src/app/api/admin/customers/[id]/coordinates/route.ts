import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { latitude, longitude } = body;

    // Validate
    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ success: false, error: 'Latitude dan longitude wajib diisi' }, { status: 400 });
    }
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ success: false, error: 'Latitude dan longitude harus berupa angka' }, { status: 400 });
    }
    if (lat < -90 || lat > 90) {
      return NextResponse.json({ success: false, error: 'Latitude harus antara -90 dan 90' }, { status: 400 });
    }
    if (lng < -180 || lng > 180) {
      return NextResponse.json({ success: false, error: 'Longitude harus antara -180 dan 180' }, { status: 400 });
    }

    const existing = await db.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Pelanggan tidak ditemukan' }, { status: 404 });
    }

    const customer = await db.customer.update({
      where: { id },
      data: { latitude: lat, longitude: lng, updatedBy: session.user.id },
      select: { id: true, latitude: true, longitude: true, fullName: true },
    });

    const { createAuditLog } = await import('@/lib/audit');
    await createAuditLog({ userId: session.user.id, action: 'UPDATE_CUSTOMER', entity: 'Customer', entityId: id });

    return NextResponse.json({ success: true, data: customer, message: 'Koordinat berhasil diperbarui' });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    console.error('Update coordinates error:', error);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui koordinat' }, { status: 500 });
  }
}
