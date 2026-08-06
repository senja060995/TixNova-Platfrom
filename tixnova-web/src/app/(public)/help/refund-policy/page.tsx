import type { Metadata } from "next";
import { RotateCcw, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Kebijakan Refund | TixNova",
  description:
    "Pelajari syarat, ketentuan, dan prosedur pengembalian dana tiket di TixNova.",
};

const eligibleCases = [
  "Event dibatalkan oleh penyelenggara",
  "Event diundur dan pembeli tidak dapat hadir pada tanggal baru",
  "Tiket ganda akibat kesalahan sistem TixNova",
  "Pembayaran berhasil namun tiket tidak terbit",
];

const nonEligibleCases = [
  "Pembeli berubah pikiran atau tidak dapat hadir tanpa alasan force majeure",
  "Tiket yang sudah digunakan / di-scan di venue",
  "Perubahan jadwal event kurang dari 7 hari sebelum acara berlangsung",
  "Pembelian tiket melalui pihak ketiga / calo",
];

const steps = [
  { icon: "1", title: "Ajukan Permohonan", desc: "Login ke akun TixNova, buka menu 'Tiket Saya', pilih pesanan yang ingin direfund, lalu klik 'Ajukan Refund'." },
  { icon: "2", title: "Verifikasi & Review", desc: "Tim TixNova akan memverifikasi permohonanmu dalam 1–3 hari kerja." },
  { icon: "3", title: "Konfirmasi Disetujui", desc: "Kamu akan menerima email konfirmasi jika permohonan refund disetujui." },
  { icon: "4", title: "Proses Pencairan", desc: "Dana akan dikembalikan ke metode pembayaran asli dalam 7–14 hari kerja tergantung kebijakan bank." },
];

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="relative bg-bg-surface border-b border-bg-border py-16 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="container-main relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
            <RotateCcw className="w-4 h-4" />
            Kebijakan Refund
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-text-primary mb-4">
            Kebijakan Pengembalian Dana
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Kami berkomitmen untuk memberikan pengalaman yang adil dan transparan
            bagi setiap pengguna TixNova.
          </p>
        </div>
      </section>

      <div className="section container-main max-w-4xl space-y-12">
        {/* Notice */}
        <div className="flex gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-400 mb-1">Perhatian Penting</p>
            <p className="text-text-secondary text-sm leading-relaxed">
              Kebijakan refund berlaku sesuai dengan ketentuan penyelenggara event.
              TixNova hanya dapat memproses refund berdasarkan kebijakan yang
              disepakati oleh promotor. Biaya layanan tidak dapat dikembalikan.
            </p>
          </div>
        </div>

        {/* Eligible */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-text-primary">Kondisi yang Memenuhi Syarat Refund</h2>
          </div>
          <ul className="space-y-3">
            {eligibleCases.map((item) => (
              <li key={item} className="flex gap-3 text-text-secondary text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Non Eligible */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <XCircle className="w-6 h-6 text-danger" />
            <h2 className="text-xl font-bold text-text-primary">Kondisi yang Tidak Memenuhi Syarat Refund</h2>
          </div>
          <ul className="space-y-3">
            {nonEligibleCases.map((item) => (
              <li key={item} className="flex gap-3 text-text-secondary text-sm">
                <XCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Timeline */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-text-primary">Prosedur Pengajuan Refund</h2>
          </div>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {step.icon}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 bg-bg-border mt-2" />
                  )}
                </div>
                <div className="pb-6">
                  <h3 className="font-semibold text-text-primary">{step.title}</h3>
                  <p className="text-text-secondary text-sm mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeframe */}
        <div className="card bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <h2 className="text-xl font-bold text-text-primary mb-4">Estimasi Waktu Pencairan Dana</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { method: "Transfer Bank", time: "7–14 hari kerja" },
              { method: "GoPay / OVO / Dana", time: "3–7 hari kerja" },
              { method: "Kartu Kredit / Debit", time: "14–21 hari kerja" },
              { method: "ShopeePay", time: "3–7 hari kerja" },
            ].map((item) => (
              <div key={item.method} className="flex justify-between items-center py-3 border-b border-bg-border last:border-0">
                <span className="text-text-secondary text-sm">{item.method}</span>
                <span className="text-text-primary font-medium text-sm">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="text-center p-8 rounded-2xl bg-bg-surface border border-bg-border">
          <p className="text-text-secondary mb-4">
            Ada pertanyaan tentang refund? Hubungi tim support kami.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="mailto:support@tixnova.id" className="btn-secondary">
              Email: support@tixnova.id
            </a>
            <a href="/help" className="btn-primary">
              Pusat Bantuan
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
