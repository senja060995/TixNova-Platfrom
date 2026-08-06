"use client";

import { useState, useEffect } from "react";
import { Percent, Save, RefreshCw, Info, TrendingUp, DollarSign, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface CommissionData {
  global_rate: number;
  total_commission_earned: number;
  total_revenue: number;
  active_tenants: number;
}

export default function SuperAdminCommissionPage() {
  const [data, setData] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rate, setRate] = useState<number>(5);
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api.getClient().get("/super-admin/commission")
      .then((res) => {
        const d = res.data?.data;
        setData(d);
        setRate(d?.global_rate ?? 5);
      })
      .catch(() => {
        // Fallback ke dashboard untuk data umum
        api.getClient().get("/super-admin/dashboard")
          .then((r) => {
            const s = r.data?.data?.stats;
            setData({
              global_rate: 5,
              total_commission_earned: s?.platform_commission || 0,
              total_revenue: s?.total_revenue || 0,
              active_tenants: s?.active_tenants || 0,
            });
          })
          .catch(() => setData(null));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rate < 0 || rate > 100) {
      toast.error("Persentase komisi harus antara 0 dan 100.");
      return;
    }
    setSaving(true);
    try {
      await api.getClient().put("/super-admin/commission", { rate });
      toast.success("Komisi platform berhasil diperbarui!");
      fetchData();
    } catch {
      toast.error("Gagal menyimpan komisi. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Pengaturan Komisi Platform</h1>
        <p className="text-text-secondary text-sm mt-1">
          Atur persentase komisi yang diambil TixNova dari setiap transaksi tiket.
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-bg-surface rounded-2xl border border-bg-border" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-bg-surface p-6 rounded-2xl border border-bg-border space-y-2">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Percent className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-text-muted">Komisi Global Saat Ini</p>
            <p className="text-2xl font-black text-white">{data?.global_rate ?? rate}%</p>
          </div>
          <div className="bg-bg-surface p-6 rounded-2xl border border-bg-border space-y-2">
            <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <p className="text-xs text-text-muted">Total Komisi Diterima</p>
            <p className="text-2xl font-black text-white">{formatCurrency(data?.total_commission_earned || 0)}</p>
          </div>
          <div className="bg-bg-surface p-6 rounded-2xl border border-bg-border space-y-2">
            <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-success" />
            </div>
            <p className="text-xs text-text-muted">Tenant Aktif</p>
            <p className="text-2xl font-black text-white">{data?.active_tenants || 0} Promotor</p>
          </div>
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-bg-surface p-6 sm:p-8 rounded-2xl border border-bg-border max-w-lg">
        <h2 className="font-bold text-white text-lg mb-2">Ubah Komisi Global</h2>
        <p className="text-text-secondary text-sm mb-6">
          Perubahan ini berlaku untuk semua tenant yang tidak memiliki komisi khusus.
        </p>
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              Persentase Komisi Platform (%)
            </label>
            <div className="relative">
              <Input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="bg-bg-elevated border-bg-border text-white text-xl font-bold py-4 pr-12"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-bold text-lg">%</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/20">
            <Info className="w-5 h-5 text-info shrink-0 mt-0.5" />
            <p className="text-info text-sm">
              Komisi <strong>{rate}%</strong> berarti dari setiap tiket senilai{" "}
              <strong>Rp 100.000</strong>, TixNova menerima{" "}
              <strong>{formatCurrency(100000 * rate / 100)}</strong>.
            </p>
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-primary-dark w-full font-bold flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </form>
      </div>

      {/* Per-tenant Commission Note */}
      <div className="bg-bg-surface p-6 rounded-2xl border border-bg-border">
        <h3 className="font-bold text-white mb-3">Komisi Per-Tenant</h3>
        <p className="text-text-secondary text-sm">
          Untuk mengubah komisi pada tenant tertentu, buka halaman{" "}
          <a href="/dashboard/tenants" className="text-primary hover:underline font-medium">
            Kelola Tenant
          </a>{" "}
          dan klik tombol <strong>Komisi %</strong> pada baris tenant yang ingin diubah.
          Komisi per-tenant akan mengesampingkan (override) komisi global di atas.
        </p>
      </div>
    </div>
  );
}
