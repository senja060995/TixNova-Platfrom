# 🎵 Concert Ticketing SaaS Platform
## Dokumentasi Produk Profesional — PT Ragam Manfaat Sinergi

> **Versi:** 1.0.0 | **Status:** Planning & Architecture  
> **Tanggal:** 29 Juli 2026 | **Dibuat oleh:** Antigravity AI

---

## 📋 Daftar Isi

1. [Overview Produk](#overview-produk)
2. [Arsitektur Sistem](#arsitektur-sistem)
3. [Struktur Folder Project](#struktur-folder-project)
4. [ERD Database Lengkap](#erd-database-lengkap)
5. [API Endpoint List](#api-endpoint-list)
6. [System Flow](#system-flow)
7. [UI/UX Design System](#uiux-design-system)
8. [Security Architecture](#security-architecture)
9. [Infrastructure & DevOps](#infrastructure--devops)
10. [Best Practices & Scalability](#best-practices--scalability)

---

## 1. Overview Produk

### 🎯 Nama Platform
**TixNova** — *Modern Concert Ticketing Platform*

### 💡 Value Proposition
Platform ticketing konser berbasis SaaS multi-tenant yang memungkinkan promotor/event organizer memiliki ekosistem penjualan tiket sendiri dengan dashboard terintegrasi, payment gateway lengkap, dan fitur scan QR real-time.

### 👥 Target User

| Role | Deskripsi | Jumlah |
|------|-----------|--------|
| **Super Admin** | Owner platform, manages semua tenant | 1-5 user |
| **Admin Event / Promotor** | Event organizer, buat & kelola konser | Tidak terbatas |
| **End User / Buyer** | Pembeli tiket | Tidak terbatas |

---

## 2. Arsitektur Sistem

### 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                              │
└──────────────┬──────────────┬──────────────────────────────┘
               │              │
       ┌───────▼──────┐ ┌─────▼──────────┐
       │   Next.js    │ │  Admin Panel   │
       │  (Public)    │ │  (Dashboard)   │
       └───────┬──────┘ └─────┬──────────┘
               │              │
       ┌───────▼──────────────▼──────────┐
       │            Nginx                │
       │      (Reverse Proxy / SSL)      │
       └───────────────┬─────────────────┘
                       │
       ┌───────────────▼─────────────────┐
       │         Laravel 12 API          │
       │    (REST API + Sanctum Auth)    │
       └──┬───────────┬──────────────┬───┘
          │           │              │
   ┌──────▼──┐  ┌─────▼────┐  ┌─────▼────┐
   │ MySQL/  │  │  Redis   │  │  Queue   │
   │ PgSQL   │  │  Cache   │  │ Workers  │
   └─────────┘  └──────────┘  └──────────┘
          │
   ┌──────▼──────────────────────────┐
   │         Storage (S3 / MinIO)    │
   │   Posters, E-Tickets, Reports   │
   └─────────────────────────────────┘
```

### 🔧 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Laravel 12 | REST API, Business Logic |
| **Auth** | Laravel Sanctum | Token-based Auth |
| **Frontend** | Next.js 14 (App Router) | Public Site & Dashboard |
| **Styling** | Tailwind CSS v3 | Modern UI |
| **Database** | MySQL 8 / PostgreSQL 15 | Data Persistence |
| **Cache** | Redis 7 | Session, Cache, Queue |
| **Queue** | Laravel Queue + Horizon | Email, Notif, PDF |
| **Storage** | AWS S3 / MinIO | Files & Assets |
| **Payment** | Midtrans + Xendit | Payment Gateway |
| **Email** | Mailgun / SES | Transactional Email |
| **WhatsApp** | WA Business API / Fonnte | Notifikasi WA |
| **Container** | Docker + Docker Compose | Environment |
| **Web Server** | Nginx | Reverse Proxy |
| **CI/CD** | GitHub Actions | Auto Deploy |

---

## 3. Struktur Folder Project

### 📁 Backend — Laravel 12

```
tixnova-api/
├── app/
│   ├── Console/
│   │   └── Commands/
│   │       ├── CleanExpiredOrders.php
│   │       └── SendEventReminders.php
│   ├── Exceptions/
│   │   └── Handler.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginController.php
│   │   │   │   ├── RegisterController.php
│   │   │   │   └── ForgotPasswordController.php
│   │   │   ├── SuperAdmin/
│   │   │   │   ├── DashboardController.php
│   │   │   │   ├── TenantController.php
│   │   │   │   ├── EventApprovalController.php
│   │   │   │   ├── CommissionController.php
│   │   │   │   └── ReportController.php
│   │   │   ├── Promotor/
│   │   │   │   ├── EventController.php
│   │   │   │   ├── TicketController.php
│   │   │   │   ├── ScanController.php
│   │   │   │   ├── DashboardController.php
│   │   │   │   └── ReportController.php
│   │   │   ├── User/
│   │   │   │   ├── EventController.php
│   │   │   │   ├── OrderController.php
│   │   │   │   ├── ProfileController.php
│   │   │   │   └── HistoryController.php
│   │   │   ├── Blog/
│   │   │   │   ├── ArticleController.php
│   │   │   │   └── CategoryController.php
│   │   │   └── Payment/
│   │   │       ├── MidtransController.php
│   │   │       └── XenditController.php
│   │   ├── Middleware/
│   │   │   ├── CheckRole.php
│   │   │   ├── CheckTenantAccess.php
│   │   │   ├── RateLimiter.php
│   │   │   └── SanitizeInput.php
│   │   └── Requests/
│   │       ├── Event/
│   │       │   ├── CreateEventRequest.php
│   │       │   └── UpdateEventRequest.php
│   │       ├── Order/
│   │       │   └── CreateOrderRequest.php
│   │       └── Auth/
│   │           ├── LoginRequest.php
│   │           └── RegisterRequest.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Tenant.php
│   │   ├── Event.php
│   │   ├── Ticket.php
│   │   ├── Order.php
│   │   ├── OrderItem.php
│   │   ├── Payment.php
│   │   ├── Blog.php
│   │   ├── Category.php
│   │   ├── Voucher.php
│   │   ├── SeatMap.php
│   │   └── ScanLog.php
│   ├── Services/
│   │   ├── PaymentService.php
│   │   ├── QRCodeService.php
│   │   ├── EmailService.php
│   │   ├── WhatsAppService.php
│   │   ├── VoucherService.php
│   │   └── ReportService.php
│   ├── Jobs/
│   │   ├── SendEticket.php
│   │   ├── SendWhatsAppNotif.php
│   │   ├── GeneratePDFReport.php
│   │   └── ProcessPaymentCallback.php
│   └── Traits/
│       ├── HasTenant.php
│       └── HasQRCode.php
├── config/
│   ├── midtrans.php
│   ├── xendit.php
│   ├── tenant.php
│   └── commission.php
├── database/
│   ├── migrations/
│   │   ├── 2024_01_01_000001_create_tenants_table.php
│   │   ├── 2024_01_01_000002_create_users_table.php
│   │   ├── 2024_01_01_000003_create_events_table.php
│   │   ├── 2024_01_01_000004_create_tickets_table.php
│   │   ├── 2024_01_01_000005_create_orders_table.php
│   │   ├── 2024_01_01_000006_create_order_items_table.php
│   │   ├── 2024_01_01_000007_create_payments_table.php
│   │   ├── 2024_01_01_000008_create_blogs_table.php
│   │   ├── 2024_01_01_000009_create_categories_table.php
│   │   ├── 2024_01_01_000010_create_vouchers_table.php
│   │   ├── 2024_01_01_000011_create_seat_maps_table.php
│   │   └── 2024_01_01_000012_create_scan_logs_table.php
│   └── seeders/
│       ├── SuperAdminSeeder.php
│       ├── RoleSeeder.php
│       └── SampleEventSeeder.php
├── routes/
│   ├── api.php          # Main API routes
│   ├── auth.php         # Auth routes
│   └── webhook.php      # Payment webhooks
└── tests/
    ├── Feature/
    │   ├── Auth/
    │   ├── Event/
    │   ├── Order/
    │   └── Payment/
    └── Unit/
        ├── PaymentService/
        └── QRCodeService/
```

### 📁 Frontend — Next.js 14

```
tixnova-web/
├── app/
│   ├── (public)/
│   │   ├── page.tsx               # Landing Page
│   │   ├── events/
│   │   │   ├── page.tsx           # Browse Events
│   │   │   └── [slug]/
│   │   │       └── page.tsx       # Event Detail
│   │   ├── blog/
│   │   │   ├── page.tsx           # Blog List
│   │   │   └── [slug]/
│   │   │       └── page.tsx       # Blog Detail
│   │   └── checkout/
│   │       ├── page.tsx           # Checkout
│   │       └── success/
│   │           └── page.tsx       # Order Success
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── dashboard/
│   │   ├── (super-admin)/
│   │   │   ├── overview/page.tsx
│   │   │   ├── tenants/page.tsx
│   │   │   ├── events/page.tsx
│   │   │   ├── transactions/page.tsx
│   │   │   ├── commission/page.tsx
│   │   │   └── reports/page.tsx
│   │   ├── (promotor)/
│   │   │   ├── overview/page.tsx
│   │   │   ├── events/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── edit/page.tsx
│   │   │   │       └── tickets/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── scan/page.tsx
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx
│   │   │   │   └── create/page.tsx
│   │   │   └── reports/page.tsx
│   │   └── (user)/
│   │       ├── profile/page.tsx
│   │       ├── my-tickets/page.tsx
│   │       └── history/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── DataTable.tsx
│   │   ├── SkeletonLoader.tsx
│   │   └── Toast.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── DashboardLayout.tsx
│   ├── event/
│   │   ├── EventCard.tsx
│   │   ├── EventBanner.tsx
│   │   ├── TicketSelector.tsx
│   │   └── SeatMapViewer.tsx
│   ├── payment/
│   │   ├── CheckoutForm.tsx
│   │   ├── PaymentStatus.tsx
│   │   └── VoucherInput.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── SalesChart.tsx
│   │   ├── RevenueChart.tsx
│   │   └── QRScanner.tsx
│   └── blog/
│       ├── ArticleCard.tsx
│       └── RichTextEditor.tsx
├── lib/
│   ├── api.ts                    # Axios instance + interceptors
│   ├── auth.ts                   # Auth helper
│   └── utils.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useEvents.ts
│   └── useCart.ts
├── store/
│   ├── authStore.ts              # Zustand stores
│   ├── cartStore.ts
│   └── notifStore.ts
└── types/
    ├── event.ts
    ├── ticket.ts
    ├── order.ts
    └── user.ts
```

---

## 4. ERD Database Lengkap

### 🗄️ Entity Relationship Diagram

```
┌──────────────┐       ┌─────────────────┐       ┌──────────────┐
│   TENANTS    │       │      USERS      │       │    ROLES     │
├──────────────┤       ├─────────────────┤       ├──────────────┤
│ id (PK)      │◄──┐   │ id (PK)         │◄──┐   │ id (PK)      │
│ name         │   │   │ tenant_id (FK)  │   │   │ name         │
│ slug         │   │   │ role_id (FK)    │───┘   │ slug         │
│ email        │   └───│ name            │       │ guard_name   │
│ phone        │       │ email           │       └──────────────┘
│ logo         │       │ password        │
│ status       │       │ avatar          │
│ plan         │       │ phone           │
│ commission   │       │ email_verified  │
│ created_at   │       │ is_active       │
└──────────────┘       │ created_at      │
                       └─────────────────┘
                               │
          ┌────────────────────┤
          │                    │
          ▼                    ▼
┌──────────────────┐    ┌──────────────┐
│      EVENTS      │    │    BLOGS     │
├──────────────────┤    ├──────────────┤
│ id (PK)          │    │ id (PK)      │
│ tenant_id (FK)   │    │ tenant_id    │
│ user_id (FK)     │    │ user_id      │
│ category_id (FK) │    │ category_id  │
│ title            │    │ title        │
│ slug             │    │ slug         │
│ description      │    │ content      │
│ venue            │    │ excerpt      │
│ city             │    │ banner       │
│ province         │    │ meta_title   │
│ latitude         │    │ meta_desc    │
│ longitude        │    │ status       │
│ start_date       │    │ published_at │
│ end_date         │    │ created_at   │
│ banner           │    └──────────────┘
│ poster           │
│ status           │◄──────────────────────┐
│ is_featured      │                       │
│ approved_at      │    ┌──────────────┐   │
│ approved_by      │    │  CATEGORIES  │   │
│ created_at       │    ├──────────────┤   │
└──────────────────┘    │ id (PK)      │   │
         │              │ name         │   │
         │              │ slug         │   │
         ▼              │ type         │   │
┌──────────────────┐    │ icon         │   │
│     TICKETS      │    └──────────────┘   │
├──────────────────┤                       │
│ id (PK)          │    ┌──────────────────┘
│ event_id (FK)    │    │
│ name             │    ▼
│ type             │ ┌──────────────┐
│ price            │ │  SEAT_MAPS   │
│ quota            │ ├──────────────┤
│ sold             │ │ id (PK)      │
│ min_purchase     │ │ event_id     │
│ max_purchase     │ │ name         │
│ sale_start       │ │ rows         │
│ sale_end         │ │ columns      │
│ is_active        │ │ config_json  │
│ created_at       │ │ created_at   │
└──────────────────┘ └──────────────┘
         │
         ▼
┌──────────────────┐       ┌──────────────────┐
│     ORDERS       │       │   ORDER_ITEMS     │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │◄──────│ id (PK)           │
│ order_code       │       │ order_id (FK)     │
│ user_id (FK)     │       │ ticket_id (FK)    │
│ event_id (FK)    │       │ quantity          │
│ voucher_id (FK)  │       │ price             │
│ subtotal         │       │ seat_number       │
│ discount         │       │ attendee_name     │
│ admin_fee        │       │ attendee_email    │
│ commission_fee   │       │ qr_code           │
│ total            │       │ qr_used           │
│ status           │       │ qr_used_at        │
│ expired_at       │       │ created_at        │
│ notes            │       └──────────────────┘
│ created_at       │
└──────────────────┘
         │
         ▼
┌──────────────────┐
│    PAYMENTS      │
├──────────────────┤
│ id (PK)          │
│ order_id (FK)    │
│ method           │
│ provider         │
│ external_id      │
│ amount           │
│ status           │
│ payload_raw      │
│ paid_at          │
│ expired_at       │
│ refund_at        │
│ created_at       │
└──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│    VOUCHERS      │       │    SCAN_LOGS      │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)           │
│ tenant_id        │       │ order_item_id     │
│ event_id (null=  │       │ event_id          │
│   all events)   │       │ scanned_by        │
│ code             │       │ scan_status       │
│ type             │       │ device_info       │
│ discount_type    │       │ location          │
│ discount_value   │       │ scanned_at        │
│ min_purchase     │       └──────────────────┘
│ max_use          │
│ used_count       │       ┌──────────────────┐
│ valid_from       │       │   REFERRAL_CODES  │
│ valid_until      │       ├──────────────────┤
│ is_active        │       │ id (PK)           │
│ created_at       │       │ user_id           │
└──────────────────┘       │ code              │
                           │ commission_rate   │
                           │ total_used        │
                           │ total_earned      │
                           │ is_active         │
                           └──────────────────┘
```

### 📊 Detail Schema Tables

#### `tenants`
```sql
CREATE TABLE tenants (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    phone       VARCHAR(20),
    logo        VARCHAR(500),
    description TEXT,
    status      ENUM('pending','active','suspended','rejected') DEFAULT 'pending',
    plan        ENUM('free','starter','professional','enterprise') DEFAULT 'free',
    commission  DECIMAL(5,2) DEFAULT 5.00 COMMENT 'Platform commission %',
    domain      VARCHAR(255) COMMENT 'Custom domain',
    settings    JSON,
    approved_at TIMESTAMP NULL,
    approved_by BIGINT UNSIGNED NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `users`
```sql
CREATE TABLE users (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id       BIGINT UNSIGNED NULL,
    role_id         TINYINT UNSIGNED NOT NULL DEFAULT 3, -- 1=superadmin, 2=promotor, 3=user
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password        VARCHAR(255) NOT NULL,
    avatar          VARCHAR(500),
    phone           VARCHAR(20),
    email_verified_at TIMESTAMP NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    last_login_at   TIMESTAMP NULL,
    referral_code   VARCHAR(20) UNIQUE,
    referred_by     BIGINT UNSIGNED NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_email (email),
    INDEX idx_role_id (role_id)
);
```

#### `events`
```sql
CREATE TABLE events (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id       BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL,
    category_id     BIGINT UNSIGNED,
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) UNIQUE NOT NULL,
    description     LONGTEXT,
    short_desc      TEXT,
    venue           VARCHAR(255) NOT NULL,
    venue_detail    TEXT,
    city            VARCHAR(100) NOT NULL,
    province        VARCHAR(100),
    latitude        DECIMAL(10,8),
    longitude       DECIMAL(11,8),
    start_date      DATETIME NOT NULL,
    end_date        DATETIME NOT NULL,
    banner          VARCHAR(500),
    poster          VARCHAR(500),
    status          ENUM('draft','pending','approved','rejected','ongoing','completed','cancelled') DEFAULT 'draft',
    is_featured     BOOLEAN DEFAULT FALSE,
    is_free         BOOLEAN DEFAULT FALSE,
    min_age         TINYINT UNSIGNED DEFAULT 0,
    tags            JSON,
    meta_title      VARCHAR(255),
    meta_description TEXT,
    approved_at     TIMESTAMP NULL,
    approved_by     BIGINT UNSIGNED NULL,
    reject_reason   TEXT,
    view_count      INT UNSIGNED DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status (status),
    INDEX idx_city (city),
    INDEX idx_start_date (start_date),
    FULLTEXT idx_search (title, description)
);
```

#### `tickets`
```sql
CREATE TABLE tickets (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id        BIGINT UNSIGNED NOT NULL,
    name            VARCHAR(255) NOT NULL,         -- "VIP", "Regular", "Early Bird"
    type            ENUM('regular','vip','early_bird','free') NOT NULL,
    description     TEXT,
    price           DECIMAL(12,2) NOT NULL DEFAULT 0,
    quota           INT UNSIGNED NOT NULL,
    sold            INT UNSIGNED DEFAULT 0,
    min_purchase    TINYINT UNSIGNED DEFAULT 1,
    max_purchase    TINYINT UNSIGNED DEFAULT 10,
    sale_start      DATETIME,
    sale_end        DATETIME,
    includes        JSON COMMENT 'Array of perks/inclusions',
    is_active       BOOLEAN DEFAULT TRUE,
    sort_order      TINYINT UNSIGNED DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_event_id (event_id)
);
```

#### `orders`
```sql
CREATE TABLE orders (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_code      VARCHAR(20) UNIQUE NOT NULL,   -- TIX-20240101-XXXXX
    user_id         BIGINT UNSIGNED NOT NULL,
    event_id        BIGINT UNSIGNED NOT NULL,
    tenant_id       BIGINT UNSIGNED NOT NULL,
    voucher_id      BIGINT UNSIGNED NULL,
    referral_code   VARCHAR(20) NULL,
    subtotal        DECIMAL(12,2) NOT NULL,
    discount        DECIMAL(12,2) DEFAULT 0,
    admin_fee       DECIMAL(12,2) DEFAULT 0,
    commission_fee  DECIMAL(12,2) DEFAULT 0,
    total           DECIMAL(12,2) NOT NULL,
    status          ENUM('pending','paid','cancelled','refunded','expired') DEFAULT 'pending',
    buyer_name      VARCHAR(255),
    buyer_email     VARCHAR(255),
    buyer_phone     VARCHAR(20),
    notes           TEXT,
    expired_at      TIMESTAMP,
    paid_at         TIMESTAMP NULL,
    cancelled_at    TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_event_id (event_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status (status),
    INDEX idx_order_code (order_code)
);
```

#### `order_items`
```sql
CREATE TABLE order_items (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id        BIGINT UNSIGNED NOT NULL,
    ticket_id       BIGINT UNSIGNED NOT NULL,
    quantity        TINYINT UNSIGNED NOT NULL,
    price           DECIMAL(12,2) NOT NULL,
    seat_number     VARCHAR(20) NULL,
    attendee_name   VARCHAR(255),
    attendee_email  VARCHAR(255),
    attendee_phone  VARCHAR(20),
    qr_code         VARCHAR(500) UNIQUE NOT NULL,
    qr_used         BOOLEAN DEFAULT FALSE,
    qr_used_at      TIMESTAMP NULL,
    eticket_sent    BOOLEAN DEFAULT FALSE,
    eticket_sent_at TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_order_id (order_id),
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_qr_code (qr_code)
);
```

#### `payments`
```sql
CREATE TABLE payments (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id        BIGINT UNSIGNED NOT NULL,
    method          ENUM('bank_transfer','ewallet','qris','credit_card','va') NOT NULL,
    provider        ENUM('midtrans','xendit','manual') NOT NULL,
    external_id     VARCHAR(255) UNIQUE COMMENT 'Provider transaction ID',
    payment_url     VARCHAR(500),
    amount          DECIMAL(12,2) NOT NULL,
    status          ENUM('pending','success','failed','expired','refunded') DEFAULT 'pending',
    payload_raw     JSON COMMENT 'Raw payload from provider',
    paid_at         TIMESTAMP NULL,
    expired_at      TIMESTAMP NULL,
    refund_amount   DECIMAL(12,2) NULL,
    refund_at       TIMESTAMP NULL,
    refund_reason   TEXT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_order_id (order_id),
    INDEX idx_external_id (external_id),
    INDEX idx_status (status)
);
```

---

## 5. API Endpoint List

### 🔐 Authentication

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| POST | `/api/auth/register` | — | — | Register user baru |
| POST | `/api/auth/register/promotor` | — | — | Register sebagai promotor |
| POST | `/api/auth/login` | — | — | Login semua role |
| POST | `/api/auth/logout` | ✅ | All | Logout |
| POST | `/api/auth/forgot-password` | — | — | Kirim link reset password |
| POST | `/api/auth/reset-password` | — | — | Reset password |
| GET | `/api/auth/me` | ✅ | All | Get current user |
| POST | `/api/auth/refresh` | ✅ | All | Refresh token |

### 🏛️ Super Admin

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/admin/dashboard/stats` | ✅ | Global statistics |
| GET | `/api/admin/tenants` | ✅ | List semua tenant |
| POST | `/api/admin/tenants/{id}/approve` | ✅ | Approve tenant |
| POST | `/api/admin/tenants/{id}/suspend` | ✅ | Suspend tenant |
| GET | `/api/admin/events` | ✅ | List semua event |
| POST | `/api/admin/events/{id}/approve` | ✅ | Approve event |
| POST | `/api/admin/events/{id}/reject` | ✅ | Reject event + reason |
| GET | `/api/admin/transactions` | ✅ | List semua transaksi |
| GET | `/api/admin/reports/revenue` | ✅ | Laporan revenue |
| GET | `/api/admin/reports/export` | ✅ | Export laporan (CSV/Excel) |
| GET | `/api/admin/commission` | ✅ | Setting komisi |
| PUT | `/api/admin/commission` | ✅ | Update komisi |
| GET | `/api/admin/users` | ✅ | Manajemen user |
| PUT | `/api/admin/users/{id}/toggle` | ✅ | Aktif/nonaktif user |

### 🎪 Promotor (Event Manager)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/promotor/dashboard/stats` | ✅ | Stats tenant |
| GET | `/api/promotor/events` | ✅ | List event milik promotor |
| POST | `/api/promotor/events` | ✅ | Buat event baru |
| GET | `/api/promotor/events/{id}` | ✅ | Detail event |
| PUT | `/api/promotor/events/{id}` | ✅ | Update event |
| DELETE | `/api/promotor/events/{id}` | ✅ | Hapus event (draft only) |
| POST | `/api/promotor/events/{id}/publish` | ✅ | Submit event untuk review |
| POST | `/api/promotor/events/{id}/banner` | ✅ | Upload banner (multipart) |
| GET | `/api/promotor/events/{id}/tickets` | ✅ | List tiket event |
| POST | `/api/promotor/events/{id}/tickets` | ✅ | Buat tiket |
| PUT | `/api/promotor/tickets/{id}` | ✅ | Update tiket |
| DELETE | `/api/promotor/tickets/{id}` | ✅ | Hapus tiket |
| GET | `/api/promotor/events/{id}/orders` | ✅ | List order event |
| GET | `/api/promotor/events/{id}/reports` | ✅ | Laporan penjualan event |
| GET | `/api/promotor/reports/export` | ✅ | Export laporan |
| POST | `/api/promotor/scan` | ✅ | Scan QR tiket check-in |
| GET | `/api/promotor/scan/logs/{event_id}` | ✅ | Log scan event |
| GET | `/api/promotor/vouchers` | ✅ | List voucher |
| POST | `/api/promotor/vouchers` | ✅ | Buat voucher |
| DELETE | `/api/promotor/vouchers/{id}` | ✅ | Hapus voucher |

### 🌐 Public (Tidak Perlu Auth)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/events` | Browse events (dengan filter & pagination) |
| GET | `/api/events/{slug}` | Detail event |
| GET | `/api/events/featured` | Featured events untuk landing page |
| GET | `/api/events/cities` | List kota yang ada event |
| GET | `/api/categories` | List kategori event |
| GET | `/api/blogs` | List artikel blog |
| GET | `/api/blogs/{slug}` | Detail artikel |
| GET | `/api/blogs/categories` | Kategori blog |

**Query Parameters untuk `/api/events`:**
```
?city=jakarta
?category=music
?date_from=2024-01-01
?date_to=2024-03-31
?search=coldplay
?price_min=0
?price_max=500000
?sort=date_asc|date_desc|price_asc|price_desc|popular
?page=1&per_page=12
```

### 🛒 Order & Checkout

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/orders` | ✅ | Buat order baru |
| GET | `/api/orders/{code}` | ✅ | Detail order |
| POST | `/api/orders/{code}/cancel` | ✅ | Cancel order |
| GET | `/api/orders/{code}/tickets` | ✅ | Download e-tickets |
| POST | `/api/vouchers/validate` | ✅ | Validasi voucher |
| POST | `/api/referrals/validate` | ✅ | Validasi referral code |

**Request Body `POST /api/orders`:**
```json
{
  "event_id": 1,
  "items": [
    {
      "ticket_id": 1,
      "quantity": 2,
      "attendees": [
        {
          "name": "Budi Santoso",
          "email": "budi@example.com",
          "phone": "081234567890"
        }
      ]
    }
  ],
  "voucher_code": "DISC20",
  "referral_code": "REF123",
  "payment_method": "qris",
  "buyer_name": "Budi Santoso",
  "buyer_email": "budi@example.com",
  "buyer_phone": "081234567890"
}
```

### 💳 Payment

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/payments/initiate` | ✅ | Inisiasi payment |
| GET | `/api/payments/{order_code}/status` | ✅ | Cek status payment |
| POST | `/api/webhooks/midtrans` | — | Midtrans callback |
| POST | `/api/webhooks/xendit` | — | Xendit callback |

### 👤 User Profile

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/user/profile` | ✅ | Get profile |
| PUT | `/api/user/profile` | ✅ | Update profile |
| POST | `/api/user/avatar` | ✅ | Upload avatar |
| GET | `/api/user/orders` | ✅ | Riwayat pembelian |
| GET | `/api/user/tickets` | ✅ | Semua tiket saya |

---

## 6. System Flow

### 🔄 Flow Pembelian Tiket (User Journey)

```
USER                    FRONTEND                BACKEND                PAYMENT GW
 │                          │                       │                       │
 │  Browse events           │                       │                       │
 ├─────────────────────────►│  GET /api/events       │                       │
 │                          ├──────────────────────►│                       │
 │                          │◄──────────────────────┤                       │
 │◄─────────────────────────┤  Event list           │                       │
 │                          │                       │                       │
 │  Pilih event & tiket     │                       │                       │
 ├─────────────────────────►│  GET /api/events/{slug}│                      │
 │◄─────────────────────────┤  Event detail + tickets│                      │
 │                          │                       │                       │
 │  Input data & checkout   │                       │                       │
 ├─────────────────────────►│  POST /api/orders      │                       │
 │                          ├──────────────────────►│                       │
 │                          │       Validate data    │                       │
 │                          │       Lock quota       │                       │
 │                          │       Create order     │                       │
 │                          │       Calculate total  │                       │
 │                          │◄──────────────────────┤                       │
 │◄─────────────────────────┤  {order_code, total}  │                       │
 │                          │                       │                       │
 │  Pilih metode bayar      │                       │                       │
 ├─────────────────────────►│  POST /api/payments    │                       │
 │                          ├──────────────────────►│                       │
 │                          │            POST to Payment Gateway             │
 │                          │───────────────────────┼──────────────────────►│
 │                          │◄──────────────────────┼───────────────────────┤
 │                          │      {payment_url}    │                       │
 │◄─────────────────────────┤                       │                       │
 │                          │                       │                       │
 │  Redirect ke payment page │                       │                       │
 │  (QRIS / VA / E-Wallet)  │                       │                       │
 │─────────────────────────────────────────────────────────────────────────►│
 │◄─────────────────────────────────────────────────────────────────────────┤
 │  Bayar sukses            │                       │                       │
 │                          │              Webhook Callback                 │
 │                          │◄──────────────────────────────────────────────┤
 │                          │       POST /api/webhooks/midtrans              │
 │                          │  Update payment status │                      │
 │                          │  Update order status  │                       │
 │                          │  Generate QR Code     │                       │
 │                          │  Queue: SendEticket   │                       │
 │                          │                       │  ┌────────────────┐   │
 │                          │                       │  │  Queue Worker  │   │
 │                          │                       │  │ Send Email +   │   │
 │                          │                       │  │  WhatsApp      │   │
 │                          │                       │  └────────────────┘   │
 │  Check email/WA          │                       │                       │
 │◄─── E-Ticket diterima ───│                       │                       │
```

### 🎫 Flow Check-in di Event (QR Scan)

```
PETUGAS              SCAN APP              BACKEND           DATABASE
  │                     │                     │                  │
  │  Buka scan page     │                     │                  │
  ├────────────────────►│                     │                  │
  │                     │  GET /api/scan/auth  │                  │
  │                     ├────────────────────►│                  │
  │                     │◄────────────────────┤                  │
  │                     │  {event_id, valid}  │                  │
  │  Scan QR Code       │                     │                  │
  ├────────────────────►│                     │                  │
  │                     │  POST /api/promotor/scan               │
  │                     │  {qr_code, event_id}│                  │
  │                     ├────────────────────►│                  │
  │                     │     Find order_item by qr_code         │
  │                     │──────────────────────────────────────►│
  │                     │     Validate: event match, not used    │
  │                     │◄──────────────────────────────────────┤
  │                     │     Mark qr_used = true               │
  │                     │     Create scan_log                   │
  │                     │──────────────────────────────────────►│
  │                     │◄────────────────────┤                  │
  │                     │  {status: "valid",  │                  │
  │                     │   attendee_name,    │                  │
  │                     │   ticket_type}      │                  │
  │◄────────────────────┤                     │                  │
  │  ✅ VALID - Masuk!  │                     │                  │
```

### 👨‍💼 Flow Promotor Buat Event

```
PROMOTOR → Register/Login → Dashboard Promotor
     │
     ├── CRUD Event
     │     ├── Input data event (judul, lokasi, tanggal, dll)
     │     ├── Upload banner/poster
     │     ├── Set tiket (nama, harga, kuota, tier)
     │     └── Submit untuk review
     │
     ├── Super Admin Review
     │     ├── Notifikasi ke super admin
     │     ├── Admin preview event
     │     └── Approve / Reject + Reason
     │
     └── Event Published
           ├── Notifikasi ke promotor
           └── Event tampil di marketplace
```

---

## 7. UI/UX Design System

### 🎨 Color Palette

```css
/* Primary Brand */
--color-primary: #7C3AED;        /* Violet 600 */
--color-primary-dark: #5B21B6;   /* Violet 800 */
--color-accent: #F59E0B;         /* Amber 500 */

/* Dark Mode Background */
--bg-base: #0F0F17;              /* Near black */
--bg-surface: #1A1A2E;          /* Dark card */
--bg-elevated: #252540;          /* Elevated card */
--bg-border: #2D2D4E;           /* Border */

/* Text */
--text-primary: #F8FAFC;
--text-secondary: #94A3B8;
--text-muted: #475569;

/* Status */
--color-success: #10B981;
--color-warning: #F59E0B;
--color-danger: #EF4444;
--color-info: #3B82F6;
```

### 📱 Page Structure

#### Landing Page Sections:
1. **Hero Section** — Full-screen banner dengan CTA "Cari Konser" + search bar kota/tanggal
2. **Featured Events** — Horizontal scroll carousel konser unggulan
3. **Browse by City** — Grid kota populer dengan count event
4. **Upcoming Events** — Grid 3x4 konser mendatang
5. **Blog Highlight** — 3 artikel terbaru
6. **Download App CTA** — (Future mobile app)
7. **Footer** — Links, sosmed, kontak

#### Dashboard Promotor Layout:
- **Sidebar** kiri (fixed) — Nav items
- **Top Bar** — User avatar, notif, logout
- **Main Content Area** — Per-page content
- **Stats Cards** — Revenue, Tiket Terjual, Event Aktif, Pengunjung
- **Charts** — Line chart revenue (7/30/90 hari), Bar chart tiket per kategori
- **Recent Orders** — Tabel order terbaru real-time

### 🖥️ UI Preview

````carousel
![TixNova Landing Page](/Users/sidomulyo/.gemini/antigravity-ide/brain/b6c47d67-24ef-44fe-9a60-2aaf5e1ea54d/tixnova_landing_page_1785282290999.png)
<!-- slide -->
![TixNova Promotor Dashboard](/Users/sidomulyo/.gemini/antigravity-ide/brain/b6c47d67-24ef-44fe-9a60-2aaf5e1ea54d/tixnova_dashboard_1785282300219.png)
````

### 🖥️ Halaman Utama (Screenshot Description)

**Landing Page:**
- Dark background `#0F0F17`
- Hero: gradient ungu ke hitam, teks besar "Temukan Konser Terbaik di Kotamu"
- Search bar glassmorphism dengan filter kota + tanggal
- Cards event: image cover, badge kategori, harga, lokasi, tanggal
- Hover effect: scale + glow ungu

**Dashboard:**
- Sidebar dengan icon + text, active state highlight ungu
- Stat cards dengan animated counter
- Chart menggunakan Recharts (dark theme)
- Table dengan pagination dan filter

---

## 8. Security Architecture

### 🔐 Authentication & Authorization

```php
// Middleware Stack
Route::middleware([
    'auth:sanctum',
    'check.role:promotor',
    'check.tenant',
    'throttle:60,1',    // Rate limit: 60 req/menit
])->group(function () {
    // Protected routes
});
```

### 🛡️ Security Checklist

| Layer | Implementasi |
|-------|-------------|
| **Auth** | Laravel Sanctum + Token expiry 24h |
| **Authorization** | Spatie Permission (RBAC) |
| **Rate Limiting** | 60 req/min user, 1000 req/min webhook |
| **Input Validation** | Laravel Form Request + sanitize |
| **SQL Injection** | Eloquent ORM (no raw queries) |
| **XSS** | Blade escaping + Content Security Policy |
| **CSRF** | Sanctum SPA CSRF cookie |
| **File Upload** | Validate MIME type, size limit, rename |
| **Webhook Security** | Signature verification (Midtrans/Xendit) |
| **Tenant Isolation** | `tenant_id` pada setiap query |
| **Sensitive Data** | Encrypt payment data at rest |
| **HTTPS** | SSL via Let's Encrypt + HSTS |

### 🔒 Webhook Signature Verification

```php
// Midtrans
public function verifySignature(Request $request): bool
{
    $orderId = $request->input('order_id');
    $statusCode = $request->input('status_code');
    $grossAmount = $request->input('gross_amount');
    $serverKey = config('midtrans.server_key');
    
    $signature = hash(
        'sha512',
        $orderId . $statusCode . $grossAmount . $serverKey
    );
    
    return hash_equals($signature, $request->input('signature_key'));
}
```

### 🏢 Multi-Tenant Isolation

```php
// Trait HasTenant — otomatis filter berdasarkan tenant
trait HasTenant
{
    protected static function bootHasTenant(): void
    {
        static::creating(function ($model) {
            if (auth()->check() && auth()->user()->tenant_id) {
                $model->tenant_id = auth()->user()->tenant_id;
            }
        });

        static::addGlobalScope('tenant', function ($query) {
            if (auth()->check() && !auth()->user()->isSuperAdmin()) {
                $query->where('tenant_id', auth()->user()->tenant_id);
            }
        });
    }
}
```

---

## 9. Infrastructure & DevOps

### 🐳 Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./certbot/conf:/etc/letsencrypt
    depends_on:
      - api
      - web

  api:
    build:
      context: ./tixnova-api
      dockerfile: Dockerfile
    environment:
      - APP_ENV=production
      - DB_HOST=mysql
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis

  web:
    build:
      context: ./tixnova-web
      dockerfile: Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=https://api.tixnova.id

  mysql:
    image: mysql:8.0
    volumes:
      - mysql_data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: tixnova

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  queue-worker:
    build:
      context: ./tixnova-api
    command: php artisan queue:work --queue=high,default,low --tries=3
    depends_on:
      - api
      - redis

  scheduler:
    build:
      context: ./tixnova-api
    command: php artisan schedule:work
    depends_on:
      - api

volumes:
  mysql_data:
  redis_data:
```

### 📊 Queue Architecture

```php
// Job Priority Queues
SendEticket::dispatch($orderItem)->onQueue('high');      // Prioritas tinggi
SendWhatsAppNotif::dispatch($order)->onQueue('default'); // Normal
GeneratePDFReport::dispatch($report)->onQueue('low');   // Background
CleanExpiredOrders::dispatch()->onQueue('low');         // Maintenance
```

### 🔄 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run PHP Tests
        run: php artisan test --parallel
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          script: |
            cd /var/www/tixnova
            git pull origin main
            docker compose up -d --build
            docker compose exec api php artisan migrate --force
            docker compose exec api php artisan config:cache
```

---

## 10. Best Practices & Scalability

### 📈 Strategi Skalabilitas

| Aspek | Implementasi |
|-------|-------------|
| **Database** | Read replicas untuk query berat, Connection pooling |
| **Cache** | Redis untuk event listing, stats, session |
| **Queue** | Separate workers per queue priority |
| **CDN** | CloudFront/Cloudflare untuk static assets |
| **Images** | Lazy loading + WebP format + responsive sizes |
| **API** | Pagination semua list endpoint |
| **Search** | Meilisearch / Algolia untuk full-text search |
| **Monitoring** | Sentry (error), Telescope (debug), Prometheus+Grafana |

### 🏗️ Modular Architecture

```
tixnova-api/app/
├── Modules/
│   ├── Auth/
│   ├── Tenant/
│   ├── Event/
│   ├── Ticket/
│   ├── Order/
│   ├── Payment/
│   ├── Blog/
│   ├── Notification/
│   └── Report/
```

### 📦 Cache Strategy

```php
// Cache event listing (5 menit)
Cache::tags(['events', "city:{$city}"])
    ->remember("events:{$city}:{$page}", 300, function() {
        return Event::with(['tickets', 'category'])
            ->where('city', $city)
            ->where('status', 'approved')
            ->paginate(12);
    });

// Invalidate on update
Cache::tags(['events'])->flush();
```

### 🧪 Testing Strategy

```
tests/
├── Unit/
│   ├── PaymentServiceTest.php
│   ├── QRCodeServiceTest.php
│   ├── VoucherServiceTest.php
│   └── CommissionCalculatorTest.php
├── Feature/
│   ├── Auth/
│   │   ├── RegisterTest.php
│   │   └── LoginTest.php
│   ├── Event/
│   │   ├── CreateEventTest.php
│   │   └── ApproveEventTest.php
│   ├── Order/
│   │   ├── CreateOrderTest.php
│   │   ├── CheckoutTest.php
│   │   └── CancelOrderTest.php
│   └── Payment/
│       ├── MidtransWebhookTest.php
│       └── XenditWebhookTest.php
└── Browser/   # Laravel Dusk
    ├── CheckoutFlowTest.php
    └── QRScanTest.php
```

### 🚀 Performance Target

| Metric | Target |
|--------|--------|
| API Response Time | < 200ms (cached) |
| API Response Time | < 500ms (fresh) |
| Page Load (LCP) | < 2.5 detik |
| Database Query | < 100ms per query |
| Concurrent Orders | 1000+ / menit |
| Uptime | 99.9% SLA |

---

## 📅 Roadmap Pengembangan

> **⚠️ UPDATE (Agustus 2026):** Roadmap resmi kini mengacu pada **`docs/MASTER_BLUEPRINT.md` (TIXNOVA 2.0 — AI-Powered Event Growth & Operating System)**. Fase lama di bawah (Phase 1–3) dipertahankan sebagai **catatan historis** yang sudah tervalidasi audit. **Phase 4–5 lama (ticketing-centric) diganti** oleh Fase 1–6 baru yang selaras dengan Blueprint 2.0. Arah produk berubah dari "Platform Ticketing" menjadi **"Event Growth OS"** — ticketing hanyalah salah satu modul.

### Phase 1 — MVP (Bulan 1-2) — [100% COMPLETED] — *HISTORIS*
- [x] Auth system (register, login, roles)
- [x] Tenant management
- [x] CRUD Event
- [x] Tiket (harga, kuota, tier)
- [x] Order & Checkout
- [x] Midtrans integration
- [x] E-ticket QR generation
- [x] Email notification
- [x] Landing page + event browse
- [x] Basic dashboard promotor

### Phase 2 — Core Features (Bulan 3-4) — [100% COMPLETED] — *HISTORIS*
- [x] QR Scanner app (Web Scanner di `/dashboard/scan`)
- [x] Blog system (Blog CRUD Promotor/Admin & Public Blog)
- [x] Voucher & diskon
- [x] Laporan & export PDF/Excel
- [x] Dashboard super admin lengkap
- [x] Xendit integration
- [x] WhatsApp notification

### Phase 3 — Growth Features (Bulan 5-6) — [85% COMPLETED] — *HISTORIS*
- [x] Referral / affiliate system
- [x] Seat map builder & seat picker
- [x] Refund & reschedule (Pengajuan, Review Promotor, Exec Admin & Ubah Jadwal)
- [x] Advanced analytics (Grafik Pendapatan, Tiket Per Category, Laporan Komisi)
- [x] Multi-language (ID/EN) — *Baru saja tuntas di seluruh API & Frontend*
- [ ] Custom domain per tenant → *dimigrasikan ke modul White Label & Custom Domain (Blueprint Fase 3)*
- [ ] Mobile app native (React Native) → *diganti Mobile App + Wallet & PWA (Blueprint Fase 2-3)*

### Fase 1 — Foundation (30-90 Hari) — [AKTIF]
> **Berbayar dulu utang teknis, lalu definisikan kategori baru.**
- [ ] Fix bug High: Xendit webhook 500 (`routes/api.php:106`), `TicketController::update` crash, `/auth/refresh` mismatch
- [ ] Fix free-order (order tanpa pembayaran valid), admin fee hardcoded Rp5.000 → configurable per tenant
- [ ] CI/CD (GitHub Actions: test + lint), Docker, Redis (cache + queue)
- [ ] Rate limit auth, CORS produksi, bersihkan kredensial seed
- [ ] Rebrand: positioning "AI-Powered Event Growth & Operating System" + tagline baru
- [ ] Event Intelligence dashboard v1 (realtime sales/scan)
- [ ] Affiliate link tracking v1 (perluasan `referrals`)
- [ ] Trust Badge & EO Trust Score v1 (🟢 Guaranteed / 🟡 Verified / ⚪ Standard)
- [ ] Onboarding EO baru + multi-language live
- [ ] Sinkronisasi dokumentasi dengan kode

### Fase 2 — Growth Engine (6-12 Bulan)
> **Platform menjadi mesin permintaan (demand engine), bukan distributor pasif.**
- [ ] Distribution OS penuh (embed widget, QR flyer, deep-link, channel tracking)
- [ ] Affiliate & Influencer OS lengkap (payout otomatis saat tiket ter-scan)
- [x] Community OS + revenue share (fan club, komunitas, kampus, korporat)
- [ ] Campaign OS (promo, bundling, early bird, tiered price)
- [ ] Trust Ledger v1 (escrow EO, guaranteed auto-refund)
- [ ] Event ERP v1 (budget, timeline, checklist produksi)
- [ ] Event CRM v1 (segmentasi RFM, re-marketing)
- [ ] AI Pricing & Demand v1 (rule + statistik)
- [ ] Data warehouse + feature store
- [ ] Mobile PWA (app-lite, wallet QR)

### Fase 3 — Ecosystem (12-24 Bulan)
> **Buka lapisan B2B & platform; monetisasi beragam.**
- [ ] Sponsor OS + Proof-of-Attendance Report
- [ ] Vendor Marketplace + escrow
- [ ] Public API + SDK/Widget + Developer Portal
- [ ] White Label + custom domain (menuntaskan Phase 3 lama)
- [ ] AI Marketing (auto-segment + auto-copy)
- [ ] Finance OS (payout scheduler, reconciliation, pajak)
- [ ] AI Fraud & Ops
- [ ] Mobile native app + wallet

### Fase 4 — Marketplaces & Intelligence (2-3 Tahun)
- [ ] Venue Marketplace
- [ ] Talent Marketplace + escrow artis (DP lock 50%)
- [ ] Creator Marketplace (deliverable-based payout)
- [ ] AI Matching penuh (EO↔sponsor/vendor/talent/venue/creator)
- [ ] Financing untuk EO (berbasis pre-sale tiket)
- [ ] Insurance add-on (perlindungan pembatalan)

### Fase 5 — Global (3-5 Tahun)
- [ ] Ekspansi Singapura & Malaysia
- [ ] Multi-currency + multi-gateway penuh
- [ ] Lisensi white-label ke operator lokal negara lain
- [ ] Developer economy & plugin marketplace

### Fase 6 — 10 Tahun (Visi 2036)
- [ ] AI Feasibility + synthetic data
- [ ] Ekspansi MEA / global
- [ ] Menjadi standar industri event (kategori leader)
- [ ] IPO / strategi exit

> **Catatan:** Detail lengkap, alasan bisnis/teknis, estimasi revenue, kompleksitas, dan prioritas tiap modul ada di `docs/MASTER_BLUEPRINT.md`.

---

*Dokumen ini dibuat Oleh PT Ragam Manfaat Sinergi*  
*Versi 2.0 — Agustus 2026 (Roadmap selaras dengan `docs/MASTER_BLUEPRINT.md`)*
