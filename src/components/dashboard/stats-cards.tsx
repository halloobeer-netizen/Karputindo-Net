'use client';

import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Package,
  MapPin,
  MapPinOff,
  CalendarPlus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardStats } from '@/types';

interface StatsCardsProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

const statsConfig = [
  {
    key: 'totalCustomers' as const,
    label: 'Total Pelanggan',
    icon: Users,
    color: 'text-gray-900',
    bgColor: 'bg-gray-100',
  },
  {
    key: 'activeCustomers' as const,
    label: 'Pelanggan Aktif',
    icon: UserCheck,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
  },
  {
    key: 'installationCustomers' as const,
    label: 'Proses Pemasangan',
    icon: UserPlus,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    key: 'terminatedCustomers' as const,
    label: 'Berhenti / Cancel',
    icon: UserX,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    key: 'withCoordinates' as const,
    label: 'Dengan Koordinat',
    icon: MapPin,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    key: 'withoutCoordinates' as const,
    label: 'Tanpa Koordinat',
    icon: MapPinOff,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    key: 'totalPackages' as const,
    label: 'Paket Internet',
    icon: Package,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  {
    key: 'newInstallationsThisMonth' as const,
    label: 'Pemasangan Bulan Ini',
    icon: CalendarPlus,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
];

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsConfig.map((config) => {
        const value = stats[config.key];
        const isAlert = config.key === 'withoutCoordinates' && value > 0;
        return (
          <Card
            key={config.key}
            className={`border-border/50 hover:shadow-md transition-shadow ${isAlert ? 'ring-2 ring-amber-400' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}>
                  <config.icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {config.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 leading-tight">
                    {value.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
