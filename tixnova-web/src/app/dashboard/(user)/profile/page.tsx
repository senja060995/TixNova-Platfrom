"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, authApi } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

export default function UserProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    authApi.getMe()
      .then((res) => {
        const u = res.data.user;
        setName(u.name || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto animate-pulse">
        <div className="h-8 bg-bg-surface rounded w-48" />
        <div className="h-96 bg-bg-surface rounded-2xl border border-bg-border" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Pengaturan Profil</h1>
        <p className="text-text-secondary text-sm mt-1">
          Kelola informasi data diri Anda dan keamanan kata sandi akun TixNova.
        </p>
      </div>

      <div className="bg-bg-surface p-6 sm:p-8 rounded-3xl border border-bg-border shadow-2xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-12 bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Email Address (Tidak Dapat Diubah)
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <Input
                type="email"
                value={email}
                disabled
                className="pl-12 bg-bg-elevated/50 border-bg-border text-text-muted rounded-xl py-3.5 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Nomor WhatsApp / HP
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <Input
                type="tel"
                placeholder="081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-12 bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
              />
            </div>
          </div>

          <div className="border-t border-bg-border pt-5 space-y-4">
            <h4 className="font-bold text-white text-sm">Ubah Kata Sandi (Opsional)</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Password Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
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
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
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
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="w-full py-4 text-base font-bold bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/30 rounded-xl flex items-center justify-center gap-2 mt-4"
          >
            {saving ? "Menyimpan..." : (
              <>
                <Save className="w-5 h-5" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
