# 🎵 TixNova — AI-Powered Event Growth & Operating System

> **The Event Growth Operating System** — Power the experience economy.
> **PT Ragam Manfaat Sinergi** — Versi 2.0
> Alamat: Jl. Teluk Betung Selatan No. 123, Bandar Lampung, Indonesia

## 🎯 Tentang TixNova

TixNova bukan sekadar platform ticketing. Ia adalah **sistem operasi pertumbuhan event (Event Growth OS)** — lapisan kepercayaan, data, dan kecerdasan yang menyatukan seluruh ekonomi event (EO, artis, sponsor, venue, vendor, komunitas, pembeli) dalam satu sistem multi-tenant.

Visi 2036: **menjadi sistem operasi ekonomi event global.** Arah produk, arsitektur 6 lapis, dan roadmap 10 tahun tertuang dalam Master Blueprint.

### Fitur Utama:
- **Multi-tenant System**: Setiap promotor/EO memiliki data terisolasi
- **RBAC (Role-Based Access Control)**: Super Admin, Promotor, dan User
- **Sistem Event Management**: Pembuatan, approval, pengelolaan, pelacakan acara
- **Checkout yang Aman**: Integrasi payment gateway (Midtrans, Xendit) + webhook idempotent
- **QR Code Ticketing**: Tiket digital + verifikasi scan cepat
- **Sistem Referral & Affiliate**: Pemasaran organik berjejaring (fondasi Distribution OS)
- **Refund & Reschedule**: Pengajuan, review, dan eksekusi terstruktur
- **Multi-language**: Konten ID/EN
- **Dashboard Analitik**: Pendapatan, tiket per kategori, komisi

## 📋 Dokumentasi

| Dokumen | Isi |
|---|---|
| **[docs/MASTER_BLUEPRINT.md](./docs/MASTER_BLUEPRINT.md)** | Blueprint 2.0 — visi 2036, arsitektur 6 lapis, strategi AI/data/platform, roadmap 30 hari–10 tahun |
| **[docs/AUDIT_REPORT_2026-08-06.md](./docs/AUDIT_REPORT_2026-08-06.md)** | Audit komprehensif produk, arsitektur, keamanan, roadmap |
| **[docs/PRODUCT_DOCUMENTATION.md](./docs/PRODUCT_DOCUMENTATION.md)** | Dokumentasi lengkap produk + roadmap pengembangan |

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Laravel 13.8 + PHP 8.3 + Sanctum |
| Frontend | Next.js 16 + React 19 + TypeScript + Tailwind CSS |
| Database | MySQL 8 / SQLite (dev) |
| Cache & Queue | Redis 7 |
| Payment | Midtrans + Xendit |
| Infrastruktur | Docker Compose + GitHub Actions (CI) |

## 👥 Role

- **Super Admin** — Owner platform
- **Promotor / EO** — Event organizer
- **User** — Pembeli tiket

## 🧭 Arah Produk (Blueprint 2.0)

```
CORE (Ticketing · Event Mgmt · Multi-tenant · Trust & Identity)
   + GROWTH ENGINE (Distribution OS · Affiliate · Community · Campaign)
   + OPERATING SYSTEM (Event ERP · CRM · Finance OS · Vendor/Crew)
   + MARKETPLACES (Sponsor · Vendor · Venue · Talent · Creator)
   + INTELLIGENCE (Analytics · AI Pricing · AI Marketing · AI Matching · AI Fraud)
   + PLATFORM (API · SDK/Widget · White Label · Mobile+Wallet · POS)
```

Lihat `docs/MASTER_BLUEPRINT.md` untuk detail, prioritas, dan roadmap lengkap.
