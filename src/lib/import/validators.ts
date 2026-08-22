// ============================================
// FASE 3A — Validation Utilities
// ============================================

import type { PackageStatus, CustomerStatus } from '@/types';

// --- Email ---

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string | null | undefined): boolean {
  if (!value || !value.trim()) return true; // email is optional
  return EMAIL_RE.test(value.trim());
}

// --- Coordinate Parsing ---
// Accepts: "-6.809111, 107.236010" or "-6.809111,107.236010" or URL with coords
// Google Maps share URL: https://maps.google.com/?q=-6.809111,107.236010
// Google Maps URL: https://www.google.com/maps/place/.../@-6.809111,107.236010

export function parseCoordinates(
  value: string | null | undefined
): { latitude: number; longitude: number } | null {
  if (!value || !value.toString().trim()) return null;

  const str = value.toString().trim();

  // Try direct format: "lat, lng"
  const directMatch = str.match(/^\s*(-?\d+\.?\d*)\s*[ ,]\s*(-?\d+\.?\d*)\s*$/);
  if (directMatch) {
    const lat = parseFloat(directMatch[1]);
    const lng = parseFloat(directMatch[2]);
    if (isValidLat(lat) && isValidLng(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  // Try to extract from URL (Google Maps share links)
  const urlMatch = str.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (urlMatch) {
    const lat = parseFloat(urlMatch[1]);
    const lng = parseFloat(urlMatch[2]);
    if (isValidLat(lat) && isValidLng(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  // Try q= parameter in URL
  const qMatch = str.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (isValidLat(lat) && isValidLng(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  return null;
}

function isValidLat(lat: number): boolean {
  return lat >= -90 && lat <= 90;
}

function isValidLng(lng: number): boolean {
  return lng >= -180 && lng <= 180;
}

// --- Date Parsing ---
// Excel serial numbers, Date objects, or text dates

export function parseExcelDate(
  value: string | number | boolean | null | undefined
): string | null {
  if (value === null || value === undefined || value === false) return null;

  // If it's a number, it might be an Excel serial date
  if (typeof value === 'number') {
    if (value <= 0 || !Number.isFinite(value)) return null;
    const date = excelSerialToDate(value);
    if (date) return formatDateID(date);
    return null;
  }

  const str = String(value).trim();
  if (!str) return null;

  // Try standard Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
    return formatDateID(parsed);
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d = new Date(year, month - 1, day);
      if (!isNaN(d.getTime())) return formatDateID(d);
    }
  }

  return null;
}

function excelSerialToDate(serial: number): Date | null {
  // Excel epoch is January 1, 1900 (with a bug for the leap year 1900)
  const epoch = new Date(1899, 11, 30);
  const date = new Date(epoch.getTime() + serial * 86400000);
  if (isNaN(date.getTime())) return null;
  return date;
}

export function formatDateID(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// --- Phone ---
// Phones MUST be treated as strings. Never parse as number.

export function normalizePhone(value: string | number | boolean | null | undefined): string | null {
  if (value === null || value === undefined || value === false || value === true) return null;
  return String(value).trim() || null;
}

// --- Status Normalization ---

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktif',
  INSTALLATION: 'Proses Pemasangan',
  INACTIVE: 'Tidak Aktif',
  TERMINATED: 'Berhenti',
  SUSPENDED: 'Ditangguhkan',
  ISOLIR: 'Isolir',
};

const STATUS_ALIASES: Record<string, CustomerStatus> = {
  'finish': 'ACTIVE',
  'finished': 'ACTIVE',
  'selesai': 'ACTIVE',
  'aktif': 'ACTIVE',
  'active': 'ACTIVE',
  'berjalan': 'ACTIVE',
  'pembongkaran': 'TERMINATED',
  'berhenti': 'TERMINATED',
  'stop': 'TERMINATED',
  'terminated': 'TERMINATED',
  'disconnect': 'TERMINATED',
  'putus': 'TERMINATED',
  'isolir': 'ISOLIR',
  'isolate': 'ISOLIR',
  'isolated': 'ISOLIR',
  'proses': 'INSTALLATION',
  'pemasangan': 'INSTALLATION',
  'install': 'INSTALLATION',
  'installation': 'INSTALLATION',
  'pasang': 'INSTALLATION',
  'belum selesai': 'INSTALLATION',
  'belum finish': 'INSTALLATION',
  'belum finish ': 'INSTALLATION',
  'nonaktif': 'INACTIVE',
  'tidak aktif': 'INACTIVE',
  'inactive': 'INACTIVE',
  'suspend': 'SUSPENDED',
  'suspended': 'SUSPENDED',
  'ditangguhkan': 'SUSPENDED',
  'blocked': 'SUSPENDED',
};

export interface StatusMatchResult {
  status: CustomerStatus | null;
  recognized: boolean;
  method: 'STATUS_MATCH' | 'EMPTY' | 'UNRECOGNIZED';
  matchedLabel: string | null; // Indonesian label
}

export function normalizeStatus(value: string | null | undefined): StatusMatchResult {
  const emptyResult: StatusMatchResult = { status: null, recognized: true, method: 'EMPTY', matchedLabel: null };

  if (!value || !value.toString().trim()) {
    return emptyResult;
  }

  const originalTrimmed = value.toString().trim();
  // Normalize: collapse multiple spaces, lowercase
  const normalized = originalTrimmed.toLowerCase().replace(/\s+/g, ' ');
  const mapped = STATUS_ALIASES[normalized];

  if (mapped) {
    return {
      status: mapped,
      recognized: true,
      method: 'STATUS_MATCH',
      matchedLabel: STATUS_LABELS[mapped] || mapped,
    };
  }

  return {
    status: null,
    recognized: false,
    method: 'UNRECOGNIZED',
    matchedLabel: null,
  };
}

// --- Package Matching ---

/**
 * Extract the first standalone speed/bandwidth number from a string.
 * Handles: "Home 10 247.748 exc PPN 11%" → 10, "Paket 20 Mbps" → 20, "50MBPS" → 50
 * Returns null if no speed number found.
 */
function extractSpeedNumber(value: string): number | null {
  if (!value) return null;
  // Match a standalone number that could be a bandwidth (1-9999 range)
  // We look for a number NOT part of a price (e.g. not 247.748 after another number)
  // Strategy: find all numbers, pick the most likely speed candidate
  const numbers: { value: number; index: number }[] = [];
  const re = /(\d+)(?:\.\d+)?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(value)) !== null) {
    const num = parseFloat(match[1]); // integer part only
    if (num >= 1 && num <= 9999) {
      numbers.push({ value: num, index: match.index });
    }
  }
  if (numbers.length === 0) return null;

  // Heuristic: if there's a number followed by "mbps" or "mb" (case insensitive), prefer that
  const mbpsIdx = value.search(/\d+\s*mb(?:ps)?/i);
  if (mbpsIdx >= 0) {
    const mbpsMatch = value.match(/(\d+)\s*mb(?:ps)?/i);
    if (mbpsMatch) {
      const n = parseInt(mbpsMatch[1], 10);
      if (n >= 1 && n <= 9999) return n;
    }
  }

  // If there's only one number, that's likely the speed
  if (numbers.length === 1) return numbers[0].value;

  // Multiple numbers: try to pick the speed by common bandwidth values
  const commonSpeeds = new Set([5, 10, 15, 20, 25, 30, 50, 75, 100, 150, 200, 300, 500, 1000]);
  const speedCandidates = numbers.filter(n => commonSpeeds.has(n.value));
  if (speedCandidates.length === 1) return speedCandidates[0].value;

  // If still multiple, prefer the first number (typically speed comes first in package names like "Home 10 ...")
  return numbers[0].value;
}

/**
 * Extract speed number from a database package speed field like "10 Mbps"
 */
function extractDbSpeed(speedStr: string): number | null {
  if (!speedStr) return null;
  const match = speedStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export interface PackageMatchResult {
  matched: boolean;
  displayName: string;       // DB package name if matched, raw Excel value if not
  matchMethod: 'EXACT' | 'PARTIAL' | 'SPEED_MATCH' | 'AMBIGUOUS' | 'UNMATCHED';
}

export function matchPackage(
  excelValue: string | null | undefined,
  dbPackages: { name: string; speed: string }[]
): PackageMatchResult {
  const emptyResult: PackageMatchResult = { matched: false, displayName: '', matchMethod: 'UNMATCHED' };

  if (!excelValue || !excelValue.toString().trim()) {
    return emptyResult;
  }

  const trimmed = excelValue.toString().trim();
  const trimmedLower = trimmed.toLowerCase();

  if (dbPackages.length === 0) {
    return { matched: false, displayName: trimmed, matchMethod: 'UNMATCHED' };
  }

  // Priority A: Exact normalized name match
  for (const pkg of dbPackages) {
    if (pkg.name.toLowerCase() === trimmedLower) {
      return { matched: true, displayName: pkg.name, matchMethod: 'EXACT' };
    }
  }

  // Priority A continued: Exact match after normalizing spaces/case
  const normalizeForCompare = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  for (const pkg of dbPackages) {
    if (normalizeForCompare(pkg.name) === normalizeForCompare(trimmed)) {
      return { matched: true, displayName: pkg.name, matchMethod: 'EXACT' };
    }
  }

  // Priority B: Partial / fuzzy match (one contains the other)
  for (const pkg of dbPackages) {
    const pkgLower = pkg.name.toLowerCase();
    if (trimmedLower.includes(pkgLower) || pkgLower.includes(trimmedLower)) {
      return { matched: true, displayName: pkg.name, matchMethod: 'PARTIAL' };
    }
  }

  // Priority B continued: Extract Mbps from Excel value and match against DB package names
  const excelMbpsMatch = trimmed.match(/(\d+)\s*mbps/i);
  if (excelMbpsMatch) {
    const excelSpeed = parseInt(excelMbpsMatch[1], 10);
    for (const pkg of dbPackages) {
      const dbSpeed = extractDbSpeed(pkg.speed);
      if (dbSpeed !== null && dbSpeed === excelSpeed) {
        return { matched: true, displayName: pkg.name, matchMethod: 'PARTIAL' };
      }
    }
  }

  // Priority C: Speed/bandwidth match — extract speed number from Excel value
  const excelSpeed = extractSpeedNumber(trimmed);
  if (excelSpeed !== null) {
    // Find all DB packages with matching speed
    const candidates = dbPackages.filter(pkg => {
      const dbSpeed = extractDbSpeed(pkg.speed);
      return dbSpeed !== null && dbSpeed === excelSpeed;
    });

    if (candidates.length === 1) {
      return { matched: true, displayName: candidates[0].name, matchMethod: 'SPEED_MATCH' };
    }

    if (candidates.length > 1) {
      // Ambiguous — multiple packages with same speed
      return { matched: false, displayName: trimmed, matchMethod: 'AMBIGUOUS' };
    }
  }

  // No match found
  return { matched: false, displayName: trimmed, matchMethod: 'UNMATCHED' };
}
