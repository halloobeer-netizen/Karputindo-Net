'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Upload,
  FileSpreadsheet,
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Users,
  Download,
  Filter,
} from 'lucide-react';

import { CUSTOMER_STATUS_LABELS } from '@/types';
import type { CustomerStatus } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ============================================
// Types
// ============================================

interface FileMeta {
  fileName: string;
  fileSize: number;
  totalRows: number;
  headers: string[];
}

interface ParsedRow {
  rowIndex: number;
  importStatus: 'READY' | 'INVALID' | 'DUPLICATE';
  issues: string[];
  customerNumber: string | null;
  fullName: string | null;
  phone1: string | null;
  phone2: string | null;
  email: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  packageExcel: string | null;
  sales: string | null;
  media: string | null;
  technician: string | null;
  spkNumber: string | null;
  spkDate: string | null;
  installationDate: string | null;
  terminationDate: string | null;
  status: string | null;
  statusOriginal: string | null;
  notes: string | null;
}

interface ImportSummary {
  totalRows: number;
  readyCount: number;
  invalidCount: number;
  duplicateCount: number;
}

interface ImportResultSummary {
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  duplicateRows: number;
  invalidRows: number;
  failedRows: number;
}

// ============================================
// Status Config
// ============================================

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  READY: { label: 'READY', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
  INVALID: { label: 'INVALID', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  DUPLICATE: { label: 'DUPLICATE', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: AlertTriangle },
};

// ============================================
// Helpers
// ============================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function fmt(value: string | number | null | undefined): string {
  if (value == null || value === '') return '-';
  return String(value);
}

function formatCoord(lat: number | null, lng: number | null): string {
  if (lat == null || lng == null) return '-';
  return `${lat}, ${lng}`;
}

function statusLabel(status: string | null): string {
  if (!status) return '-';
  return CUSTOMER_STATUS_LABELS[status as CustomerStatus] || status;
}

// ============================================
// Component
// ============================================

