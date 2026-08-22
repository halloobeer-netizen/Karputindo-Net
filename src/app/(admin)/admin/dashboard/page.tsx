'use client';

import { useEffect, useState } from 'react';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { GrowthChart } from '@/components/dashboard/growth-chart';
import type { DashboardStats, CustomerGrowthData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [growthData, setGrowthData] = useState<CustomerGrowthData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch('/api/admin/dashboard/stats');
        const json = await res.json();

        if (json.success && json.data) {
          setStats(json.data.stats);
          setGrowthData(json.data.growthData);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
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
        <h1 className="text-2xl font-bold text-[#171717]">Dashboard</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Ringkasan data pelanggan Karputindo Net
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={isLoading} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Growth Chart - takes 2 columns on xl */}
        <div className="xl:col-span-2">
          <GrowthChart data={growthData} isLoading={isLoading} />
        </div>

        {/* Recent Activity Placeholder */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#171717] flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-[#171717]">Belum ada aktivitas</p>
                  <p className="text-xs text-[#6B7280]">
                    Aktivitas akan ditampilkan di sini
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
