'use client';

import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Package,
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
    color: 'text-[#C51F2A]',
    bgColor: 'bg-red-50',
  },
  {
    key: 'activeCustomers' as const,
    label: 'Pelanggan Aktif',
    icon: UserCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    key: 'terminatedCustomers' as const,
    label: 'Pelanggan Berhenti',
    icon: UserX,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
  },
  {
    key: 'installationCustomers' as const,
    label: 'Proses Pemasangan',
    icon: UserPlus,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
  {
    key: 'totalPackages' as const,
    label: 'Paket Internet',
    icon: Package,
    color: 'text-[#C51F2A]',
    bgColor: 'bg-red-50',
  },
];

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="bg-white rounded-xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-11 h-11 rounded-xl" />
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statsConfig.map((config) => {
        const value = stats[config.key];
        return (
          <Card key={config.key} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl ${config.bgColor} flex items-center justify-center shrink-0`}>
                  <config.icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280] truncate">
                    {config.label}
                  </p>
                  <p className="text-2xl font-bold text-[#171717] leading-tight">
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
