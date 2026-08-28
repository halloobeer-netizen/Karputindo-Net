'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, MapPinOff, Pencil, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CUSTOMER_STATUS_LABELS } from '@/types';
import type { CustomerStatus, PaginatedResponse } from '@/types';

interface CustomerRow {
  id: string;
  customerNumber: string;
  fullName: string;
  phone1: string | null;
  address: string | null;
  status: CustomerStatus;
  packageExcel: string | null;
  latitude: number | null;
  longitude: number | null;
  package: { name: string } | null;
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  INSTALLATION: 'bg-orange-100 text-orange-800 border-orange-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
  TERMINATED: 'bg-red-100 text-red-800 border-red-200',
  SUSPENDED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ISOLIR: 'bg-purple-100 text-purple-800 border-purple-200',
};

export default function MissingCoordinatesCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '100',
        coordinates: 'missing',
      });
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      const json: PaginatedResponse<CustomerRow> = await res.json();

      if (json.success && json.data) {
        setCustomers(json.data);
      } else {
        setError(json.error || 'Gagal memuat pelanggan tanpa koordinat');
      }
    } catch {
      setError('Terjadi kesalahan saat mengambil data pelanggan');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 250);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/admin/dashboard" className="hover:text-foreground">Dashboard</Link>
            <span>/</span>
            <Link href="/admin/customers" className="hover:text-foreground">Pelanggan</Link>
            <span>/</span>
            <span className="font-medium text-foreground">Tanpa Koordinat</span>
          </div>
          <h1 className="text-2xl font-bold text-[#171717]">Pelanggan Tanpa Koordinat</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daftar pelanggan yang latitude atau longitude-nya masih kosong.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Semua Pelanggan
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
        Setelah koordinat disimpan melalui tombol <strong>Edit</strong>, pelanggan otomatis tidak akan muncul lagi di daftar ini.
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, nomor pelanggan, telepon, alamat..."
            className="pl-9"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <MapPinOff className="h-5 w-5 text-orange-500" />
            <p className="font-semibold text-[#171717]">{isLoading ? 'Memuat...' : `${customers.length} pelanggan perlu diperbaiki`}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                <TableHead>NO PELANGGAN</TableHead>
                <TableHead>NAMA PELANGGAN</TableHead>
                <TableHead>NO TELEPON</TableHead>
                <TableHead>PAKET</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>KOORDINAT</TableHead>
                <TableHead className="text-center">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="mx-auto h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <MapPinOff className="h-8 w-8" />
                      <p className="font-medium text-foreground">Tidak ada pelanggan tanpa koordinat.</p>
                      <p className="text-sm">Semua pelanggan sudah memiliki koordinat lengkap.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.customerNumber || '-'}</TableCell>
                    <TableCell className="font-medium text-[#171717]">{customer.fullName}</TableCell>
                    <TableCell>{customer.phone1 || '-'}</TableCell>
                    <TableCell>{customer.packageExcel || customer.package?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_BADGE_CLASSES[customer.status]}>
                        {CUSTOMER_STATUS_LABELS[customer.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-orange-700">
                        {customer.latitude == null && customer.longitude == null
                          ? 'Latitude & Longitude kosong'
                          : customer.latitude == null
                            ? 'Latitude kosong'
                            : 'Longitude kosong'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button asChild size="sm" className="bg-[#C51F2A] text-white hover:bg-[#A71922]">
                        <Link href={`/admin/customers/${customer.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
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
