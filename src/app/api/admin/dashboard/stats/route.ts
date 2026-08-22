import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { DashboardStats, CustomerGrowthData, RecentCustomer, PackageExcelCategory, StatusDistribution, CUSTOMER_STATUS_LABELS, CustomerStatus } from '@/types';

export async function GET() {
  try {
    await requireAuth();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      totalCustomers,
      activeCustomers,
      installationCustomers,
      terminatedCustomers,
      totalPackages,
      withCoordinates,
      withoutCoordinates,
      newInstallationsThisMonth,
    ] = await Promise.all([
      db.customer.count(),
      db.customer.count({ where: { status: 'ACTIVE' } }),
      db.customer.count({ where: { status: 'INSTALLATION' } }),
      db.customer.count({ where: { status: 'TERMINATED' } }),
      db.internetPackage.count({ where: { status: 'ACTIVE' } }),
      db.customer.count({ where: { latitude: { not: null }, longitude: { not: null } } }),
      db.customer.count({ where: { OR: [{ latitude: null }, { longitude: null }] } }),
      db.customer.count({
        where: { installationDate: { gte: startOfMonth, lt: endOfMonth } },
      }),
    ]);

    const stats: DashboardStats = {
      totalCustomers,
      activeCustomers,
      installationCustomers,
      terminatedCustomers,
      totalPackages,
      withCoordinates,
      withoutCoordinates,
      newInstallationsThisMonth,
    };

    // Recent customers (last 5)
    const recentCustomers: RecentCustomer[] = await db.customer.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        customerNumber: true,
        fullName: true,
        status: true,
        packageExcel: true,
        createdAt: true,
      },
    });

    // PackageExcel category analysis
    const rawPackages = await db.customer.groupBy({
      by: ['packageExcel'],
      where: { packageExcel: { not: null } },
      _count: { packageExcel: true },
      orderBy: { _count: { packageExcel: 'desc' } },
    });

    const categoryMap = new Map<string, { name: string; count: number }[]>();
    for (const row of rawPackages) {
      const pkg = row.packageExcel!;
      const category = pkg.split(' ')[0]; // GINESIA, HOME, WIRELESS
      if (!categoryMap.has(category)) categoryMap.set(category, []);
      categoryMap.get(category)!.push({ name: pkg, count: row._count.packageExcel });
    }
    const packageExcelCategories: PackageExcelCategory[] = Array.from(categoryMap.entries())
      .map(([category, packages]) => ({
        category,
        count: packages.reduce((sum, p) => sum + p.count, 0),
        packages,
      }))
      .sort((a, b) => b.count - a.count);

    // Status distribution
    const statuses: CustomerStatus[] = ['ACTIVE', 'INSTALLATION', 'INACTIVE', 'TERMINATED', 'SUSPENDED', 'ISOLIR'];
    const statusCounts = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await db.customer.count({ where: { status } }),
      }))
    );
    const statusDistribution: StatusDistribution[] = statusCounts
      .filter((s) => s.count > 0)
      .map((s) => ({
        status: s.status,
        label: CUSTOMER_STATUS_LABELS[s.status],
        count: s.count,
      }))
      .sort((a, b) => b.count - a.count);

    // Growth data (6 months)
    const growthData: CustomerGrowthData[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('id-ID', { year: '2-digit', month: 'short' });

      const [total, aktif, berhenti] = await Promise.all([
        db.customer.count({ where: { createdAt: { lt: monthEnd } } }),
        db.customer.count({ where: { status: 'ACTIVE', createdAt: { lt: monthEnd } } }),
        db.customer.count({ where: { status: 'TERMINATED', createdAt: { lt: monthEnd } } }),
      ]);

      growthData.push({ month: monthName, total, aktif, berhenti });
    }

    return NextResponse.json({
      success: true,
      data: { stats, growthData, recentCustomers, packageExcelCategories, statusDistribution },
    });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ success: false, error: 'Gagal memuat data dashboard' }, { status: 500 });
  }
}
