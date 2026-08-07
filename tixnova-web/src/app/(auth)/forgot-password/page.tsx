"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Mail, ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success("Instruksi reset password telah dikirim ke email Anda.");
    } catch {
      // Show success anyway for security
      setSent(true);
      toast.success("Jika email terdaftar, instruksi reset password telah dikirim.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-bg-surface p-8 rounded-3xl border border-bg-border shadow-2xl relative overflow-hidden">
        {/* Back to home */}
        <Link
          href="/"
          className="absolute top-6 left-6 z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>

        <div className="text-center relative">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-black tracking-tight text-white mb-4">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-lg">
              T
            </span>
            <span>Tix<span className="text-primary">Nova</span></span>
          </Link>
          <h2 className="text-2xl font-extrabold text-white">Reset Password</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Masukkan email Anda untuk menerima tautan pemulihan kata sandi.
          </p>
        </div>

        {sent ? (
          <div className="bg-success/10 border border-success/30 rounded-2xl p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">Email Dikirim!</h4>
            <p className="text-xs text-text-secondary">
              Kami telah mengirimkan instruksi ke <strong className="text-white">{email}</strong>. Silakan periksa folder inbox atau spam Anda.
            </p>
            <Link href="/login" className="block pt-2">
              <Button className="w-full bg-primary hover:bg-primary-dark">Kembali ke Login</Button>
            </Link>
          </div>
        ) : (
          <form className="space-y-5 relative" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <Input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-base font-bold bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/30 rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? "Kirimkan..." : (
                <>
                  <span>Kirim Tautan Reset</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        )}

        <div className="border-t border-bg-border pt-4 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Halaman Login
          </Link>
        </div>
      </div>
    </div>
  );
}
