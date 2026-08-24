'use client';

import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  MapPin,
  MapPinOff,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardStats } from '@/types';

interface StatsCardsProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

const statsConfig = [
  { key: 'totalCustomers' as const, label: 'Total Pelanggan', icon: Users, color: 'text-red-600', bgColor: 'bg-red-50', note: (s: DashboardStats) => 'Semua pelanggan' },
  { key: 'activeCustomers' as const, label: 'Pelanggan Aktif', icon: UserCheck, color: 'text-green-600', bgColor: 'bg-green-50', note: (s: DashboardStats) => s.totalCustomers ? `${((s.activeCustomers / s.totalCustomers) * 100).toFixed(1)}% dari total` : '0% dari total' },
  { key: 'installationCustomers' as const, label: 'Proses Pemasangan', icon: UserPlus, color: 'text-orange-600', bgColor: 'bg-orange-50', note: (s: DashboardStats) => s.totalCustomers ? `${((s.installationCustomers / s.totalCustomers) * 100).toFixed(1)}% dari total` : '0% dari total' },
  { key: 'terminatedCustomers' as const, label: 'Berhenti / Cancel', icon: UserX, color: 'text-red-600', bgColor: 'bg-rose-50', note: (s: DashboardStats) => s.totalCustomers ? `${((s.terminatedCustomers / s.totalCustomers) * 100).toFixed(1)}% dari total` : '0% dari total' },
  { key: 'withCoordinates' as const, label: 'Dengan Koordinat', icon: MapPin, color: 'text-blue-600', bgColor: 'bg-blue-50', note: (s: DashboardStats) => s.totalCustomers ? `${((s.withCoordinates / s.totalCustomers) * 100).toFixed(1)}% dari total` : '0% dari total' },
  { key: 'withoutCoordinates' as const, label: 'Tanpa Koordinat', icon: MapPinOff, color: 'text-orange-600', bgColor: 'bg-orange-50', note: (s: DashboardStats) => s.totalCustomers ? `${((s.withoutCoordinates / s.totalCustomers) * 100).toFixed(1)}% dari total` : '0% dari total' },
];

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="rounded-xl bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <div className="flex-1 space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-7 w-12" /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
      {statsConfig.map((config) => {
        const value = stats[config.key];
        return (
          <Card key={config.key} className="group rounded-xl bg-white transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${config.bgColor}`}>
                  <config.icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-gray-600">{config.label}</p>
                  <p className="mt-0.5 text-[24px] font-extrabold leading-none text-[#171717]">{value.toLocaleString('id-ID')}</p>
                  <p className="mt-2 truncate text-[10px] text-gray-400">{config.note(stats)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
