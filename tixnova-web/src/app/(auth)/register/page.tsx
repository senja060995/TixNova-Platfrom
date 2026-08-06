"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Phone, Building, ArrowRight, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { toast } from "@/components/ui/Toast";

import { useLocale } from "@/components/LocaleProvider";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

function RegisterContent() {
  const router = useRouter();
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "promotor" || searchParams.get("tab") === "promotor" ? "promotor" : "user";

  const [role, setRole] = useState<"user" | "promotor">(initialRole);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      if (role === "user") {
        const res = await authApi.register({
          name,
          email,
          password,
          password_confirmation: passwordConfirm,
          phone,
          referral_code: referralCode.trim() || undefined,
        });
        authApi.setAccessToken(res.data.token);
        toast.success("Registrasi akun berhasil!");
        router.push("/");
      } else {
        const res = await authApi.registerPromotor({
          name,
          email,
          password,
          password_confirmation: passwordConfirm,
          tenant_name: tenantName,
          tenant_email: email,
          tenant_phone: phone,
        });
        toast.info(
          res.message || "Mohon maaf, proses pendaftaran promotor Anda sedang diproses oleh pihak admin. Mohon ditunggu beberapa saat lagi, nanti akan diberitahukan lewat email setelah proses pendaftaran berhasil diaudit.",
          { title: "Pendaftaran Dalam Proses Audit", duration: 8000 }
        );
        router.push("/login");
      }
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Registrasi gagal. Silakan periksa kembali data Anda.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 bg-bg-surface p-8 rounded-3xl border border-bg-border shadow-2xl relative overflow-hidden">
        {/* Language Switcher */}
        <div className="absolute top-6 right-6 z-10">
          <LanguageSwitcher />
        </div>

        {/* Header */}
        <div className="text-center relative">
          <Link href="/" className="inline-flex items-center gap-2.5 text-2xl font-black tracking-tight text-white mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/TN.png" alt="TixNova Logo" className="h-9 w-auto object-contain shrink-0" />
            <span>Tix<span className="text-primary">Nova</span></span>
          </Link>
          <h2 className="text-2xl font-extrabold text-white mt-2">{t("auth.registerTitle")}</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {t("auth.registerDesc")}
          </p>
        </div>

        {/* Role Toggle Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-bg-elevated p-1.5 rounded-xl border border-bg-border">
          <button
            type="button"
            onClick={() => setRole("user")}
            className={`py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              role === "user"
                ? "bg-primary text-white shadow-md shadow-primary/30"
                : "text-text-secondary hover:text-white"
            }`}
          >
            Pembeli Tiket
          </button>
          <button
            type="button"
            onClick={() => setRole("promotor")}
            className={`py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              role === "promotor"
                ? "bg-primary text-white shadow-md shadow-primary/30"
                : "text-text-secondary hover:text-white"
            }`}
          >
            Promotor / Event Organizer
          </button>
        </div>

        {/* Form */}
        <form className="space-y-4 relative" onSubmit={handleSubmit}>
          {role === "promotor" && (
            <Input
              label="Nama Organisasi / Promotor"
              type="text"
              placeholder="Contoh: Sound Project Indonesia"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              leftIcon={<Building className="w-5 h-5" />}
              className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3"
              required
            />
          )}

          <Input
            label="Nama Lengkap"
            type="text"
            placeholder="Budi Santoso"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-5 h-5" />}
            className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3"
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-5 h-5" />}
            className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3"
            required
          />

          <Input
            label="Nomor WhatsApp / HP"
            type="tel"
            placeholder="081234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-5 h-5" />}
            className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3"
          />

          {role === "user" && (
            <Input
              label="Kode Referral (Opsional)"
              type="text"
              placeholder="Contoh: REF-ABCD1234"
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
              className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3 font-mono"
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pointer-events-auto text-text-muted hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3 text-sm"
              required
            />

            <Input
              label="Konfirmasi Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3 text-sm"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-base font-bold bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/30 rounded-xl flex items-center justify-center gap-2 mt-4"
          >
            {loading ? "Mendaftarkan..." : (
              <>
                <span>Daftar {role === "promotor" ? "Promotor" : "Sekarang"}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </form>

        <div className="border-t border-bg-border pt-4 text-center text-sm text-text-secondary">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-bg-base flex items-center justify-center text-white">Memuat form...</div>}>
      <RegisterContent />
    </React.Suspense>
  );
}
