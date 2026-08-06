import Link from "next/link";
import type { Metadata } from "next";
import {
  HelpCircle,
  FileText,
  RotateCcw,
  BookOpen,
  MessageCircle,
  Phone,
  Mail,
  ChevronRight,
  Search,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Pusat Bantuan | TixNova",
  description:
    "Temukan jawaban atas pertanyaanmu tentang pembelian tiket, pembayaran, dan layanan TixNova.",
};

const helpCategories = [
  {
    icon: BookOpen,
    title: "Cara Beli Tiket",
    description: "Panduan lengkap membeli tiket dari pencarian hingga pembayaran.",
    href: "/help/how-to-buy",
    color: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    icon: HelpCircle,
    title: "FAQ",
    description: "Pertanyaan yang paling sering ditanyakan oleh pengguna TixNova.",
    href: "/help/faq",
    color: "from-blue-500/20 to-cyan-500/10",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: RotateCcw,
    title: "Kebijakan Refund",
    description: "Ketahui syarat dan proses pengembalian dana tiket kamu.",
    href: "/help/refund-policy",
    color: "from-emerald-500/20 to-teal-500/10",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: FileText,
    title: "Syarat & Ketentuan",
    description: "Baca syarat dan ketentuan penggunaan layanan TixNova.",
    href: "/terms",
    color: "from-amber-500/20 to-orange-500/10",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
  },
];

const contactOptions = [
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Chat langsung dengan tim support kami",
    action: "Mulai Chat",
    href: "#chat",
    available: "Senin–Jumat, 08.00–22.00 WIB",
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Kirim email ke tim support kami",
    action: "support@tixnova.id",
    href: "mailto:support@tixnova.id",
    available: "Respons dalam 1×24 jam",
  },
  {
    icon: Phone,
    title: "WhatsApp",
    description: "Hubungi kami via WhatsApp",
    action: "+62 812-3456-7890",
    href: "https://wa.me/6281234567890",
    available: "Senin–Minggu, 08.00–21.00 WIB",
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="relative overflow-hidden bg-bg-surface border-b border-bg-border py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="container-main relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            Pusat Bantuan
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-text-primary mb-4">
            Ada yang bisa kami bantu?
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto mb-8">
            Temukan jawaban atas pertanyaanmu atau hubungi tim support kami
            yang siap membantu kapan saja.
          </p>
          {/* Search box (UI only) */}
          <div className="max-w-lg mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Cari pertanyaan atau topik bantuan..."
              className="input-field pl-12 text-base"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section container-main">
        <h2 className="text-2xl font-bold text-text-primary mb-8">
          Topik Bantuan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {helpCategories.map((cat) => (
            <Link
              key={cat.title}
              href={cat.href}
              className={`group relative p-6 rounded-2xl border bg-gradient-to-br ${cat.color} ${cat.border} hover:scale-[1.02] transition-all duration-200`}
            >
              <cat.icon className={`w-8 h-8 mb-4 ${cat.iconColor}`} />
              <h3 className="font-semibold text-text-primary mb-1 group-hover:text-primary transition-colors">
                {cat.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {cat.description}
              </p>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="section border-t border-bg-border bg-bg-surface">
        <div className="container-main">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Masih butuh bantuan?
            </h2>
            <p className="text-text-secondary">
              Tim support kami siap membantu kamu.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {contactOptions.map((opt) => (
              <a
                key={opt.title}
                href={opt.href}
                className="card card-hover flex flex-col items-center text-center gap-3 hover:border-primary/30"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <opt.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{opt.title}</h3>
                  <p className="text-text-secondary text-sm mt-0.5">{opt.description}</p>
                  <p className="text-primary font-medium text-sm mt-2">{opt.action}</p>
                  <p className="text-text-muted text-xs mt-1">{opt.available}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
