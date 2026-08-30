# PROJECT HANDOVER — KARPOTINDO

## 1. Project Overview

**Project Name:** KARPOTINDO  
**Project Type:** ISP / Internet Customer Management Web Application  
**Status:** Active Development  
**Primary Purpose:** Mengelola pelanggan internet, paket layanan, billing, pembayaran, status isolasi, serta sinkronisasi pelanggan dengan MikroTik.

Project ini sudah melalui beberapa tahap pengembangan dan **BUKAN project baru**.  
Developer atau AI yang melanjutkan project wajib memahami struktur yang sudah ada dan melanjutkan dari kondisi terakhir tanpa membangun ulang dari awal.

---

## 2. Important Continuation Rule

Sebelum melakukan perubahan:

1. Periksa repository terbaru.
2. Periksa struktur folder.
3. Periksa `package.json`.
4. Periksa database/schema.
5. Periksa API routes.
6. Periksa environment variables yang sudah digunakan.
7. Periksa deployment configuration.
8. Identifikasi fitur yang sudah bekerja.
9. Jangan mengubah fitur yang sudah stabil tanpa alasan teknis yang jelas.

**Repository dan database terbaru adalah source of truth.**

Jangan membuat ulang aplikasi dari nol.

---

## 3. Main Technology Direction

Stack aktual harus diverifikasi dari repository sebelum melakukan perubahan.

Teknologi yang digunakan / direncanakan dalam pengembangan KARPOTINDO antara lain:

- Next.js
- React
- TypeScript / JavaScript sesuai repository
- PostgreSQL
- Neon
- Vercel
- GitHub
- API routes / backend services
- MikroTik RouterOS integration

Jangan melakukan migrasi framework, database, hosting, atau arsitektur tanpa instruksi eksplisit.

---

## 4. Main Modules

KARPOTINDO dikembangkan sebagai sistem administrasi ISP dengan modul utama:

### Customer Management
- Database pelanggan
- Nama pelanggan
- Nomor pelanggan / ID
- Nomor telepon
- Alamat
- Email
- Paket internet
- Lokasi / koordinat
- Status pelanggan
- Edit data pelanggan
- Tambah pelanggan manual
- Import pelanggan melalui Excel / CSV

### Internet Package Management
- Daftar paket internet
- Harga paket
- Informasi paket
- Paket pelanggan
- Penambahan paket secara manual

### Billing
- Tagihan pelanggan
- Status pembayaran
- Tombol / proses pembayaran
- Status isolasi
- Aktivasi kembali pelanggan
- Sinkronisasi status billing dengan MikroTik

### MikroTik Integration
- PPPoE customer synchronization
- Isolasi pelanggan
- Aktivasi pelanggan
- Sinkronisasi aplikasi ↔ MikroTik
- Auto retry ketika proses sinkronisasi gagal

### Map / Customer Location
- Menampilkan lokasi pelanggan
- Klik pelanggan untuk fokus ke titik koordinat
- Data lokasi berasal dari database pelanggan

---

## 5. Completed / Working Direction

Beberapa bagian berikut sudah pernah dikembangkan dan harus dianggap sebagai bagian dari workflow yang sudah ada.

### Customer Database
Sudah mencakup arah fitur:

- Import Excel / CSV
- Pelanggan tanpa nomor pelanggan tetap dapat dimasukkan
- Edit data
- Input manual
- Paket mengikuti data pelanggan
- Lokasi pelanggan
- Peta pelanggan

Jika implementasi aktual berbeda, ikuti repository terbaru.

---

## 6. Billing Module

Billing sudah dikembangkan sampai ke tahap di mana:

- Halaman billing tersedia.
- Tombol pembayaran telah dikembangkan.
- Tombol isolasi / aktivasi telah dikembangkan.
- Performa loading billing sebelumnya pernah diperbaiki.
- Refresh berulang saat melakukan aksi billing sebelumnya menjadi perhatian dan sudah dilakukan perbaikan.
- Pada kondisi terakhir, fungsi utama billing dinyatakan sudah bekerja.

