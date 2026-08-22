import { z } from 'zod';

export const customerCreateSchema = z.object({
  customerNumber: z.string().min(1, 'No Pelanggan wajib diisi'),
  fullName: z.string().min(1, 'Nama Lengkap wajib diisi'),
  phone1: z.string().optional().or(z.literal('')),
  phone2: z.string().optional().or(z.literal('')),
  email: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  packageId: z.string().optional().or(z.literal('')),
  packageExcel: z.string().optional().or(z.literal('')),
  registrationFee: z.coerce.number().optional().nullable(),
  sales: z.string().optional().or(z.literal('')),
  media: z.string().optional().or(z.literal('')),
  technician: z.string().optional().or(z.literal('')),
  spkNumber: z.string().optional().or(z.literal('')),
  spkDate: z.string().optional().or(z.literal('')),
  installationDate: z.string().optional().or(z.literal('')),
  terminationDate: z.string().optional().or(z.literal('')),
  status: z.string().min(1, 'Status wajib dipilih'),
  notes: z.string().optional().or(z.literal('')),
});

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;

export function sanitizeCustomerInput(input: CustomerCreateInput) {
  return {
    ...input,
    phone1: input.phone1 || null,
    phone2: input.phone2 || null,
    email: input.email || null,
    address: input.address || null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    packageId: input.packageId || null,
    packageExcel: input.packageExcel || null,
    registrationFee: input.registrationFee ?? null,
    sales: input.sales || null,
    media: input.media || null,
    technician: input.technician || null,
    spkNumber: input.spkNumber || null,
    spkDate: input.spkDate ? new Date(input.spkDate) : null,
    installationDate: input.installationDate ? new Date(input.installationDate) : null,
    terminationDate: input.terminationDate ? new Date(input.terminationDate) : null,
    notes: input.notes || null,
  };
}