export default function ImportPage() {
  const router = useRouter();

  // --- Step state ---
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');

  // --- Upload state ---
  const [isUploading, setIsUploading] = useState(false);

  // --- Preview state ---
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // --- Import state ---
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResultSummary | null>(null);
  const [filename, setFilename] = useState('');

  // --- Import confirmation dialog ---
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // Upload Handler
  // ============================================

  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/import/parse', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (json.success && json.data) {
        setFileMeta(json.data.fileMeta);
        setParsedRows(json.data.parsedRows);
        setSummary(json.data.summary);
        setFilename(json.data.fileMeta.fileName);
        setStep('preview');
        toast.success(`Berhasil memuat ${json.data.summary.totalRows} baris data`);
      } else {
        toast.error(json.error || 'Gagal memproses file');
      }
    } catch {
      toast.error('Terjadi kesalahan saat mengunggah file');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  // ============================================
  // Import Handler
  // ============================================

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const res = await fetch('/api/admin/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsedRows, filename }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        setImportResult(json.data.summary);
        setStep('result');
        toast.success(`Import selesai! ${json.data.summary.importedRows} pelanggan berhasil diimport.`);
      } else {
        toast.error(json.error || 'Gagal melakukan import');
      }
    } catch {
      toast.error('Terjadi kesalahan saat import');
    } finally {
      setIsImporting(false);
      setConfirmOpen(false);
    }
  };

  // ============================================
  // Filtered rows for preview
  // ============================================

  const filteredRows = parsedRows.filter((row) => {
    if (statusFilter !== 'ALL' && row.importStatus !== statusFilter) return false;
    if (searchFilter) {
 const s = searchFilter.toLowerCase();
      return (
        (row.customerNumber?.toLowerCase().includes(s)) ||
        (row.fullName?.toLowerCase().includes(s)) ||
        (row.packageExcel?.toLowerCase().includes(s))
      );
    }
    return true;
  });

  // ============================================
  // Render: Upload Step
  // ============================================

  if (step === 'upload') {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Import Pelanggan</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#171717]">Import Pelanggan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload file Excel (.xlsx) untuk mengimport data pelanggan
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-xl border-2 border-dashed border-border hover:border-[#C51F2A]/50 transition-colors p-12">
          <div
            className="flex flex-col items-center justify-center gap-4 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            {isUploading ? (
              <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
            ) : (
              <Upload className="w-12 h-12 text-muted-foreground" />
            )}
            <div className="text-center">
              <p className="text-base font-medium text-foreground">
                {isUploading ? 'Memproses file...' : 'Klik atau seret file ke sini'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Format: .xlsx, .xls, .csv (maks 10 MB)
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={onFileChange}
          />
        </div>

        {/* Back button */}
        <Button asChild variant="outline">
          <Link href="/admin/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  // ============================================
  // Render: Preview Step
  // ============================================

  if (step === 'preview') {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Import Pelanggan</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#171717]">Preview Import</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {fileMeta?.fileName} — {fileMeta && formatFileSize(fileMeta.fileSize)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('upload')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Upload Ulang
            </Button>
            {summary && summary.readyCount > 0 && (
              <Button
                className="bg-[#C51F2A] hover:bg-[#A71922] text-white"
                onClick={() => setConfirmOpen(true)}
              >
                <Download className="w-4 h-4 mr-2" />
                Import ke Database
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total Data</div>
              <div className="text-2xl font-bold text-foreground mt-1">{summary.totalRows}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" /> Ready
              </div>
              <div className="text-2xl font-bold text-green-700 mt-1">{summary.readyCount}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <XCircle className="w-4 h-4 text-red-600" /> Invalid
              </div>
              <div className="text-2xl font-bold text-red-700 mt-1">{summary.invalidCount}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Duplicate
              </div>
              <div className="text-2xl font-bold text-amber-700 mt-1">{summary.duplicateCount}</div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Cari No Pelanggan, Nama, Paket..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="READY">Ready</SelectItem>
              <SelectItem value="INVALID">Invalid</SelectItem>
              <SelectItem value="DUPLICATE">Duplicate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead className="w-28">NO PELANGGAN</TableHead>
                  <TableHead className="w-44">NAMA</TableHead>
                  <TableHead>KONTAK</TableHead>
                  <TableHead>EMAIL</TableHead>
                  <TableHead>PAKET EXCEL</TableHead>
                  <TableHead>ALAMAT</TableHead>
                  <TableHead>KOORDINAT</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead className="w-28">STATUS IMPORT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                      Tidak ada data yang cocok dengan filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => {
                    const cfg = STATUS_CONFIG[row.importStatus];
                    const StatusIcon = cfg.icon;
                    return (
                      <TableRow key={row.rowIndex}>
                        <TableCell className="text-center text-muted-foreground">
                          {row.rowIndex + 1}
                        </TableCell>
                        <TableCell className="font-medium">{fmt(row.customerNumber)}</TableCell>
                        <TableCell className="font-medium text-[#171717]">{fmt(row.fullName)}</TableCell>
                        <TableCell>{fmt(row.phone1)}</TableCell>
                        <TableCell className="lowercase">{fmt(row.email)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{fmt(row.packageExcel)}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{fmt(row.address)}</TableCell>
                        <TableCell className="text-xs">{formatCoord(row.latitude, row.longitude)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {statusLabel(row.status)}
                            {row.statusOriginal && row.statusOriginal !== statusLabel(row.status) && (
                              <span className="ml-1 text-muted-foreground">({row.statusOriginal})</span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${cfg.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {cfg.label}
                          </Badge>
                          {row.issues.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                              {row.issues.join('; ')}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
            Menampilkan {filteredRows.length} dari {parsedRows.length} baris
          </div>
        </div>

        {/* Import Confirmation Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Import</DialogTitle>
              <DialogDescription>
                Anda akan mengimport data pelanggan ke database. Hanya data dengan status <strong>READY</strong> yang akan diproses.
              </DialogDescription>
            </DialogHeader>
            {summary && (
              <div className="space-y-2 py-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Data</span>
                  <span className="font-medium">{summary.totalRows}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Ready (akan diimport)</span>
                  <span className="font-medium text-green-700">{summary.readyCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-700">Invalid (dilewati)</span>
                  <span className="font-medium text-red-700">{summary.invalidCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-amber-700">Duplicate (dilewati)</span>
                  <span className="font-medium text-amber-700">{summary.duplicateCount}</span>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Batal</Button>
              <Button
                className="bg-[#C51F2A] hover:bg-[#A71922] text-white"
                onClick={handleImport}
                disabled={isImporting}
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                {isImporting ? 'Mengimport...' : 'Ya, Import Data'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============================================
  // Render: Result Step
  // ============================================

  if (step === 'result' && importResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Import Pelanggan</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#171717]">Hasil Import</h1>
          <p className="text-sm text-muted-foreground mt-1">{filename}</p>
        </div>

        {/* Result Summary */}
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Import Selesai</h2>
              <p className="text-sm text-muted-foreground">
                {importResult.importedRows > 0
                  ? `${importResult.importedRows} pelanggan berhasil diimport ke database.`
                  : 'Tidak ada data baru yang diimport.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Total Diproses</div>
              <div className="text-xl font-bold text-foreground">{importResult.totalRows}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-sm text-green-700">Berhasil</div>
              <div className="text-xl font-bold text-green-700">{importResult.importedRows}</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="text-sm text-amber-700">Duplicate</div>
              <div className="text-xl font-bold text-amber-700">{importResult.duplicateRows}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-sm text-red-700">Invalid</div>
              <div className="text-xl font-bold text-red-700">{importResult.invalidRows}</div>
            </div>
            {importResult.failedRows > 0 && (
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-sm text-red-700">Gagal</div>
                <div className="text-xl font-bold text-red-700">{importResult.failedRows}</div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="bg-[#C51F2A] hover:bg-[#A71922] text-white">
            <Link href="/admin/customers">
              <Users className="w-4 h-4 mr-2" />
              Lihat Data Pelanggan
            </Link>
          </Button>
          <Button variant="outline" onClick={() => { setStep('upload'); setImportResult(null); }}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Import File Lain
          </Button>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
