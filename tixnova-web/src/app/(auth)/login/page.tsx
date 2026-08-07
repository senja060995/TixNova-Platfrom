"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Lock, Mail, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/components/ui/Toast";

import { useLocale } from "@/components/LocaleProvider";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const authLogin = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      authLogin(res.data.user, res.data.token, res.data.token);
      toast.success(`Selamat datang kembali, ${res.data.user.name}!`);

      const roles = res.data.roles || [];
      if (roles.includes("super_admin")) {
        router.push("/dashboard/admin-overview");
      } else if (roles.includes("promotor")) {
        router.push("/dashboard/overview");
      } else {
        router.push("/dashboard/my-tickets");
      }
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Login gagal. Periksa email & password Anda.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-bg-surface p-6 sm:p-8 rounded-3xl border border-bg-border shadow-2xl relative overflow-hidden">
        {/* Back to home + language switcher */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="Kembali ke Beranda"
            title="Kembali ke Beranda"
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-bg-border bg-bg-surface text-text-secondary hover:text-primary hover:border-primary/50 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <LanguageSwitcher />
        </div>

        {/* Glow decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />

        <div className="text-center relative">
          <Link href="/" className="inline-flex items-center gap-2.5 text-2xl font-black tracking-tight text-white mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/TN.png" alt="TixNova Logo" className="h-9 w-auto object-contain shrink-0" />
            <span>Tix<span className="text-primary">Nova</span></span>
          </Link>
          <h2 className="text-2xl font-extrabold text-white mt-4">{t("auth.loginTitle")}</h2>
          <p className="mt-2 text-sm text-text-secondary">
            {t("auth.loginDesc")}
          </p>
        </div>

        <form className="mt-8 space-y-5 relative" onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-5 h-5" />}
            className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
            required
          />

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Password
              </span>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                Lupa Password?
              </Link>
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pointer-events-auto text-text-muted hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
              className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-base font-bold bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/30 rounded-xl flex items-center justify-center gap-2"
          >
            {loading ? "Memproses..." : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </form>

        <div className="border-t border-bg-border pt-6 text-center text-sm text-text-secondary">
          Belum punya akun?{" "}
          <Link href="/register" className="text-primary font-bold hover:underline">
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