**Jangan membangun ulang billing tanpa mengecek implementasi aktual.**

---

## 7. MikroTik Integration — LOCKED ARCHITECTURE

Bagian MikroTik sudah dibahas dan arah arsitekturnya dianggap **LOCKED**.

Prinsip utama:

```text
Billing / Customer Status
        ↓
KARPOTINDO Application
        ↓
Synchronization Service
        ↓
MikroTik RouterOS
        ↓
PPPoE Customer Status
```

Aplikasi KARPOTINDO menjadi pusat logika status pelanggan.

MikroTik mengikuti status yang ditentukan aplikasi melalui synchronization layer.

---

## 8. Customer Isolation Flow

Untuk pelanggan yang belum membayar:

```text
Tagihan melewati aturan jatuh tempo
        ↓
KARPOTINDO menandai pelanggan sebagai unpaid / isolated
        ↓
Synchronization job dibuat
        ↓
MikroTik menerima perintah isolasi
        ↓
PPPoE pelanggan dinonaktifkan / dialihkan sesuai konfigurasi
        ↓
Status sinkronisasi dicatat di aplikasi
```

Detail teknis metode isolasi harus mengikuti implementasi terbaru pada repository dan konfigurasi RouterOS yang dipilih.

Jangan mengubah konsep ini tanpa instruksi.

---

## 9. Customer Reactivation Flow

Untuk pelanggan yang sudah membayar:

```text
Pembayaran dikonfirmasi
        ↓
Billing menjadi PAID
        ↓
Status isolasi dihapus
        ↓
Synchronization job dibuat
        ↓
MikroTik menerima perintah aktivasi
        ↓
PPPoE pelanggan aktif kembali
        ↓
Status sinkronisasi dicatat
```

Target akhirnya adalah proses pembayaran → aktivasi internet dapat berjalan otomatis.

---

## 10. Synchronization Principle

Sinkronisasi harus dirancang agar aman terhadap kegagalan jaringan atau MikroTik tidak tersedia.

Ideal flow:

```text
Application State
      ↓
Sync Queue / Sync Job
      ↓
MikroTik
      ↓
SUCCESS / FAILED
      ↓
Store Result
```

Aplikasi tidak boleh kehilangan informasi hanya karena MikroTik gagal dihubungi sementara.

---

## 11. Auto Retry — COMPLETED DIRECTION

Auto retry sudah menjadi bagian dari desain final sinkronisasi.

Jika sinkronisasi gagal karena:

- MikroTik offline
- network timeout
- RouterOS connection error
- temporary API failure

maka sistem harus mencoba ulang.

Contoh konsep:

```text
Attempt 1
↓
FAILED
↓
Retry

Attempt 2
↓
FAILED
↓
Retry

Attempt 3
↓
SUCCESS
```

Jumlah retry dan interval mengikuti implementasi yang ada atau dapat disempurnakan tanpa mengubah konsep dasarnya.

---

## 12. Source of Truth

Untuk status pelayanan pelanggan:

**KARPOTINDO Database = application source of truth.**

MikroTik adalah execution layer.

Contoh:

```text
Database:
customer.status = ACTIVE

→ MikroTik harus berada dalam kondisi ACTIVE.
```

Jika terjadi perbedaan:

```text
Database = ACTIVE
MikroTik = ISOLATED
```

synchronization service harus mampu memperbaiki ketidaksesuaian tersebut.

---

## 13. Real MikroTik Connection

Pada tahap pengembangan sebelumnya, integrasi telah dirancang agar nantinya MikroTik asli dapat digunakan.

Ketika perangkat MikroTik tersedia, proses lanjutan:

1. Pastikan RouterOS API tersedia.
2. Konfigurasikan IP / hostname router.
3. Buat user MikroTik khusus aplikasi.
4. Berikan permission minimum yang diperlukan.
5. Masukkan credential melalui environment variables.
6. Test connectivity.
7. Test read PPPoE users.
8. Test isolation pada satu test customer.
9. Test reactivation.
10. Test auto retry.
11. Test reconciliation / synchronization.

