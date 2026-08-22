'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Search, Plus, Eye, Pencil, Trash2, X } from 'lucide-react';

import { CUSTOMER_STATUS_OPTIONS, CUSTOMER_STATUS_LABELS } from '@/types';
import type { CustomerStatus, PaginatedResponse } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ============================================
// Types
// ============================================

interface CustomerRow {
  id: string;
  customerNumber: string;
  fullName: string;
  phone1: string | null;
  email: string | null;
  address: string | null;
  status: CustomerStatus;
  installationDate: string | null;
  packageExcel: string | null;
  package: { name: string } | null;
}

// ============================================
// Status Badge Styles
// ============================================

const STATUS_BADGE_CLASSES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  INSTALLATION: 'bg-orange-100 text-orange-800 border-orange-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
  TERMINATED: 'bg-red-100 text-red-800 border-red-200',
  SUSPENDED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ISOLIR: 'bg-purple-100 text-purple-800 border-purple-200',
};

// ============================================
// Constants
// ============================================

const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
];

const DEFAULT_PAGE_SIZE = 25;
const DEBOUNCE_MS = 300;

// ============================================
// Component
// ============================================

export default function CustomersPage() {
  // --- Filter State ---
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // --- Pagination State ---
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // --- Data State ---
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Delete confirmation ---
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Debounce search input ---
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search]);

  // --- Reset page when filters change ---
  useEffect(() => {
    setPage(1);
  }, [statusFilter, pageSize]);

  // --- Fetch customers ---
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      const json: PaginatedResponse<CustomerRow> = await res.json();

      if (json.success && json.data) {
        setCustomers(json.data);
        setTotalItems(json.pagination.totalItems);
        setTotalPages(json.pagination.totalPages);
      } else {
        setError(json.error || 'Gagal memuat data pelanggan');
      }
    } catch {
      setError('Terjadi kesalahan saat mengambil data');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // --- Delete handler ---
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/customers/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (json.success) {
        toast.success('Pelanggan berhasil dihapus');
        setDeleteTarget(null);
        fetchCustomers();
      } else {
        toast.error(json.error || 'Gagal menghapus pelanggan');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus pelanggan');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Reset all filters ---
  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('ALL');
    setPageSize(DEFAULT_PAGE_SIZE);
    setPage(1);
  };

  const hasActiveFilters = search !== '' || statusFilter !== 'ALL';

  // --- Pagination display range ---
  const displayRange = useMemo(() => {
    if (totalItems === 0) return null;
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalItems);
    return { start, end };
  }, [page, pageSize, totalItems]);

  // --- Pagination page numbers ---
  const pageNumbers = useMemo(() => {
    const pages: (number | 'dots')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      if (page <= 3) {
        end = Math.min(totalPages - 1, maxVisible);
      } else if (page >= totalPages - 2) {
        start = Math.max(2, totalPages - maxVisible + 1);
      }

      if (start > 2) pages.push('dots');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('dots');

      if (totalPages > 1) pages.push(totalPages);
    }

    return pages;
  }, [page, totalPages]);

  // --- Format date ---
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6">
      {/* Breadcrumb (text only) */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/admin/dashboard"
          className="hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Pelanggan</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171717]">Pelanggan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {displayRange
              ? `Menampilkan ${displayRange.start}-${displayRange.end} dari ${totalItems} pelanggan`
              : 'Daftar pelanggan Karputindo Net'}
          </p>
        </div>
        <Button asChild className="bg-[#C51F2A] hover:bg-[#A71922] text-white shrink-0">
          <Link href="/admin/customers/new">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pelanggan
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Cari pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-[#E5E7EB] focus-visible:border-[#C51F2A] focus-visible:ring-[#C51F2A]/20"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              {CUSTOMER_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset Filter */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="shrink-0"
            >
              <X className="w-4 h-4 mr-2" />
              Reset Filter
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                <TableHead className="w-12 text-center">NO</TableHead>
                <TableHead>NO PELANGGAN</TableHead>
                <TableHead>NAMA PELANGGAN</TableHead>
                <TableHead>NO TELEPON</TableHead>
                <TableHead>PAKET</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>TANGGAL PEMASANGAN</TableHead>
                <TableHead className="text-center">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-center">
                      <Skeleton className="h-4 w-6 mx-auto" />
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64">
                    <div className="flex flex-col items-center justify-center text-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Search className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-foreground">
                          Belum ada pelanggan
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {hasActiveFilters
                            ? 'Tidak ada pelanggan yang cocok dengan filter. Coba ubah filter Anda.'
                            : 'Mulai tambahkan pelanggan baru ke sistem.'}
                        </p>
                      </div>
                      {!hasActiveFilters && (
                        <Button asChild className="bg-[#C51F2A] hover:bg-[#A71922] text-white">
                          <Link href="/admin/customers/new">
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Pelanggan
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer, index) => (
                  <TableRow key={customer.id}>
                    <TableCell className="text-center text-muted-foreground">
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {customer.customerNumber}
                    </TableCell>
                    <TableCell className="font-medium text-[#171717]">
                      {customer.fullName}
                    </TableCell>
                    <TableCell>{customer.phone1 || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {customer.packageExcel || customer.package?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_BADGE_CLASSES[customer.status]}
                      >
                        {CUSTOMER_STATUS_LABELS[customer.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(customer.installationDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Detail"
                        >
                          <Link href={`/admin/customers/${customer.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Edit"
                        >
                          <Link href={`/admin/customers/${customer.id}/edit`}>
                            <Pencil className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                          title="Hapus"
                          onClick={() => setDeleteTarget(customer)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Tampilkan</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => setPageSize(Number(val))}
              >
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>per halaman</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Sebelumnya
              </Button>

              <div className="flex items-center gap-1">
                {pageNumbers.map((pn, idx) =>
                  pn === 'dots' ? (
                    <span
                      key={`dots-${idx}`}
                      className="px-2 text-sm text-muted-foreground"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={pn}
                      variant={page === pn ? 'default' : 'outline'}
                      size="sm"
                      className={`h-8 w-8 p-0 ${page === pn ? 'bg-[#C51F2A] text-white hover:bg-[#A71922]' : ''}`}
                      onClick={() => setPage(pn)}
                    >
                      {pn}
                    </Button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pelanggan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pelanggan{' '}
              <span className="font-semibold text-foreground">
                {deleteTarget?.fullName}
              </span>{' '}
              ({deleteTarget?.customerNumber})? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
