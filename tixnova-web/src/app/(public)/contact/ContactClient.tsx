"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, MessageCircle, Send, CheckCircle } from "lucide-react";

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "support@tixnova.id",
    href: "mailto:support@tixnova.id",
    desc: "Respons dalam 1×24 jam kerja",
  },
  {
    icon: Phone,
    title: "WhatsApp",
    value: "+62 812-3456-7890",
    href: "https://wa.me/6281234567890",
    desc: "Senin–Minggu, 08.00–21.00 WIB",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    value: "Chat di Platform",
    href: "#chat",
    desc: "Senin–Jumat, 08.00–22.00 WIB",
  },
  {
    icon: MapPin,
    title: "Kantor",
    value: "Jakarta Selatan, DKI Jakarta",
    href: "https://maps.google.com",
    desc: "Kunjungan dengan janji terlebih dahulu",
  },
];

const topics = [
  "Masalah Pembelian Tiket",
  "Pembayaran & Refund",
  "Akun & Login",
  "Pertanyaan Teknis",
  "Kemitraan & Bisnis",
  "Feedback & Saran",
  "Lainnya",
];

export default function ContactClient() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="relative bg-bg-surface border-b border-bg-border py-16 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="container-main relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <MessageCircle className="w-4 h-4" />
            Hubungi Kami
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-text-primary mb-4">
            Kami Siap Membantu Anda
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Punya pertanyaan, saran, atau butuh bantuan? Tim TixNova siap
            merespons setiap pesan Anda.
          </p>
        </div>
      </section>

      <section className="section container-main max-w-5xl">
        <div className="grid lg:grid-cols-5 gap-10">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-text-primary mb-6">
              Cara Menghubungi Kami
            </h2>
            {contactInfo.map((info) => (
              <a
                key={info.title}
                href={info.href}
                target={info.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="card flex gap-4 hover:border-primary/30 hover:scale-[1.01] transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <info.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-text-muted text-xs mb-0.5">{info.title}</p>
                  <p className="text-text-primary font-medium text-sm group-hover:text-primary transition-colors">
                    {info.value}
                  </p>
                  <p className="text-text-muted text-xs mt-0.5">{info.desc}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
                <h3 className="text-2xl font-bold text-text-primary mb-2">
                  Pesan Terkirim!
                </h3>
                <p className="text-text-secondary">
                  Terima kasih, {form.name}! Kami akan menghubungi Anda di{" "}
                  <strong className="text-text-primary">{form.email}</strong>{" "}
                  dalam 1×24 jam kerja.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: "", email: "", topic: "", message: "" });
                  }}
                  className="btn-secondary mt-6 text-sm"
                >
                  Kirim Pesan Lain
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="card space-y-5">
                <h2 className="text-xl font-bold text-text-primary">Kirim Pesan</h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="contact-name">
                      Nama Lengkap <span className="text-danger">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Nama kamu"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="contact-email">
                      Alamat Email <span className="text-danger">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@kamu.com"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="contact-topic">
                    Topik <span className="text-danger">*</span>
                  </label>
                  <select
                    id="contact-topic"
                    required
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                    className="input-field"
                  >
                    <option value="" disabled>Pilih topik...</option>
                    {topics.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="contact-message">
                    Pesan <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tuliskan pesan atau pertanyaanmu di sini..."
                    className="input-field resize-none"
                  />
                </div>

                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Kirim Pesan
                </button>

                <p className="text-text-muted text-xs text-center">
                  Dengan mengirim pesan ini, Anda menyetujui{" "}
                  <a href="/privacy" className="text-primary hover:underline">
                    Kebijakan Privasi
                  </a>{" "}
                  kami.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
