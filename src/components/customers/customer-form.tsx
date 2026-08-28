'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

import { customerCreateSchema } from '@/validation/customer';
import { CUSTOMER_STATUS_OPTIONS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PackageOption { id: string; name: string; speed: number; price: number; }
interface CustomerFormProps { defaultValues?: Record<string, any>; customerId?: string; }

export const customerFormDefaultValues: Record<string, any> = {
  customerNumber: '', fullName: '', phone1: '', phone2: '', email: '', address: '', latitude: '', longitude: '', packageId: '', packageExcel: '', registrationFee: '', sales: '', media: '', technician: '', spkNumber: '', spkDate: '', installationDate: '', terminationDate: '', status: 'INSTALLATION', dueDay: 10, gracePeriod: 3, serviceStatus: 'ACTIVE', pppoeUsername: '', notes: '',
};

export function CustomerForm({ defaultValues, customerId }: CustomerFormProps) {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const isEditMode = !!customerId;
  const form = useForm({ resolver: zodResolver(customerCreateSchema), defaultValues: defaultValues || customerFormDefaultValues });

  useEffect(() => {
    async function fetchPackages() {
      try {
        const res = await fetch('/api/admin/packages'); const json = await res.json();
        if (json.success && json.data) setPackages(json.data);
      } catch { toast.error('Gagal memuat daftar paket internet'); } finally { setIsLoadingPackages(false); }
    }
    fetchPackages();
  }, []);

  async function onSubmit(values: Record<string, any>) {
    try {
      const url = isEditMode ? `/api/admin/customers/${customerId}` : '/api/admin/customers';
      const method = isEditMode ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const json = await res.json();
      if (json.success) {
        toast.success(isEditMode ? 'Data pelanggan berhasil diperbarui' : 'Pelanggan berhasil ditambahkan');
        const targetId = isEditMode ? customerId : json.data?.id;
        router.push(targetId ? `/admin/customers/${targetId}` : '/admin/customers');
      } else toast.error(json.error || 'Terjadi kesalahan');
    } catch { toast.error('Terjadi kesalahan saat menyimpan data'); }
  }

  const isSubmitting = form.formState.isSubmitting;
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <section className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-[#171717] mb-4">Identitas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="customerNumber" render={({ field }) => <FormItem><FormLabel>No Pelanggan *</FormLabel><FormControl><Input placeholder="Contoh: KPT-001" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="fullName" render={({ field }) => <FormItem><FormLabel>Nama Lengkap *</FormLabel><FormControl><Input placeholder="Nama lengkap pelanggan" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="phone1" render={({ field }) => <FormItem><FormLabel>No Telepon 1</FormLabel><FormControl><Input placeholder="08xxxxxxxxxx" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="phone2" render={({ field }) => <FormItem><FormLabel>No Telepon 2</FormLabel><FormControl><Input placeholder="08xxxxxxxxxx (opsional)" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="email@contoh.com" {...field} /></FormControl><FormMessage /></FormItem>} />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-[#171717] mb-4">Layanan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="packageExcel" render={({ field }) => <FormItem className="md:col-span-2"><FormLabel>Paket (sesuai Excel)</FormLabel><FormControl><Input placeholder="Contoh: Home 10 247748 exc PPN 11%" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="packageId" render={({ field }) => <FormItem><FormLabel>Paket Internet (opsional)</FormLabel><Select onValueChange={field.onChange} value={field.value || ''} disabled={isLoadingPackages}><FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih paket internet (opsional)" /></SelectTrigger></FormControl><SelectContent>{packages.map((pkg) => <SelectItem key={pkg.id} value={pkg.id}>{pkg.name} — {pkg.speed}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
            <FormField control={form.control} name="status" render={({ field }) => <FormItem><FormLabel>Status *</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih status" /></SelectTrigger></FormControl><SelectContent>{CUSTOMER_STATUS_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
            <FormField control={form.control} name="spkDate" render={({ field }) => <FormItem><FormLabel>Tanggal SPK</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="installationDate" render={({ field }) => <FormItem><FormLabel>Tanggal Finish</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="terminationDate" render={({ field }) => <FormItem><FormLabel>Tanggal Berhenti</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-border p-6">
          <div className="mb-4"><h2 className="text-lg font-semibold text-[#171717]">Billing & MikroTik</h2><p className="mt-1 text-sm text-muted-foreground">Atur jatuh tempo, masa tenggang, status layanan dan username PPPoE pelanggan.</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="dueDay" render={({ field }) => <FormItem><FormLabel>Tanggal Jatuh Tempo</FormLabel><FormControl><Input type="number" min="1" max="31" placeholder="10" {...field} /></FormControl><p className="text-xs text-muted-foreground">Tanggal tagihan setiap bulan, misalnya 10.</p><FormMessage /></FormItem>} />
            <FormField control={form.control} name="gracePeriod" render={({ field }) => <FormItem><FormLabel>Masa Tenggang (hari)</FormLabel><FormControl><Input type="number" min="0" max="30" placeholder="3" {...field} /></FormControl><p className="text-xs text-muted-foreground">Pelanggan diisolir setelah jatuh tempo + masa tenggang.</p><FormMessage /></FormItem>} />
            <FormField control={form.control} name="pppoeUsername" render={({ field }) => <FormItem><FormLabel>Username PPPoE</FormLabel><FormControl><Input placeholder="Contoh: KPT000123" {...field} /></FormControl><p className="text-xs text-muted-foreground">Dipakai untuk mencocokkan pelanggan dengan MikroTik.</p><FormMessage /></FormItem>} />
            <FormField control={form.control} name="serviceStatus" render={({ field }) => <FormItem><FormLabel>Status Layanan</FormLabel><Select onValueChange={field.onChange} value={field.value || 'ACTIVE'}><FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="ACTIVE">ACTIVE — Internet aktif</SelectItem><SelectItem value="ISOLIR">ISOLIR — Internet diisolir</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-[#171717] mb-4">Lokasi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="address" render={({ field }) => <FormItem className="md:col-span-2"><FormLabel>Alamat</FormLabel><FormControl><Textarea placeholder="Alamat lengkap pelanggan" rows={3} {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="latitude" render={({ field }) => <FormItem><FormLabel>Latitude</FormLabel><FormControl><Input type="number" step="any" placeholder="Contoh: -6.2088" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="longitude" render={({ field }) => <FormItem><FormLabel>Longitude</FormLabel><FormControl><Input type="number" step="any" placeholder="Contoh: 106.8456" {...field} /></FormControl><FormMessage /></FormItem>} />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-[#171717] mb-4">Informasi Internal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="sales" render={({ field }) => <FormItem><FormLabel>Sales</FormLabel><FormControl><Input placeholder="Nama sales" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="media" render={({ field }) => <FormItem><FormLabel>Media</FormLabel><FormControl><Input placeholder="Media promosi" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="technician" render={({ field }) => <FormItem><FormLabel>Teknisi</FormLabel><FormControl><Input placeholder="Nama teknisi" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="spkNumber" render={({ field }) => <FormItem><FormLabel>No SPK</FormLabel><FormControl><Input placeholder="Nomor SPK" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="registrationFee" render={({ field }) => <FormItem><FormLabel>Biaya Registrasi</FormLabel><FormControl><Input type="number" step="any" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem>} />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-[#171717] mb-4">Catatan</h2>
          <FormField control={form.control} name="notes" render={({ field }) => <FormItem><FormLabel>Catatan</FormLabel><FormControl><Textarea placeholder="Catatan tambahan (opsional)" rows={3} {...field} /></FormControl><FormMessage /></FormItem>} />
        </section>

        <div className="flex justify-end"><Button type="submit" disabled={isSubmitting} className="bg-[#C51F2A] hover:bg-[#A71922] text-white min-w-[160px]">{isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : <><Save className="w-4 h-4" />{isEditMode ? 'Simpan Perubahan' : 'Tambah Pelanggan'}</>}</Button></div>
      </form>
    </Form>
  );
}
