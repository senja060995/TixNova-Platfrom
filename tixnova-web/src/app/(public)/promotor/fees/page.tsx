"use client";

import Link from "next/link";
import {
  DollarSign, Percent, ShieldCheck, Zap,
  CheckCircle2, ArrowRight, Building2, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const features = [
  "Bebas Biaya Pendaftaran & Pemasangan Event",
  "Biaya Komisi Transparan (Dipotong Otomatis Saat Penjualan Lunas)",
  "Termasuk Integrasi Payment Gateway (QRIS, VA, E-Wallet, Kartu Kredit)",
  "Sistem E-Ticket QR Code Otomatis Terkirim ke Pembeli",
  "Aplikasi Gate Check-in Real-Time Gratis",
  "Pencairan Diteruskan Langsung ke Rekening Promotor",
];

export default function PromotorFeesPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-bold uppercase tracking-wider">
          <Percent className="w-4 h-4" /> Skema Komisi & Transparansi Biaya
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">Struktur Komisi Promotor TixNova</h1>
        <p className="text-text-secondary text-base sm:text-lg max-w-2xl mx-auto">
          Tanpa biaya langganan bulanan. Anda hanya membayar komisi platform kecil untuk setiap tiket yang berhasil terjual.
        </p>
      </div>

      {/* Pricing Card */}
      <div className="bg-bg-surface border-2 border-primary/40 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-bg-border pb-8">
          <div>
            <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Komisi Platform Standar</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl sm:text-6xl font-black text-white">5%</span>
              <span className="text-text-secondary text-sm font-semibold">/ tiket terjual</span>
            </div>
            <p className="text-xs text-text-muted mt-1">* Komisi khusus dapat disesuaikan untuk skala event besar.</p>
          </div>
          <Link href="/register?role=promotor">
            <Button size="lg" className="bg-primary hover:bg-primary-dark font-extrabold px-8 py-4 text-base rounded-2xl flex items-center gap-2">
              <span>Mulai Buat Event</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Feature Checkmarks */}
        <div className="space-y-4">
          <h3 className="font-bold text-white text-lg">Semua Layanan Sudah Termasuk:</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feat) => (
              <div key={feat} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <span className="text-text-secondary text-sm font-medium">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Simulation Box */}
      <div className="bg-bg-surface border border-bg-border rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="font-bold text-white text-lg flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" /> Ilustrasi Perhitungan
        </h3>
        <div className="p-4 rounded-2xl bg-bg-elevated/60 border border-bg-border space-y-2 text-sm text-text-secondary">
          <div className="flex justify-between">
            <span>Harga Tiket Regulasi:</span>
            <span className="font-bold text-white">Rp 200.000</span>
          </div>
          <div className="flex justify-between">
            <span>Komisi Platform TixNova (5%):</span>
            <span className="font-bold text-accent">- Rp 10.000</span>
          </div>
          <div className="flex justify-between border-t border-bg-border pt-2 font-bold text-white text-base">
            <span>Pendapatan Bersih Promotor:</span>
            <span className="text-success">Rp 190.000 / tiket</span>
          </div>
        </div>
      </div>

      {/* FAQ Link */}
      <div className="text-center space-y-3">
        <p className="text-text-secondary text-sm">
          Punya pertanyaan seputar pencairan dana atau komisi event khusus?
        </p>
        <Link href="/contact" className="inline-flex items-center gap-2 text-primary hover:underline font-bold text-sm">
          <HelpCircle className="w-4 h-4" /> Hubungi Tim TixNova
        </Link>
      </div>
    </div>
  );
}
