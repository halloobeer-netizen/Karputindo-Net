// ============================================
// FASE 3B — Simplified Row Parser
// READY / INVALID / DUPLICATE
// Package preserved as-is from Excel
// ============================================

import type { RawExcelRow, ParsedCustomerRow, ColumnMapping } from './types';
import { parseCoordinates, parseExcelDate, normalizePhone, normalizeStatus } from './validators';

/**
 * Build a reverse lookup: targetField → excelColumn
 */
function buildFieldLookup(mappings: ColumnMapping[]): Record<string, string> {
  const lookup: Record<string, string> = {};
  for (const m of mappings) {
    if (m.targetField && m.targetField !== '__skip__') {
      lookup[m.targetField] = m.excelColumn;
    }
  }
  return lookup;
}

/**
 * Get value from raw row as string
 */
function getRawValue(row: RawExcelRow, column: string): string | null {
  const val = row[column];
  if (val === null || val === undefined) return null;
  if (typeof val === 'boolean') return null;
  return String(val);
}

/**
 * Parse all rows — simplified: READY / INVALID / DUPLICATE
 */
export function parseAndValidateRows(
  rawRows: RawExcelRow[],
  mappings: ColumnMapping[],
  existingCustomerNumbers: Set<string>
): ParsedCustomerRow[] {
  const lookup = buildFieldLookup(mappings);

  return rawRows.map((raw, idx) => {
    const issues: string[] = [];

    // --- customerNumber ---
    const customerNumber = getRawValue(raw, lookup['customerNumber'] || '');
    const cnTrimmed = customerNumber?.trim() || null;

    // --- fullName ---
    const fullName = getRawValue(raw, lookup['fullName'] || '');
    const fnTrimmed = fullName?.trim() || null;

    // --- Determine status ---
    let importStatus: 'READY' | 'INVALID' | 'DUPLICATE' = 'READY';

    // INVALID: hanya Nama kosong (No Pelanggan kosong tetap READY)
    if (!fnTrimmed) {
      issues.push('Nama Lengkap kosong');
      importStatus = 'INVALID';
    }

    // DUPLICATE: hanya cek jika No Pelanggan tersedia
    if (cnTrimmed && existingCustomerNumbers.has(cnTrimmed)) {
      issues.push('No Pelanggan sudah ada di database');
      if (importStatus !== 'INVALID') {
        importStatus = 'DUPLICATE';
      }
    }

    // --- phone1 ---
    const phone1 = normalizePhone(raw[lookup['phone1'] || '']);

    // --- phone2 ---
    const phone2 = normalizePhone(raw[lookup['phone2'] || '']);

    // --- email (keep original, don't validate) ---
    const emailRaw = getRawValue(raw, lookup['email'] || '');
    const emailOriginal = emailRaw?.trim() || null;
    // Store as-is; if it looks like email keep it, otherwise keep original text too
    const email = emailOriginal;

    // --- address ---
    const address = getRawValue(raw, lookup['address'] || '');

    // --- coordinates ---
    const coordRaw = getRawValue(raw, lookup['coordinates'] || '');
    const coords = parseCoordinates(coordRaw);
    const latitude = coords?.latitude ?? null;
    const longitude = coords?.longitude ?? null;

    // --- package (RAW from Excel, preserved as-is) ---
    const packageExcel = getRawValue(raw, lookup['package'] || '')?.trim() || null;

    // --- registrationFee ---
    const regFeeRaw = raw[lookup['registrationFee'] || ''];
    let registrationFee: number | null = null;
    if (regFeeRaw !== null && regFeeRaw !== undefined && regFeeRaw !== '') {
      const parsed = Number(regFeeRaw);
      if (!isNaN(parsed) && isFinite(parsed)) {
        registrationFee = parsed;
      }
    }

    // --- sales, media, technician ---
    const sales = getRawValue(raw, lookup['sales'] || '');
    const media = getRawValue(raw, lookup['media'] || '');
    const technician = getRawValue(raw, lookup['technician'] || '');

    // --- spkNumber ---
    const spkNumber = getRawValue(raw, lookup['spkNumber'] || '');

    // --- dates ---
    const spkDate = parseExcelDate(raw[lookup['spkDate'] || '']);
    const installationDate = parseExcelDate(raw[lookup['installationDate'] || '']);
    const terminationDate = parseExcelDate(raw[lookup['terminationDate'] || '']);

    // --- status ---
    const statusRaw = getRawValue(raw, lookup['status'] || '');
    const statusOriginal = statusRaw?.trim() || null;
    const statusResult = normalizeStatus(statusRaw);
    const status = statusResult.status;

    // --- notes ---
    const notes = getRawValue(raw, lookup['notes'] || '');

    return {
      rowIndex: idx,
      importStatus,
      issues,
      customerNumber: cnTrimmed,
      fullName: fnTrimmed,
      phone1,
      phone2,
      email,
      emailOriginal,
      address: address?.trim() || null,
      latitude,
      longitude,
      packageExcel,
      registrationFee,
      sales,
      media,
      technician,
      spkNumber,
      spkDate,
      installationDate,
      terminationDate,
      status,
      statusOriginal,
      notes,
    };
  });
}

/**
 * Compute summary statistics
 */
export function computeSummary(rows: ParsedCustomerRow[]) {
  let readyCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;

  for (const row of rows) {
    if (row.importStatus === 'READY') readyCount++;
    else if (row.importStatus === 'INVALID') invalidCount++;
    else if (row.importStatus === 'DUPLICATE') duplicateCount++;
  }

  return {
    totalRows: rows.length,
    readyCount,
    invalidCount,
    duplicateCount,
  };
}
