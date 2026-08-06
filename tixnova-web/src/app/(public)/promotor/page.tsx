"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Sparkles,
  Zap,
  ShieldCheck,
  QrCode,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Ticket,
  Users
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

export default function PromotorLandingPage() {
  return (
    <div className="w-full space-y-20 py-12">
      {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4" /> Platform SaaS Promotor Konser #1 Indonesia
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Jual Tiket Konser & Kelola Event <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary-light">Tanpa Biaya Awal</span>
          </h1>

          <p className="text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Dapatkan ekosistem penjualan tiket lengkap: Dashboard analitik penjualan real-time, custom tier tiket, hingga aplikasi scan QR gate venue instan.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register?role=promotor">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary-dark hover:shadow-xl hover:shadow-primary/30 font-extrabold px-8 py-4 text-base rounded-2xl flex items-center gap-2">
                <span>Daftar Promotor Gratis</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>

            <Link href="/login">
              <Button size="lg" variant="outline" className="border-bg-border text-white font-bold px-8 py-4 text-base rounded-2xl">
                Login Promotor
              </Button>
            </Link>
          </div>

          {/* Social Proof Badge */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-xs text-text-muted border-t border-bg-border/60 max-w-3xl mx-auto">
            <span className="flex items-center gap-2 font-semibold text-white">
              <CheckCircle2 className="w-4 h-4 text-success" /> Tanpa Biaya Pendaftaran
            </span>
            <span className="flex items-center gap-2 font-semibold text-white">
              <CheckCircle2 className="w-4 h-4 text-success" /> Gate Check-in Real-Time
            </span>
            <span className="flex items-center gap-2 font-semibold text-white">
              <CheckCircle2 className="w-4 h-4 text-success" /> Laporan Komisi Transparan
            </span>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Segala Yang Anda Butuhkan Untuk Sukseskan Konser</h2>
            <p className="text-text-secondary text-sm">Dirancang khusus untuk Event Organizer profesional dan Promotor independen.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-bg-surface border border-bg-border p-8 rounded-3xl space-y-4 hover:border-primary/40 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Dashboard Analitik Real-Time</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Pantau grafik penjualan tiket, total pendapatan GMV, dan data demografi pembeli secara langsung dari layar HP atau laptop Anda.
              </p>
            </div>

            <div className="bg-bg-surface border border-bg-border p-8 rounded-3xl space-y-4 hover:border-primary/40 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 text-accent flex items-center justify-center border border-accent/30">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Aplikasi Venue Gate Scanner</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Petugas gate pintu masuk venue dapat melakukan pemindaian QR Code tiket dengan kecepatan &lt; 1 detik, lengkap dengan sistem penangkal tiket duplikat.
              </p>
            </div>

            <div className="bg-bg-surface border border-bg-border p-8 rounded-3xl space-y-4 hover:border-primary/40 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-success/20 text-success flex items-center justify-center border border-success/30">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Fleksibilitas Tier & Kode Promo</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Buat kategori tiket VIP, Regular, Early Bird, Presale, dan terapkan voucher diskon khusus untuk meningkatkan antusiasme penjualan.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Banner Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary-dark via-bg-surface to-bg-surface border border-primary/30 rounded-3xl p-8 sm:p-14 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
            <div className="space-y-3 max-w-xl z-10">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Siap Menggelar Konser Impian?</span>
              <h2 className="text-3xl font-black text-white">Bergabunglah Bersama Puluhan Promotor Ternama</h2>
              <p className="text-text-secondary text-sm">Proses pendaftaran cepat kurang dari 2 menit. Tim TixNova siap membantu kesuksesan event Anda.</p>
            </div>

            <div className="shrink-0 z-10">
              <Link href="/register?role=promotor">
                <Button size="lg" className="bg-primary hover:bg-primary-dark font-extrabold px-8 py-4 text-base rounded-2xl shadow-lg shadow-primary/30">
                  Mulai Sekarang Gratis
                </Button>
              </Link>
            </div>
          </div>
        </section>
    </div>
  );
}
