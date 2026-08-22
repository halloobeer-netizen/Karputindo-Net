// ============================================
// FASE 3B — Simplified Import Types
// ============================================

export type ImportRowStatus = 'READY' | 'INVALID' | 'DUPLICATE';

export interface RawExcelRow {
  [key: string]: string | number | boolean | null | undefined;
}

export interface FileMeta {
  fileName: string;
  fileSize: number;
  sheetCount: number;
  sheetNames: string[];
  totalRows: number;
  headers: string[];
}

export interface ColumnMapping {
  excelColumn: string;
  targetField: string | null; // null = "Jangan Import Kolom Ini"
}

export interface ParsedCustomerRow {
  rowIndex: number;
  importStatus: ImportRowStatus;
  issues: string[];

  // Mapped fields
  customerNumber: string | null;
  fullName: string | null;
  phone1: string | null;
  phone2: string | null;
  email: string | null;
  emailOriginal: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  packageExcel: string | null;    // raw package text from Excel (PRESERVED AS-IS)
  registrationFee: number | null;
  sales: string | null;
  media: string | null;
  technician: string | null;
  spkNumber: string | null;
  spkDate: string | null;
  installationDate: string | null;
  terminationDate: string | null;
  status: string | null;          // normalized status enum value
  statusOriginal: string | null;  // original status text from Excel
  notes: string | null;
}

export interface ImportSummary {
  totalRows: number;
  readyCount: number;
  invalidCount: number;
  duplicateCount: number;
}

export interface ImportResult {
  rowIndex: number;
  customerNumber: string | null;
  fullName: string | null;
  resultStatus: 'IMPORTED' | 'DUPLICATE_SKIPPED' | 'INVALID_SKIPPED' | 'FAILED';
  reason: string;
}

// Target fields available for mapping
export const TARGET_FIELDS = [
  { value: 'customerNumber', label: 'No Pelanggan', required: true },
  { value: 'fullName', label: 'Nama Lengkap', required: true },
  { value: 'phone1', label: 'Kontak 1', required: false },
  { value: 'phone2', label: 'Kontak 2', required: false },
  { value: 'email', label: 'Alamat Email', required: false },
  { value: 'address', label: 'Alamat Pemasangan', required: false },
  { value: 'coordinates', label: 'Kordinat/Shareloc', required: false },
  { value: 'package', label: 'Paket', required: false },
  { value: 'registrationFee', label: 'Registrasi', required: false },
  { value: 'sales', label: 'Sales', required: false },
  { value: 'media', label: 'Media', required: false },
  { value: 'technician', label: 'Teknisi', required: false },
  { value: 'spkNumber', label: 'Nomor SPK', required: false },
  { value: 'spkDate', label: 'Tanggal SPK', required: false },
  { value: 'installationDate', label: 'Tanggal Finish', required: false },
  { value: 'terminationDate', label: 'Tanggal Berhenti', required: false },
  { value: 'status', label: 'Status Finish', required: false },
  { value: 'notes', label: 'Catatan', required: false },
] as const;

export type TargetFieldValue = (typeof TARGET_FIELDS)[number]['value'] | '__skip__';

export const TARGET_FIELD_MAP: Record<string, string> = {
  customerNumber: 'No Pelanggan',
  fullName: 'Nama Lengkap',
  phone1: 'Kontak 1',
  phone2: 'Kontak 2',
  email: 'Alamat Email',
  address: 'Alamat Pemasangan',
  coordinates: 'Kordinat/Shareloc',
  package: 'Paket',
  registrationFee: 'Registrasi',
  sales: 'Sales',
  media: 'Media',
  technician: 'Teknisi',
  spkNumber: 'Nomor SPK',
  spkDate: 'Tanggal SPK',
  installationDate: 'Tanggal Finish',
  terminationDate: 'Tanggal Berhenti',
  status: 'Status Finish',
  notes: 'Catatan',
};
