import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '25')));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const coordinates = searchParams.get('coordinates') || '';

    const where: Prisma.CustomerWhereInput = {};

    if (search) {
      where.OR = [
        { customerNumber: { contains: search } },
        { fullName: { contains: search } },
        { phone1: { contains: search } },
        { phone2: { contains: search } },
        { email: { contains: search } },
        { address: { contains: search } },
        { packageExcel: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (coordinates === 'missing') {
      const missingCoordinates: Prisma.CustomerWhereInput = {
        OR: [{ latitude: null }, { longitude: null }],
      };

      if (where.OR) {
        const searchOr = where.OR;
        delete where.OR;
        where.AND = [{ OR: searchOr }, missingCoordinates];
      } else {
        Object.assign(where, missingCoordinates);
      }
    } else if (coordinates === 'complete') {
      where.latitude = { not: null };
      where.longitude = { not: null };
    }

    const [customers, totalItems] = await Promise.all([
      db.customer.findMany({
        where,
        include: { package: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.customer.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    console.error('List customers error:', error);
    return NextResponse.json({ success: false, error: 'Gagal memuat data pelanggan' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { customerCreateSchema, sanitizeCustomerInput } = await import('@/validation/customer');
    const parsed = customerCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = sanitizeCustomerInput(parsed.data);

    const existing = await db.customer.findUnique({ where: { customerNumber: data.customerNumber } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'No Pelanggan sudah terdaftar' }, { status: 409 });
    }

    const customer = await db.customer.create({
      data: { ...data, createdBy: session.user.id, updatedBy: session.user.id },
      include: { package: true },
    });

    const { createAuditLog } = await import('@/lib/audit');
    await createAuditLog({ userId: session.user.id, action: 'CREATE_CUSTOMER', entity: 'Customer', entityId: customer.id });

    return NextResponse.json({ success: true, data: customer, message: 'Pelanggan berhasil ditambahkan' }, { status: 201 });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    console.error('Create customer error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menambahkan pelanggan' }, { status: 500 });
  }
}
