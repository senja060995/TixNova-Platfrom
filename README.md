# TixNova Platform

Platform sistem operasi dan manajemen ticketing event berbasis web yang dirancang untuk mengelola pendaftaran event, penjualan e-tiket, verifikasi transaksi, gate scanner QR code, serta otomasi pertumbuhan bisnis event organizer.

Dev by RamsDev

---

## Arsitektur Teknologi

- **Backend API**: Laravel 11 (PHP 8.2+) dengan Sanctum Authentication, Spatie Role Permission, dan Service Layer Pattern.
- **Frontend Web**: Next.js 16 (React 19, Turbopack) dengan Tailwind CSS dan Vanilla CSS Design System.
- **Database**: PostgreSQL / SQLite dengan dukungan multi-tenant scope.
- **Payment Gateway**: Midtrans Snap & Xendit Invoice Integration.

---

## Persyaratan Sistem

Sebelum melakukan instalasi, pastikan perangkat Anda telah terpasang:
- PHP >= 8.2
- Composer >= 2.5
- Node.js >= 18.0.0
- NPM >= 9.0.0
- Database PostgreSQL / SQLite

---

## Panduan Instalasi

### 1. Cloning Repository

```bash
git clone https://github.com/senja060995/TixNova-Platfrom.git
cd TixNova-Platfrom
```

### 2. Setup Backend (tixnova-api)

1. Masuk ke direktori backend:
   ```bash
   cd tixnova-api
   ```

2. Install dependensi Composer:
   ```bash
   composer install
   ```

3. Salin file lingkungan `.env`:
   ```bash
   cp .env.example .env
   ```

4. Generate Application Key:
   ```bash
   php artisan key:generate
   ```

5. Konfigurasi kredensial database dan Payment Gateway di file `.env`:
   ```env
   DB_CONNECTION=sqlite
   MIDTRANS_SERVER_KEY=your_midtrans_server_key
   MIDTRANS_CLIENT_KEY=your_midtrans_client_key
   XENDIT_SECRET_KEY=your_xendit_secret_key
   ```

6. Jalankan migrasi database dan seeder data awal:
   ```bash
   php artisan migrate --seed
   ```

7. Jalankan server lokal backend:
   ```bash
   php artisan serve --port=8000
   ```

---

### 3. Setup Frontend (tixnova-web)

1. Masuk ke direktori frontend:
   ```bash
   cd ../tixnova-web
   ```

2. Install dependensi NPM:
   ```bash
   npm install
   ```

3. Salin file lingkungan `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

4. Konfigurasi URL API backend pada file `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

5. Jalankan server pengembangan Next.js:
   ```bash
   npm run dev
   ```

6. Buka peramban web pada alamat `http://localhost:3000`.

---

## Panduan Pemakaian Aplikasi

### Role Super Admin
- **URL Login**: `/login` (Akun awal: `admin@tixnova.id` / `password123`)
- **Fitur Utama**:
  - Pengelolaan data tenant dan audit persetujuan promotor baru.
  - Review dan verifikasi pengajuan event serta jadwal ulang (reschedule).
  - Monitoring transaksi platform, penyesuaian komisi, dan laporan pendapatan.
  - Pengelolaan refund tiket global dan audit log aktivitas sistem.

### Role Promotor / Event Organizer
- **URL Pendaftaran**: `/register?role=promotor`
- **URL Login**: `/login`
- **Fitur Utama**:
  - Pembuatan dan manajemen event (tiket regular, VIP, early bird, seat map).
  - Pemasaran tiket via Campaign OS, CRM segmentasi, dan integrasi Komunitas.
  - Penjualan tiket via Payment Gateway Midtrans / Xendit.
  - Aplikasi Gate Scanner (`/dashboard/scan`) untuk verifikasi check-in QR Code.

### Role Pembeli Tiket (User)
- **URL Registrasi & Login**: `/register` dan `/login`
- **Fitur Utama**:
  - Pencarian event berdasarkan kota, kategori, dan rentang harga.
  - Checkout tiket cepat dengan integrasi pembayaran otomatis.
  - Akses E-Tiket Vault (`/dashboard/my-tickets`) dan QR Code check-in.
  - Fitur pengajuan refund resmi dan program referral komunitas.

---

## Status Perkembangan & Roadmap

### Fase 1: Foundation & Security Hardening (Selesai / Completed)
- Selesai: Sistem Autentikasi Sanctum & Role-Based Access Control (RBAC).
- Selesai: Integrasi Payment Gateway Midtrans & Xendit otomatis.
- Selesai: Generasi E-Tiket QR Code dan Gate Web Scanner real-time.
- Selesai: Modul Multi-Language (Bahasa Indonesia & English).
- Selesai: Proteksi Keamanan Hardening v1 (Enkripsi Data Pelanggan PII, HMAC Signed QR Code, Security Headers HTTP, Audit Log Activity).
- Selesai: Proteksi Audit Pendaftaran Promotor & Proteksi Tenant Pending.

### Fase 2: Growth Engine (Dalam Pengembangan / In Progress)
- Selesai: Community OS & Revenue Sharing.
- Selesai: Event CRM & Campaign OS v1.
- Selesai: Vendor Marketplace & Sponsorship OS.
- Selesai: Developer API Portal.
- Dalam Proses: AI Dynamic Pricing Engine & Demand Forecast.
- Dalam Proses: Mobile PWA Wallet E-Ticket.

### Fase 3: Ecosystem & White Label (Rencana Mendatang)
- Rencana: Custom Domain per Tenant Promotor.
- Rencana: Financial Escrow Payout Scheduler.
- Rencana: AI Fraud Detection System.

---

## Lisensi

Pengembangan aplikasi ini dikelola secara eksklusif oleh RamsDev. Seluruh hak cipta dilindungi oleh undang-undang.
