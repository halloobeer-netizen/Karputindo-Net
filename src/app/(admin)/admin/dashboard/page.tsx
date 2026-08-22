'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Users, UserCheck, UserX, UserPlus, Package, MapPin,
  AlertTriangle, Zap, BarChart3, ArrowRight, ExternalLink,
} from 'lucide-react';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { GrowthChart } from '@/components/dashboard/growth-chart';
import type {
  DashboardStats, CustomerGrowthData, RecentCustomer,
  PackageExcelCategory, StatusDistribution,
} from '@/types';
import { CUSTOMER_STATUS_LABELS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

// Status badge classes
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  INSTALLATION: 'bg-orange-100 text-orange-800 border-orange-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
  TERMINATED: 'bg-red-100 text-red-800 border-red-200',
  SUSPENDED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ISOLIR: 'bg-purple-100 text-purple-800 border-purple-200',
};

// Category colors
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  GINESIA: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  HOME: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  WIRELESS: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

type CategoryKey = keyof typeof CATEGORY_COLORS;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [growthData, setGrowthData] = useState<CustomerGrowthData[] | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>([]);
  const [packageCategories, setPackageCategories] = useState<PackageExcelCategory[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch('/api/admin/dashboard/stats');
        const json = await res.json();
        if (json.success && json.data) {
          setStats(json.data.stats);
          setGrowthData(json.data.growthData);
          setRecentCustomers(json.data.recentCustomers || []);
          setPackageCategories(json.data.packageExcelCategories || []);
          setStatusDistribution(json.data.statusDistribution || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Gagal memuat data dashboard');
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ringkasan data pelanggan Karputindo Net
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={isLoading} />

      {/* Alert: Customers without coordinates */}
      {stats && stats.withoutCoordinates > 0 && (
        <div
          className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => (window.location.href = '/admin/customers')}
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              {stats.withoutCoordinates} pelanggan belum memiliki koordinat
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Tambahkan latitude dan longitude untuk menampilkan di peta. Klik untuk ke daftar pelanggan.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-500 shrink-0" />
        </div>
      )}

      {/* Charts + Status + Quick Access */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div className="xl:col-span-2">
          <GrowthChart data={growthData} isLoading={isLoading} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick Access */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-rose-600" />
                Akses Cepat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start gap-2 text-sm">
                <Link href="/admin/customers/new">
                  <UserPlus className="w-4 h-4" /> Tambah Pelanggan
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2 text-sm">
                <Link href="/admin/import">
                  <Package className="w-4 h-4" /> Import Excel
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2 text-sm">
                <Link href="/admin/map">
                  <MapPin className="w-4 h-4" /> Peta Pelanggan
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2 text-sm">
                <Link href="/admin/packages">
                  <BarChart3 className="w-4 h-4" /> Paket Internet
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                Distribusi Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>
              ) : (
                <div className="space-y-3">
                  {statusDistribution.map((s) => {
                    const pct = stats ? ((s.count / stats.totalCustomers) * 100) : 0;
                    return (
                      <div key={s.status} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{s.label}</span>
                          <span className="font-medium text-gray-700">{s.count} ({pct.toFixed(1)}%)</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom row: Recent Customers + Package Categories */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Customers */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                Pelanggan Terbaru
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
                <Link href="/admin/customers">Lihat Semua <ArrowRight className="w-3 h-3 ml-1" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : recentCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada data pelanggan</p>
            ) : (
              <div className="space-y-2">
                {recentCustomers.map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/customers/${c.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-gray-600">
                        {c.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.customerNumber || '—'} {c.packageExcel ? `· ${c.packageExcel.split(' ').slice(0, 2).join(' ')}` : ''}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${STATUS_COLORS[c.status] || ''}`}>
                      {CUSTOMER_STATUS_LABELS[c.status]}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Package Categories from Excel */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-rose-600" />
                Paket Excel (Pelanggan Aktif)
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
                <Link href="/admin/packages">Detail <ArrowRight className="w-3 h-3 ml-1" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : packageCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada data paket Excel</p>
            ) : (
              <div className="space-y-3">
                {packageCategories.map((cat) => {
                  const colors = CATEGORY_COLORS[cat.category as CategoryKey] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                  return (
                    <div key={cat.category} className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold ${colors.text}`}>{cat.category}</span>
                        <span className={`text-xs font-semibold ${colors.text}`}>{cat.count} pelanggan</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.packages.slice(0, 5).map((p) => (
                          <Badge key={p.name} variant="outline" className={`text-[10px] ${colors.border} ${colors.text}`}>
                            {p.name.split(' ').slice(0, 2).join(' ')} <span className="ml-1 opacity-60">({p.count})</span>
                          </Badge>
                        ))}
                        {cat.packages.length > 5 && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            +{cat.packages.length - 5} lainnya
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
