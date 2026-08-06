import type { Metadata } from "next";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | TixNova",
  description:
    "Pelajari bagaimana TixNova mengumpulkan, menggunakan, dan melindungi data pribadi Anda.",
};

const sections = [
  {
    title: "1. Data yang Kami Kumpulkan",
    content: `Kami mengumpulkan informasi berikut saat Anda menggunakan Platform TixNova:

Data Identitas: Nama lengkap, alamat email, nomor telepon, dan tanggal lahir yang Anda berikan saat mendaftar.

Data Transaksi: Riwayat pembelian tiket, metode pembayaran (disimpan dalam bentuk terenkripsi), dan informasi pesanan.

Data Teknis: Alamat IP, jenis browser, perangkat yang digunakan, dan data log akses untuk keperluan keamanan.

Data Penggunaan: Halaman yang dikunjungi, fitur yang digunakan, dan preferensi Anda di platform.`,
  },
  {
    title: "2. Bagaimana Kami Menggunakan Data Anda",
    content: `Data yang kami kumpulkan digunakan untuk:

• Memproses pembelian tiket dan mengirimkan e-tiket ke email Anda
• Mengelola akun dan memberikan layanan customer support
• Mengirimkan notifikasi penting terkait pesanan dan event
• Meningkatkan layanan dan pengalaman pengguna melalui analisis data
• Mematuhi kewajiban hukum dan mencegah aktivitas penipuan
• Mengirimkan penawaran dan informasi event (hanya jika Anda menyetujuinya)`,
  },
  {
    title: "3. Berbagi Data dengan Pihak Ketiga",
    content: `TixNova TIDAK menjual data pribadi Anda kepada pihak ketiga. Kami hanya berbagi data dalam kondisi terbatas:

Penyelenggara Event: Nama dan data kontak Anda dibagikan kepada penyelenggara event yang tiketnya Anda beli, untuk keperluan verifikasi kehadiran.

Mitra Pembayaran: Data transaksi dibagikan kepada payment gateway yang kami gunakan, sesuai standar PCI DSS.

Penegak Hukum: Jika diwajibkan oleh hukum yang berlaku atau perintah pengadilan.`,
  },
  {
    title: "4. Keamanan Data",
    content: `Kami mengimplementasikan langkah-langkah keamanan yang komprehensif:

• Enkripsi SSL/TLS 256-bit untuk semua transmisi data
• Enkripsi data sensitif saat disimpan di database
• Sistem deteksi intrusi dan pemantauan keamanan 24/7
• Pembatasan akses data hanya untuk karyawan yang membutuhkan
• Audit keamanan berkala oleh pihak ketiga independen`,
  },
  {
    title: "5. Cookie dan Teknologi Pelacakan",
    content: `Kami menggunakan cookie dan teknologi serupa untuk:

• Mengingat preferensi dan sesi login Anda
• Menganalisis penggunaan platform (melalui layanan analitik anonim)
• Menyajikan konten yang relevan

Anda dapat mengatur preferensi cookie melalui pengaturan browser Anda. Menonaktifkan cookie tertentu mungkin mempengaruhi fungsionalitas Platform.`,
  },
  {
    title: "6. Hak-Hak Anda",
    content: `Sebagai pengguna TixNova, Anda memiliki hak untuk:

• Mengakses: Meminta salinan data pribadi yang kami miliki tentang Anda
• Perbaikan: Meminta koreksi data yang tidak akurat
• Penghapusan: Meminta penghapusan data Anda (dengan batasan tertentu)
• Keberatan: Menolak pemrosesan data untuk tujuan pemasaran langsung
• Portabilitas: Menerima data Anda dalam format yang dapat dibaca mesin

Untuk menggunakan hak-hak ini, hubungi kami di privacy@tixnova.id`,
  },
  {
    title: "7. Retensi Data",
    content: `Kami menyimpan data Anda selama akun Anda aktif dan selama diperlukan untuk memenuhi tujuan yang dijelaskan dalam kebijakan ini. Data transaksi disimpan selama minimal 5 tahun sesuai ketentuan hukum perpajakan Indonesia.

Setelah akun dihapus, data Anda akan dianonimkan dalam waktu 30 hari, kecuali jika penyimpanan lebih lama diwajibkan oleh hukum.`,
  },
  {
    title: "8. Perubahan Kebijakan Privasi",
    content: `Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan signifikan akan diinformasikan melalui email atau notifikasi di Platform minimal 30 hari sebelum berlaku. Penggunaan Platform secara terus-menerus setelah perubahan berlaku dianggap sebagai penerimaan terhadap kebijakan yang diperbarui.`,
  },
];

export default function PrivacyPage() {
  const lastUpdated = "1 Juli 2026";

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="relative bg-bg-surface border-b border-bg-border py-16 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="container-main relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Privasi
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-text-primary mb-4">
            Kebijakan Privasi
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Privasi Anda adalah prioritas kami. Pelajari bagaimana kami
            mengumpulkan, menggunakan, dan melindungi data Anda.
          </p>
          <p className="text-text-muted text-sm mt-4">
            Terakhir diperbarui: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <div className="border-b border-bg-border bg-bg-surface">
        <div className="container-main py-6">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-text-secondary">
            {["Enkripsi SSL 256-bit", "Tidak Menjual Data", "Patuhi UU PDP Indonesia", "Audit Keamanan Berkala"].map((badge) => (
              <span key={badge} className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="section container-main max-w-3xl">
        <div className="space-y-10">
          {sections.map((sec) => (
            <div key={sec.title}>
              <h2 className="text-lg font-bold text-text-primary mb-3">{sec.title}</h2>
              <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">
                {sec.content}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-bg-surface border border-bg-border text-center">
          <p className="text-text-secondary text-sm">
            Pertanyaan tentang privasi data Anda?{" "}
            <a href="mailto:privacy@tixnova.id" className="text-primary hover:underline">
              privacy@tixnova.id
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
