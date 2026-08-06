import type { Metadata } from "next";
import { Newspaper, Download, Mail, Phone, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Ruang Media | TixNova",
  description:
    "Temukan siaran pers, kit media, dan berita terbaru tentang TixNova untuk kebutuhan liputan media Anda.",
};

const pressReleases = [
  {
    date: "10 Juli 2026",
    title: "TixNova Raih Pendanaan Seri A sebesar Rp 50 Miliar",
    summary:
      "TixNova mengumumkan keberhasilan meraih pendanaan Seri A untuk memperluas jangkauan ke lebih banyak kota dan mengembangkan fitur baru.",
    tag: "Investasi",
  },
  {
    date: "15 Juni 2026",
    title: "TixNova Catat 500.000 Tiket Terjual di Semester Pertama 2026",
    summary:
      "Platform ticketing digital TixNova mencatat milestone 500 ribu tiket terjual sejak awal tahun 2026, meningkat 300% dibanding periode yang sama tahun lalu.",
    tag: "Milestone",
  },
  {
    date: "1 Mei 2026",
    title: "TixNova Luncurkan Fitur Kursi Interaktif untuk Venue Besar",
    summary:
      "Pengguna kini dapat memilih kursi secara visual dan real-time melalui denah venue interaktif yang terintegrasi langsung di platform TixNova.",
    tag: "Produk",
  },
  {
    date: "20 Maret 2026",
    title: "Kemitraan TixNova dengan 3 Venue Utama Jakarta",
    summary:
      "TixNova resmi menjadi partner eksklusif ticketing untuk Jakarta International Expo, Istora Senayan, dan Balai Sidang Jakarta.",
    tag: "Kemitraan",
  },
];

const tagColors: Record<string, string> = {
  Investasi: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Milestone: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Produk: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Kemitraan: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function PressPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="relative bg-bg-surface border-b border-bg-border py-16 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="container-main relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <Newspaper className="w-4 h-4" />
            Ruang Media
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-text-primary mb-4">
            TixNova di Media
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Temukan siaran pers, materi media, dan informasi terbaru tentang
            TixNova untuk kebutuhan liputan Anda.
          </p>
        </div>
      </section>

      <div className="section container-main max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Press Releases */}
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-xl font-bold text-text-primary mb-6">Siaran Pers Terbaru</h2>
            {pressReleases.map((pr) => (
              <article key={pr.title} className="card group cursor-pointer hover:border-primary/30 hover:scale-[1.01] transition-all">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <span className={`badge border ${tagColors[pr.tag]}`}>{pr.tag}</span>
                  <span className="text-text-muted text-xs shrink-0">{pr.date}</span>
                </div>
                <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors mb-2">
                  {pr.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">{pr.summary}</p>
                <div className="flex items-center gap-1 mt-4 text-primary text-sm font-medium">
                  Baca selengkapnya <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </article>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Media Kit */}
            <div className="card bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <h3 className="font-bold text-text-primary mb-3">Media Kit</h3>
              <p className="text-text-secondary text-sm mb-4">
                Unduh logo, panduan merek, dan aset visual TixNova dalam resolusi tinggi.
              </p>
              <button className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                <Download className="w-4 h-4" />
                Unduh Media Kit
              </button>
            </div>

            {/* Press Contact */}
            <div className="card">
              <h3 className="font-bold text-text-primary mb-3">Kontak Media</h3>
              <p className="text-text-secondary text-sm mb-4">
                Untuk pertanyaan dari media atau wawancara, hubungi tim PR kami.
              </p>
              <div className="space-y-3">
                <a href="mailto:press@tixnova.id" className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors">
                  <Mail className="w-4 h-4 text-primary" />
                  press@tixnova.id
                </a>
                <a href="tel:+6221123456" className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors">
                  <Phone className="w-4 h-4 text-primary" />
                  +62 21 1234 5678
                </a>
              </div>
            </div>

            {/* Stats */}
            <div className="card">
              <h3 className="font-bold text-text-primary mb-4">TixNova dalam Angka</h3>
              <div className="space-y-3">
                {[
                  { label: "Pengguna Aktif", value: "250K+" },
                  { label: "Tiket Terjual", value: "500K+" },
                  { label: "Event per Bulan", value: "100+" },
                  { label: "Kota Terjangkau", value: "34" },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center border-b border-bg-border pb-2 last:border-0 last:pb-0">
                    <span className="text-text-secondary text-sm">{s.label}</span>
                    <span className="text-primary font-bold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
