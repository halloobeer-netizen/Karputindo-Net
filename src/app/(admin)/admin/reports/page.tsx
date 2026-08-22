'use client';

import Link from 'next/link';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Laporan</span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#171717]">Laporan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Laporan dan analitik data pelanggan
        </p>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-lg border border-border p-12 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <BarChart3 className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Segera Hadir</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Fitur laporan sedang dalam pengembangan.
          Anda akan dapat melihat laporan bulanan, tren pertumbuhan pelanggan, dan analitik pendapatan.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4" />
          <span>Laporan bulanan, tren, dan analitik</span>
        </div>
      </div>
    </div>
  );
}
