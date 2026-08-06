import type { Metadata } from "next";
import { HelpCircle, ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ – Pertanyaan yang Sering Ditanyakan | TixNova",
  description:
    "Temukan jawaban atas pertanyaan umum tentang pembelian tiket, pembayaran, pengiriman e-tiket, dan layanan TixNova.",
};

const faqs = [
  {
    category: "Pembelian Tiket",
    items: [
      {
        q: "Bagaimana cara membeli tiket di TixNova?",
        a: "Pilih event yang ingin kamu hadiri, pilih kategori tiket dan jumlah, lalu klik 'Beli Tiket'. Kamu akan diarahkan ke halaman checkout untuk memilih metode pembayaran.",
      },
      {
        q: "Apakah saya perlu membuat akun untuk membeli tiket?",
        a: "Ya, kamu perlu membuat akun TixNova untuk membeli tiket. Ini diperlukan agar e-tiketmu tersimpan dengan aman dan mudah diakses kapan saja.",
      },
      {
        q: "Berapa lama batas waktu pembayaran setelah checkout?",
        a: "Kamu memiliki waktu 60 menit untuk menyelesaikan pembayaran sejak melakukan checkout. Jika melewati batas waktu tersebut, pesananmu akan otomatis dibatalkan.",
      },
      {
        q: "Bisakah saya membeli tiket untuk orang lain?",
        a: "Bisa. Saat mengisi data pesanan, masukkan nama pemegang tiket yang sesuai. Pastikan nama yang tertulis sesuai dengan identitas yang akan dibawa ke venue.",
      },
    ],
  },
  {
    category: "Pembayaran",
    items: [
      {
        q: "Metode pembayaran apa saja yang tersedia?",
        a: "TixNova menerima berbagai metode pembayaran: Transfer Bank (BCA, Mandiri, BNI, BRI), QRIS, GoPay, OVO, Dana, ShopeePay, dan kartu kredit/debit Visa/Mastercard.",
      },
      {
        q: "Apakah ada biaya layanan tambahan?",
        a: "Ya, terdapat biaya layanan yang bervariasi tergantung nilai transaksi. Biaya ini akan ditampilkan secara transparan di halaman checkout sebelum kamu melakukan pembayaran.",
      },
      {
        q: "Pembayaran saya berhasil tapi tiket belum diterima, apa yang harus dilakukan?",
        a: "Coba cek folder spam/junk di emailmu terlebih dahulu. Jika tetap tidak ada, hubungi tim support kami via Live Chat atau WhatsApp dengan menyertakan bukti pembayaran.",
      },
    ],
  },
  {
    category: "E-Tiket & Venue",
    items: [
      {
        q: "Di mana saya bisa menemukan e-tiket saya?",
        a: "E-tiket akan dikirimkan ke email yang terdaftar dan juga bisa diakses melalui menu 'Tiket Saya' di dashboard akun TixNova kamu.",
      },
      {
        q: "Apakah e-tiket bisa digunakan langsung dari smartphone?",
        a: "Ya, kamu bisa menunjukkan e-tiket dalam bentuk QR Code langsung dari smartphone. Tidak perlu mencetak, cukup tunjukkan layar ponselmu kepada petugas.",
      },
      {
        q: "Apa yang harus saya bawa ke venue?",
        a: "Siapkan e-tiket (QR Code) dan identitas diri (KTP/SIM/Paspor) yang sesuai dengan nama pada tiket. Beberapa event mungkin memiliki persyaratan tambahan.",
      },
    ],
  },
  {
    category: "Akun & Keamanan",
    items: [
      {
        q: "Lupa password, bagaimana cara reset?",
        a: "Klik 'Lupa Password' di halaman login, masukkan emailmu, lalu ikuti instruksi yang dikirimkan ke emailmu untuk membuat password baru.",
      },
      {
        q: "Apakah data pribadi saya aman?",
        a: "Ya. TixNova menggunakan enkripsi SSL 256-bit untuk melindungi seluruh data transaksi dan data pribadimu. Kami tidak pernah menjual data pengguna kepada pihak ketiga.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="relative bg-bg-surface border-b border-bg-border py-16 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="container-main relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            FAQ
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-text-primary mb-4">
            Pertanyaan yang Sering Ditanyakan
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Jawaban cepat untuk pertanyaan umum seputar layanan TixNova.
          </p>
        </div>
      </section>

      {/* FAQ List */}
      <section className="section container-main max-w-3xl">
        <div className="space-y-12">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-xl font-bold text-primary mb-5 border-b border-bg-border pb-3">
                {section.category}
              </h2>
              <div className="space-y-4">
                {section.items.map((item) => (
                  <details
                    key={item.q}
                    className="group card cursor-pointer open:border-primary/30"
                  >
                    <summary className="flex items-start justify-between gap-4 list-none">
                      <span className="font-medium text-text-primary group-open:text-primary transition-colors">
                        {item.q}
                      </span>
                      <ChevronDown className="w-5 h-5 text-text-muted shrink-0 mt-0.5 group-open:rotate-180 transition-transform duration-200" />
                    </summary>
                    <p className="mt-4 text-text-secondary text-sm leading-relaxed">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-center">
          <h3 className="text-xl font-bold text-text-primary mb-2">
            Masih ada pertanyaan?
          </h3>
          <p className="text-text-secondary mb-6">
            Hubungi tim support kami yang siap membantu kapan saja.
          </p>
          <a href="/contact" className="btn-primary inline-block">
            Hubungi Kami
          </a>
        </div>
      </section>
    </div>
  );
}
