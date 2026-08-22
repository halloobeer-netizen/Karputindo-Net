import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { generateAutoMapping } from '@/lib/import/header-matcher';
import { parseAndValidateRows, computeSummary } from '@/lib/import/row-parser';
import { db } from '@/lib/db';
import type { RawExcelRow, FileMeta, ColumnMapping, ParsedCustomerRow, ImportSummary } from '@/lib/import/types';

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    // --- Validate file extension ---
    const fileName = file.name;
    const ext = '.' + fileName.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { success: false, error: 'Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv' },
        { status: 400 }
      );
    }

    // --- Validate file size ---
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `Ukuran file melebihi batas ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 400 }
      );
    }

    // --- Parse the file server-side ---
    const buffer = Buffer.from(await file.arrayBuffer());
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'array' });

    const sheetNames = workbook.SheetNames;
    const sheetCount = sheetNames.length;
    const firstSheet = workbook.Sheets[sheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<RawExcelRow>(firstSheet, { defval: '' });

    if (jsonData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'File kosong atau tidak memiliki data' },
        { status: 400 }
      );
    }

    const headers = Object.keys(jsonData[0]);
    const totalRows = jsonData.length;

    const fileMeta: FileMeta = {
      fileName,
      fileSize: file.size,
      sheetCount,
      sheetNames,
      totalRows,
      headers,
    };

    // --- Auto mapping ---
    const autoMap = generateAutoMapping(headers);
    const mappings: ColumnMapping[] = headers.map((h) => ({
      excelColumn: h,
      targetField: autoMap[h],
    }));

    // --- Load existing customer numbers for duplicate check ---
    const existingCustomers = await db.customer.findMany({ select: { customerNumber: true } });
    const existingNumbers = new Set(existingCustomers.map((c) => c.customerNumber));

    // --- Parse rows ---
    const parsedRows = parseAndValidateRows(jsonData, mappings, existingNumbers);
    const summary = computeSummary(parsedRows);

    return NextResponse.json({
      success: true,
      data: {
        fileMeta,
        headers,
        mappings,
        parsedRows,
        summary,
      },
    });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    console.error('Import parse error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses file. Pastikan format file benar.' },
      { status: 500 }
    );
  }
}
