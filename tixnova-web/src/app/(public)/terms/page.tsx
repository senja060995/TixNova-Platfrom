import type { Metadata } from "next";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | TixNova",
  description:
    "Baca syarat dan ketentuan penggunaan platform TixNova sebelum menggunakan layanan kami.",
};

const sections = [
  {
    title: "1. Ketentuan Umum",
    content: `Dengan mengakses dan menggunakan platform TixNova (selanjutnya disebut "Platform"), Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan ketentuan ini, harap berhenti menggunakan Platform kami.

TixNova adalah platform ticketing digital yang dikelola oleh PT Ragam Manfaat Sinergi, sebuah perusahaan yang terdaftar dan beroperasi sesuai dengan hukum yang berlaku di Republik Indonesia.`,
  },
  {
    title: "2. Pendaftaran Akun",
    content: `Untuk menggunakan fitur pembelian tiket, Anda diharuskan mendaftar dan membuat akun. Anda wajib memberikan informasi yang akurat, lengkap, dan terkini saat pendaftaran.

Anda bertanggung jawab penuh atas kerahasiaan kata sandi akun Anda dan seluruh aktivitas yang terjadi melalui akun tersebut. TixNova tidak bertanggung jawab atas kerugian yang timbul akibat penggunaan akun Anda oleh pihak lain.`,
  },
  {
    title: "3. Pembelian Tiket",
    content: `Pembelian tiket dianggap sah setelah pembayaran dikonfirmasi oleh sistem TixNova. E-tiket akan dikirimkan ke alamat email yang terdaftar.

Tiket bersifat non-transferable dan hanya dapat digunakan oleh pemegang tiket yang namanya tertera kecuali dinyatakan lain oleh penyelenggara. TixNova berhak membatalkan tiket yang diperoleh melalui cara yang tidak sah.`,
  },
  {
    title: "4. Pembayaran dan Biaya",
    content: `Harga tiket yang tertera adalah harga final termasuk biaya layanan (service fee) yang ditampilkan secara transparan di halaman checkout. Biaya layanan tidak dapat dikembalikan dalam kondisi apapun.

Seluruh transaksi dilakukan dalam mata uang Rupiah (IDR). TixNova menggunakan sistem pembayaran yang telah tersertifikasi PCI DSS untuk keamanan transaksi Anda.`,
  },
  {
    title: "5. Pembatalan dan Refund",
    content: `Kebijakan pembatalan dan refund tiket mengikuti ketentuan yang berlaku. Refund hanya dapat diproses dalam kondisi-kondisi tertentu sebagaimana tercantum dalam Kebijakan Refund kami.

TixNova tidak bertanggung jawab atas kerugian yang timbul akibat pembatalan atau perubahan event oleh penyelenggara. Kami akan berupaya semaksimal mungkin untuk memfasilitasi proses refund sesuai kebijakan penyelenggara.`,
  },
  {
    title: "6. Larangan Penggunaan",
    content: `Pengguna dilarang untuk:
• Menggunakan Platform untuk tujuan yang melanggar hukum
• Membeli tiket menggunakan data kartu kredit/debit orang lain tanpa izin
• Menjual kembali tiket di atas harga nominal (scalping)
• Menggunakan bot atau program otomatis untuk membeli tiket
• Menyebarkan informasi palsu atau menyesatkan melalui Platform`,
  },
  {
    title: "7. Kekayaan Intelektual",
    content: `Seluruh konten pada Platform TixNova, termasuk namun tidak terbatas pada logo, desain, teks, grafik, dan perangkat lunak, adalah milik TixNova dan dilindungi oleh hukum hak cipta Indonesia.

Penggunaan konten Platform tanpa izin tertulis dari TixNova dilarang keras dan dapat mengakibatkan tuntutan hukum.`,
  },
  {
    title: "8. Perubahan Ketentuan",
    content: `TixNova berhak mengubah Syarat dan Ketentuan ini sewaktu-waktu. Perubahan akan diinformasikan melalui email atau pengumuman di Platform. Penggunaan Platform secara terus-menerus setelah perubahan dianggap sebagai penerimaan terhadap ketentuan yang telah diperbarui.`,
  },
  {
    title: "9. Hukum yang Berlaku",
    content: `Syarat dan Ketentuan ini diatur dan ditafsirkan berdasarkan hukum Republik Indonesia. Setiap sengketa yang timbul diselesaikan melalui musyawarah. Apabila tidak tercapai kesepakatan, sengketa akan diselesaikan di Pengadilan Negeri Jakarta Selatan.`,
  },
];

export default function TermsPage() {
  const lastUpdated = "1 Juli 2026";

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="relative bg-bg-surface border-b border-bg-border py-16 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="container-main relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
            <FileText className="w-4 h-4" />
            Legal
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-text-primary mb-4">
            Syarat &amp; Ketentuan
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Harap baca syarat dan ketentuan ini dengan seksama sebelum menggunakan
            layanan TixNova.
          </p>
          <p className="text-text-muted text-sm mt-4">
            Terakhir diperbarui: {lastUpdated}
          </p>
        </div>
      </section>

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

        <div className="mt-12 p-6 rounded-2xl bg-bg-surface border border-bg-border">
          <p className="text-text-secondary text-sm text-center">
            Dengan menggunakan platform TixNova, Anda menyatakan telah membaca, memahami,
            dan menyetujui seluruh Syarat &amp; Ketentuan di atas.{" "}
            <a href="/contact" className="text-primary hover:underline">
              Hubungi kami
            </a>{" "}
            jika ada pertanyaan.
          </p>
        </div>
      </section>
    </div>
  );
}
