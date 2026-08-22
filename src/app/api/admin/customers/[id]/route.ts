import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const customer = await db.customer.findUnique({
      where: { id },
      include: { package: true, created_by: { select: { name: true } }, updated_by: { select: { name: true } } },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Pelanggan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    console.error('Get customer error:', error);
    return NextResponse.json({ success: false, error: 'Gagal memuat data pelanggan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const existing = await db.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Pelanggan tidak ditemukan' }, { status: 404 });
    }

    const { customerCreateSchema, sanitizeCustomerInput } = await import('@/validation/customer');
    const parsed = customerCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = sanitizeCustomerInput(parsed.data);

    if (data.customerNumber !== existing.customerNumber) {
      const dup = await db.customer.findUnique({ where: { customerNumber: data.customerNumber } });
      if (dup) {
        return NextResponse.json({ success: false, error: 'No Pelanggan sudah terdaftar' }, { status: 409 });
      }
    }

    const customer = await db.customer.update({
      where: { id },
      data: { ...data, updatedBy: session.user.id },
      include: { package: true },
    });

    const { createAuditLog } = await import('@/lib/audit');
    await createAuditLog({ userId: session.user.id, action: 'UPDATE_CUSTOMER', entity: 'Customer', entityId: id });

    return NextResponse.json({ success: true, data: customer, message: 'Data pelanggan berhasil diperbarui' });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    console.error('Update customer error:', error);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui pelanggan' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const existing = await db.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Pelanggan tidak ditemukan' }, { status: 404 });
    }

    await db.customer.delete({ where: { id } });

    const { createAuditLog } = await import('@/lib/audit');
    await createAuditLog({ userId: session.user.id, action: 'DELETE_CUSTOMER', entity: 'Customer', entityId: id });

    return NextResponse.json({ success: true, message: 'Pelanggan berhasil dihapus' });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    console.error('Delete customer error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus pelanggan' }, { status: 500 });
  }
}
