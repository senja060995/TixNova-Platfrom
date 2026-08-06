# 🎵 TIXNOVA — Enterprise Ecosystem Audit Report

> **Audit Komprehensif** — Produk, Arsitektur, Bisnis, Roadmap
> **Tanggal Audit:** 6 Agustus 2026
> **Target:** Project Ticketing `tiketing/` (TixNova) — PT Ragam Manfaat Sinergi
> **Metode:** Penelusuran source code, struktur project, git history, dokumentasi, konfigurasi, migration database, API routes, dan test suite.
> **Perintah Validasi:** `php artisan test` → **39 tests passed, 118 assertions** | `npx eslint .` → **1 error, 125 warnings**
> **Catatan Kejujuran:** Seluruh klaim dalam laporan ini berbasis bukti kode. Klaim dokumentasi yang **tidak** terbukti di repository ditandai eksplisit sebagai **"Belum ditemukan pada repository"**.

---

## DAFTAR ISI

1. [Output 1 — Project Discovery Report](#output-1--project-discovery-report)
2. [Output 2 — Executive Summary](#output-2--executive-summary)
3. [Output 3 — Product Vision](#output-3--product-vision)
4. [Output 4 — Ecosystem Analysis](#output-4--ecosystem-analysis)
5. [Output 5 — Feature Inventory](#output-5--feature-inventory)
6. [Output 6 — Missing Features](#output-6--missing-features)
7. [Output 7 — Blue Ocean Analysis](#output-7--blue-ocean-analysis)
8. [Output 8 — Technical Audit](#output-8--technical-audit)
9. [Output 9 — Business Model Analysis](#output-9--business-model-analysis)
10. [Output 10 — Roadmap Detection](#output-10--roadmap-detection)
11. [Output 11 — Product Roadmap Recommendation](#output-11--product-roadmap-recommendation)
12. [Output 12 — Ecosystem Expansion](#output-12--ecosystem-expansion)
13. [Output 13 — Enterprise Readiness](#output-13--enterprise-readiness)
14. [Output 14 — Innovation Report (100+ Ide)](#output-14--innovation-report)
15. [Output 15 — Founder Recommendation](#output-15--founder-recommendation)
16. [Mandatory Deliverables](#mandatory-deliverables)

---

# OUTPUT 1 — Project Discovery Report

| Atribut | Temuan |
|---|---|
| **Nama Project** | **TixNova** — *Concert Ticketing SaaS Platform* |
| **Deskripsi** | Platform ticketing konser SaaS multi-tenant. Promotor membuat & menjual tiket event, pengguna membeli via payment gateway, check-in via QR scan, dikontrol super admin. |
| **Lokasi** | `/Users/sidomulyo/PT RAGAM MANFAAT SINERGI/tiketing` |
| **Status** | **Pre-production / Beta.** Development aktif ~1 minggu (commit 29 Jul – 6 Agu 2026). 7 commit root + 7 commit web, author tunggal (`sidomulyoadvertisingdev` / `Rams Dev`). |
| **Bahasa** | PHP 8.3 (backend), TypeScript 5 (frontend) |
| **Framework** | Laravel `^13.8` (composer.json:12 — **catatan:** README/dokumentasi menyebut "Laravel 12" & "Next.js 14", tidak sinkron) · Next.js `16.2.12` App Router + Turbopack · React 19.2.4 |
| **Database** | PostgreSQL 15 (`.env` lokal `DB_CONNECTION=pgsql`), SQLite in-memory untuk test. Migration 30 file, ±30 tabel. |
| **Frontend** | Next.js 16, Tailwind CSS v4 (CSS-first `@theme`), Zustand 5, Axios, react-query 5 (belum terpakai) |
| **Backend** | Laravel REST API + Sanctum (bearer token) + Spatie Permission (RBAC) |
| **CMS** | Blog engine built-in (model `Blog`, `Category`, translation `blog_content_translations`). Headless CMS eksternal: tidak ada. |
| **Mobile** | **Belum ditemukan pada repository.** Dokumentasi menyebut "React Native" sebagai roadmap, tidak ada kode mobile. |
| **Infrastructure** | **Belum ditemukan pada repository** (tidak ada `Dockerfile`, `docker-compose.yml`, nginx config di repo). Dokumentasi (PRODUCT_DOCUMENTATION.md §9) memuat docker-compose & GitHub Actions sebagai **rencana**, bukan realita. |
| **Repository Structure** | Monorepo: `tixnova-api/` (ter-track di git root) + `tixnova-web/` (punya `.git` sendiri, status berubah-ubah antar repo). Root punya `docs/PRODUCT_DOCUMENTATION.md` + `README.md` (masih berisi marker conflict `<<<<<<< HEAD` di `README.md:1` — file belum di-resolve). |
| **Dependency** | API: dompdf, intervention/image, simple-qrcode, spatie/permission, sanctum. Web: headlessui, heroicons, react-query, html5-qrcode, qrcode.react, zustand, lucide, date-fns. |
| **External Service** | Midtrans (sandbox, `MIDTRANS_IS_PRODUCTION=false`), Mailtrap SMTP sandbox, (Resend dikonfigurasi di config namun `.env` memakai SMTP). |
| **Third Party** | Spatie Permission, Barryvdh dompdf, Intervention Image, simple-qrcode |
| **Payment Gateway** | **Midtrans** (Snap V1 + status polling + refund) — berfungsi penuh. **Xendit** — stub rusak (webhook → 500, lihat Technical Audit). |
| **Notification** | Email via queue (Job `SendEticket`, `SendEventRescheduleNotification`, Mail `EticketMail`, `PasswordResetMail`). WhatsApp: **Belum ditemukan pada repository** (diklaim di docs §9, tidak ada implementasi). |
| **Authentication** | Sanctum personal access tokens (tanpa expiry explicit, tanpa refresh token di backend). RBAC 3 role: `super_admin`, `promotor`, `user`. |
| **Deployment** | **Belum ditemukan pada repository.** Remote: `https://github.com/senja060995/TixNova.git` (private). Tidak ada instruksi deploy di repo. |
| **CI/CD** | **Belum ditemukan pada repository.** Tidak ada `.github/`, tidak ada workflow file. Docs §9 memuat pipeline GitHub Actions sebagai rencana. |

**Teknologi yang diklaim docs vs terverifikasi di kode:**

| Klaim Dokumentasi | Realita di Kode |
|---|---|
| Laravel 12 | Laravel 13.8 (`composer.json:12`) |
| Next.js 14 | Next.js 16.2.12 (`package.json:20`) |
| Tailwind v3 | Tailwind v4 |
| Redis cache/queue | `CACHE_STORE=database`, `QUEUE_CONNECTION=database` (Redis tidak aktif di env lokal) |
| MySQL/PostgreSQL | PostgreSQL lokal, SQLite di test |
| Xendit terintegrasi | Stub rusak (tidak ada method `xendit()`) |
| WhatsApp notification | Tidak ada implementasi |
| Docker + Nginx | Tidak ada file infra di repo |
| GitHub Actions CI/CD | Tidak ada `.github` |
| React Native app | Tidak ada |
| Rate limiter webhook 1000/min | Throttle limiter perlu dicek (`throttle:webhooks`) |
| Mobile App | Tidak ada |

---

# OUTPUT 2 — Executive Summary

## Apa yang sebenarnya sedang dibangun?
**TixNova adalah SaaS ticketing multi-tenant untuk industri event (fokus konser) Indonesia.** Satu platform yang mempertemukan 3 peran: **Super Admin** (owner platform), **Promotor/EO** (penjual tiket), dan **Buyer** (pembeli tiket). Cakupan produk sudah sangat luas untuk usia 1 minggu: manajemen event lengkap dengan flow approval, ticketing bertingkat (regular/vip/early_bird/presale), seat map builder, checkout + payment Midtrans, e-ticket QR, check-in scanner real-time, voucher, referral, refund, reschedule event, komisi per tenant, laporan/export, blog bilingual, dan dashboard untuk ketiga role.

## Masalah apa yang ingin diselesaikan?
1. **Promotor kecil/menengah di Indonesia** sulit mendapatkan platform ticketing yang modern, murah, dan tidak menelan komisi besar (Eventbrite/LOKET menarik fee tinggi, Ticketmaster tidak relevan untuk pasar lokal).
2. **Kepercayaan pembeli**: banyak event lokal ditipu (tiket palsu, event gagal tanpa refund). TixNova menempatkan **approval admin**, **trust badge**, dan **auto-refund** sebagai nilai inti.
3. **Fragmen ekosistem**: EO harus pakai 3-4 tools (penjualan, QR check-in, pembayaran, akuntansi). TixNova mengkonsolidasi dalam satu dashboard.

## Siapa target market?
- **Primary**: EO/Promotor konser skala kecil-menengah di Lampung → nasional Indonesia.
- **Secondary**: Buyer/penggemar (Gen Z & Milenial, mobile-first, dominan QRIS/e-wallet).
- **Tertiary (future)**: Perusahaan sponsor, artis/manajemen, komunitas fans (dokumentasi Quad-Ecosystem).

## Nilai jual utama (saat ini terverifikasi)
- Multi-tenant dengan isolasi data via global scope (`HasTenant`) — dasar SaaS yang sehat.
- Flow pembelian end-to-end yang **benar-benar berfungsi dan diuji** (39 test hijau): checkout → payment → webhook signature → idempotency → QR → scan.
- Keamanan transaksi serius: verifikasi signature Midtrans + deduplikasi webhook (`payment_webhook_events.event_key` unique).
- **Sekali tulis, tiga dashboard** (buyer/promotor/super-admin) di satu codebase Next.js.

## Peluang terbesar
- **Bluesky gap**: pasar ticketing Indonesia untuk event menengah-bawah nyaris tidak terlayani dengan kualitas teknologi baik. LOKET kuat di arus utama; jagoannya "lokal, terpercaya, anti-scam, komisi rendah" masih terbuka.
- **Quad-Ecosystem vision** (dokumentasi Phase 5) — jika dieksekusi, tidak ada kompetitor lokal yang menawarkan integrasi sponsor+artis+fans dalam satu platform.
- **Data**: setiap transaksi menghasilkan data (demografi buyer, harga optimal, popularitas kota) yang bisa dimonetisasi sebagai insight/analytics B2B.

## Risiko
1. **Kekurangan engineering depth**: 3 bug high-severity terverifikasi (Xendit webhook 500, `TicketController::update` crash, `/auth/refresh` tidak ada di backend tapi dipanggil frontend).
2. **Dependensi single developer** — semua commit dari satu orang; bus-factor = 1.
3. **Regulasi & trust**: pembayaran (PJP/PBJ licensing Bank Indonesia), PPN, dan dispute refund menuntut legal & finance yang matang sebelum skala.
4. **Persaingan harga**: kompetitor dengan modal besar (LOKET, Tiket.com, Partai Eventbrite/Universe) bisa membakar uang.
5. **Dokumentasi ≠ realita**: infra (Docker, CI/CD, WhatsApp, Xendit, Redis, mobile) belum ada di repo — risk jika tim meyakini sudah "jadi".

## Kekurangan utama (ringkas)
- Xendit rusak; hanya Midtrans yang jalan.
- 3 sistem cart di frontend (1 dipakai, 2 mati), react-query mati.
- Token JWT/Sanctum di `localStorage` (rentan XSS), tanpa refresh token backend.
- Harga admin fee `5000` hardcoded di backend (`CheckoutService:151`) dan frontend (`checkout/page.tsx:130`).
- Tanpa CI/CD, tanpa Docker, tanpa staging/prod environment.
- Redis, cache, queue masih `database` driver (belum production-grade).
- `README.md` root masih punya conflict marker (`<<<<<<< HEAD`).

---

# OUTPUT 3 — Product Vision

| Elemen | Definisi |
|---|---|
| **Visi** | Menjadi platform ticketing & ekosistem event paling tepercaya di Indonesia — "bebas dari penipuan dan transparan" untuk semua pihak (dokumentasi Phase 5). |
| **Misi** | Memberdayakan promotor/EO lokal dengan toolset ticketing enterprise-grade, memberi pembeli jaminan keamanan transaksi, dan membangun jaringan kepercayaan lintas stakeholder event. |
| **Future Vision** | **Quad-Ecosystem Platform**: menghubungkan 4 pilar — Perusahaan/Sponsor (B2B marketplace + proof-of-attendance), Promotor/EO (verified organizer + trust score), Artis/Manajemen (talent booking + escrow), Fansbase (anti-scam + guaranteed refund). |
| **Core Value** | (1) Trust & Transparency, (2) Kecepatan ship ke pasar, (3) Data sebagai aset, (4) Ekosistem bukan sekadar marketplace. |
| **Unique Selling Proposition** | *"Ticketing enterprise-grade untuk promotor lokal, dengan proteksi anti-penipuan untuk pembeli."* Kombinasi: SaaS multi-tenant + payment gateway ganda + QR check-in real-time + refund escrow + trust badge. |
| **Competitive Advantage** | Isolasi tenant benar (global scope), keamanan webhook benar, cakupan fitur luas dalam 1 repo, dan roadmap Quad-Ecosystem yang belum ada duanya di pasar lokal. |
| **North Star Metric** | **Volume transaksi berhasil (successful paid tickets)** — karena ia mewakili: jumlah buyer, kepercayaan (konversi checkout), health ekosistem, dan revenue platform (komisi). *Proposed*: belum ada metrik tertulis di repo. |

---

# OUTPUT 4 — Ecosystem Analysis

## Peta Ekosistem Saat Ini (yang terverifikasi di kode)

```
                          INTERNET
                             │
             ┌───────────────┼───────────────┐
             ▼               ▼               ▼
   Landing/Marketplace  Checkout/My Ticket   Dashboard 3 Role
   (public events,      (buy → pay → QR)     (super_admin / promotor / user)
    blogs, cities)                          └──────────────────────────┐
             │                                                        │
             └──────────────┬─────────────────────────────────────────┘
                            ▼
                  Next.js 16 (tixnova-web) — 56 halaman
                            │  HTTPS / REST JSON
                            ▼
                  Laravel 13 API (tixnova-api) — ±60 endpoint
            ┌───────────┬────────────┬─────────────┬────────────┐
            ▼           ▼            ▼             ▼            ▼
      AUTH        TENANCY       EVENTS       ORDERS/PAY    CONTENT
      Sanctum     HasTenant     approval     Midtrans webhook  Blog
      RBAC 3 role Global scope  flow 4 state  idempotent + QR  ID/EN
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            ▼             ▼             ▼             ▼             ▼
     PostgreSQL 15   Queue(database)  E-ticket PDF  QR Scan       Report
     ±30 tabel       SendEticket/     dompdf +      check-in       CSV export
                     Reschedule notif qrcode        scan_logs      commission
```

## Modul & Hubungan Antar Modul

| Modul | Fungsi | Dependensi ke |
|---|---|---|
| **Auth/RBAC** (`AuthController`, `CheckRole`) | Register user/promotor, login, reset password | Sanctum, Spatie, `Tenant` |
| **Tenancy** (`HasTenant`, `CheckTenantAccess`) | Isolasi data per tenant; approval tenant | `Tenant`, `User` |
| **Event** (`PublicEvent`, `PromotorEvent`, `EventApproval`) | CRUD, publish→approve→reject→featured, reschedule | `Tenant`, `Category`, `EventContentTranslation` |
| **Ticket** (`TicketController`) | Tier, harga, kuota, masa jual | `Event` |
| **Seat Map** (`SeatMapController`, `SeatReservationService`) | Builder + picker + hold seat | `Ticket`, `Seat`, `SeatMap` |
| **Order/Checkout** (`CheckoutService`) | Validasi, kunci kuota, voucher, referral, komisi, admin fee | Event, Ticket, Voucher, Referral, Tenant |
| **Inventory** (`InventoryReservationService`) | reserve→sold/release, expire order | Order, Ticket |
| **Payment** (`MidtransGateway`, `WebhookController`) | Snap, status polling, refund | Order, Payment, Refund |
| **QR & Scan** (`ScanController`, `ScanLog`) | Render QR, check-in validasi | OrderItem, Event |
| **Refund** (`RefundService`) | Request→review→confirm→reversal | Order, Payment, Refund, ReferralReward |
| **Referral** (`ReferralService`) | Kode referral, reward per order paid | User, Order |
| **Voucher** (`VoucherController`, `Voucher` model) | Diskon %/flat per tenant/event | Event, Order |
| **Report** (`ReportService`, `ReportController`) | Revenue/payout/attendance, CSV | Order, Payment, ScanLog |
| **Blog** (`Blog` + translation) | Konten marketing promotor/super-admin | Tenant, Category |

**Insight arsitektural:** modul berinteraksi dominan via **Service layer** + model relation (bukan event-driven). Belum ada event bus, queue pub/sub, atau webhook outbound. Skala monolitik modular — cocok untuk MVP, perlu refactor saat masuk Phase 3+.

---

# OUTPUT 5 — Feature Inventory

**Legenda status:** ✅ Selesai & teruji · 🟡 Selesai tapi ada cacat · 🟠 Parsial/bermasalah · 🔴 Belum/rusak · ⚪ Rencana
**Prioritas owner (proposed):** P0 = wajib segera, P1 = 90 hari, P2 = 6 bulan, P3 = 12+ bulan
**Skor (1-5):** BV = business value, TC = technical complexity, RK = risk/kerentanan

| # | Feature | Status | Progress | Priority | Owner | Dependency | Category | BV | TC | RK |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Register & Login (user/promotor) | ✅ | 100% | P0 | — | Sanctum | Auth | 5 | 2 | 2 |
| 2 | RBAC 3 role (super_admin/promotor/user) | ✅ | 100% | P0 | — | Spatie | Auth | 5 | 2 | 2 |
| 3 | Logout & Me (profil dari token) | ✅ | 100% | P0 | — | Sanctum | Auth | 4 | 1 | 1 |
| 4 | Forgot & Reset password | 🟡 | 90% | P1 | — | Mail | Auth | 4 | 2 | 3 | *(link selalu localhost:3000 — config app.frontend_url tidak ada)* |
| 5 | Refresh token (frontend interceptor) | 🔴 | 0% | P0 | — | — | Auth | 4 | 2 | 5 | *(frontend panggil /auth/refresh; backend tidak punya route)* |
| 6 | Multi-tenant dengan global scope | ✅ | 100% | P0 | — | HasTenant | Tenancy | 5 | 4 | 3 |
| 7 | Approval tenant (pending→active) | ✅ | 100% | P0 | — | — | Tenancy | 4 | 2 | 2 |
| 8 | Suspend/activate tenant + set komisi | ✅ | 100% | P0 | — | — | Tenancy | 4 | 2 | 2 |
| 9 | Custom domain per tenant | ⚪ | 0% | P2 | — | — | Tenancy | 5 | 5 | 4 | *(docs Phase 3)* |
| 10 | CRUD Event promotor | ✅ | 100% | P0 | — | — | Event | 5 | 3 | 2 |
| 11 | Event approval flow (draft→pending→approved/rejected) | ✅ | 100% | P0 | — | — | Event | 5 | 3 | 2 |
| 12 | Feature/unfeature event | ✅ | 100% | P1 | — | — | Event | 3 | 1 | 1 |
| 13 | Event reschedule request → admin review | ✅ | 100% | P1 | — | EventRescheduleService | Event | 4 | 3 | 2 |
| 14 | Upload banner/poster event | ✅ | 100% | P0 | — | UploadController | Event | 4 | 2 | 2 |
| 15 | Event filter: kota, kategori, tanggal, harga, search | ✅ | 100% | P1 | — | — | Discovery | 5 | 3 | 1 |
| 16 | Kategori event + cities list | ✅ | 100% | P1 | — | — | Discovery | 3 | 1 | 1 |
| 17 | Ticket tiers (regular/vip/early_bird/presale) | ✅ | 100% | P0 | — | — | Ticket | 5 | 2 | 1 |
| 18 | Quota, min/max purchase, sale window | ✅ | 100% | P0 | — | — | Ticket | 5 | 3 | 2 |
| 19 | Update ticket | 🟠 | 80% | P0 | — | — | Ticket | 4 | 1 | 5 | *(`$request->validated()` di Request biasa → crash)* |
| 20 | Seat map builder (section/row/seat) | ✅ | 100% | P1 | — | SeatMap | Seat | 5 | 4 | 3 |
| 21 | Seat-first buying flow | ✅ | 100% | P1 | — | SeatReservationService | Seat | 4 | 4 | 3 |
| 22 | Seat hold & release | ✅ | 100% | P1 | — | — | Seat | 4 | 4 | 3 |
| 23 | Checkout order (validasi, kunci kuota, kalkulasi) | ✅ | 100% | P0 | — | CheckoutService | Order | 5 | 4 | 3 |
| 24 | Locking inventory reserve→sold/release | ✅ | 100% | P0 | — | InventoryReservationService | Order | 5 | 4 | 3 |
| 25 | Expire pending order (scheduler tiap menit) | ✅ | 100% | P1 | — | ExpirePendingOrders | Order | 4 | 3 | 2 |
| 26 | Voucher diskon (%/flat, per tenant/event) | ✅ | 100% | P1 | — | — | Promo | 4 | 3 | 2 |
| 27 | Referral code & reward | ✅ | 100% | P1 | — | ReferralService | Growth | 4 | 3 | 2 |
| 28 | Referral dashboard (stats) | ✅ | 100% | P2 | — | — | Growth | 3 | 2 | 1 |
| 29 | Midtrans Snap payment | ✅ | 100% | P0 | — | MidtransGateway | Payment | 5 | 4 | 3 |
| 30 | Xendit payment | 🔴 | 10% | P1 | — | XenditGateway | Payment | 4 | 4 | 5 | *(webhook 500, config salah)* |
| 31 | Webhook Midtrans signature + idempotency | ✅ | 100% | P0 | — | — | Payment | 5 | 4 | 2 |
| 32 | Payment status polling | ✅ | 100% | P1 | — | — | Payment | 4 | 2 | 1 |
| 33 | E-ticket QR generation | ✅ | 100% | P0 | — | simple-qrcode | Ticket | 5 | 2 | 2 |
| 34 | E-ticket email (queue) | ✅ | 100% | P1 | — | SendEticket | Notif | 5 | 3 | 2 |
| 35 | QR check-in scanner (web camera) | ✅ | 100% | P1 | — | html5-qrcode | Check-in | 5 | 3 | 2 |
| 36 | Scan log (valid/already_used/cross-tenant) | ✅ | 100% | P1 | — | ScanLog | Check-in | 4 | 2 | 1 |
| 37 | Refund request→review→confirm→reversal | ✅ | 100% | P1 | — | RefundService | Finance | 5 | 4 | 3 |
| 38 | Auto-refund saat event batal | ✅ | 100% | P2 | — | — | Finance | 4 | 3 | 3 |
| 39 | Komisi platform per tenant + config tier | 🟡 | 80% | P1 | — | — | Finance | 4 | 2 | 3 | *(update komisi hanya Config::set, tidak persist)* |
| 40 | Report revenue/payout/attendance + CSV | ✅ | 100% | P1 | — | ReportService | Analytics | 4 | 3 | 2 |
| 41 | Dashboard stats (super-admin & promotor) | ✅ | 100% | P1 | — | — | Analytics | 4 | 2 | 1 |
| 42 | Blog CRUD + publish (promotor/super-admin) | ✅ | 100% | P2 | — | — | Content | 3 | 2 | 2 |
| 43 | Blog public + kategori | ✅ | 100% | P2 | — | — | Content | 2 | 1 | 1 |
| 44 | Multi-language ID/EN (event & blog) | ✅ | 100% | P2 | — | ContentTranslation | Content | 3 | 3 | 2 |
| 45 | Admin operations (orders/users listing + PII mask) | ✅ | 100% | P2 | — | OperationsController | Ops | 3 | 2 | 2 |
| 46 | Public landing (SSR, ISR 60s) | ✅ | 100% | P1 | — | — | Frontend | 4 | 2 | 1 |
| 47 | Public event list/detail + cart (localStorage) | 🟠 | 85% | P1 | — | — | Frontend | 5 | 3 | 3 | *(3 sistem cart; 1 hidup)* |
| 48 | Checkout page + success polling | 🟠 | 85% | P0 | — | — | Frontend | 5 | 3 | 3 | *(admin fee hardcode)* |
| 49 | Dashboard promotor (9 halaman) | ✅ | 100% | P1 | — | — | Frontend | 5 | 3 | 2 |
| 50 | Dashboard super-admin (11 halaman) | ✅ | 100% | P1 | — | — | Frontend | 4 | 3 | 2 |
| 51 | Dashboard user (my-tickets, history, refunds, referral) | ✅ | 100% | P1 | — | — | Frontend | 4 | 2 | 1 |
| 52 | Auto-logout redirect + 401 interceptor | 🟠 | 50% | P1 | — | api.ts | Frontend | 3 | 2 | 3 | *(refresh gagal)* |
| 53 | Multi-language UI (ID/EN toggle) | ✅ | 100% | P2 | — | LocaleProvider | Frontend | 3 | 2 | 2 |
| 54 | Halaman statis (about, careers, help, terms, dll) | 🟠 | 70% | P3 | — | — | Frontend | 2 | 1 | 2 | *(1 link 404)* |
| 55 | Test suite backend (39 test, 118 assert) | ✅ | 100% | P1 | — | PHPUnit | QA | 5 | 3 | 1 |
| 56 | Test frontend | 🔴 | 0% | P2 | — | — | QA | 3 | 3 | 3 |
| 57 | WhatsApp notification | 🔴 | 0% | P2 | — | — | Notif | 4 | 3 | 3 | *(docs klaim, belum ada)* |
| 58 | Custom domain | ⚪ | 0% | P2 | — | — | Tenancy | 5 | 5 | 4 |
| 59 | Mobile app React Native | ⚪ | 0% | P2 | — | — | Mobile | 5 | 5 | 4 |
| 60 | Resale ticket marketplace | ⚪ | 0% | P3 | — | — | Marketplace | 5 | 5 | 4 | *(docs Phase 4)* |
| 61 | NFT/Web3 ticket | ⚪ | 0% | P3 | — | — | Web3 | 3 | 5 | 4 | *(docs Phase 4)* |
| 62 | Open API / API marketplace | ⚪ | 0% | P3 | — | — | Platform | 5 | 5 | 4 | *(docs Phase 4)* |
| 63 | B2B corporate ticketing | ⚪ | 0% | P3 | — | — | B2B | 4 | 4 | 3 | *(docs Phase 4)* |
| 64 | Quad-Ecosystem (sponsor/artis/fans) | ⚪ | 0% | P3 | — | — | Vision | 5 | 5 | 5 | *(docs Phase 5)* |

---

# OUTPUT 6 — Missing Features (vs Kompetitor)

Perbandingan dengan Eventbrite, Ticketmaster, Universe, Humanitix, LOKET, Artatix, Peatix. Fokus **fitur yang terverifikasi tidak ada di kode TixNova**.

| # | Fitur | Kompetitor yang Punya | Mengapa Penting | Prioritas |
|---|---|---|---|---|
| 1 | **Analytics penjualan real-time granular** (per-tier, per-channel, heatmap kota) | Eventbrite, LOKET | EO butuh keputusan harga/promo berbasis data; laporan saat ini hanya aggregate (ReportService) | P1 |
| 2 | **Hosted checkout page / iframe** (tanpa redirect ke Midtrans) | Eventbrite, Universe, LOKET | Konversi naik drastis jika pengguna tak keluar dari situs | P1 |
| 3 | **Ticketing untuk free event / RSVP** | Eventbrite, Peatix | Pintu masuk EO komunitas & brand activation (volume besar) | P1 |
| 4 | **Guest list / will-call offline check-in** | Eventbrite, LOKET, Artatix | EO butuh daftar nama manual untuk non-QR; scanner web belum offline | P1 |
| 5 | **Waitlist & presale access code** | Ticketmaster, Eventbrite | FOMO marketing; prioritas komunitas fans | P2 |
| 6 | **Dynamic pricing / surge** | Ticketmaster (Official Platinum) | Revenue lift 5-15%; monopoli Ticketmaster membuktikan permintaan | P2 |
| 7 | **Fee transparency & fee shifting** | Universe, Eventbrite (passe) | Buyer trust; "jangan diam-diam naikkan harga" | P2 |
| 8 | **Refund policy self-service merchant** (maksimum, deadline, reschedule) | Eventbrite, Peatix | Mengurangi dispute; ekspektasi jelas | P1 |
| 9 | **Multiple payment method pilihan buyer** (QRIS/VA/e-wallet via pilihan) | LOKET, Tiket.com | Saat ini provider hardcoded midtrans & method tidak mempengaruhi alur | P0 |
| 10 | **Referral/affiliate tracking per link + payout otomatis** | Eventbrite (Managed), artatix | Referral sudah ada tapi tanpa payout & tanpa program influencer | P2 |
| 11 | **Venue & seat section builder visual (drag & drop)** | Eventbrite, LOKET, Universe | SeatMapBuilder sudah ada tapi berbasis form/section, bukan canvas visual | P2 |
| 12 | **Event page SEO penuh** (structured data, OG image, sitemap, canonical) | Semua kompetitor | Trafik organik = akuisisi gratis | P1 |
| 13 | **Email/SMS/WA campaign ke buyer event lain** (retention) | Eventbrite, Peatix | Repeat purchase adalah revenue tercepat | P2 |
| 14 | **Subscription/keanggotaan event (fan club)** | Peatix | Recurring revenue & komunitas | P3 |
| 15 | **Scan offline + konflik koneksi (local cache)** | LOKET, Artatix | Check-in di venue dengan sinyal buruk adalah pain point nyata | P2 |
| 16 | **Admin fee untuk free ticket (donation/charity mode)** | Humanitix | Pasar nirlaba; Humanitix membuktikan niche bisa digarap | P3 |
| 17 | **Multi-currency / multi-locale internasional** | Eventbrite, Peatix | Pintu ekspor | P3 |
| 18 | **Rating & review event & EO** | Eventbrite (fans), Universe | Trust loop; feeding trust badge | P2 |
| 19 | **Bundle ticket (multi-event pass)** | Ticketmaster | Festival & season pass | P3 |
| 20 | **Group/Corporate booking dengan invoicing** | Eventbrite, Peatix | B2B revenue | P3 |
| 21 | **API/SDK for third-party embed** | Eventbrite | Developer platform = distribusi & moat | P2 |
| 22 | **Marketing analytics & attribution** (UTM, channel) | Eventbrite, Universe | EO perlu tahu ROI promosi | P2 |
| 23 | **Reconciliation/keuangan EO** (settlement report per payout) | LOKET, Artatix | EO butuh arus kas jelas; trust platform | P1 |
| 24 | **Multi-organizer account per tenant (staff roles)** | Eventbrite (sub-organizer) | EO besar punya tim | P2 |
| 25 | **Instagram/TikTok ticket shop embed & DM commerce** | Universe, Ticketmaster | Discovery channel Gen Z Indonesia | P2 |

---

# OUTPUT 7 — Blue Ocean Analysis

Jangan sekadar menyaingi LOKET/Eventbrite. Pasar Indonesia punya gap struktural: **kepercayaan rendah, EO menengah kurang terlayani, data tidak dimonetisasi, ekosistem pecah.** Berikut peluang *blue ocean*:

## 7.1 Peluang Unik (belum dimiliki industri lokal)

| # | Peluang | Deskripsi | Value | Risk |
|---|---|---|---|---|
| B1 | **Trust Badge + Guaranteed Auto-Refund Engine** | Badge 🟢Guaranteed/🟡Verified/⚪Standard + escrow refund otomatis 100% jika event batal/bermasalah (dokumentasi Phase 5). | Anti-scam = diferensiasi #1 vs LOKET/Eventbrite di pasar Indonesia | Legal & modal escrow |
| B2 | **Proof-of-Attendance Analytics untuk Sponsor** | Laporan real-time scan count + demografi attendee sebagai bukti audit penayangan sponsor (bukan sekadar poster). | Sponsor membayar mahal; data bukti = revenue baru | Integrasi scan |
| B3 | **Milestone Escrow Payout** | Pencairan dana event bertahap: DP venue → DP artis → pasca-event. Mengurangi sengketa promotor vs artis. | Trust antar stakeholder | Kompleks finance |
| B4 | **Promoter Trust Score & Badge** | Skor kredibilitas EO berbasis riwayat event sukses/refund/reschedule. | Memfilter EO abal-abal; membantu buyer | Data & ML dasar |
| B5 | **Talent Rate Card & Booking Guarantee** | Harga artis transparan + DP escrow 50%. | "Belum ada di Indonesia"; menarik artis/management | Negosiasi industri |
| B6 | **AI Event Planner / Auto-listing** | Asisten AI: dari brief ("konser akustik, 500 pax, Bandung") → buat event, tier tiket, harga saran, seat map. | Menurunkan barrier EO | Kualitas output |
| B7 | **Demand Forecast & AI Pricing** | Prediksi penjualan per tier → rekomendasi harga dinamis & alokasi kuota. | Revenue lift EO, data moat | Data historis masih minim |
| B8 | **Fanbase Priority Booking** | Kuota khusus komunitas fans + verifikasi keanggotaan. | Loyalitas & LTV | Kemitraan komunitas |
| B9 | **AI Anti-Scalping** | Deteksi pembelian bot (velocity, device, pola) + cap resale markup. | Trust & fairness | False positive |

## 7.2 Peluang yang Mesti Dihindari Dulu (Biaya > Manfaat di tahap ini)
- NFT/Web3 ticket (docs Phase 4) — hype turun, nilai utilitas rendah, biaya onboarding tinggi. **Turunkan prioritas.**
- Live streaming integration — kompetensi lain (bandwidth, CDN, DRM).
- Crypto payment — regulasi BI ketat.

## 7.3 Blue Ocean Positioning Statement (Proposed)
> *"TixNova bukan penjual tiket. Kami adalah **ekosistem kepercayaan event** — tempat EO terverifikasi menjual, sponsor membuktikan dampaknya, artis dijamin bayarannya, dan penggemar tidak pernah takut ditipu."*

---

# OUTPUT 8 — Technical Audit

## 8.1 Skor Teknis (0-10)

| Aspek | Skor | Bukti / Catatan |
|---|---|---|
| Folder Structure | 7 | Laravel standar + separation controller/service/middleware; belum modular (docs klaim `Modules/`, belum ada) |
| Code Quality | 6 | Service layer rapi, requests terpisah; tapi bug runtime terverifikasi + 125 warning eslint + 1 error |
| Architecture | 7 | Monolitik modular; trait tenancy; bagus untuk MVP; belum event-driven |
| Scalability | 4 | `database` queue/cache, tanpa Redis; locking DB ok tapi single-node; N+1 rawan di beberapa relasi |
| Performance | 4 | Tanpa caching (docs cache strategy §10 **tidak ada di kode**), tanpa indexing review, tanpa profiling |
| Security | 6 | Webhook+tenancy solid; tapi token localStorage, tanpa rate limit login, weak seed password |
| Maintainability | 5 | Dokumentasi tidak sinkron kode; README conflict marker; tanpa lint di CI; dead code |
| Testing | 6 | 39 test feature hijau; gap besar (Xendit, ticket update, auth refresh, komisi) |
| Caching | 2 | `CACHE_STORE=database`, tanpa Redis tags (docs §10 tidak terimplementasi) |
| Queue | 5 | Queue database + `afterCommit`; belum Horizon/Redis, belum dead-letter handling robust |
| Realtime | 2 | Tanpa websocket/broadcast (docs klaim real-time; kenyataannya polling 5 detik) |
| Database Design | 7 | ERD matang (orders, order_items, payments, refunds, referral_rewards); beberapa index kurang |
| API Design | 6 | REST konsisten; **inkonsistensi binding `{event}` (slug) vs `{event:id}`**; respon shape beragam (`{success,data}` vs polos) |
| Naming Convention | 6 | Sebagian besar konsisten; ada controller `Promotor` vs `User` nama ambigu (`User\ProfileController` = profile buyer) |
| DDD | 5 | Services memisahkan domain; belum ada bounded context, value objects, repositories |
| SOLID | 6 | DI di constructor; beberapa controller fat; `CommissionController` pakai `Config::set` (melanggar SRP) |
| Clean Architecture | 4 | Tidak ada lapisan use-case/port-adapter; controller langsung panggil service |
| Microservices Readiness | 3 | Monolit; data erat-coupled; belum siap pecah, dan **belum perlu** |
| Event Driven Readiness | 3 | Job queue sudah ada; belum ada domain events/outbox pattern |
| AI Readiness | 3 | Data terstruktur bagus (orders/payments/scan) — fondasi ada; belum ada model/feature store |
| Blockchain Readiness | 2 | Belum relevan; tidak ada wallet/hash/immutability layer |

## 8.2 Temuan Kritis (verifikasi langsung)

### 🔴 HIGH — harus diperbaiki segera

| # | Temuan | Lokasi | Dampak |
|---|---|---|---|
| 1 | **Webhook Xendit → 500.** Route `POST /api/webhooks/xendit` memanggil `WebhookController::xendit()` yang **tidak ada**. | `routes/api.php:106` | Setiap callback Xendit error; payment Xendit tak pernah settle |
| 2 | **`TicketController::update` crash.** Memanggil `$request->validated()` pada `Illuminate\Http\Request` (method hanya ada di FormRequest). | `app/Http/Controllers/Promotor/TicketController.php` | Update tiket promotor → `BadMethodCallException` (fitur #19 rusak) |
| 3 | **`/auth/refresh` dipanggil frontend, tidak ada di backend.** | `tixnova-web/src/lib/api.ts` (interceptor) vs `routes/api.php` | Refresh token flow selalu 404 → auto-logout paksa saat 401 |
| 4 | **Provider payment hardcoded `'midtrans'`.** | `CheckoutService.php:184`, `PaymentController::initiate` | Method bayar pilihan user tidak memengaruhi gateway; Xendit path unreachable |
| 5 | **Free-order (total ≤ 0) tidak lengkap:** order dibayar di checkout tanpa `convertToSold`, tanpa e-ticket, tanpa reward referral, tanpa usage voucher. | `PaymentController::initiate` | Order "free" rusak: inventory tetap reserved |

### 🟠 MEDIUM

| # | Temuan | Lokasi |
|---|---|---|
| 1 | Reset-password link selalu `http://localhost:3000` (`config('app.frontend_url')` tidak terdefinisi). | `AuthController.php` forgotPassword |
| 2 | Update komisi via `Config::set()` tidak persist antar-request. | `SuperAdmin/CommissionController.php` |
| 3 | `Blog/BlogController.php` pakai `'ilike'` (Postgres-only) — dead code tapi berbahaya bila dirutekan. | `app/Http/Controllers/Blog/BlogController.php` |
| 4 | Refund hanya Midtrans (`RefundService::process`); Xendit refund unimplemented. | `RefundService.php` |
| 5 | Xendit di-wire ke `config('services.midtrans.frontend_url')` untuk redirect. | `AppServiceProvider.php:18` |
| 6 | Tanpa rate limit di `/api/login`, `/api/forgot-password`, `/api/auth/register` (brute-force). | `routes/api.php` |
| 7 | `SuperAdminSeeder` password lemah (`password123`). | `database/seeders/SuperAdminSeeder.php` |
| 8 | `Order` model default `expires_at` +2 jam vs checkout 15 menit — divergensi. | `app/Models/Order.php` |
| 9 | CORS origins hanya dev localhost; tanpa origin production. | `config/cors.php` |
| 10 | README root masih punya conflict marker `<<<<<<< HEAD`. | `tiketing/README.md:1` |

### 🟡 LOW / Info
- `adminFee = 5000` hardcoded di backend (`CheckoutService:151`) **dan** frontend (`checkout/page.tsx:130`) — harus jadi setting tenant/platform.
- Frontend: 3 sistem cart (1 hidup: `localStorage["tixnova_cart"]`; mati: `CartProvider`, `cartStore`), react-query tidak pernah dipakai, unused deps (`date-fns`, `@headlessui/react`, `@heroicons/react`), 125 warning lint, asset hilang (`/grid.svg`, `/placeholder-blog.jpg`), link 404 `/help/how-to-buy`.
- Binding route campur: `{event:slug}` vs `{event:id}` (inkonsistensi API).
- Tidak ada test untuk: Xendit, ticket update, komisi, reset password, admin blogs.

## 8.3 Kekuatan yang Terverifikasi
- **Idempotency webhook** via `payment_webhook_events.event_key` unique (anti double-settle). 
- **Signature SHA-512** Midtrans + `hash_equals` (timing-safe).
- **Tenant isolation** via global scope + re-check ownership `where('user_id',...)` saat bypass scope.
- **Locking DB** (`lockForUpdate`) pada checkout, voucher, seat, webhook — menghindari oversell.
- **PII masking** di endpoint admin/report.
- **Test suite hijau** (39 test, 118 assert) mencakup eticket, payment security, scan, referral, refund, seat map, translation.
- **Scheduler** `orders:expire` tiap menit + `withoutOverlapping`.

---

# OUTPUT 9 — Business Model Analysis

## 9.1 Model Revenue Saat Ini (terverifikasi)
| Sumber | Cara Kerja | Terverifikasi |
|---|---|---|
| **Komisi platform** | Persentase dari subtotal per order, per tenant (`tenants.commission`, default 5% — `config/commission.php`), dengan min `1000` & max `500000` IDR | ✅ `CheckoutService::commission()` |
| **Admin fee buyer** | Fee tetap `5000` IDR per order ditambahkan ke buyer | ✅ `CheckoutService:151` |

## 9.2 Matriks Peluang Monetisasi

| # | Aliran Revenue | Model | Maturity | Effort | Prioritas | Potensi |
|---|---|---|---|---|---|---|
| 1 | **Komisi platform per order** | Transaction fee | Ada | — | P0 | Basis revenue |
| 2 | **Admin fee / booking fee** | Fee | Ada (hardcode) | Low | P0 | Naik 20-30% jika dinamis per tenant |
| 3 | **Subscription plan tenant** (free/starter/professional/enterprise) | SaaS | Field `plan` ada, **belum ada billing** | Medium | P1 | Recurring MRR |
| 4 | **Tiered commission** (plan lebih tinggi = komisi lebih rendah) | Pricing | Config tier ada, **belum terpakai** (`commission.tiers` tak direferensikan) | Low | P1 | Upsell |
| 5 | **Featured/boost event** (bayar tampil di landing) | Marketplace ads | `is_featured` ada, **tanpa harga** | Medium | P2 | Revenue + engagement |
| 6 | **Voucher/upsell platform** (voucher platform-wide) | Promo | Model voucher tenant ada | Medium | P2 | Distribusi |
| 7 | **API / developer platform** | Usage-based | Roadmap Phase 4 | High | P3 | Platform ekonomi |
| 8 | **White label / custom domain** | Per-deployment | Roadmap Phase 3 | High | P2 | Enterprise |
| 9 | **Sponsorship marketplace commission** | B2B | Roadmap Phase 5 | High | P3 | Besar |
| 10 | **Sponsor proof-of-attendance analytics** | B2B SaaS | Roadmap Phase 5 | High | P3 | Besar |
| 11 | **Analytics & insight data** (laporan anonim agregat) | Data | Fondasi ada | Medium | P3 | Baru di ID |
| 12 | **AI services** (auto pricing, forecast, planner) | Usage/premium | Fondasi data ada | Medium | P2 | Differensiator |
| 13 | **Payout/financing untuk EO** (early settlement) | Fintech | Belum | High | P4 | Fintech |
| 14 | **Affiliate/influencer marketplace** | Commission split | Referral ada | Medium | P2 | Growth |
| 15 | **Ads network** (brand di landing/city page) | Ads | Belum | Low | P3 | Tambahan |
| 16 | **Merchandise engine** (bundling merch + tiket) | GMV | Belum | Medium | P4 | GMV |

**Insight:** Revenue engine inti (komisi + fee) sudah berjalan. Langkah revenue tercepat = **subscription tenant** (MRR), **featured boost**, dan **dynamic admin fee** — semua low/medium effort, semua memakai struktur yang sudah ada.

---

# OUTPUT 10 — Roadmap Detection

## 10.1 Roadmap Resmi di Dokumentasi (`docs/PRODUCT_DOCUMENTATION.md` §10)
| Phase | Scope | Klaim Status | Verifikasi di Kode |
|---|---|---|---|
| **Phase 1 — MVP** | Auth, tenant, CRUD event, tiket, order, Midtrans, QR, email, landing, dashboard | 100% ✅ | ✅ Terverifikasi |
| **Phase 2 — Core** | QR scanner web, blog, voucher, laporan/export, dashboard super admin, Xendit, WhatsApp | 100% ✅ | 🟠 Xendit rusak, WhatsApp tidak ada |
| **Phase 3 — Growth** | Referral, seat map, refund & reschedule, advanced analytics, multi-language, custom domain, mobile app | 85% ✅ | 🟠 Custom domain & mobile belum ada |
| **Phase 4 — Scale** | Resale marketplace, live streaming, NFT ticket, B2B corporate, open API | Planned | ⚪ Tidak ada di kode |
| **Phase 5 — Quad-Ecosystem** | Sponsor marketplace, promoter trust score, talent booking, anti-scam, guaranteed refund | Future | ⚪ Tidak ada di kode |

## 10.2 Roadmap Tersembunyi (dari kode & git)
- **Tidak ada** TODO/FIXME/HACK di seluruh `app/` (verifikasi grep) — kebersihan yang menyesatkan: pekerjaan yang belum selesai (Xendit, auth refresh) tidak ditandai.
- **Commit terakhir** `6e73384` (30 Jul) = "payment controllers, webhooks, vouchers, reports & complete frontend dashboard pages" — arah development = menyelesaikan payments/reports/dashboard. Commit web terbaru `a6fdf22` (5-6 Agu) = "full dashboard pages, Fix routing conflicts, Fix role object render, Add promotor pages".
- **Indikator roadmap aktif** dari migration terbaru (5-6 Agu): `seat_maps/seats`, `event_reschedules`, `content_translations`, `refunds`, `payment_webhook_events`, `referral_rewards` → fase sekarang = **menyelesaikan Growth features (seat, refund, reschedule, multi-language)**.
- **Branch**: hanya `main`. Tidak ada branch feature/experimental.
- **Milestone/issue**: GitHub remote ada tapi **tidak bisa diverifikasi dari repo** (tidak ada `.github`).

## 10.3 Kesimpulan Roadmap Berjalan
Produk berada di **akhir Phase 3** (Growth), dengan 2 item Phase 3 tertunda (custom domain, mobile) dan **kualitas debt yang harus dibayar dulu**: Xendit rusak, update ticket rusak, auth refresh rusak, dan infra (CI/CD, Redis) belum ada. Roadmap sebenarnya yang sedang dikerjakan: **menyelesaikan dan menghaluskan dashboard + alur refund/reschedule/seat**, bukan naik ke Phase 4.

---

# OUTPUT 11 — Product Roadmap Recommendation

## 11.1 30 Hari — "Stabilkan & Bayar Utang Teknis" (Foundation)
| Milestone | Deskripsi |
|---|---|
| M1 | Fix 3 High bugs: Xendit webhook method, `TicketController::update` (ganti `$request->validate()`), tambah route `/auth/refresh` (atau hapus dari frontend) |
| M2 | Fix free-order flow (`convertToSold`, eticket, referral, voucher) |
| M3 | Rate limit auth (`throttle:10,1` login/register/forgot) + ganti SuperAdminSeeder credentials |
| M4 | Persist update komisi ke DB (`tenants.commission` sudah ada — jangan `Config::set`) |
| M5 | Setup CI (GitHub Actions: lint + test on PR) — **wajib** sebelum tim/tim bertambah |
| M6 | Setup Redis (cache+queue), nonaktifkan `APP_DEBUG`, fix CORS production |
| M7 | Frontend: konsolidasi ke 1 cart (bunuh CartProvider & cartStore), wire react-query atau buang dependency, bersihkan 126 lint issue |
| M8 | Sinkronisasi dokumentasi (README conflict marker, Laravel 13/Next 16, status fitur) |

**Keluar dari 30 hari:** produksi pertama dengan 1 event riil (dogfood) — validasi Midtrans production, QR scan di venue nyata.

## 11.2 90 Hari — "Go Live & Revenue Pertama"
- **MVP produksi live**: domain resmi, SSL, deployment VPS/Dokploy/Railway, monitoring (Sentry + uptime).
- **Admin fee dinamis + featured boost pricing** → revenue naik (P1).
- **Subscription tenant**: aktivasi plan (free/starter/professional/enterprise) + billing manual dulu, otomatis menyusul.
- **Structured SEO event page** (OG, JSON-LD, sitemap) → trafik organik.
- **Hosted checkout page** (perbaiki konversi).
- **WA notification** via Fonnte (lokal, murah, dominan di Indonesia).
- **Custom domain per tenant** (Phase 3 yang tertunda) → pintu white-label.

## 11.3 6 Bulan — "Growth Engine"
- **Analytics real-time EO** (per-tier/channel/heatmap) + export PDF.
- **Dynamic pricing** (aturan promoter di-set manual dulu → auto kelak).
- **Referral payout otomatis** + influencer/affiliate links.
- **Mobile app (React Native/Expo)** dengan e-ticket wallet & scanner — kuat di segmen Gen Z.
- **Guest list / will-call** + scan offline cache.
- **API pertama untuk third-party** (tiket embedded di situs EO).
- **Program 50 EO terverifikasi** (trust badge beta).

## 11.4 1 Tahun — "Ecosystem Phase 4"
- Resale marketplace (dengan kontrol anti-scalping), B2B corporate ticketing, event insurance partnership.
- Trust Score EO + rating/review event.
- AI pricing & demand forecast v1.
- Fanbase priority booking (beta).

## 11.5 2 Tahun — "Quad-Ecosystem Phase 5"
- Sponsor marketplace + proof-of-attendance analytics.
- Talent rate card & booking escrow.
- Guaranteed auto-refund engine (escrow).
- API platform & white-label SaaS.

## 11.6 3-5 Tahun — "Global Ticket Network"
- Ekspansi regional ASEAN (format ID/EN siap; butuh multi-currency & local payment).
- Open developer platform (plugin/extension marketplace).
- AI Event Planner publik; data analytics B2B SaaS.
- Standar industri: interoperabilitas QR (format lintas platform).

---

# OUTPUT 12 — Ecosystem Expansion

## Strategi Ekspansi Modular (naik satu level per fase)

```
      TODAY                    +6 BLN                     +1 TAHUN
┌────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│ Event Ticketing │ ──► │  Event CRM       │ ──► │  Event ERP         │
│ (fundamental)   │     │  (buyer profile, │     │  (ops, keuangan,   │
│                 │     │   retention,     │     │   staff, venue)    │
└────────────────┘     │   segmentation)   │     └────────────────────┘
                              │                        │
                    ┌─────────┴────────┐     ┌─────────┴────────┐
                    │ Vendor / Crew    │     │  Marketplace     │
                    │ Marketplace      │     │  (sponsor/       │
                    │ (lighting, sound,│     │   artis/affiliate)│
                    │  rigging, crew)  │     └────────────────────┘
                    └──────────────────┘            │
                                         ┌─────────┴────────┐
                                         │  AI Platform +    │
                                         │  Global Network   │
                                         └──────────────────┘
```

**Cara (pragmatis, bukan overwrite):**
1. **Event CRM** — reuse data `users`, `orders`, `referral_rewards`. Tambah segmentasi + campaign email/WA + pipeline "buyer event A → event B".
2. **Event Finance** — ekstensi `Refund`, `Payment`, `Commission`. Tambah payout EO, settlement report, pajak (PPN 11%), reconciliation.
3. **Event HR / Staff** — perluas model `User` dengan role staff tenant (check-in crew, kasir, promoter staff) — **sekarang `CheckRole` hanya 3 role**, ini yang harus diubah.
4. **Venue Management** — `SeatMap` menjadi fondasi; tambah venue profile, kalender venue, sewa venue.
5. **Vendor/Crew Marketplace** — modul terpisah (table baru) tapi login shared; EO membooking vendor, vendor mendapat profile + payout.
6. **Sponsor/Influencer Marketplace** — data scan (`ScanLog`) menjadi aset utama proof-of-attendance.
7. **AI Platform** — build di atas data terstruktur (orders, scan, referral); mulai dari pricing/forecast, bukan chatbot.
8. **Blockchain** — HANYA setelah utilitas jelas (transfer tiket sekunder + provenance), bukan token speculative.

---

# OUTPUT 13 — Enterprise Readiness

| Target | Readiness | Analisa |
|---|---|---|
| **SaaS multi-tenant** | 🟡 70% | Isolasi tenant solid; **belum ada billing, plan enforcement, metering, self-serve onboarding** |
| **Enterprise** | 🟠 30% | Belum ada SSO/SAML, audit log, SLA, tenant admin multi-user, custom domain belum |
| **Government** | 🔴 10% | Butuh PSE (Penyelenggara Sistem Elektronik), data center lokal, compliance Kominfo, security audit formal |
| **International** | 🔴 15% | Multi-bahasa ID/EN sudah; **belum multi-currency, multi-timezone, lokal payment tiap negara, GDPR/PDP** |
| **Franchise** | 🟡 40% | Multi-tenant = fondasi franchise; butuh white-label + brand customization |
| **White Label** | 🟠 30% | Custom domain (Phase 3) belum ada; branding platform masih melekat |
| **API Platform** | 🟠 35% | REST internal ada; **belum ada public docs, API keys, rate plan, webhook outbound** |
| **Marketplace** | 🟠 40% | Multi-tenant + referral ada; belum escrow, review, dispute resolution, trust score |

**Gap kritis untuk enterprise:** (1) SSO & RBAC granular per tenant, (2) audit trail, (3) billing/plan enforcement, (4) custom domain, (5) monitoring/SLA, (6) dokumentasi API & developer portal.

---

# OUTPUT 14 — Innovation Report

## 100+ Ide Inovasi (diurutkan berdasarkan dampak bisnis)

**Cluster A — Trust & Anti-Fraud (dampak tertinggi di pasar ID)** — *prioritas P0-P1*
1. Trust Badge event (🟢/🟡/⚪) berbasis skor otomatis
2. Guaranteed auto-refund engine (escrow) saat event batal
3. Anti-scalping: limit device/velocity + verifikasi identitas pembelian massal
4. Anti-bot checkout (honeypot + behavioral)
5. QR tiket ber-rotasi (dynamic QR dengan TTL + signature HMAC)
6. Verifikasi pembeli via OTP/WhatsApp saat pembelian high-value
7. Fraud scoring transaksi real-time (rule-based dulu, ML kemudian)
8. Refund otomatis proporsional bila event berganti jadwal > 12 jam
9. Escrow dana artis (DP 50% terkunci, payout milestone)
10. Sertifikat keaslian tiket (hash + ledger) untuk resale

**Cluster B — AI & Data (moat jangka panjang)** — *P1-P2*
11. Demand forecast per tier/kota/waktu
12. AI pricing suggestion (anchoring, surge, early bird)
13. AI event planner (brief → event siap jual)
14. Auto-description & copywriting event (ID/EN)
15. Revenue prediction per event sebelum launch
16. AI chat support untuk buyer (event policy, refund status)
17. AI recommendation "event yang mungkin kamu suka"
18. Segmentasi buyer otomatis (RFM) untuk EO
19. Anomaly detection transaksi & scan
20. AI summarizer report untuk EO/management

**Cluster C — Growth & Distribution** — *P1-P2*
21. Affiliate/influencer marketplace (link + payout otomatis)
22. Distribusi tiket via toko TikTok/Instagram/Shopee
23. Referral engine multi-level
24. Fanbase priority booking (kuota komunitas)
25. Pre-sale access code (eksklusif)
26. Group buy / bundle multi-event pass
27. Campaign builder (email/WA/SMS) untuk EO
28. UTM attribution & marketing analytics
29. Cross-event upsell ("beli juga tiket band ini")
30. Re-marketing ke buyer yang belum bayar (abandoned checkout)

**Cluster D — Sponsor & B2B (Quad-Ecosystem)** — *P2-P3*
31. Sponsor marketplace (catalog event vs budget sponsor)
32. Proof-of-attendance analytics (scan count real-time)
33. Milestone escrow payout sponsor
34. Sponsor CRM (pipeline, kontrak, invoice)
35. Brand activation ticketing (QR scan untuk klaim reward di venue)
36. Corporate ticketing (invoice, PO, multi-user)
37. Employee benefit portal (tiket korporat diskon)
38. Event insurance partnership (buyer protection)
39. Data insight B2B (agregat anonim per industri)
40. Venue marketing hub (kalender venue + EO)

**Cluster E — Operational Excellence** — *P1-P2*
41. Scan offline (local cache + sync)
42. Guest list / will-call (search nama, tambah manual)
43. Multi-staff account per tenant (role crew)
44. Multi-venue event (satu event banyak kota/venue)
45. Shift/access control check-in per gate
46. Real-time dashboard hari-H (masuk per jam)
47. Operator timeline (soundcheck, open gate, list penyanyi)
48. Lost & found / helpdesk hari-H
49. Rapid entry (QR batch + face detection lanjutan)
50. Recon hasil scan vs penjualan (variance report)

**Cluster F — Monetisasi & Finance** — *P1-P2*
51. Dynamic admin fee per tenant/tier
52. Featured/boost event marketplace
53. Subscription plan + billing otomatis
54. Early settlement / financing EO
55. Komisi tiered per plan (config sudah ada, aktivasi!)
56. Merchant cashback / reward point EO
57. Voucher marketplace platform-wide
58. Data API SaaS (anonymized insights)
59. Payout automation EO (bulk, jadwal)
60. Multi-merchant split payout (EO + artis + venue)

**Cluster G — Product UX** — *P2*
61. Hosted checkout page (tanpa keluar situs)
62. Apple Wallet / Google Wallet ticket pass
63. E-ticket PDF + QR offline (unduh)
64. Dark/light theme + aksesibilitas (WCAG)
65. Native mobile app (Expo) e-ticket wallet
66. Ticket transfer antar pengguna (bukan resale) — verifikasi identitas
67. Event timeline countdown + reminder WA/email
68. Seat 3D preview / venue foto tur
69. Wishlist & notifikasi event favorit
70. Ulasan & rating event/EO

**Cluster H — Marketplace & Community** — *P3*
71. Resale marketplace resmi dengan cap harga
72. Komunitas fans per artis (forum, event meetup)
73. Volunteer marketplace
74. Crew/operator marketplace
75. Merchandise engine (bundling merch + tiket)
76. Content creator tools (poster generator, story template)
77. Fan content showcase (foto/ARSIP)
78. Loyalty network lintas event (poin konser)
79. NFT membership dengan utilitas nyata (backstage, presale) — hati-hati
80. Community rewards (referral + attendance + engagement)

**Cluster I — Platform & Developer** — *P3*
81. Public REST API + docs (OpenAPI/Swagger)
82. Webhook outbound untuk EO (order events)
83. SDK (Node/PHP) & embed widget tiket
84. Plugin marketplace
85. White-label per brand
86. SSO/SAML/OAuth untuk enterprise
87. IFrame checkout embed
88. Sandbox developer portal + API keys
89. GraphQL/BFF layer opsional
90. Multi-region edge caching

**Cluster J — Internationalization & Compliance** — *P3*
91. Multi-currency (IDR/ringgit/dollar) + FX
92. Pajak otomatis (PPN, withholding) per region
93. PDPA/GDPR compliance toolkit
94. Bahasa lokal ASEAN + locale content
95. Pembayaran internasional (international cards, PayPal)
96. Timezone-aware event scheduling
97. Localization penuh (tanggal, angka, RTL)
98. Data residency option (Indonesia + regional)
99. Legal dispute resolution terintegrasi
100. Accessibility internasional & sertifikasi

**Cluster K — Long-term Moat (diferensiasi global)** — *P3+*
101. Standard QR interop lintas platform (proposal industri)
102. On-chain provenance untuk resale anti-palsu
103. AI identity verification untuk VIP/backstage
104. Live event metaverse simulasi (lokasi, 360°) — eksperimen
105. Predictive supply-chain event (venue, vendor, crew capacity)
106. Social proof network ("teman saya datang ke sini")
107. Event graph API (relasi artis-venue-EO-fans)
108. Carbon footprint per event (CSR brand)
109. Digital twin venue (kapasitas, alur, keamanan)
110. Sovereign event wallet (buyer, bukan platform-owned)

---

# OUTPUT 15 — Founder Recommendation

## 15.1 Apa yang Harus Dilakukan SEKARANG (mendatang)

1. **Bayar 3 bug High + free-order** (estimasi: 2-3 hari) — tidak ada alasan produktivitas lain sebelum ini. `Xendit` route → implement method atau blokir dengan pesan jelas.
2. **Putuskan strategi payment**: fokus Midtrans saja untuk launch (Xendit nanti), atau selesaikan Xendit dengan benar. *Alasan bisnis:* jangan ship dua gateway setengah jadi.
3. **Pasang CI (GitHub Actions: `php artisan test` + `eslint`) di hari yang sama.** *Alasan teknis:* mencegah regresi bug yang sudah ditemukan; *alasan bisnis:* syarat minimal sebelum ajak developer/partner.
4. **Sinkronkan dokumentasi.** README conflict marker + klaim Docker/Xendit/WhatsApp yang belum ada = bahaya komunikasi ke investor.
5. **Siapkan 1 event pilot nyata** (konser lokal Lampung) — dogfood penuh: Midtrans production, QR scan, refund, report.

## 15.2 Apa yang Harus DIHENTIKAN

1. **Berhenti menambah fitur baru** sampai CI hijau + bug High beres. Roadmap saat ini mengejar fitur (seat, refund, translation) sambil meninggalkan debt (Xendit, refresh token, free order).
2. **Hentikan klaim dokumentasi yang tidak ada di kode** (WhatsApp, Xendit "100%", Docker, CI/CD). Investor akan audit.
3. **Jangan mulai NFT/Web3 & live streaming.** Buang prioritas — buang-buang waktu di fase ini.
4. **Jangan buru-buru microservices** atau modular refactor besar. Monolit ini sehat.

## 15.3 Apa yang Harus DIPERCEPAT

1. **Redis + queue production** (cache/queue database → Redis) — mendukung skala dan menghilangkan satu kelas masalah performa.
2. **Rate limit auth + security hardening** (token, CORS, seed) — sebelum "go public".
3. **Admin fee dinamis & featured boost** — dua fitur kecil dengan revenue langsung.
4. **Subscription tenant** — recurring revenue, investor menyukai MRR.
5. **Custom domain (white label)** — ini yang membuka pintu enterprise dan diferensiasi dari marketplace generic.

## 15.4 Apa yang Harus DIBANGUN (urutan strategis)

1. **Trust/Anti-Fraud layer** (badge + auto-refund + anti-scalping) — ini blue ocean, ini positioning.
2. **Hosted checkout + WA notification** — konversi & reach.
3. **Analytics real-time EO** — retensi.
4. **Mobile app (Expo)** — distribusi Gen Z.
5. **API platform** — distribusi B2B.

## 15.5 Revenue Tercepat (urutan)

1. Komisi + admin fee (sudah ada) → **naikkan dengan dynamic pricing & featured boost** (2 minggu).
2. Subscription tenant (2 bulan).
3. Data/analytics premium (3-4 bulan).
4. Sponsor proof-of-attendance (6-12 bulan).

## 15.6 Blue Ocean & Keunggulan Global

- **Blue Ocean #1:** "Guaranteed Auto-Refund + Trust Badge" — belum ada pemain lokal dengan jaminan seperti ini.
- **Blue Ocean #2:** "Proof-of-Attendance untuk Sponsor" — mengubah ticketing dari biaya EO menjadi channel ROI brand.
- **Keunggulan global potensial:** pola **Quad-Ecosystem** (sponsor-artis-EO-fans dalam satu ledger kepercayaan) — jika berhasil di Indonesia, model ini portabel ke ASEAN.

## 15.7 Pesan Penutup (CTO)

> *"Kode yang ada sudah menunjukkan disiplin engineering yang luar biasa untuk 1 minggu: transactional integrity, idempotency, tenant isolation, test coverage. Masalahnya bukan kemampuan — tapi **fokus**. Saat ini Anda punya 5 produk separuh (payment ganda, 3 cart, docs vs kode). Pilih satu jalur: stabilkan yang sudah ada, bayar utang, live-kan 1 event nyata. Setelah itu, eksekusi blue ocean trust. Modal terbesar Anda bukan fitur — tapi **kepercayaan** yang bisa dibangun karena data & arsitektur Anda sudah cukup baik untuk mendukungnya.*"

---

# MANDATORY DELIVERABLES

## D1. ✅ Ecosystem Diagram
(lihat Output 4 — peta ekosistem vertikal terverifikasi)

## D2. Architecture Diagram (detail)

```
┌─────────────────────────── tixnova-web (Next.js 16) ───────────────────────────┐
│  Public:  / (SSR ISR 60s) /events /events/[slug] /checkout /checkout/success   │
│           /blogs /cities /categories  ·  Static: about/help/terms/contact...    │
│  Auth:    /login /register /forgot-password /reset-password                    │
│  Dash:    (super-admin) 11 pg · (promotor) 12 pg · (user) 5 pg  [client-heavy]  │
│  Data:    api.ts (axios + 401 interceptor) · zustand authStore · localStorage  │
│           cart · react-query (PROVIDER TERPASANG, BELUM DIPAKAI)               │
└──────────────────────────────────┬─────────────────────────────────────────────┘
                                   │ HTTPS /api (Bearer token)
┌──────────────────────────────────▼─────────────────────────────────────────────┐
│                    tixnova-api (Laravel 13 · PHP 8.3)                          │
│  Middleware: auth:sanctum → check.role:{super_admin|promotor} → check.tenant   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  HTTP Layer: Controllers (Auth, Public, User, Promotor, SuperAdmin)    │   │
│  │  Validation: FormRequests  ·  AuthZ: Spatie Permission                  │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │  Service Layer: Checkout · Inventory · Seat · Referral · Refund ·      │   │
│  │                 Report · Reschedule · Payments(Midtrans/Xendit)        │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │  Model Layer: Tenant User Event Ticket SeatMap Seat Order OrderItem     │   │
│  │               Payment Voucher Refund ReferralCode Reward ScanLog Blog   │   │
│  │               Reschedule WebhookEvent  + HasTenant global scope         │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │  Async: Queue(database) → SendEticket, RescheduleNotif · Mailables       │   │
│  │         Scheduler → ExpirePendingOrders (tiap menit, withoutOverlapping) │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└──────────────┬──────────────┬──────────────┬──────────────────┬───────────────┘
               ▼              ▼              ▼                  ▼
        PostgreSQL 15   Queue/Table     Midtrans Snap    Mailtrap/SMTP
        (30 tabel)      (database drv)  (sandbox)         (queue email)
```

## D3. Module Dependency Diagram

```
Auth ──► Tenant ──► Event ──► Ticket ──► SeatMap
              │         │        │            │
              │         ▼        ▼            ▼
              ├──►   CheckoutService ◄── Voucher / Referral
              │         │
              │         ▼
              │    Payment (Midtrans/Xendit) ──► Webhook (idempotent)
              │         │
              │         ▼
              └──►   Order/OrderItem ──► QR Code
                              │            │
                              ▼            ▼
                       RefundService   Scan/ScanLog ──► Reports
                              │
                              ▼
                       ReferralReward reversal
```
Arah dependensi dominan **top-down** (Controller→Service→Model). Tidak ada dependensi siklik. Tidak ada event bus/outbox.

## D4. Data Flow Diagram (buy → paid)

```
Buyer → POST /orders (throttle:checkout)
  → CheckoutService (transaction)
      → lockForUpdate tickets → cek kuota (quota - sold - reserved)
      → cek voucher (tenant/event/min_purchase) → hitung discount
      → attach referral → hitung admin_fee(5000) + commission(tenant %)
      → create Order(status=pending, expires_at=+15m)
      → create OrderItems + qr_code → reserve inventory
      → hold seats → create Payment(pending)
  → POST /payments/initiate → MidtransGateway::createTransaction (Snap)
  → redirect_url ke buyer
Midtrans webhook → verify signature sha512 + hash_equals
  → dedup (payment_webhook_events.event_key unique)
  → status success? → InventoryReservationService::convertToSold
     → Payment success → Order paid → referral reward → voucher used
     → dispatch SendEticket (afterCommit)
  → status expired/failed? → release inventory → order cancelled/expired
Polling GET /payments/{code}/status → settle jika sudah paid
```

## D5. Database Relationship Overview

```
tenants 1─∞ users         users ∞─1 tenants
tenants 1─∞ events        events ∞─1 tenants
events  1─∞ tickets       events 1─1 seat_maps (opsional) / 1─∞ event_reschedules
events  1─∞ orders        orders ∞─1 users / tenants / events
orders  1─∞ order_items   order_items ∞─1 tickets / seats
orders  1─1 payments (saat ini 1:1; design siap 1:∞)
orders  1─∞ refunds       refunds ∞─1 payments
users   1─1 referral_codes · referral_codes ∞─1 referral_rewards · rewards ∞─1 orders
tenants 1─∞ vouchers      vouchers ∞─1 events(optional)
events  1─∞ scan_logs     order_items ∞─1 scan_logs
events/blogs 1─∞ content_translations
roles/permissions (spatie) ∞─∞ users · jobs/cache/sessions (infra)
```
**Catatan:** `order_items.attendee_*` denormalized (baik untuk eticket tetap setelah ticket/harga berubah). `payments.external_id` unique. `payment_webhook_events.event_key` unique (idempotency). Belum ada index FULLTEXT pada title (docs klaim ada; migration events tidak memuatnya).

## D6. User Journeys

### D6.1 Customer Journey (buyer)
```
Discover (landing/events/city) → Pilih event → Detail (tier, seat-first) →
Add to cart (localStorage) → Checkout (form buyer + voucher + referral) →
POST /orders → POST /payments/initiate → Redirect Midtrans Snap → Bayar →
Webhook settle → E-ticket email (QR) → /checkout/success (polling) →
My Tickets → Hari-H: bawa QR → Promotor scan → status valid → masuk
```
**Pain point terverifikasi:** keluar dari situs ke Midtrans; polling 5s; QR hanya di web (belum wallet); tidak ada reminder WA.

### D6.2 Organizer Journey (promotor/EO)
```
Register promotor → tenant pending → tunggu approval super-admin →
Dashboard → Buat event (draft) → tambah ticket tiers → seat map → publish
→ tunggu approval admin → event live → pantau orders/dashboard →
Buat voucher → scan QR hari-H → review refund → lihat report/export
→ request reschedule bila perlu
```

### D6.3 Admin Journey (super-admin)
```
Login → Dashboard global → Approve/reject tenant & event → toggle featured →
Kelola komisi per tenant → pantau transactions/operations → PII-masked
reports → review refund confirm → review event reschedule → kelola blog
```

### D6.4 Sponsor / Vendor / Affiliate Journeys
- **Sponsor:** ⚪ *Belum ada di repository* — roadmap Phase 5 (proof-of-attendance, escrow).
- **Vendor:** ⚪ *Belum ada di repository* — peluang ekspansi (Output 12).
- **Affiliate:** 🟡 Sebagian — flow referral buyer (kode → reward per order paid → dashboard referral). Belum payout, belum influencer marketplace.

## D7. AI Integration Map (proposed)
```
Data existing (orders, payments, scan, referral, translation)
  → Feature store (aggregate: sell_rate per tier, DOW effect, city elasticity)
  → AI services (internal, bukan API eksternal dulu):
      • Demand forecast → kapasitas kuota per tier
      • Pricing suggest → anchor + surge (human approve dulu)
      • Event planner → copy + struktur event + rekomendasi harga
      • Chatbot buyer (policy/refund/status)
  → Output: event publish lebih cepat, harga optimal, konversi naik
```
Syarat: stabilkan data pipeline dulu (Redis cache + queue), 3-6 bulan.

## D8. Blockchain Integration Map (proposed)
```
Titik masuk paling masuk akal = RESALE + PROVENANCE (bukan NFT spekulatif):
  Ticket aset → issuable asset (hash qr_code, owner identity hash)
  Transfer sekunder → transaksi di ledger (cap harga anti-scalping)
  Refund/void → status on-chain
  Reward/poin loyalitas → token non-speculative
Syarat: wallet penyimpanan buyer + KYC ringan + fee on-chain jelas.
Prioritas: P3/P4 — TIDAK untuk tahap ini.
```

## D9. API Relationship Diagram
```
auth/           ──► profile, tenant
user/           ──► orders, payments, refunds, referrals
events/         ──► categories, seat-map, blogs/{slug}
super-admin/    ──► tenants, events{approve/reject/featured}, commissions,
                     orders, reports, blogs, refunds, reschedules
promotor/       ──► events, tickets, seat-map, seats, vouchers, blogs,
                     reports, refunds, scan
webhooks/       ──► midtrans (✅), xendit (🔴 500)
```
Setiap resource dasarnya REST; role diisolasi oleh middleware chain; frontend hanya memakai subset (~60% endpoint dipakai).

## D10. Product Portfolio
| Level | Produk | Status |
|---|---|---|
| Core | Event ticketing SaaS (multi-tenant) | Beta |
| Layer 1 | Promotor OS (event, tiket, seat, scan, report, refund, blog) | Beta |
| Layer 1 | Super-admin ops platform | Beta |
| Layer 2 | Growth (referral, voucher, multi-language) | Beta |
| Layer 3 | Ecosystem (sponsor/artis/fans) | Konsep (docs Phase 5) |
| Layer 4 | Platform (API, white-label, mobile) | Konsep (docs Phase 3-4) |

## D11. SWOT Analysis
| | Positif | Negatif |
|---|---|---|
| **Internal** | **S:** Multi-tenant benar, transaction integrity, webhook idempotent, 39 test hijau, cakupan fitur luas | **W:** 3 bug high, tanpa CI/CD/Docker, Xendit rusak, frontend dead-code + 126 lint, docs≠kode, bus-factor 1 |
| **Eksternal** | **O:** Pasar event ID tumbuh, EO menengah kurang terlayani, trust gap besar, data monetizable, blue ocean trust/escrow | **T:** LOKET/Tiket.com/Eventbrite bermodal besar, regulasi BI/Kominfo, kompetisi harga, sentimen scam merusak pasar |

## D12. Competitive Matrix
| Dimensi | TixNova | LOKET | Tiket.com | Eventbrite | Universe | Peatix | Humanitix |
|---|---|---|---|---|---|---|---|
| Fokus pasar | ID/ASEAN | ID | ID | Global | Global | APAC | Global/nirlaba |
| Multi-tenant SaaS EO | ✅ | 🟡 | 🔴 | ✅ | ✅ | 🟡 | 🟡 |
| Payment lokal (QRIS/VA/e-wallet) | 🟡 Midtrans | ✅ | ✅ | 🔴 | 🔴 | 🟡 | 🟡 |
| QR check-in | ✅ web | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Seat map | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 | 🟡 |
| Trust badge/anti-scam | ⚪ roadmap | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| Auto-refund escrow | ⚪ roadmap | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| Proof-of-attendance sponsor | ⚪ roadmap | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| Komisi EO rendah | ✅ 5% | 🟡 | 🔴 | 🔴 tinggi | 🟡 | 🟡 | ✅ nirlaba |
| White-label/custom domain | ⚪ roadmap | 🔴 | 🔴 | 🟡 | 🟡 | 🔴 | 🔴 |
| Mobile app | ⚪ roadmap | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## D13. Feature Gap Analysis
Ringkasan Output 6: 25 fitur gap. **Top 10 menurut prioritas:** multiple payment method (P0), hosted checkout (P1), analytics granular (P1), refund policy self-service (P1), SEO event page (P1), WA/SMS campaign (P2), referral payout (P2), free event/RSVP (P1), guest list offline (P1), rating/review (P2).

## D14. Technical Debt Report
| Item | Jenis | Effort | Prioritas |
|---|---|---|---|
| Xendit webhook 500 | Bug | Low | P0 |
| TicketController update crash | Bug | Low | P0 |
| /auth/refresh mismatch | Bug | Low | P0 |
| Free-order incomplete | Bug | Medium | P0 |
| Provider hardcoded midtrans | Design | Medium | P0 |
| Rate limit auth + weak seed | Security | Low | P0 |
| 3 cart systems + dead code | Refactor | Medium | P1 |
| react-query mati / fetch duplikat | Refactor | Medium | P1 |
| Hardcoded admin_fee (BE+FE) | Design | Low | P1 |
| Config::set komisi tidak persist | Bug | Low | P1 |
| Cache/queue database → Redis | Infra | Medium | P1 |
| Docs sinkronisasi | Docs | Low | P1 |
| Mixed slug/id binding | API design | Low | P2 |
| 'ilike' dead controller | Cleanup | Low | P2 |
| README conflict marker | Docs | Trivial | P0 |

## D15. Security Report
**Baik:** signature sha512 + hash_equals, idempotency webhook, tenant global scope + re-check ownership, locking DB, PII masking, throttle checkout & scan, CSRF disabled only for `api/*`.
**Gap:**
1. Token di localStorage (XSS → token bocor). Mitigasi: httpOnly cookie atau encrypted session; minimal: kurangi XSS surface.
2. Tidak ada rate limit auth endpoints (brute force).
3. `APP_DEBUG` perlu false di prod; `.env` ada di repo working tree (untracked, tapi pastikan di gitignore — ✅ ya).
4. CORS dev-only origins.
5. Webhook Xendit tanpa method (dampak: callback tidak diverifikasi, selalu 500).
6. SuperAdminSeeder credentials lemah.
7. `RegisterPromotorRequest`/`RegisterRequest` — perlu dicek throttle + email verifikasi (tidak ada flow verify email → akun spamable).
8. Tidak ada audit log.
9. Upload controller — perlu validasi MIME/exif penuh (ada `UploadController`, detail validation perlu di-review lebih lanjut).
**Skor keamanan keseluruhan: 6/10** (fondasi kuat, hardening belum).

## D16. Scalability Report
- **Sekarang:** monolit Laravel + Next.js SSR, DB Postgres single, queue database, tanpa cache. Skala: ribuan order/hari aman; puluhan ribu mulai tertekan.
- **Langkah (sesuai skala):** (1) Redis cache+queue → (2) read replica DB → (3) cache event listing + ISR → (4) rate limiting per tenant → (5) worker queue terpisah (eticket/report) → (6) object storage (S3/MinIO) untuk upload & PDF → (7) edge/CDN untuk landing → (8) partition orders by waktu bila perlu.
- **Blocking point terverifikasi:** semua list endpoint paginated? Sebagian besar ya; beberapa tanpa `->paginate` perlu audit. N+1 di dashboard (load relasi per baris) perlu dioptimasi.
- **Target:** 1000+ order/menit (docs) butuh Redis lock + queue Redis + optimasi query — tidak bisa dengan setup saat ini.

## D17. Cost Optimization Report
| Area | Kondisi | Optimasi | Hemat |
|---|---|---|---|
| Infra | Belum ada deploy | Mulai di VPS tunggal/Dokploy (IDR ~200-500rb/bln) bukan cloud besar | 60-80% vs cloud-managed |
| Queue | database driver | Redis dalam VPS yang sama | — |
| Storage | local disk | S3/MinIO hanya saat upload volume tinggi | — |
| Email | Mailtrap sandbox → perlu Resend/SES production | Pakai SES (murah) / Resend free tier | ~30% |
| CDN/Images | belum | Cloudflare free + WebP/AVIF | bandwidth |
| Payment fee | Midtrans | Negosiasi MDR bulk; Xendit sebagai leverage jika difix | 0.5-1% |

## D18. Product Maturity Matrix
| Dimensi | 1-10 | Keterangan |
|---|---|---|
| Fungsionalitas | 7 | Luas & dalam; bug blocking di 3 titik |
| Reliabilitas | 5 | Test 39 hijau tapi tanpa staging/CI |
| Usability | 6 | UI konsisten dark theme; beberapa flow canggung (redirect payment) |
| Scalability | 4 | Belum siap volume tinggi |
| Security | 6 | Fondasi baik, hardening kurang |
| Operasional (monitoring/deploy) | 2 | Tidak ada deploy/monitoring |
| Dokumentasi | 4 | Docs bagus tapi tidak sinkron kode |
| Data & Analytics | 5 | Data terstruktur, analitik masih dasar |
| **Maturity keseluruhan** | **5/10 — Early-beta menuju MVP produksi** |

## D19. Innovation Matrix
| Cluster | Dampak | Effort | Prioritas | Sudah dimiliki industri? |
|---|---|---|---|---|
| Trust & Anti-fraud | Sangat Tinggi | Medium | P1 | ❌ (gap global juga) |
| AI & Data | Tinggi | Medium-High | P2 | 🟡 |
| Sponsor proof-of-attendance | Tinggi | Medium | P2 | ❌ |
| Hosted checkout/UX | Tinggi | Low-Med | P1 | ✅ (harus mengejar) |
| Payment lokal | Tinggi | Low | P0 | ✅ (harus mengejar) |
| Resale anti-scalping | Sedang | High | P3 | 🟡 |
| Web3/NFT | Rendah sekarang | High | P4 | 🟡 (hindari) |

## D20. Priority Matrix (value vs effort)
```
  HIGH VALUE
     │  P0: Fix 3 bug · Rate limit · free-order · konsolidasi cart
     │      P1: Admin fee dinamis · Redis · CI · hosted checkout
     │      P2: Subscription · featured boost · WA notif · custom domain
     │
  ────┼──────────────────────────────────────────── effort (low → high)
     │
  LOW VALUE
```
Urutan eksekusi P0 (minggu 1-2) → P1 (minggu 3-8) → P2 (bulan 3-6).

## D21. Revenue Matrix
| Stream | Timeline | Effort | Potensi (indikatif) |
|---|---|---|---|
| Komisi + admin fee (dinamis) | 2 minggu | Low | Basis (5% + fee) |
| Featured boost | 1-2 bulan | Low | +5-10% revenue platform |
| Subscription tenant | 2-3 bulan | Medium | MRR berulang |
| Data/analytics premium | 3-6 bulan | Medium | B2B ARPU tinggi |
| Sponsorship | 6-12 bulan | High | Potensi terbesar |

## D22. Risk Matrix
| Risk | Prob. | Impact | Mitigasi |
|---|---|---|---|
| Bug blocking (Xendit/update/refresh) | Tinggi | Tinggi | Fix P0 minggu ini + CI |
| Bus-factor 1 developer | Tinggi | Tinggi | Dokumentasi + CI + on-board developer |
| Regulasi payment (BI/Kominfo) | Sedang | Tinggi | Konsultasi legal sebelum skala |
| Kompetitor bakar uang | Sedang | Tinggi | Diferensiasi trust/escrow, bukan harga |
| Fraud/chargeback | Sedang | Sedang | Rule-based scoring + escrow |
| Data leak (token localStorage) | Sedang | Tinggi | httpOnly cookie + hardening XSS |
| Dokumentasi≠realita menyesatkan | Sedang | Sedang | Sinkronisasi + audit |
| Volume spike hari-H | Sedang | Sedang | Redis + queue + load test |

## D23. Gantt Roadmap (Ringkas)
```
M1  Fix P0 bugs · CI · Rate limit · Redis   ████████
M2  Docs sync · cart consolidation · lint   ██████
M3  Pilot event live · staging + deploy      ████████
M4  Admin fee dinamis · featured boost       ████
M5  Subscription tenant + billing            ██████
M6  SEO · hosted checkout · WA notif         ██████
M7  Analytics real-time EO · PDF report      ██████
M8  Custom domain · API v1 · mobile app      ██████████
M9  Referral payout · dynamic pricing        ██████
M10 Trust/anti-fraud layer · trust score     ██████████
M11 Resale marketplace · B2B corporate       ████████
M12 Sponsor marketplace · proof-of-attendance██████████
M13 AI pricing/forecast                      ██████
M14 ASEAN expansion                          ██████████
    0    2    4    6    8    10   12   14   16   (bulan)
```

## D24. Product Timeline (fase vs status)
```
29-30 Jul 2026   MVP & Core (Phase 1-2)  ✅ selesai, migrasi fitur growth mulai
5-6 Agu 2026     Growth features (seat, refund, reschedule, translation) ✅ 85%
Agu-Sep 2026     Stabilisasi + go-live (30 hari)         ← REKOMENDASI SEKARANG
Okt-Nov 2026     Revenue engine (fee dinamis, subs, boost)
2027 Q1          Ecosystem Phase 4 (resale, B2B, AI pricing v1)
2027 Q3          Quad-Ecosystem Phase 5 (sponsor, artis, fans)
2028+            Global/ASEAN + platform API
```

---

# APPENDIX — Data Pendukung

## A. Inventaris Endpoint (≈60 route terverifikasi)
| Group | Jumlah | Route penting |
|---|---|---|
| Auth | 7 | register, register/promotor, login, logout, me, forgot-password, reset-password |
| User | 7 | profile, orders, tickets, referrals, refunds, refund request |
| Public events | 5 | featured, cities, index, show, seat-map |
| Public blogs/cat/voucher | 5 | blogs index/show/categories, categories, vouchers/apply |
| Orders & payments | 5 | create, show, cancel, initiate, status |
| Webhooks | 2 | midtrans ✅ / xendit 🔴 |
| Super-admin | ±22 | tenants, events(approve/reject/featured), commission, operations, reports, blogs, refunds, reschedules |
| Promotor | ±20 | events CRUD+banner+publish+reschedule, tickets, seat-map, seats, vouchers, blogs, reports, refunds, scan |

## B. Test Suite (terverifikasi hijau)
`EticketFulfillment, PaymentSecurity, PromotorScan, Referral, RefundWorkflow, Report, SeatMap, SuperAdminOperations, EventRescheduleWorkflow, EventBlogTranslation` = **39 test / 118 assertions / 471ms**

## C. Git History (Root `tiketing`)
```
6e73384 feat: payment controllers, webhooks, vouchers, reports & dashboard pages
82ec441 Update web submodule (EventCard syntax fix)
464f78d Update tixnova-web submodule (hydration error fixes)
572a08f Update API favicon (TN.png)
a67a396 Update README + remove attribution
5946cdf Merge origin/main
f440b5c Initial commit of tiketing project
e605857 Initial commit (Rams Dev)
```
Author tunggal, rentang 29-30 Jul (+ web 5-6 Agu), remote `senja060995/TixNova`.

---

*Laporan ditulis berdasarkan inspeksi langsung source code dan artefak repo per 6 Agustus 2026. Semua klaim tanpa bukti kode ditandai "Belum ditemukan pada repository". Dokumen ini dapat dijadikan acuan: product roadmap, engineering sprint planning, materi investor, dan negotiation partner.*




