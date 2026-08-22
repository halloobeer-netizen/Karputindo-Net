'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { User, ArrowLeft } from 'lucide-react';

import { CustomerForm } from '@/components/customers/customer-form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================
// Types
// ============================================

interface CustomerData {
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
  status: string;
  notes: string | null;
}

// ============================================
// Helpers
// ============================================

function toDateString(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function mapCustomerToForm(data: CustomerData): Record<string, any> {
  return {
    customerNumber: data.customerNumber ?? '',
    fullName: data.fullName ?? '',
    phone1: data.phone1 ?? '',
    phone2: data.phone2 ?? '',
    email: data.email ?? '',
    address: data.address ?? '',
    latitude: data.latitude ?? '',
    longitude: data.longitude ?? '',
    packageId: data.packageId ?? '',
    packageExcel: data.packageExcel ?? '',
    registrationFee: data.registrationFee ?? '',
    sales: data.sales ?? '',
    media: data.media ?? '',
    technician: data.technician ?? '',
    spkNumber: data.spkNumber ?? '',
    spkDate: toDateString(data.spkDate),
    installationDate: toDateString(data.installationDate),
    terminationDate: toDateString(data.terminationDate),
    status: data.status ?? 'ACTIVE',
    notes: data.notes ?? '',
  };
}

// ============================================
// Loading Skeleton
// ============================================

function EditSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-64" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-border p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-full" />
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

export default function EditCustomerPage() {
  const params = useParams();
  const id = params.id as string;

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  if (isLoading) return <EditSkeleton />;

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

  const formDefaults = mapCustomerToForm(customer);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/admin/customers" className="hover:text-foreground transition-colors">Pelanggan</Link>
        <span>/</span>
        <Link href={`/admin/customers/${id}`} className="hover:text-foreground transition-colors">{customer.fullName}</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Edit</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-navy-900">Edit Pelanggan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ubah data pelanggan: <span className="font-medium text-foreground">{customer.fullName}</span>{' '}
          ({customer.customerNumber})
        </p>
      </div>

      <CustomerForm defaultValues={formDefaults} customerId={id} />
    </div>
  );
}
