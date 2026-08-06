"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "id" | "en";

type Dictionary = Record<string, string>;

const dictionaries: Record<Locale, Dictionary> = {
  id: {
    // Navigation
    "nav.events": "Cari Event",
    "nav.categories": "Kategori",
    "nav.cities": "Kota",
    "nav.blog": "Blog",
    "nav.promoter": "Jadi Promotor",
    "nav.login": "Masuk",
    "nav.register": "Daftar",
    "nav.myTickets": "Tiket Saya",
    "nav.dashboard": "Dashboard",
    "nav.profile": "Profil Saya",
    "nav.history": "Riwayat Transaksi",
    "nav.logout": "Keluar",
    "nav.navigation": "Navigasi TixNova",

    // Footer
    "footer.description": "Platform ticketing konser modern Indonesia. Temukan, beli, dan nikmati konser favoritmu dengan mudah, aman, dan cepat.",
    "footer.platform": "Platform",
    "footer.support": "Bantuan",
    "footer.company": "Perusahaan",
    "footer.promoter": "Untuk Promotor",
    "footer.copyright": "Hak Cipta Dilindungi Undang-Undang.",
    "footer.secure": "Aman & Terpercaya",
    "footer.fast": "Proses Cepat",
    "footer.madeIn": "Dibuat di Indonesia",

    // Hero & Home
    "hero.badge": "Platform Ticketing Konser #1 Indonesia",
    "hero.titleBefore": "Temukan",
    "hero.titleHighlight": "Konser Terbaik",
    "hero.titleAfter": "di Kotamu",
    "hero.description": "Ribuan konser, festival, & event menunggumu. Beli tiket mudah, aman, & dapat e-tiket instan.",
    "hero.searchPlaceholder": "Cari konser, artis, venue...",
    "hero.allCities": "Semua Kota",
    "hero.search": "Cari Event",
    "hero.popularCategories": "Kategori populer:",
    "home.featured": "Event Unggulan",
    "home.viewAll": "Lihat Semua",
    "home.upcoming": "Event Mendatang",
    "home.upcomingDescription": "Jangan lewatkan event menarik yang akan datang",
    "home.browseCity": "Jelajahi Event per Kota",
    "home.browseCityDescription": "Temukan konser & pertunjukan terdekat di kotamu",
    "home.viewAllCities": "Lihat Semua Kota",
    "home.noFeatured": "Belum ada event unggulan saat ini.",
    "home.noUpcoming": "Belum ada event mendatang",
    "home.upcomingSoon": "Event terbaru akan muncul di sini",
    "city.events": "Event",
    "city.explore": "Jelajahi Konser",

    // Events Page
    "events.explore": "Jelajahi Konser & Event",
    "events.title": "Temukan Event Favoritmu",
    "events.description": "Beli tiket konser, festival musik, hiburan, dan event terbaik di seluruh Indonesia.",
    "events.searchPlaceholder": "Cari konser, artis, lokasi, atau venue...",
    "events.filter": "Filter",
    "events.allCategories": "Semua Kategori",
    "events.allCities": "Semua Kota",
    "events.sortUpcoming": "Mendatang",
    "events.sortDate": "Tanggal: Terdekat",
    "events.sortPriceLow": "Harga: Terendah",
    "events.sortPriceHigh": "Harga: Tertinggi",
    "events.sortPopular": "Paling Populer",

    // Event Detail & Tickets
    "eventDetail.selectTicket": "Pilih Tiket",
    "eventDetail.seatMap": "Pilih Kursi",
    "eventDetail.about": "Tentang Event Ini",
    "eventDetail.venueLocation": "Lokasi & Venue",
    "eventDetail.terms": "Syarat & Ketentuan",
    "eventDetail.promoter": "Diselenggarakan oleh",
    "eventDetail.share": "Bagikan Event",
    "eventDetail.soldOut": "Habis Terjual",
    "eventDetail.buyNow": "Beli Tiket Sekarang",
    "tickets.category": "Kategori Tiket",
    "tickets.price": "Harga",
    "tickets.quota": "Sisa Kuota",
    "tickets.quantity": "Jumlah",

    // Seat Map
    "seatmap.selectSeat": "Pilih Kursi Penonton",
    "seatmap.stage": "PANGGUNG UTAMA / STAGE",
    "seatmap.available": "Tersedia",
    "seatmap.selected": "Dipilih",
    "seatmap.booked": "Terjual",
    "seatmap.confirm": "Konfirmasi Pilihan Kursi",

    // Blog
    "blog.title": "Blog & Berita Konser",
    "blog.description": "Informasi terbaru seputar dunia musik, event konser, dan tips hiburan.",
    "blog.searchPlaceholder": "Cari artikel, tips war tiket...",
    "blog.readMore": "Baca Selengkapnya",
    "blog.recent": "Artikel Terbaru",
    "blog.related": "Artikel Terkait",
    "blog.noArticles": "Belum ada artikel yang diterbitkan.",

    // Cities
    "cities.title": "Jelajahi Konser Berdasarkan Kota",
    "cities.description": "Temukan acara live music dan festival seru di kota favoritmu.",
    "cities.searchPlaceholder": "Cari nama kota...",
    "cities.exploreConcerts": "Lihat Konser di",

    // Auth Pages
    "auth.loginTitle": "Selamat Datang Kembali",
    "auth.loginDesc": "Masuk ke akun TixNova kamu untuk mengakses tiket & transaksi.",
    "auth.registerTitle": "Buat Akun TixNova",
    "auth.registerDesc": "Daftar gratis untuk mulai membeli tiket konser favoritmu.",
    "auth.promoterRegister": "Daftar Sebagai Promotor Event",
    "auth.emailLabel": "Alamat Email",
    "auth.passwordLabel": "Kata Sandi",
    "auth.confirmPassword": "Konfirmasi Kata Sandi",
    "auth.nameLabel": "Nama Lengkap",
    "auth.phoneLabel": "Nomor WhatsApp / Telepon",
    "auth.tenantName": "Nama Organisasi / Promotor",
    "auth.forgotPassword": "Lupa kata sandi?",
    "auth.loginBtn": "Masuk Sekarang",
    "auth.registerBtn": "Daftar Akun",
    "auth.noAccount": "Belum punya akun?",
    "auth.hasAccount": "Sudah punya akun?",
    "auth.registerPrompt": "Daftar di sini",
    "auth.loginPrompt": "Masuk di sini",
    "auth.resetTitle": "Reset Kata Sandi",
    "auth.resetDesc": "Masukkan email kamu untuk menerima tautan reset kata sandi.",
    "auth.sendResetLink": "Kirim Link Reset",

    // Checkout & Payment
    "checkout.title": "Pemesanan Tiket",
    "checkout.summary": "Ringkasan Pemesanan",
    "checkout.customerInfo": "Data Pemesan",
    "checkout.voucher": "Kode Voucher / Promo",
    "checkout.applyVoucher": "Gunakan Voucher",
    "checkout.totalPayment": "Total Pembayaran",
    "checkout.payNow": "Lanjutkan Pembayaran",
    "checkout.successTitle": "Pembayaran Berhasil!",
    "checkout.successDesc": "E-tiket kamu telah siap dan dikirimkan ke email.",
    "checkout.viewTickets": "Lihat Tiket Saya",

    // Dashboard
    "dashboard.welcome": "Selamat datang kembali",
    "dashboard.overview": "Ringkasan",
    "dashboard.myTicketsTitle": "Tiket Saya",
    "dashboard.historyTitle": "Riwayat Transaksi",
    "dashboard.profileTitle": "Profil Akun",
    "dashboard.referralsTitle": "Program Referral",
    "dashboard.refundsTitle": "Pengajuan Refund",
    "dashboard.scanTitle": "Scan E-Ticket QR",
    "dashboard.eventsTitle": "Kelola Event",
    "dashboard.blogsTitle": "Kelola Blog",
    "dashboard.reportsTitle": "Laporan Penjualan",
    "dashboard.tenantsTitle": "Kelola Promotor",
    "dashboard.approvalsTitle": "Persetujuan Event",

    // Common
    "common.loading": "Memuat...",
    "common.save": "Simpan",
    "common.cancel": "Batal",
    "common.delete": "Hapus",
    "common.edit": "Edit",
    "common.back": "Kembali",
    "common.reset": "Reset",
    "common.previous": "Sebelumnya",
    "common.next": "Berikutnya",
    "common.status": "Status",
    "common.action": "Aksi",
    "common.detail": "Detail",
    "common.success": "Berhasil",
    "common.error": "Terjadi kesalahan",
  },
  en: {
    // Navigation
    "nav.events": "Browse Events",
    "nav.categories": "Categories",
    "nav.cities": "Cities",
    "nav.blog": "Blog",
    "nav.promoter": "Become a Promoter",
    "nav.login": "Log in",
    "nav.register": "Sign up",
    "nav.myTickets": "My Tickets",
    "nav.dashboard": "Dashboard",
    "nav.profile": "My Profile",
    "nav.history": "Transaction History",
    "nav.logout": "Log out",
    "nav.navigation": "TixNova Navigation",

    // Footer
    "footer.description": "Indonesia's modern concert ticketing platform. Discover, buy, and enjoy your favorite concerts easily, safely, and quickly.",
    "footer.platform": "Platform",
    "footer.support": "Support",
    "footer.company": "Company",
    "footer.promoter": "For Promoters",
    "footer.copyright": "All Rights Reserved.",
    "footer.secure": "Safe & Trusted",
    "footer.fast": "Fast Process",
    "footer.madeIn": "Made in Indonesia",

    // Hero & Home
    "hero.badge": "Indonesia's #1 Concert Ticketing Platform",
    "hero.titleBefore": "Discover the",
    "hero.titleHighlight": "Best Concerts",
    "hero.titleAfter": "in Your City",
    "hero.description": "Thousands of concerts, festivals, and events are waiting for you. Buy tickets easily, safely, and get instant e-tickets.",
    "hero.searchPlaceholder": "Search concerts, artists, venues...",
    "hero.allCities": "All Cities",
    "hero.search": "Search Events",
    "hero.popularCategories": "Popular categories:",
    "home.featured": "Featured Events",
    "home.viewAll": "View All",
    "home.upcoming": "Upcoming Events",
    "home.upcomingDescription": "Don't miss exciting events coming soon",
    "home.browseCity": "Browse Events by City",
    "home.browseCityDescription": "Find concerts and shows near you",
    "home.viewAllCities": "View All Cities",
    "home.noFeatured": "There are no featured events right now.",
    "home.noUpcoming": "No upcoming events yet",
    "home.upcomingSoon": "New events will appear here soon",
    "city.events": "Events",
    "city.explore": "Browse Concerts",

    // Events Page
    "events.explore": "Explore Concerts & Events",
    "events.title": "Find Your Favorite Event",
    "events.description": "Buy tickets for concerts, music festivals, entertainment, and the best events across Indonesia.",
    "events.searchPlaceholder": "Search concerts, artists, locations, or venues...",
    "events.filter": "Filter",
    "events.allCategories": "All Categories",
    "events.allCities": "All Cities",
    "events.sortUpcoming": "Upcoming",
    "events.sortDate": "Date: Nearest",
    "events.sortPriceLow": "Price: Low to High",
    "events.sortPriceHigh": "Price: High to Low",
    "events.sortPopular": "Most Popular",

    // Event Detail & Tickets
    "eventDetail.selectTicket": "Select Ticket",
    "eventDetail.seatMap": "Select Seat",
    "eventDetail.about": "About This Event",
    "eventDetail.venueLocation": "Venue Location",
    "eventDetail.terms": "Terms & Conditions",
    "eventDetail.promoter": "Organized by",
    "eventDetail.share": "Share Event",
    "eventDetail.soldOut": "Sold Out",
    "eventDetail.buyNow": "Buy Ticket Now",
    "tickets.category": "Ticket Category",
    "tickets.price": "Price",
    "tickets.quota": "Quota Remaining",
    "tickets.quantity": "Quantity",

    // Seat Map
    "seatmap.selectSeat": "Select Audience Seat",
    "seatmap.stage": "MAIN STAGE",
    "seatmap.available": "Available",
    "seatmap.selected": "Selected",
    "seatmap.booked": "Booked",
    "seatmap.confirm": "Confirm Seat Selection",

    // Blog
    "blog.title": "Blog & Concert News",
    "blog.description": "Latest updates on music, concerts, and ticketing tips.",
    "blog.searchPlaceholder": "Search articles, tips...",
    "blog.readMore": "Read More",
    "blog.recent": "Recent Articles",
    "blog.related": "Related Articles",
    "blog.noArticles": "No articles published yet.",

    // Cities
    "cities.title": "Browse Concerts by City",
    "cities.description": "Find live music and music festivals in your favorite cities.",
    "cities.searchPlaceholder": "Search city name...",
    "cities.exploreConcerts": "Explore Concerts in",

    // Auth Pages
    "auth.loginTitle": "Welcome Back",
    "auth.loginDesc": "Sign in to your TixNova account to access tickets and transactions.",
    "auth.registerTitle": "Create TixNova Account",
    "auth.registerDesc": "Sign up for free to start buying tickets for your favorite concerts.",
    "auth.promoterRegister": "Register as Event Promoter",
    "auth.emailLabel": "Email Address",
    "auth.passwordLabel": "Password",
    "auth.confirmPassword": "Confirm Password",
    "auth.nameLabel": "Full Name",
    "auth.phoneLabel": "WhatsApp / Phone Number",
    "auth.tenantName": "Promoter / Organization Name",
    "auth.forgotPassword": "Forgot password?",
    "auth.loginBtn": "Log In Now",
    "auth.registerBtn": "Sign Up Account",
    "auth.noAccount": "Don't have an account?",
    "auth.hasAccount": "Already have an account?",
    "auth.registerPrompt": "Sign up here",
    "auth.loginPrompt": "Log in here",
    "auth.resetTitle": "Reset Password",
    "auth.resetDesc": "Enter your email address to receive a password reset link.",
    "auth.sendResetLink": "Send Reset Link",

    // Checkout & Payment
    "checkout.title": "Ticket Checkout",
    "checkout.summary": "Order Summary",
    "checkout.customerInfo": "Customer Details",
    "checkout.voucher": "Voucher / Promo Code",
    "checkout.applyVoucher": "Apply Voucher",
    "checkout.totalPayment": "Total Payment",
    "checkout.payNow": "Proceed to Payment",
    "checkout.successTitle": "Payment Successful!",
    "checkout.successDesc": "Your e-tickets are ready and sent to your email.",
    "checkout.viewTickets": "View My Tickets",

    // Dashboard
    "dashboard.welcome": "Welcome back",
    "dashboard.overview": "Overview",
    "dashboard.myTicketsTitle": "My Tickets",
    "dashboard.historyTitle": "Transaction History",
    "dashboard.profileTitle": "Account Profile",
    "dashboard.referralsTitle": "Referral Program",
    "dashboard.refundsTitle": "Refund Requests",
    "dashboard.scanTitle": "Scan E-Ticket QR",
    "dashboard.eventsTitle": "Manage Events",
    "dashboard.blogsTitle": "Manage Blogs",
    "dashboard.reportsTitle": "Sales Reports",
    "dashboard.tenantsTitle": "Manage Promoters",
    "dashboard.approvalsTitle": "Event Approvals",

    // Common
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.back": "Back",
    "common.reset": "Reset",
    "common.previous": "Previous",
    "common.next": "Next",
    "common.status": "Status",
    "common.action": "Action",
    "common.detail": "Detail",
    "common.success": "Success",
    "common.error": "An error occurred",
  },
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const saved = window.localStorage.getItem("tixnova_locale");
      if (saved === "id" || saved === "en") {
        setLocaleState(saved);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem("tixnova_locale", nextLocale);
    document.documentElement.lang = nextLocale;
  };

  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (key: string) => dictionaries[locale][key] || dictionaries.id[key] || key,
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider.");

  return context;
}
