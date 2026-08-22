'use client';

import Link from 'next/link';
import { CustomerForm } from '@/components/customers/customer-form';

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/admin/dashboard"
          className="hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
        <span>/</span>
        <Link
          href="/admin/customers"
          className="hover:text-foreground transition-colors"
        >
          Pelanggan
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Tambah Pelanggan</span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Tambah Pelanggan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tambahkan data pelanggan baru ke sistem Karputindo Net
        </p>
      </div>

      {/* Form */}
      <CustomerForm />
    </div>
  );
}
