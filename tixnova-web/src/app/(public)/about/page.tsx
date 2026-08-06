import type { Metadata } from "next";
import Link from "next/link";
import {
  Target,
  Eye,
  Heart,
  Users,
  Ticket,
  Globe,
  TrendingUp,
  Star,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Tentang Kami | TixNova",
  description:
    "Kenali TixNova — platform ticketing konser modern Indonesia yang menghubungkan jutaan penggemar musik dengan event terbaik.",
};

const stats = [
  { value: "500K+", label: "Tiket Terjual" },
  { value: "1.200+", label: "Event Sukses" },
  { value: "300+", label: "Promotor Mitra" },
  { value: "34", label: "Kota di Indonesia" },
];

const values = [
  {
    icon: Heart,
    title: "Pengguna di Atas Segalanya",
    desc: "Setiap keputusan yang kami buat berpusat pada pengalaman terbaik bagi pengguna.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    icon: Star,
    title: "Transparansi",
    desc: "Kami percaya pada kejujuran — tidak ada biaya tersembunyi, tidak ada janji palsu.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Globe,
    title: "Inklusif",
    desc: "Kami membangun untuk semua — dari penggemar K-Pop hingga pecinta jazz lokal.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: TrendingUp,
    title: "Inovasi Berkelanjutan",
    desc: "Kami terus berinovasi untuk memberikan solusi ticketing yang lebih baik setiap harinya.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
];

const team = [
  { name: "Budi Santoso", role: "CEO & Co-Founder", initial: "BS" },
  { name: "Dewi Rahayu", role: "CTO & Co-Founder", initial: "DR" },
  { name: "Andi Prasetyo", role: "CPO", initial: "AP" },
  { name: "Sari Wulandari", role: "CMO", initial: "SW" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="relative bg-bg-surface border-b border-bg-border py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/5 pointer-events-none" />
        <div className="container-main relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Users className="w-4 h-4" />
            Tentang Kami
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-text-primary mb-6 leading-tight">
            Menghubungkan Jutaan{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">
              Penggemar
            </span>{" "}
            dengan Event Impian
          </h1>
          <p className="text-text-secondary text-xl max-w-2xl mx-auto leading-relaxed">
            TixNova lahir dari semangat untuk membuat pengalaman membeli tiket
            konser menjadi semudah, seaman, dan semenyenangkan pengalaman
            konsernya sendiri.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-bg-border bg-bg-surface">
        <div className="container-main py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl lg:text-4xl font-black text-primary">{stat.value}</p>
                <p className="text-text-secondary text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="section container-main max-w-4xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black text-text-primary mb-4">Cerita Kami</h2>
            <div className="space-y-4 text-text-secondary leading-relaxed">
              <p>
                Pada tahun 2023, tim pendiri TixNova mengalami frustrasi yang sama:
                antrean panjang untuk membeli tiket konser, sistem yang crash saat
                tiket rilis, dan biaya tersembunyi yang tidak transparan.
              </p>
              <p>
                Dari frustrasi itu lahirlah TixNova — platform ticketing yang
                dirancang dengan teknologi mutakhir, antarmuka yang intuitif, dan
                komitmen penuh pada kepuasan pengguna.
              </p>
              <p>
                Hari ini, TixNova melayani ratusan ribu penggemar musik di seluruh
                Indonesia dan menjadi mitra terpercaya ratusan promotor dan
                penyelenggara event profesional.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="card bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <Ticket className="w-8 h-8 text-primary mb-3" />
              <p className="font-bold text-text-primary">Berdiri 2023</p>
              <p className="text-text-muted text-sm">Jakarta, Indonesia</p>
            </div>
            <div className="card bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
              <Users className="w-8 h-8 text-accent mb-3" />
              <p className="font-bold text-text-primary">Tim 50+ Orang</p>
              <p className="text-text-muted text-sm">Full-time & Remote</p>
            </div>
            <div className="card bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
              <Globe className="w-8 h-8 text-emerald-400 mb-3" />
              <p className="font-bold text-text-primary">34 Kota</p>
              <p className="text-text-muted text-sm">Seluruh Indonesia</p>
            </div>
            <div className="card bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
              <TrendingUp className="w-8 h-8 text-blue-400 mb-3" />
              <p className="font-bold text-text-primary">Tumbuh 300%</p>
              <p className="text-text-muted text-sm">Tahun ke tahun</p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Mission */}
      <section className="section bg-bg-surface border-y border-bg-border">
        <div className="container-main max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
              <Target className="w-10 h-10 text-primary mb-4" />
              <h2 className="text-2xl font-bold text-text-primary mb-3">Misi Kami</h2>
              <p className="text-text-secondary leading-relaxed">
                Menjadi platform ticketing terpercaya dan termudah di Indonesia,
                yang menghubungkan penggemar dengan pengalaman live entertainment
                terbaik tanpa hambatan.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
              <Eye className="w-10 h-10 text-accent mb-4" />
              <h2 className="text-2xl font-bold text-text-primary mb-3">Visi Kami</h2>
              <p className="text-text-secondary leading-relaxed">
                Membangun ekosistem live entertainment digital yang inklusif,
                di mana setiap orang di seluruh penjuru Indonesia dapat mengakses
                dan menikmati event favorit mereka.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section container-main max-w-4xl">
        <h2 className="text-3xl font-black text-text-primary text-center mb-10">
          Nilai-Nilai Kami
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {values.map((val) => (
            <div key={val.title} className="card flex gap-4">
              <div className={`w-12 h-12 rounded-xl ${val.bg} flex items-center justify-center shrink-0`}>
                <val.icon className={`w-6 h-6 ${val.color}`} />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary mb-1">{val.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{val.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="section border-t border-bg-border bg-bg-surface">
        <div className="container-main max-w-4xl">
          <h2 className="text-3xl font-black text-text-primary text-center mb-10">
            Tim Pendiri
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div key={member.name} className="card text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white font-black text-xl mx-auto mb-4">
                  {member.initial}
                </div>
                <p className="font-semibold text-text-primary">{member.name}</p>
                <p className="text-text-secondary text-sm mt-0.5">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section container-main text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-4">
          Bergabunglah bersama kami
        </h2>
        <p className="text-text-secondary mb-8 max-w-md mx-auto">
          Tertarik menjadi bagian dari tim TixNova atau bermitra dengan kami?
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/careers" className="btn-primary">Lihat Lowongan</Link>
          <Link href="/partners" className="btn-secondary">Jadi Mitra</Link>
        </div>
      </section>
    </div>
  );
}
