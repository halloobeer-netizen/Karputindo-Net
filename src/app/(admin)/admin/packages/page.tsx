'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, Eye, Pencil, Power, PowerOff, Package, Loader2, BarChart3 } from 'lucide-react';

import type { PackageStatus } from '@/types';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ─── Types ──────────────────────────────────────────────────────────────

interface PackageRow {
  id: string;
  name: string;
  speed: string;
  price: number;
  description: string | null;
  status: PackageStatus;
  createdAt: string;
  updatedAt: string;
  _count: { customers: number };
}

interface ExcelCategory {
  category: string;
  count: number;
  packages: { name: string; count: number }[];
}

const STATUS_BADGE_CLASSES: Record<PackageStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
};

const STATUS_LABELS: Record<PackageStatus, string> = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Tidak Aktif',
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  GINESIA: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  HOME: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  WIRELESS: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

type CategoryKey = keyof typeof CATEGORY_COLORS;

// ─── Helpers ────────────────────────────────────────────────────────────

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

// ─── Component ──────────────────────────────────────────────────────────

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [excelCategories, setExcelCategories] = useState<ExcelCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSpeed, setFormSpeed] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Fetch packages
  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/packages');
      const json = await res.json();
      if (json.success && json.data) setPackages(json.data);
      else setError(json.error || 'Gagal memuat paket');
    } catch { setError('Terjadi kesalahan saat mengambil data'); }
    finally { setIsLoading(false); }
  }, []);

  // Fetch Excel categories from dashboard stats
  const fetchExcelCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dashboard/stats');
      const json = await res.json();
      if (json.success && json.data?.packageExcelCategories) {
        setExcelCategories(json.data.packageExcelCategories);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchPackages(); fetchExcelCategories(); }, [fetchPackages, fetchExcelCategories]);

  // Toggle status
  const handleToggleStatus = async (pkg: PackageRow) => {
    setIsToggling(pkg.id);
    try {
      const res = await fetch(`/api/admin/packages/${pkg.id}`, { method: 'PATCH' });
      const json = await res.json();
      if (json.success) {
        toast.success(`Paket "${pkg.name}" berhasil di${pkg.status === 'ACTIVE' ? 'nonaktifkan' : 'aktifkan'}`);
        fetchPackages();
      } else { toast.error(json.error || 'Gagal mengubah status paket'); }
    } catch { toast.error('Terjadi kesalahan saat mengubah status'); }
    finally { setIsToggling(null); }
  };

  const openEdit = (pkg: PackageRow) => {
    setSelectedPackage(pkg);
    setFormName(pkg.name); setFormSpeed(pkg.speed);
    setFormPrice(String(pkg.price)); setFormDescription(pkg.description || '');
    setShowEditDialog(true);
  };

  const openAdd = () => {
    setFormName(''); setFormSpeed(''); setFormPrice(''); setFormDescription('');
    setShowAddDialog(true);
  };

  const handleSave = async (isEdit: boolean) => {
    if (!formName.trim() || !formSpeed.trim() || !formPrice.trim()) {
      toast.error('Nama, kecepatan, dan harga wajib diisi'); return;
    }
    setIsSaving(true);
    try {
      const url = isEdit ? `/api/admin/packages/${selectedPackage!.id}` : '/api/admin/packages';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), speed: formSpeed.trim(), price: Number(formPrice), description: formDescription.trim() || null }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(isEdit ? 'Paket berhasil diperbarui' : 'Paket berhasil ditambahkan');
        setShowEditDialog(false); setShowAddDialog(false); fetchPackages();
      } else { toast.error(json.error || 'Gagal menyimpan paket'); }
    } catch { toast.error('Terjadi kesalahan saat menyimpan'); }
    finally { setIsSaving(false); }
  };

  const activeCount = packages.filter(p => p.status === 'ACTIVE').length;
  const inactiveCount = packages.filter(p => p.status === 'INACTIVE').length;
  const totalExcelCustomers = excelCategories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Paket Internet</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paket Internet</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? 'Memuat data...' : `${packages.length} paket manual · ${totalExcelCustomers} pelanggan dari data Excel`}
          </p>
        </div>
        <Button onClick={openAdd} className="bg-rose-600 hover:bg-rose-700 text-white shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Tambah Paket
        </Button>
      </div>

      {/* Excel Category Cards */}
      {!isLoading && excelCategories.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-600" />
            Distribusi Paket Excel ({totalExcelCustomers} pelanggan)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {excelCategories.map(cat => {
              const colors = CATEGORY_COLORS[cat.category as CategoryKey] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
              return (
                <Card key={cat.category} className={`${colors.bg} ${colors.border}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-base font-bold ${colors.text}`}>{cat.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold ${colors.text} mb-3`}>{cat.count}</p>
                    <div className="space-y-1">
                      {cat.packages.map(p => (
                        <div key={p.name} className="flex justify-between text-xs">
                          <span className={colors.text}>{p.name}</span>
                          <span className={`font-medium ${colors.text}`}>{p.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Paket Manual</p>
            <p className="text-2xl font-bold text-gray-900">{packages.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Aktif</p>
            <p className="text-2xl font-bold text-green-700">{activeCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Tidak Aktif</p>
            <p className="text-2xl font-bold text-gray-500">{inactiveCount}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">{error}</div>}

      {/* Table */}
      <div className="bg-white rounded-lg border border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-12 text-center">NO</TableHead>
                <TableHead>NAMA PAKET</TableHead>
                <TableHead>KECEPATAN</TableHead>
                <TableHead>HARGA</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="text-center">PELANGGAN</TableHead>
                <TableHead className="text-center">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-center"><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell><div className="flex items-center justify-center gap-1"><Skeleton className="h-8 w-8 rounded" /><Skeleton className="h-8 w-8 rounded" /><Skeleton className="h-8 w-8 rounded" /></div></TableCell>
                  </TableRow>
                ))
              ) : packages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64">
                    <div className="flex flex-col items-center justify-center text-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Package className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-base font-medium">Belum ada paket internet manual</p>
                        <p className="text-sm text-muted-foreground mt-1">Paket dari Excel ditampilkan di atas.</p>
                      </div>
                      <Button onClick={openAdd} className="bg-rose-600 hover:bg-rose-700 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Tambah Paket
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                packages.map((pkg, index) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900">{pkg.name}</TableCell>
                    <TableCell>{pkg.speed}</TableCell>
                    <TableCell className="font-medium">
                      {formatRupiah(pkg.price)}<span className="text-muted-foreground text-xs ml-1">/bulan</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_BADGE_CLASSES[pkg.status]}>{STATUS_LABELS[pkg.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{pkg._count.customers}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" title="Detail" onClick={() => { setSelectedPackage(pkg); setShowDetailDialog(true); }}><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" title="Edit" onClick={() => openEdit(pkg)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" title={pkg.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'} onClick={() => handleToggleStatus(pkg)} disabled={isToggling === pkg.id}>
                          {isToggling === pkg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : pkg.status === 'ACTIVE' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Detail Paket</DialogTitle></DialogHeader>
          {selectedPackage && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Nama Paket</span><span className="font-medium">{selectedPackage.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Kecepatan</span><span className="font-medium">{selectedPackage.speed}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Harga</span><span className="font-medium">{formatRupiah(selectedPackage.price)}/bulan</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline" className={STATUS_BADGE_CLASSES[selectedPackage.status]}>{STATUS_LABELS[selectedPackage.status]}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Jumlah Pelanggan</span><span className="font-medium">{selectedPackage._count.customers}</span></div>
              {selectedPackage.description && <div className="pt-2 border-t"><span className="text-muted-foreground block mb-1">Deskripsi</span><p>{selectedPackage.description}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Paket</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label htmlFor="edit-name">Nama Paket *</Label><Input id="edit-name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Contoh: Paket 10 Mbps" /></div>
            <div className="space-y-2"><Label htmlFor="edit-speed">Kecepatan *</Label><Input id="edit-speed" value={formSpeed} onChange={e => setFormSpeed(e.target.value)} placeholder="Contoh: 10 Mbps" /></div>
            <div className="space-y-2"><Label htmlFor="edit-price">Harga (Rp) *</Label><Input id="edit-price" type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} placeholder="Contoh: 150000" /></div>
            <div className="space-y-2"><Label htmlFor="edit-desc">Deskripsi</Label><Textarea id="edit-desc" value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Opsional" rows={3} /></div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isSaving}>Batal</Button>
            <Button onClick={() => handleSave(true)} disabled={isSaving} className="bg-rose-600 hover:bg-rose-700 text-white">{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Tambah Paket Baru</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label htmlFor="add-name">Nama Paket *</Label><Input id="add-name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Contoh: Paket 10 Mbps" /></div>
            <div className="space-y-2"><Label htmlFor="add-speed">Kecepatan *</Label><Input id="add-speed" value={formSpeed} onChange={e => setFormSpeed(e.target.value)} placeholder="Contoh: 10 Mbps" /></div>
            <div className="space-y-2"><Label htmlFor="add-price">Harga (Rp) *</Label><Input id="add-price" type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} placeholder="Contoh: 150000" /></div>
            <div className="space-y-2"><Label htmlFor="add-desc">Deskripsi</Label><Textarea id="add-desc" value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Opsional" rows={3} /></div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isSaving}>Batal</Button>
            <Button onClick={() => handleSave(false)} disabled={isSaving} className="bg-rose-600 hover:bg-rose-700 text-white">{isSaving ? 'Menyimpan...' : 'Tambah Paket'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
