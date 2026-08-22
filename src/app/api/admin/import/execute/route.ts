import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import type { ParsedCustomerRow, ImportResult } from '@/lib/import/types';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const body = await request.json();
    const {
      rows,
      filename,
    }: {
      rows: ParsedCustomerRow[];
      filename: string;
    } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada data untuk diimport' }, { status: 400 });
    }

    // --- Pre-load existing customer numbers ---
    const existingCustomers = await db.customer.findMany({ select: { customerNumber: true, id: true } });
    const existingCnMap = new Map(existingCustomers.map((c) => [c.customerNumber, c.id]));

    // --- Count before ---
    const countBefore = await db.customer.count();

    // --- Create ImportHistory ---
    const importHistory = await db.importHistory.create({
      data: {
        filename,
        totalRows: rows.length,
        validRows: rows.filter((r) => r.importStatus === 'READY').length,
        importedRows: 0,
        skippedRows: 0,
        duplicateRows: 0,
        failedRows: 0,
        importedBy: userId,
        status: 'PROCESSING',
      },
    });

    // --- Process rows ---
    const results: ImportResult[] = [];
    let importedCount = 0;
    let skippedInvalid = 0;
    let skippedDuplicate = 0;
    let failedCount = 0;

    for (const row of rows) {
      // INVALID → skip
      if (row.importStatus === 'INVALID') {
        results.push({
          rowIndex: row.rowIndex,
          customerNumber: row.customerNumber,
          fullName: row.fullName,
          resultStatus: 'INVALID_SKIPPED',
          reason: row.issues.join('; '),
        });
        skippedInvalid++;
        continue;
      }

      // DUPLICATE → skip
      if (row.importStatus === 'DUPLICATE') {
        results.push({
          rowIndex: row.rowIndex,
          customerNumber: row.customerNumber,
          fullName: row.fullName,
          resultStatus: 'DUPLICATE_SKIPPED',
          reason: `No Pelanggan "${row.customerNumber}" sudah ada`,
        });
        skippedDuplicate++;
        continue;
      }

      // READY — re-check Nama wajib (No Pelanggan boleh kosong)
      if (!row.fullName?.trim()) {
        results.push({
          rowIndex: row.rowIndex,
          customerNumber: row.customerNumber,
          fullName: row.fullName,
          resultStatus: 'INVALID_SKIPPED',
          reason: 'Nama Lengkap kosong',
        });
        skippedInvalid++;
        continue;
      }

      const cn = row.customerNumber?.trim() || null;

      // Double-check duplicate only if No Pelanggan exists
      if (cn && existingCnMap.has(cn)) {
        results.push({
          rowIndex: row.rowIndex,
          customerNumber: cn,
          fullName: row.fullName,
          resultStatus: 'DUPLICATE_SKIPPED',
          reason: `No Pelanggan "${cn}" sudah ada`,
        });
        skippedDuplicate++;
        continue;
      }

      // --- Create customer ---
      try {
        const createData: Record<string, unknown> = {
          fullName: row.fullName!.trim(),
          createdBy: userId,
          updatedBy: userId,
          status: row.status || 'INSTALLATION',
        };

        // customerNumber hanya disimpan jika tersedia
        if (cn) createData.customerNumber = cn;

        if (row.packageExcel) createData.packageExcel = row.packageExcel;
        if (row.phone1) createData.phone1 = row.phone1;
        if (row.phone2) createData.phone2 = row.phone2;
        if (row.email) createData.email = row.email;
        if (row.address) createData.address = row.address;
        if (row.latitude !== null) createData.latitude = row.latitude;
        if (row.longitude !== null) createData.longitude = row.longitude;
        if (row.registrationFee !== null) createData.registrationFee = row.registrationFee;
        if (row.sales) createData.sales = row.sales;
        if (row.media) createData.media = row.media;
        if (row.technician) createData.technician = row.technician;
        if (row.spkNumber) createData.spkNumber = row.spkNumber;
        if (row.notes) createData.notes = row.notes;

        // Dates — parse the formatted date string back to Date
        if (row.spkDate) {
          const d = new Date(row.spkDate);
          if (!isNaN(d.getTime())) createData.spkDate = d;
        }
        if (row.installationDate) {
          const d = new Date(row.installationDate);
          if (!isNaN(d.getTime())) createData.installationDate = d;
        }
        if (row.terminationDate) {
          const d = new Date(row.terminationDate);
          if (!isNaN(d.getTime())) createData.terminationDate = d;
        }

        await db.customer.create({ data: createData as any });
        if (cn) existingCnMap.set(cn, cn); // track for idempotency

        results.push({
          rowIndex: row.rowIndex,
          customerNumber: cn,
          fullName: row.fullName,
          resultStatus: 'IMPORTED',
          reason: '',
        });
        importedCount++;
      } catch (err) {
        results.push({
          rowIndex: row.rowIndex,
          customerNumber: cn,
          fullName: row.fullName,
          resultStatus: 'FAILED',
          reason: `Gagal: ${err instanceof Error ? err.message : 'Unknown error'}`,
        });
        failedCount++;
      }
    }

    // --- Count after ---
    const countAfter = await db.customer.count();

    // --- Final status ---
    let finalStatus: string;
    if (failedCount === 0 && skippedInvalid === 0 && skippedDuplicate === 0) {
      finalStatus = 'COMPLETED';
    } else if (importedCount > 0) {
      finalStatus = 'PARTIAL';
    } else if (failedCount === rows.length) {
      finalStatus = 'FAILED';
    } else {
      finalStatus = 'PARTIAL';
    }

    // --- Update ImportHistory ---
    await db.importHistory.update({
      where: { id: importHistory.id },
      data: {
        importedRows: importedCount,
        skippedRows: skippedInvalid + skippedDuplicate,
        duplicateRows: skippedDuplicate,
        failedRows: failedCount,
        finishedAt: new Date(),
        status: finalStatus,
      },
    });

    // --- Audit log ---
    await createAuditLog({
      userId,
      action: 'IMPORT',
      entity: 'Customer',
      entityId: importHistory.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        importId: importHistory.id,
        results,
        summary: {
          totalRows: rows.length,
          importedRows: importedCount,
          skippedRows: skippedInvalid + skippedDuplicate,
          duplicateRows: skippedDuplicate,
          invalidRows: skippedInvalid,
          failedRows: failedCount,
        },
        countBefore,
        countAfter,
        status: finalStatus,
      },
    });
  } catch (error) {
    if ((error as any)?.message?.includes('redirect')) throw error;
    console.error('Import execute error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal melakukan import. Silakan coba lagi.' },
      { status: 500 },
    );
  }
}
