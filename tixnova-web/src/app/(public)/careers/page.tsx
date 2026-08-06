import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, MapPin, Clock, ArrowRight, Users, Zap, Heart, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Karir | TixNova",
  description:
    "Bergabunglah bersama tim TixNova dan bantu kami menghubungkan jutaan penggemar dengan event terbaik di Indonesia.",
};

const perks = [
  { icon: Zap, title: "Tumbuh Bersama", desc: "Belajar dari engineer & product manager terbaik dan grow secara profesional." },
  { icon: Heart, title: "Budaya Positif", desc: "Lingkungan kerja yang suportif, inklusif, dan berorientasi pada hasil." },
  { icon: Globe, title: "Remote-Friendly", desc: "Fleksibilitas bekerja dari mana saja di seluruh Indonesia." },
  { icon: Users, title: "Tim Solid", desc: "Bergabung dengan tim yang passionate terhadap music & live entertainment." },
];

const openings = [
  {
    title: "Frontend Engineer (React/Next.js)",
    dept: "Engineering",
    type: "Full-time",
    location: "Jakarta / Remote",
    level: "Mid – Senior",
  },
  {
    title: "Backend Engineer (Laravel/Node.js)",
    dept: "Engineering",
    type: "Full-time",
    location: "Jakarta / Remote",
    level: "Mid – Senior",
  },
  {
    title: "Product Designer (UI/UX)",
    dept: "Product",
    type: "Full-time",
    location: "Jakarta / Hybrid",
    level: "Mid Level",
  },
  {
    title: "Digital Marketing Specialist",
    dept: "Marketing",
    type: "Full-time",
    location: "Jakarta",
    level: "Junior – Mid",
  },
  {
    title: "Customer Support Lead",
    dept: "Operations",
    type: "Full-time",
    location: "Jakarta",
    level: "Mid Level",
  },
  {
    title: "Partnership & Business Development",
    dept: "Business",
    type: "Full-time",
    location: "Jakarta",
    level: "Mid – Senior",
  },
];

const deptColors: Record<string, string> = {
  Engineering: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Product: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Marketing: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Operations: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Business: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="relative bg-bg-surface border-b border-bg-border py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-emerald-500/5 pointer-events-none" />
        <div className="container-main relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Briefcase className="w-4 h-4" />
            Karir di TixNova
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-text-primary mb-6 leading-tight">
            Bangun Masa Depan{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">
              Hiburan Digital
            </span>{" "}
            Bersama Kami
          </h1>
          <p className="text-text-secondary text-xl max-w-2xl mx-auto leading-relaxed">
            Bergabunglah dengan tim yang passionate dan berdedikasi untuk
            memberikan pengalaman ticketing terbaik bagi jutaan penggemar Indonesia.
          </p>
        </div>
      </section>

      {/* Perks */}
      <section className="section container-main max-w-4xl">
        <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
          Mengapa Bergabung dengan TixNova?
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {perks.map((perk) => (
            <div key={perk.title} className="card text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <perk.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-text-primary mb-1">{perk.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{perk.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Open Positions */}
      <section className="section border-t border-bg-border bg-bg-surface">
        <div className="container-main max-w-4xl">
          <h2 className="text-2xl font-bold text-text-primary mb-8">
            Posisi yang Tersedia ({openings.length})
          </h2>
          <div className="space-y-4">
            {openings.map((job) => (
              <div
                key={job.title}
                className="card group flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-primary/30 hover:scale-[1.01] transition-all"
              >
                <div>
                  <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className={`badge border ${deptColors[job.dept]}`}>
                      {job.dept}
                    </span>
                    <span className="flex items-center gap-1 text-text-muted text-xs">
                      <MapPin className="w-3 h-3" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1 text-text-muted text-xs">
                      <Clock className="w-3 h-3" /> {job.type}
                    </span>
                    <span className="text-text-muted text-xs">{job.level}</span>
                  </div>
                </div>
                <Link
                  href={`/careers/${job.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  className="btn-outline text-sm shrink-0 flex items-center gap-2 group-hover:bg-primary group-hover:text-white group-hover:border-primary"
                >
                  Lamar <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>

          {/* Spontaneous */}
          <div className="mt-10 p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 text-center">
            <h3 className="text-xl font-bold text-text-primary mb-2">
              Tidak menemukan posisi yang cocok?
            </h3>
            <p className="text-text-secondary mb-6">
              Kirimkan CV dan portofoliomu. Kami selalu terbuka untuk talenta luar biasa.
            </p>
            <a href="mailto:careers@tixnova.id" className="btn-primary inline-flex items-center gap-2">
              Kirim CV ke careers@tixnova.id
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
