'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { GrowthChart } from '@/components/dashboard/growth-chart';
import type { DashboardStats, CustomerGrowthData, RecentCustomer, StatusDistribution } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowRight, FileSpreadsheet, Map, Package, UserPlus, Users } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [growthData, setGrowthData] = useState<CustomerGrowthData[] | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>([]);
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
          setStatusDistribution(json.data.statusDistribution || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const quickAccess = [
    { label: 'Tambah Pelanggan', href: '/admin/customers/new', icon: UserPlus },
    { label: 'Import Excel', href: '/admin/import', icon: FileSpreadsheet },
    { label: 'Peta Pelanggan', href: '/admin/map', icon: Map },
    { label: 'Paket Internet', href: '/admin/packages', icon: Package },
  ];

  return (
    <div className="space-y-4 md:space-y-5">
      <section className="relative overflow-hidden rounded-xl border border-[#F1D8DA] bg-white px-5 py-5 shadow-sm md:px-7">
        <div className="relative z-10">
          <h1 className="text-xl font-extrabold text-[#171717] md:text-2xl">
            Selamat Datang di KARPUTINDO <span className="text-[#E50914]">NET</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Pantau dan kelola pelanggan internet dalam satu dashboard.</p>
        </div>
        <div className="absolute right-0 top-0 h-full w-[300px] opacity-90">
          <div className="absolute -right-8 -top-16 h-52 w-52 rotate-45 rounded-[30px] bg-gradient-to-br from-red-100 via-red-200 to-red-600" />
          <div className="absolute right-28 top-2 h-24 w-2 rotate-45 rounded-full bg-red-300/60" />
          <div className="absolute right-36 top-1 h-24 w-2 rotate-45 rounded-full bg-red-200/70" />
          <div className="absolute right-44 top-0 h-24 w-2 rotate-45 rounded-full bg-red-100" />
        </div>
      </section>

      <StatsCards stats={stats} isLoading={isLoading} />

      {stats && stats.withoutCoordinates > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600"><AlertTriangle className="h-5 w-5" /></div>
            <div>
              <p className="text-sm font-semibold text-[#171717]">Pelanggan Tanpa Koordinat</p>
              <p className="text-xs text-gray-500">{stats.withoutCoordinates} pelanggan belum memiliki koordinat peta</p>
            </div>
          </div>
          <Link href="/admin/customers" className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-xs font-semibold text-[#E50914] transition hover:bg-red-50">
            Lihat & Perbaiki <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="rounded-xl bg-white xl:col-span-4">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-bold">Akses Cepat</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {quickAccess.map((item) => (
                <Link key={item.href} href={item.href} className="group flex flex-col items-center gap-2 text-center">
                  <div className="flex h-14 w-full max-w-[72px] items-center justify-center rounded-xl border border-red-100 bg-gradient-to-br from-red-50 to-white text-[#E50914] transition group-hover:border-red-300 group-hover:shadow-sm">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-medium leading-tight text-gray-700">{item.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-white xl:col-span-4">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-bold">Distribusi Status Pelanggan</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusDistribution.length === 0 ? <p className="text-xs text-gray-400">Belum ada data status.</p> : statusDistribution.slice(0, 4).map((item, index) => {
                const total = stats?.totalCustomers || 1;
                const pct = (item.count / total) * 100;
                const colors = ['bg-green-500', 'bg-orange-500', 'bg-red-500', 'bg-gray-400'];
                return (
                  <div key={item.status}>
                    <div className="mb-1 flex items-center justify-between text-xs"><span className="text-gray-600">{item.label}</span><span className="font-semibold text-gray-800">{item.count} ({pct.toFixed(1)}%)</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${colors[index] || 'bg-gray-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="xl:col-span-4"><GrowthChart data={growthData} isLoading={isLoading} /></div>
      </div>

      <Card className="overflow-hidden rounded-xl bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
          <div><CardTitle className="text-sm font-bold">Pelanggan Terbaru</CardTitle><p className="mt-1 text-xs text-gray-500">Pelanggan terbaru yang ditambahkan</p></div>
          <Link href="/admin/customers" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold text-[#E50914] hover:bg-red-50">Lihat Semua <ArrowRight className="h-4 w-4" /></Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead><tr className="border-b"><th className="px-5 py-3">Nama Pelanggan</th><th className="px-5 py-3">No Pelanggan</th><th className="px-5 py-3">Paket</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Tanggal</th></tr></thead>
              <tbody>
                {recentCustomers.length === 0 ? <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">Belum ada pelanggan terbaru.</td></tr> : recentCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-0">
                    <td className="px-5 py-3 font-medium text-gray-800">{customer.fullName}</td>
                    <td className="px-5 py-3 text-gray-500">{customer.customerNumber || '-'}</td>
                    <td className="px-5 py-3 text-gray-600">{customer.packageExcel || '-'}</td>
                    <td className="px-5 py-3"><span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${customer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : customer.status === 'INSTALLATION' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{customer.status === 'ACTIVE' ? 'Aktif' : customer.status === 'INSTALLATION' ? 'Proses Pemasangan' : 'Berhenti / Cancel'}</span></td>
                    <td className="px-5 py-3 text-gray-500">{new Date(customer.createdAt).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