Jangan langsung melakukan test terhadap pelanggan produksi tanpa akun test.

---

## 14. MikroTik Environment Variables

Nama variabel aktual harus mengikuti repository.

Jika belum ada, pola yang disarankan:

```env
MIKROTIK_HOST=
MIKROTIK_PORT=
MIKROTIK_USERNAME=
MIKROTIK_PASSWORD=
```

Credential asli tidak boleh dimasukkan ke GitHub.

Gunakan:

- `.env.local` untuk development
- Vercel Environment Variables untuk deployment

Jangan commit secrets.

---

## 15. Customer Web Portal — LOCKED FUTURE DIRECTION

Telah diputuskan bahwa nantinya akan dibuat **web pelanggan**, bukan langsung memprioritaskan APK.

Customer web portal nantinya dapat digunakan untuk:

- Login pelanggan
- Melihat paket
- Melihat tagihan
- Melihat jatuh tempo
- Melihat status pembayaran
- Melakukan pembayaran
- Melihat riwayat pembayaran
- Melihat status koneksi
- Menghubungi support

Aplikasi admin KARPOTINDO tetap terpisah dari interface pelanggan.

---

## 16. Payment Automation — Future Direction

Target akhir:

```text
Customer
   ↓
Customer Web
   ↓
Payment Gateway
   ↓
Payment Confirmation
   ↓
KARPOTINDO Billing = PAID
   ↓
Synchronization Service
   ↓
MikroTik
   ↓
Internet Active
```

Artinya admin tidak harus mengaktifkan pelanggan secara manual setelah pembayaran berhasil.

Payment provider belum boleh diasumsikan sampai dipilih secara eksplisit.

---

## 17. UI / UX Direction

Pertahankan UI yang sudah digunakan di project.

Jangan melakukan redesign besar tanpa instruksi.

Prinsip:

- Clean
- Professional
- Responsive
- Mudah digunakan admin ISP
- Informasi penting mudah terlihat
- Tidak menggunakan animasi berlebihan
- Tidak menggunakan visual yang mengganggu operasional

---

## 18. Performance

Salah satu masalah sebelumnya adalah halaman billing terasa lambat setelah aksi tertentu.

Jika masalah performa muncul lagi:

Periksa terlebih dahulu:

- repeated fetch
- router refresh
- unnecessary revalidation
- database query
- sequential API calls
- MikroTik calls yang blocking UI
- React rendering
- cache configuration

Jangan langsung mengganti framework.

---

## 19. Database Safety

DILARANG melakukan:

```text
DROP DATABASE
DROP TABLE
TRUNCATE
prisma migrate reset
database reset
```

tanpa izin eksplisit.

Setiap perubahan schema harus mempertahankan data pelanggan.

Gunakan migration yang aman.

---

## 20. GitHub Rules

Sebelum coding:

```bash
git status
git log --oneline
```

Periksa perubahan yang ada.

Commit harus kecil dan jelas.

Contoh:

```text
feat: add mikrotik customer reconciliation

fix: prevent billing page unnecessary refresh

fix: retry failed mikrotik synchronization

feat: add customer payment status

ui: improve billing status indicators
```

Jangan menghapus history repository.

---

## 21. Deployment

Project menggunakan / diarahkan menggunakan Vercel.

Sebelum deployment:

- pastikan build berhasil
- pastikan env tersedia
- pastikan database connection tersedia
- pastikan migration aman
- pastikan API tidak mengekspos secrets

Setelah deployment, test fitur utama.

---

## 22. Error Handling

Integrasi eksternal wajib memiliki error handling.

Contoh:

```text
MikroTik unavailable
→ jangan crash aplikasi
→ simpan FAILED
→ jadwalkan retry
→ tampilkan status kepada admin
```

