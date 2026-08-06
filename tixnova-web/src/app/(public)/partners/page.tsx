import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, CheckCircle, TrendingUp, Users, Globe, ArrowRight, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Program Mitra | TixNova",
  description:
    "Bergabunglah sebagai mitra TixNova dan nikmati berbagai keuntungan eksklusif untuk bisnis ticketing Anda.",
};

const partnerTypes = [
  {
    icon: Globe,
    title: "Venue Partner",
    desc: "Tingkatkan pendapatan venue Anda dengan integrasi ticketing langsung ke platform TixNova.",
    benefits: ["Integrasi sistem tiket real-time", "Dashboard venue terpadu", "Laporan penjualan otomatis", "Dukungan tim teknis"],
    color: "from-blue-500/10",
    border: "border-blue-500/20",
    icon_color: "text-blue-400",
    icon_bg: "bg-blue-500/10",
  },
  {
    icon: Users,
    title: "Promotor Event",
    desc: "Jangkau lebih banyak penonton dan kelola penjualan tiket dengan mudah.",
    benefits: ["Penciptaan event mandiri", "Analitik penjualan real-time", "Fitur diskon & promo", "QR Code scanner gratis"],
    color: "from-primary/10",
    border: "border-primary/20",
    icon_color: "text-primary",
    icon_bg: "bg-primary/10",
    highlighted: true,
  },
  {
    icon: Star,
    title: "Affiliate Partner",
    desc: "Dapatkan komisi menarik dari setiap penjualan tiket melalui link referral Anda.",
    benefits: ["Komisi hingga 5% per transaksi", "Dashboard afiliasi personal", "Pembayaran bulanan otomatis", "Materi promosi siap pakai"],
    color: "from-emerald-500/10",
    border: "border-emerald-500/20",
    icon_color: "text-emerald-400",
    icon_bg: "bg-emerald-500/10",
  },
];

const stats = [
  { value: "300+", label: "Mitra Aktif" },
  { value: "Rp 50M+", label: "Komisi Dibayarkan" },
  { value: "98%", label: "Kepuasan Mitra" },
  { value: "24/7", label: "Dukungan Mitra" },
];

const steps = [
  { num: "01", title: "Daftar", desc: "Isi formulir pendaftaran mitra di bawah ini." },
  { num: "02", title: "Verifikasi", desc: "Tim kami akan menghubungi dan memverifikasi data kamu dalam 2–3 hari kerja." },
  { num: "03", title: "Onboarding", desc: "Ikuti sesi onboarding dan dapatkan akses ke dashboard mitra." },
  { num: "04", title: "Mulai Berjualan", desc: "Buat event, jual tiket, dan pantau penjualan secara real-time." },
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="relative bg-bg-surface border-b border-bg-border py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-primary/5 pointer-events-none" />
        <div className="container-main relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
            <Handshake className="w-4 h-4" />
            Program Mitra
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-text-primary mb-6 leading-tight">
            Tumbuh Bersama{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-primary">
              TixNova
            </span>
          </h1>
          <p className="text-text-secondary text-xl max-w-2xl mx-auto leading-relaxed">
            Bergabunglah dengan ratusan mitra TixNova dan manfaatkan platform
            ticketing terpercaya untuk mengembangkan bisnis Anda.
          </p>
        </div>
      </section>

      {/* Stats */}
      <div className="border-b border-bg-border bg-bg-surface">
        <div className="container-main py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-black text-primary">{s.value}</p>
                <p className="text-text-secondary text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Partner Types */}
      <section className="section container-main max-w-5xl">
        <h2 className="text-2xl font-bold text-text-primary text-center mb-10">
          Pilih Jenis Kemitraan
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {partnerTypes.map((type) => (
            <div
              key={type.title}
              className={`relative p-6 rounded-2xl bg-gradient-to-br ${type.color} to-transparent border ${type.border} flex flex-col ${type.highlighted ? "ring-2 ring-primary/40" : ""}`}
            >
              {type.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary rounded-full text-white text-xs font-bold">
                  Paling Populer
                </div>
              )}
              <div className={`w-12 h-12 rounded-xl ${type.icon_bg} flex items-center justify-center mb-4`}>
                <type.icon className={`w-6 h-6 ${type.icon_color}`} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">{type.title}</h3>
              <p className="text-text-secondary text-sm mb-5 leading-relaxed">{type.desc}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {type.benefits.map((b) => (
                  <li key={b} className="flex gap-2 text-sm text-text-secondary">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
              <a href="/contact" className={`btn-${type.highlighted ? "primary" : "secondary"} text-sm text-center`}>
                Daftar Sekarang
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="section border-t border-bg-border bg-bg-surface">
        <div className="container-main max-w-4xl">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-10">
            Cara Bergabung
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-semibold text-text-primary mb-1">{step.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section container-main text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-4">
          Siap Bergabung sebagai Mitra?
        </h2>
        <p className="text-text-secondary mb-8 max-w-md mx-auto">
          Hubungi tim partnership kami dan dapatkan konsultasi gratis.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact" className="btn-primary flex items-center gap-2 justify-center">
            Hubungi Kami <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="mailto:partner@tixnova.id" className="btn-secondary">
            partner@tixnova.id
          </a>
        </div>
      </section>
    </div>
  );
}
