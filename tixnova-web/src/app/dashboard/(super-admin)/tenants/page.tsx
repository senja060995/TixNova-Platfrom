"use client";

import { useState, useEffect } from "react";
import { Building2, ShieldCheck, CheckCircle2, AlertOctagon, Edit3, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface Tenant {
  id: number;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  status: "active" | "pending" | "suspended";
  commission: number;
  events_count?: number;
  orders_count?: number;
  orders_sum_total?: number;
}

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(5);
  const [updating, setUpdating] = useState(false);

  const fetchTenants = () => {
    setLoading(true);
    const params: Record<string, unknown> = {};
    if (search) params.search = search;

    api.getClient().get("/super-admin/tenants", { params })
      .then((res) => setTenants(res.data.data.data || []))
      .catch(() => setTenants([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTenants();
  }, []);

  const handleActivate = async (id: number) => {
    try {
      await api.getClient().post(`/super-admin/tenants/${id}/activate`);
      toast.success("Tenant berhasil diaktifkan!");
      fetchTenants();
    } catch {
      toast.error("Gagal mengaktifkan tenant.");
    }
  };

  const handleSuspend = async (id: number) => {
    try {
      await api.getClient().post(`/super-admin/tenants/${id}/suspend`);
      toast.success("Tenant berhasil disuspend.");
      fetchTenants();
    } catch {
      toast.error("Gagal mensuspend tenant.");
    }
  };

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    setUpdating(true);
    try {
      await api.getClient().put(`/super-admin/tenants/${selectedTenant.id}/commission`, {
        commission: commissionRate,
      });
      toast.success("Tingkat komisi berhasil diperbarui!");
      setSelectedTenant(null);
      fetchTenants();
    } catch {
      toast.error("Gagal memperbarui komisi.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Kelola Tenant & Promotor</h1>
        <p className="text-text-secondary text-sm mt-1">
          Daftar seluruh organisasi penyelenggara event yang terdaftar di platform TixNova.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <Input
            type="text"
            placeholder="Cari nama promotor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 bg-bg-surface border-bg-border text-white rounded-xl focus:border-primary py-3"
          />
        </div>
        <Button onClick={fetchTenants} className="bg-primary hover:bg-primary-dark">
          Cari
        </Button>
      </div>

      {/* Table */}
      <div className="bg-bg-surface border border-bg-border rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center animate-pulse text-text-secondary">Memuat data tenant...</div>
        ) : tenants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="text-xs uppercase bg-bg-elevated/60 text-text-muted border-b border-bg-border">
                <tr>
                  <th className="py-4 px-6">Nama Promotor</th>
                  <th className="py-4 px-6">Kontak</th>
                  <th className="py-4 px-6">Event / Order</th>
                  <th className="py-4 px-6">Total GMV</th>
                  <th className="py-4 px-6">Komisi %</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border/60">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-bg-elevated/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-sm border border-primary/30">
                          {tenant.name[0]}
                        </div>
                        <div>
                          <span>{tenant.name}</span>
                          <span className="text-[11px] text-text-muted block font-mono">@{tenant.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="block text-white text-xs">{tenant.email}</span>
                      <span className="text-xs text-text-muted">{tenant.phone || "-"}</span>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      <span className="block text-white font-semibold">{tenant.events_count || 0} Event</span>
                      <span className="text-text-muted">{tenant.orders_count || 0} Order</span>
                    </td>
                    <td className="py-4 px-6 font-bold text-primary">
                      {formatCurrency(Number(tenant.orders_sum_total || 0))}
                    </td>
                    <td className="py-4 px-6 font-bold text-accent">
                      {tenant.commission || 5}%
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        tenant.status === "active"
                          ? "bg-success/20 text-success border border-success/30"
                          : tenant.status === "pending"
                          ? "bg-accent/20 text-accent border border-accent/30"
                          : "bg-danger/20 text-danger border border-danger/30"
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {tenant.status !== "active" && (
                        <Button
                          size="sm"
                          onClick={() => handleActivate(tenant.id)}
                          className="bg-success hover:bg-emerald-700 text-xs py-1.5 px-3 font-bold"
                        >
                          Aktifkan
                        </Button>
                      )}
                      {tenant.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSuspend(tenant.id)}
                          className="border-danger/40 text-danger hover:bg-danger/10 text-xs py-1.5 px-3"
                        >
                          Suspend
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setCommissionRate(tenant.commission || 5);
                        }}
                        className="border-bg-border text-xs py-1.5 px-3"
                      >
                        Komisi %
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-text-secondary text-sm">Tidak ada tenant ditemukan.</div>
        )}
      </div>

      {/* Edit Commission Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateCommission} className="bg-bg-surface border border-bg-border rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Atur Komisi Platform</h3>
            <p className="text-xs text-text-secondary">Ubah persentase komisi platform TixNova untuk <strong>{selectedTenant.name}</strong>.</p>
            <div>
              <label className="block text-xs font-semibold mb-2">Persentase Komisi (%)</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                className="bg-bg-elevated border-bg-border text-white text-base py-3"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedTenant(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={updating} className="bg-primary hover:bg-primary-dark font-bold">
                {updating ? "Simpan..." : "Simpan Komisi"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
