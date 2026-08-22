'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  Wifi,
  MapPin,
  Briefcase,
  Monitor,
} from 'lucide-react';

import { CUSTOMER_STATUS_LABELS } from '@/types';
import type { CustomerStatus } from '@/types';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

interface CustomerDetail {
  id: string;
  customerNumber: string;
  fullName: string;
  phone1: string | null;
  phone2: string | null;
  email: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  packageId: string | null;
  packageExcel: string | null;
  registrationFee: number | null;
  sales: string | null;
  media: string | null;
  technician: string | null;
  spkNumber: string | null;
  spkDate: string | null;
  installationDate: string | null;
  terminationDate: string | null;
  status: CustomerStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { name: string } | null;
  updatedBy: { name: string } | null;
  package: {
    id: string;
    name: string;
    speed: number;
    price: number;
  } | null;
}

// ============================================
// Helpers
// ============================================

const STATUS_BADGE_CLASSES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  INSTALLATION: 'bg-orange-100 text-orange-800 border-orange-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
  TERMINATED: 'bg-red-100 text-red-800 border-red-200',
  SUSPENDED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ISOLIR: 'bg-purple-100 text-purple-800 border-purple-200',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatCurrency(value: number | null): string {
  if (value == null) return '-';
  return value.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  });
}

function fmt(value: string | number | null | undefined): string {
  if (value == null || value === '') return '-';
  return String(value);
}

// ============================================
// Detail Row Component
// ============================================

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-0 py-2 border-b border-border/50 last:border-0">
      <dt className="sm:w-48 shrink-0 text-sm text-muted-foreground font-medium">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

// ============================================
// Section Card Component
// ============================================

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-navy-900">
          <Icon className="w-5 h-5 text-navy-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-y divide-border/50">{children}</dl>
      </CardContent>
    </Card>
  );
}

// ============================================
// Loading Skeleton
// ============================================

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-border p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-3">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Page Component
// ============================================

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch(`/api/admin/customers/${id}`);
        const json = await res.json();

        if (json.success && json.data) {
          setCustomer(json.data);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCustomer();
  }, [id]);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' });
      const json = await res.json();

      if (json.success) {
        toast.success('Pelanggan berhasil dihapus');
        router.push('/admin/customers');
      } else {
        toast.error(json.error || 'Gagal menghapus pelanggan');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus pelanggan');
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (isLoading) return <DetailSkeleton />;

  if (notFound || !customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <User className="w-7 h-7 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">Pelanggan tidak ditemukan</p>
          <p className="text-sm text-muted-foreground mt-1">Data pelanggan yang Anda cari tidak tersedia.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/customers">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Pelanggan
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/admin/customers" className="hover:text-foreground transition-colors">Pelanggan</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{customer.fullName}</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{customer.fullName}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-muted-foreground">{customer.customerNumber}</span>
            <Badge variant="outline" className={STATUS_BADGE_CLASSES[customer.status]}>
              {CUSTOMER_STATUS_LABELS[customer.status]}
            </Badge>
          </div>
        </div>
      </div>

      {/* IDENTITAS */}
      <SectionCard title="IDENTITAS" icon={User}>
        <DetailRow label="No Pelanggan">{fmt(customer.customerNumber)}</DetailRow>
        <DetailRow label="Nama Lengkap">{fmt(customer.fullName)}</DetailRow>
        <DetailRow label="No Telepon 1">{fmt(customer.phone1)}</DetailRow>
        <DetailRow label="No Telepon 2">{fmt(customer.phone2)}</DetailRow>
        <DetailRow label="Email">
          {customer.email ? (
            <a href={`mailto:${customer.email}`} className="text-brand hover:underline">{customer.email}</a>
          ) : '-'}
        </DetailRow>
      </SectionCard>

      {/* LAYANAN INTERNET */}
      <SectionCard title="LAYANAN INTERNET" icon={Wifi}>
        <DetailRow label="Paket (Excel)">
          {customer.packageExcel || '-'}
        </DetailRow>
        {customer.package && (
          <DetailRow label="Paket Internet">
            <div className="flex items-center gap-2">
              <span className="font-medium">{customer.package.name}</span>
              <span className="text-muted-foreground">
                ({customer.package.speed} Mbps — {formatCurrency(customer.package.price)}/bulan)
              </span>
            </div>
          </DetailRow>
        )}
        <DetailRow label="Status">
          <Badge variant="outline" className={STATUS_BADGE_CLASSES[customer.status]}>
            {CUSTOMER_STATUS_LABELS[customer.status]}
          </Badge>
        </DetailRow>
        <DetailRow label="Tanggal Pemasangan">{formatDate(customer.installationDate)}</DetailRow>
        <DetailRow label="Tanggal Berhenti">{formatDate(customer.terminationDate)}</DetailRow>
      </SectionCard>

      {/* LOKASI */}
      <SectionCard title="LOKASI" icon={MapPin}>
        <DetailRow label="Alamat">{fmt(customer.address)}</DetailRow>
        <DetailRow label="Latitude">{fmt(customer.latitude)}</DetailRow>
        <DetailRow label="Longitude">{fmt(customer.longitude)}</DetailRow>
      </SectionCard>

      {/* INFORMASI INTERNAL */}
      <SectionCard title="INFORMASI INTERNAL" icon={Briefcase}>
        <DetailRow label="Sales">{fmt(customer.sales)}</DetailRow>
        <DetailRow label="Media">{fmt(customer.media)}</DetailRow>
        <DetailRow label="Teknisi">{fmt(customer.technician)}</DetailRow>
        <DetailRow label="No SPK">{fmt(customer.spkNumber)}</DetailRow>
        <DetailRow label="Tanggal SPK">{formatDate(customer.spkDate)}</DetailRow>
        <DetailRow label="Biaya Registrasi">{formatCurrency(customer.registrationFee)}</DetailRow>
        <DetailRow label="Catatan">{fmt(customer.notes)}</DetailRow>
      </SectionCard>

      {/* SYSTEM INFORMATION */}
      <SectionCard title="SYSTEM INFORMATION" icon={Monitor}>
        <DetailRow label="Dibuat Pada">{formatDate(customer.createdAt)}</DetailRow>
        <DetailRow label="Diperbarui Pada">{formatDate(customer.updatedAt)}</DetailRow>
        <DetailRow label="Dibuat Oleh">{fmt(customer.createdBy?.name)}</DetailRow>
        <DetailRow label="Diperbarui Oleh">{fmt(customer.updatedBy?.name)}</DetailRow>
      </SectionCard>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button asChild variant="outline">
          <Link href={`/admin/customers/${id}/edit`}>
            <Pencil className="w-4 h-4 mr-2" />Edit
          </Link>
        </Button>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="w-4 h-4 mr-2" />Hapus
        </Button>
        <Button asChild variant="outline" className="sm:ml-auto">
          <Link href="/admin/customers">
            <ArrowLeft className="w-4 h-4 mr-2" />Kembali
          </Link>
        </Button>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pelanggan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pelanggan{' '}
              <span className="font-semibold text-foreground">{customer.fullName}</span>{' '}
              ({customer.customerNumber})? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
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
