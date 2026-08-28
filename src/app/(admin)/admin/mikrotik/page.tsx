'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  CircleGauge,
  Download,
  Network,
  RefreshCw,
  Router,
  ShieldOff,
  Signal,
  Upload,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { MikrotikSnapshot, PppoeStatus } from '@/lib/mikrotik/provider';

const statusClasses: Record<PppoeStatus, string> = {
  ONLINE: 'bg-green-100 text-green-800 border-green-200',
  OFFLINE: 'bg-gray-100 text-gray-700 border-gray-200',
  ISOLATED: 'bg-red-100 text-red-800 border-red-200',
};

export default function MikrotikPage() {
  const [snapshot, setSnapshot] = useState<MikrotikSnapshot | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/mikrotik', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Gagal memuat MikroTik');
      setSnapshot(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat MikroTik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const sessions = snapshot?.sessions ?? [];
  const totals = useMemo(() => ({
    total: sessions.length,
    online: sessions.filter((item) => item.status === 'ONLINE').length,
    offline: sessions.filter((item) => item.status === 'OFFLINE').length,
    isolated: sessions.filter((item) => item.status === 'ISOLATED').length,
  }), [sessions]);

  const filteredSessions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return sessions;
    return sessions.filter((item) =>
      [item.username, item.customerName, item.profile, item.ipAddress || '']
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    );
  }, [search, sessions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="font-medium text-foreground">MikroTik</span>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#171717]">MikroTik</h1>
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Simulation Mode</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Simulasi RouterOS API. Struktur ini disiapkan agar nanti dapat diganti ke MikroTik asli tanpa mengubah dashboard.
          </p>
        </div>
        <Button variant="outline" onClick={() => loadData(true)} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total PPPoE" value={totals.total} icon={Network} loading={loading} />
        <StatCard title="Online" value={totals.online} icon={Wifi} loading={loading} />
        <StatCard title="Offline" value={totals.offline} icon={WifiOff} loading={loading} />
        <StatCard title="Terisolir" value={totals.isolated} icon={ShieldOff} loading={loading} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">ROUTER</p>
              <h2 className="mt-1 text-lg font-bold text-[#171717]">
                {loading ? 'Memuat...' : snapshot?.router.name}
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Online
            </div>
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : snapshot ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem label="Identity" value={snapshot.router.identity} />
              <InfoItem label="Host" value={snapshot.router.host} />
              <InfoItem label="RouterOS" value={snapshot.router.routerOs} />
              <InfoItem label="Uptime" value={snapshot.router.uptime} />
              <InfoItem label="CPU Load" value={`${snapshot.router.cpuLoad}%`} />
              <InfoItem label="Memory" value={`${snapshot.router.memoryUsage}%`} />
            </div>
          ) : null}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#C51F2A]/10 text-[#C51F2A]">
              <Router className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-[#171717]">Koneksi MikroTik</h2>
              <p className="text-xs text-muted-foreground">Provider siap untuk mode Live</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border bg-[#FAFAFA] p-3">
              <span className="text-muted-foreground">Mode aktif</span>
              <p className="mt-1 font-semibold">Simulation</p>
            </div>
            <div className="rounded-lg border bg-[#FAFAFA] p-3">
              <span className="text-muted-foreground">Tahap berikutnya</span>
              <p className="mt-1 font-semibold">Host + port API + user RouterOS</p>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Saat router fisik tersedia, provider simulasi dapat diganti dengan RouterOS API tanpa mengubah halaman ini.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-[#171717]">PPPoE Sessions</h2>
            <p className="text-xs text-muted-foreground">Data pelanggan jaringan simulasi</p>
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari username, pelanggan, IP..."
            className="w-full sm:w-[300px]"
          />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                <TableHead>USERNAME</TableHead>
                <TableHead>PELANGGAN</TableHead>
                <TableHead>PROFILE</TableHead>
                <TableHead>IP ADDRESS</TableHead>
                <TableHead>UPTIME</TableHead>
                <TableHead>TRAFIK</TableHead>
                <TableHead>STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                    Tidak ada sesi PPPoE yang cocok.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-semibold">{session.username}</TableCell>
                    <TableCell>{session.customerName}</TableCell>
                    <TableCell>{session.profile}</TableCell>
                    <TableCell>{session.ipAddress || '-'}</TableCell>
                    <TableCell>{session.uptime || '-'}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5"><Download className="h-3.5 w-3.5" /> {session.downloadMbps} Mbps</div>
                        <div className="flex items-center gap-1.5 text-muted-foreground"><Upload className="h-3.5 w-3.5" /> {session.uploadMbps} Mbps</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusClasses[session.status]}>{session.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading }: { title: string; value: number; icon: typeof Activity; loading: boolean }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
          {loading ? <Skeleton className="mt-3 h-8 w-12" /> : <p className="mt-2 text-2xl font-bold text-[#171717]">{value}</p>}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#C51F2A]/10 text-[#C51F2A]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-[#FAFAFA] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-[#171717]">{value}</p>
    </div>
  );
}