Error MikroTik tidak boleh menyebabkan billing data hilang.

---

## 23. Recommended MikroTik Sync Status

Jika belum tersedia, konsep berikut dapat digunakan:

```text
SYNCED
PENDING
FAILED
RETRYING
```

Tambahan informasi yang berguna:

```text
lastSyncAt
lastSyncError
retryCount
```

Tetapi sebelum menambah field baru, cek schema yang sudah ada.

---

## 24. Recommended Reconciliation

Selain event-based synchronization, sistem idealnya memiliki reconciliation.

Contoh:

```text
Setiap interval tertentu:

Read expected state from KARPOTINDO
        ↓
Read actual MikroTik state
        ↓
Compare
        ↓
Repair mismatch
```

Ini membuat sistem lebih stabil jika sebelumnya terjadi outage.

Implementasikan hanya setelah memastikan tidak bertabrakan dengan sistem sync yang sudah ada.

---

## 25. Development Priority

Urutan prioritas:

### Priority 1
Pastikan fitur yang sudah ada stabil.

### Priority 2
Pastikan billing stabil.

### Priority 3
Pastikan synchronization service stabil.

### Priority 4
Hubungkan MikroTik asli.

### Priority 5
Test otomatisasi isolate/reactivate.

### Priority 6
Tambahkan monitoring/reconciliation.

### Priority 7
Bangun customer web portal.

### Priority 8
Integrasikan payment gateway.

---

## 26. Next Recommended Development Stage

Jika repository saat ini sesuai dengan status terakhir, tahap selanjutnya adalah:

### STEP 1 — Audit Existing MikroTik Code

Cari:

```text
mikrotik
routeros
sync
pppoe
billing
isolate
activate
retry
```

Identifikasi service dan API yang sudah ada.

### STEP 2 — Prepare Real MikroTik Adapter

Pastikan integration layer dapat menerima konfigurasi router asli.

### STEP 3 — Connection Test

Buat health check:

```text
Application
→ MikroTik
→ authentication
→ response
```

### STEP 4 — Read Test

Ambil daftar PPPoE user.

Tidak melakukan perubahan.

### STEP 5 — Controlled Write Test

Gunakan test customer.

Test:

```text
ACTIVE → ISOLATED
ISOLATED → ACTIVE
```

### STEP 6 — Failure Simulation

Test:

```text
router offline
wrong credentials
timeout
network interrupted
```

Pastikan retry berjalan.

### STEP 7 — Reconciliation

Pastikan database dan MikroTik kembali konsisten.

---

## 27. Instructions for the Next AI / Developer

When taking over this repository:

DO NOT immediately write code.

First respond with:

```text
PROJECT AUDIT

1. Current stack
2. Folder structure
3. Database architecture
4. Existing billing implementation
5. Existing MikroTik implementation
6. Synchronization mechanism
7. Retry mechanism
8. Completed features
9. Potential issues
10. Recommended next action
```

Only after understanding the repository should development continue.

---

## 28. Locked Decisions

The following decisions should be considered locked unless explicitly changed:

- KARPOTINDO remains the central ISP management application.
- Billing controls customer service state.
- MikroTik is synchronized from application state.
- Unpaid customers can be automatically isolated.
- Paid customers can be automatically reactivated.
- Failed MikroTik synchronization uses retry.
- Real MikroTik will be connected when the physical router is available.
- Customer-facing service will use a web portal direction.
- Customer web portal is separate from the admin interface.
- Working features should not be rebuilt unnecessarily.

---

## 29. Important Final Instruction

This project has an existing history.

Do not treat it as a blank project.

The correct workflow is:

```text
READ
↓
AUDIT
↓
UNDERSTAND
↓
PRESERVE
↓
FIX
↓
CONTINUE
↓
TEST
↓
COMMIT
↓
DEPLOY
```

Not:

```text
DELETE
↓
REBUILD EVERYTHING
```

The goal is to continue KARPOTINDO toward a reliable production-ready ISP management system while preserving all existing work.
