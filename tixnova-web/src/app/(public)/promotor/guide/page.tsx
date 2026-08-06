"use client";

import Link from "next/link";
import {
  FileText, PlusCircle, CheckCircle2, ShieldCheck,
  Zap, Ticket, ArrowRight, Image as ImageIcon, Send
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const steps = [
  {
    step: "01",
    title: "Daftar Akun Promotor",
    desc: "Buat akun organisasi promotor secara gratis. Lengkapi nama promotor dan informasi kontak.",
    icon: PlusCircle,
  },
  {
    step: "02",
    title: "Isi Informasi Event & Upload Banner",
    desc: "Masukkan judul konser/event, lokasi venue, tanggal & waktu pelaksanaan, serta banner gambar menarik.",
    icon: ImageIcon,
  },
  {
    step: "03",
    title: "Atur Kategori & Harga Tiket",
    desc: "Tentukan tier tiket (Regular, VIP, Early Bird), kuota tiket, dan harga per kategori sesuai keinginan.",
    icon: Ticket,
  },
  {
    step: "04",
    title: "Submit & Review Admin",
    desc: "Ajukan event Anda untuk direview oleh tim admin TixNova agar tayang di marketplace publik.",
    icon: Send,
  },
  {
    step: "05",
    title: "Mulai Jual & Scan Tiket Venue",
    desc: "Pantau penjualan tiket secara real-time dari Dashboard Promotor dan lakukan gate check-in menggunakan Scanner QR Tiket.",
    icon: Zap,
  },
];

export default function PromotorGuidePage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
          <FileText className="w-4 h-4" /> Panduan Penyelenggara Event
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">Panduan Membuat Event di TixNova</h1>
        <p className="text-text-secondary text-base sm:text-lg max-w-2xl mx-auto">
          Langkah mudah mempublikasikan konser atau acara Anda dan menjual tiket secara resmi di TixNova.
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-6">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="bg-bg-surface border border-bg-border rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-6 hover:border-primary/40 transition-all shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-dark/20 text-primary border border-primary/30 flex items-center justify-center font-black text-xl shrink-0">
                {s.step}
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-accent" />
                  <h3 className="text-xl font-bold text-white">{s.title}</h3>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface border border-primary/30 rounded-3xl p-8 sm:p-12 text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black text-white">Siap Menyelenggarakan Event Anda?</h2>
        <p className="text-text-secondary text-sm max-w-md mx-auto">
          Bergabunglah bersama ratusan promotor di seluruh Indonesia dan nikmati kemudahan penjualan tiket otomatis.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register?role=promotor">
            <Button size="lg" className="bg-primary hover:bg-primary-dark font-extrabold px-8 py-4 text-base rounded-2xl flex items-center gap-2">
              <span>Daftar Promotor Sekarang</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/dashboard/overview">
            <Button size="lg" variant="outline" className="border-bg-border text-white font-bold px-8 py-4 text-base rounded-2xl">
              Buka Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
