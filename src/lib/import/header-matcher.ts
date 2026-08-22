// ============================================
// FASE 3A — Header Auto-Detection
// ============================================

import type { TargetFieldValue } from './types';

// Known header patterns for each target field
const HEADER_PATTERNS: Record<string, string[]> = {
  customerNumber: [
    'no pelanggan', 'no pel', 'nomor pelanggan', 'nompel', 'customer number',
    'no customer', 'id pelanggan', 'nopel', 'pelanggan no', 'customer no',
  ],
  fullName: [
    'nama lengkap', 'nama', 'full name', 'name', 'nama pelanggan',
    'customer name', 'pelanggan', 'nama customer',
  ],
  phone1: [
    'kontak 1', 'kontak1', 'contact 1', 'phone 1', 'phone1',
    'telepon 1', 'telpon 1', 'telepon', 'telpon', 'no hp',
    'no telp', 'hp', 'handphone', 'no wa', 'whatsapp',
    'contact', 'phone', 'telp', 'nomor telepon',
  ],
  phone2: [
    'kontak 2', 'kontak2', 'contact 2', 'phone 2', 'phone2',
    'telepon 2', 'telpon 2', 'no hp 2',
  ],
  email: [
    'alamat email', 'email', 'e mail', 'e-mail', 'mail',
  ],
  address: [
    'alamat pemasangan', 'alamat', 'address', 'alamat instalasi',
    'alamat pasang', 'lokasi', 'location',
  ],
  coordinates: [
    'kordinat', 'koordinat', 'kordinat/shareloc', 'koordinat/shareloc',
    'kordinat shareloc', 'koordinat shareloc', 'shareloc', 'share loc',
    'share location', 'gps', 'lat long', 'lat/long', 'latitude longitude',
    'latlong', 'coords', 'coordinates', 'lokasi gps',
  ],
  package: [
    'paket', 'package', 'jenis paket', 'nama paket', 'tipe paket',
    'paket internet', 'bandwidth', 'speed', 'kecepatan',
  ],
  registrationFee: [
    'registrasi', 'registration', 'biaya registrasi', 'reg fee',
    'biaya daftar', 'registration fee', 'uang pendaftaran',
  ],
  sales: [
    'sales', 'sale', 'penjual', 'marketing', 'salesman',
  ],
  media: [
    'media', 'sumber', 'source', 'channel', 'sumber media',
    'marketing channel',
  ],
  technician: [
    'teknisi', 'technician', 'tekniker', 'installer',
    'petugas', 'montir', 'pemasang',
  ],
  spkNumber: [
    'nomor spk', 'no spk', 'spk', 'nomor spk a', 'no spk a',
    'spk number', 'spk no',
  ],
  spkDate: [
    'tanggal spk', 'tgl spk', 'spk date', 'tanggal spk a',
    'tgl spk a',
  ],
  installationDate: [
    'tanggal finish', 'tgl finish', 'finish date', 'tanggal selesai',
    'tgl selesai', 'tanggal instalasi', 'tgl instalasi',
    'installation date', 'tanggal pemasangan', 'tgl pemasangan',
    'tanggal aktif', 'tgl aktif',
  ],
  terminationDate: [
    'tanggal berhenti', 'tgl berhenti', 'berhenti', 'termination date',
    'tanggal nonaktif', 'tgl nonaktif', 'tanggal disconnect',
  ],
  status: [
    'status finish', 'status', 'status pelanggan', 'customer status',
    'status finish', 'kondisi',
  ],
  notes: [
    'catatan', 'note', 'notes', 'keterangan', 'ket', 'komentar',
    'remark', 'remarks', 'memo',
  ],
};

/**
 * Normalize a header string for fuzzy matching.
 * - trim whitespace
 * - lowercase
 * - collapse multiple spaces
 * - normalize /, _, - to spaces
 * - remove extra punctuation
 */
export function normalizeHeader(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[/_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/**
 * Try to auto-match an Excel header to a target field.
 * Returns the target field name or null if no match.
 */
export function autoMatchHeader(excelHeader: string): TargetFieldValue | null {
  const normalized = normalizeHeader(excelHeader);
  if (!normalized) return null;

  for (const [field, patterns] of Object.entries(HEADER_PATTERNS)) {
    for (const pattern of patterns) {
      const normalizedPattern = normalizeHeader(pattern);
      if (normalized === normalizedPattern) {
        return field as TargetFieldValue;
      }
    }
  }

  return null;
}

/**
 * Generate auto-mapping for all Excel headers.
 */
export function generateAutoMapping(headers: string[]): Record<string, TargetFieldValue> {
  const mapping: Record<string, TargetFieldValue> = {};
  const usedFields = new Set<string>();

  for (const header of headers) {
    const match = autoMatchHeader(header);
    if (match && !usedFields.has(match)) {
      mapping[header] = match;
      usedFields.add(match);
    } else {
      mapping[header] = '__skip__';
    }
  }

  return mapping;
}
