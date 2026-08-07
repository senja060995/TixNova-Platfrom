"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, User, Mail, Phone, Lock, Save, LogOut } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { api, authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/components/ui/Toast";
import { AppBottomNav } from "@/components/wallet/AppBottomNav";

export default function WalletProfilePage() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const requested = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("access_token")) {
      router.replace("/login");
      return;
    }
    if (requested.current) return;
    requested.current = true;

    authApi
      .getMe()
      .then((res) => {
        const u = res.data.user;
        setName(u.name || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password && password !== passwordConfirm) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = { name, phone };
      if (password) {
        payload.password = password;
        payload.password_confirmation = passwordConfirm;
      }

      await api.getClient().put("/user/profile", payload);
      toast.success("Profil berhasil diperbarui!");
      setPassword("");
      setPasswordConfirm("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Gagal memperbarui profil.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const fieldClass = "pl-12 bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3";

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-24 pt-6">
      <header className="flex items-center gap-2">
        <Link
          href="/wallet"
          aria-label="Kembali ke Dompet"
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-bg-border bg-bg-surface text-text-secondary hover:text-primary hover:border-primary/50 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Profil Saya</h1>
          <p className="text-xs text-text-secondary">Kelola data diri & keamanan akun.</p>
        </div>
      </header>

      <main className="mt-6 flex-1">
        {loading ? (
          <div className="space-y-3">
            <div className="h-32 animate-pulse rounded-3xl border border-bg-border bg-bg-surface" />
            <div className="h-48 animate-pulse rounded-3xl border border-bg-border bg-bg-surface" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-3xl border border-bg-border bg-bg-surface p-5 space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={fieldClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Email Address (Tidak Dapat Diubah)
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                  <Input
                    type="email"
                    value={email}
                    disabled
                    className="pl-12 bg-bg-elevated/50 border-bg-border text-text-muted rounded-xl py-3 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Nomor WhatsApp / HP
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                  <Input
                    type="tel"
                    placeholder="081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-bg-border bg-bg-surface p-5 space-y-4">
              <h4 className="text-sm font-bold text-white">Ubah Kata Sandi (Opsional)</h4>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Password Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    type="password"
                    placeholder="Ketik ulang password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="pl-10 bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3 text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-4 py-3.5 text-sm font-bold text-white transition-colors hover:brightness-110 disabled:opacity-60"
            >
              <Save className="h-5 w-5" />
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-bold text-danger transition-colors hover:bg-danger/20"
            >
              <LogOut className="h-5 w-5" />
              Keluar
            </button>
          </form>
        )}
      </main>

      <AppBottomNav />
    </div>
  );
}
