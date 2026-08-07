"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      toast.error("Token reset password tidak valid.");
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !email) return;
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password, confirmPassword);
      setSubmitted(true);
      toast.success("Password berhasil direset. Silakan login dengan password baru.");
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Gagal mereset password.";
      toast.error(message);
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
          <h2 className="text-2xl font-extrabold text-white">Atur Ulang Password</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Masukkan password baru untuk akun Anda.
          </p>
        </div>

        {submitted ? (
          <div className="bg-success/10 border border-success/30 rounded-2xl p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">Password Berhasil Diubah!</h4>
            <p className="text-xs text-text-secondary">
              Anda sekarang dapat login dengan password baru.
            </p>
            <Link href="/login" className="block pt-2">
              <Button className="w-full bg-primary hover:bg-primary-dark">Masuk Sekarang</Button>
            </Link>
          </div>
        ) : (
          <form className="space-y-5 relative" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Password Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password baru"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Konfirmasi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-12 bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-base font-bold bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/30 rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? "Mereset..." : (
                <>
                  <span>Reset Password</span>
                  <Lock className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        )}

        <div className="border-t border-bg-border pt-4 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors">
            <Mail className="w-4 h-4" /> Kembali ke Halaman Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-base flex items-center justify-center"><div className="h-48 animate-pulse rounded-xl bg-bg-surface w-full max-w-md" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}