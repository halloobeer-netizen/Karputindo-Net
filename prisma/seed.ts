import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('\U0001f331 Seeding database...');

  // Create SUPER_ADMIN user
  const adminPassword = await bcrypt.hash('KarputindoNet@2026#Dev91', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@karputindo.net' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@karputindo.net',
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`\u2705 Super Admin created: ${superAdmin.email}`);

  // Create ADMIN user
  const adminPassword2 = await bcrypt.hash('KarputindoNet@2026#Dev92', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'operator@karputindo.net' },
    update: {},
    create: {
      name: 'Operator',
      email: 'operator@karputindo.net',
      passwordHash: adminPassword2,
      role: 'ADMIN',
    },
  });
  console.log(`\u2705 Admin created: ${admin.email}`);

  // Create sample Internet Packages
  const packages = [
    { name: 'Paket 10 Mbps', speed: '10 Mbps', price: 150000, status: 'ACTIVE', description: 'Paket dasar untuk rumah tangga' },
    { name: 'Paket 20 Mbps', speed: '20 Mbps', price: 250000, status: 'ACTIVE', description: 'Paket standar untuk UMKM' },
    { name: 'Paket 30 Mbps', speed: '30 Mbps', price: 350000, status: 'ACTIVE', description: 'Paket bisnis kecil' },
    { name: 'Paket 50 Mbps', speed: '50 Mbps', price: 500000, status: 'ACTIVE', description: 'Paket premium untuk kebutuhan tinggi' },
  ];

  const createdPkgs: Record<string, string> = {};
  for (const pkg of packages) {
    const created = await prisma.internetPackage.create({ data: pkg });
    createdPkgs[created.name] = created.id;
    console.log(`\u2705 Package created: ${created.name}`);
  }

  // Create sample customers
  const sampleCustomers = [
    {
      customerNumber: 'KPN-001',
      fullName: 'Ahmad Fauzi',
      phone1: '08123456789',
      email: 'ahmad@gmail.com',
      address: 'Jl. Merdeka No. 10, RT 01/RW 02',
      latitude: -6.2088,
      longitude: 106.8456,
      packageId: createdPkgs['Paket 20 Mbps'],
      registrationFee: 100000,
      sales: 'Dedi',
      media: 'Instagram',
      technician: 'Budi',
      spkNumber: 'SPK-2024-001',
      spkDate: new Date('2024-01-10'),
      installationDate: new Date('2024-01-15'),
      status: 'ACTIVE',
      createdBy: superAdmin.id,
      updatedBy: superAdmin.id,
      notes: 'Pelanggan lama',
    },
    {
      customerNumber: 'KPN-002',
      fullName: 'Siti Nurhaliza',
      phone1: '08234567890',
      email: 'siti@gmail.com',
      address: 'Jl. Sudirman No. 25, RT 03/RW 04',
      latitude: -6.2098,
      longitude: 106.8466,
      packageId: createdPkgs['Paket 10 Mbps'],
      registrationFee: 100000,
      sales: 'Eko',
      media: 'Teman',
      technician: 'Budi',
      spkNumber: 'SPK-2024-002',
      spkDate: new Date('2024-02-15'),
      installationDate: new Date('2024-02-20'),
      status: 'ACTIVE',
      createdBy: superAdmin.id,
      updatedBy: superAdmin.id,
    },
    {
      customerNumber: 'KPN-003',
      fullName: 'Budi Santoso',
      phone1: '08345678901',
      email: 'budi.santoso@gmail.com',
      address: 'Jl. Gatot Subroto No. 5, RT 05/RW 06',
      latitude: -6.2108,
      longitude: 106.8476,
      packageId: createdPkgs['Paket 30 Mbps'],
      registrationFee: 150000,
      sales: 'Dedi',
      media: 'Facebook',
      technician: 'Agus',
      spkNumber: 'SPK-2024-003',
      spkDate: new Date('2024-03-05'),
      installationDate: new Date('2024-03-10'),
      terminationDate: new Date('2024-09-15'),
      status: 'TERMINATED',
      createdBy: superAdmin.id,
      updatedBy: superAdmin.id,
      notes: 'Pindah rumah',
    },
    {
      customerNumber: 'KPN-004',
      fullName: 'Dewi Lestari',
      phone1: '08456789012',
      email: 'dewi.lestari@gmail.com',
      address: 'Jl. Asia Afrika No. 15, RT 07/RW 08',
      latitude: -6.2118,
      longitude: 106.8486,
      packageId: createdPkgs['Paket 20 Mbps'],
      registrationFee: 100000,
      sales: 'Eko',
      media: 'Website',
      technician: 'Agus',
      spkNumber: 'SPK-2024-004',
      spkDate: new Date('2024-10-01'),
      status: 'INSTALLATION',
      createdBy: admin.id,
      updatedBy: admin.id,
    },
    {
      customerNumber: 'KPN-005',
      fullName: 'Rizky Pratama',
      phone1: '08567890123',
      email: 'rizky.p@gmail.com',
      address: 'Jl. Braga No. 30, RT 09/RW 10',
      latitude: -6.2128,
      longitude: 106.8496,
      packageId: createdPkgs['Paket 50 Mbps'],
      registrationFee: 200000,
      sales: 'Dedi',
      media: 'Referral',
      technician: 'Budi',
      spkNumber: 'SPK-2024-005',
      spkDate: new Date('2024-04-01'),
      installationDate: new Date('2024-04-05'),
      status: 'ACTIVE',
      createdBy: superAdmin.id,
      updatedBy: superAdmin.id,
    },
  ];

  for (const customer of sampleCustomers) {
    const created = await prisma.customer.create({ data: customer });
    console.log(`\u2705 Customer created: ${created.customerNumber} - ${created.fullName}`);
  }

  console.log('\n\u2728 Seeding completed!');
  console.log('\nLogin credentials:');
  console.log('  Super Admin: admin@karputindo.net / (see .env.development)');
  console.log('  Admin:      operator@karputindo.net / (see .env.development)');
}

main()
  .catch((e) => {
    console.error('\u274c Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
