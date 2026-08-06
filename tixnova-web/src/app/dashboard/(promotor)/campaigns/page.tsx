"use client";

import { useEffect, useRef, useState } from "react";
import { Megaphone, Plus, Play, Square, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { formatCurrency, formatDateOnly } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface Campaign {
  id: number;
  name: string;
  description?: string;
  status: string;
  budget: number;
  valid_from?: string;
  valid_until?: string;
  vouchers_count: number;
  voucher_used_total: number;
  vouchers?: Array<{
    id: number;
    code: string;
    discount_type: string;
    discount_value: number;
    event_title?: string;
    used_count: number;
    max_use: number;
    is_active: boolean;
  }>;
}

const STATUS: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-bg-elevated text-text-secondary border-bg-border" },
  active: { label: "Aktif", className: "bg-success/10 text-success border-success/30" },
  ended: { label: "Berakhir", className: "bg-text-muted/20 text-text-muted border-bg-border" },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [acting, setActing] = useState<number | null>(null);
  const requested = useRef(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "draft",
    budget: "",
    valid_from: "",
    valid_until: "",
  });

  const fetchCampaigns = () => {
    setLoading(true);
    api.getClient().get("/promotor/campaigns")
      .then((response) => setCampaigns(response.data.data))
      .catch(() => toast.error("Gagal memuat kampanye."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    fetchCampaigns();
  }, []);

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.getClient().post("/promotor/campaigns", {
        name: form.name,
        description: form.description || undefined,
        status: form.status,
        budget: form.budget ? Number(form.budget) : undefined,
        valid_from: form.valid_from || undefined,
        valid_until: form.valid_until || undefined,
      });
      toast.success("Kampanye berhasil dibuat.");
      setShowAdd(false);
      setForm({ name: "", description: "", status: "draft", budget: "", valid_from: "", valid_until: "" });
      fetchCampaigns();
    } catch {
      toast.error("Gagal membuat kampanye.");
    } finally {
      setSaving(false);
    }
  };

  const act = async (id: number, action: "activate" | "end") => {
    setActing(id);
    try {
      const response = await api.getClient().post(`/promotor/campaigns/${id}/${action}`);
      toast.success(response.data.message || "Status diperbarui.");
      fetchCampaigns();
    } catch {
      toast.error("Gagal memperbarui status.");
    } finally {
      setActing(null);
    }
  };

  const toggleDetail = (id: number) => {
    setExpanded(expanded === id ? null : id);
    if (expanded !== id) {
      api.getClient().get(`/promotor/campaigns/${id}`)
        .then((response) => {
          setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, vouchers: response.data.data.vouchers } : c)));
        })
        .catch(() => toast.error("Gagal memuat detail kampanye."));
    }
  };

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-bg-surface" />;

  return <div className="mx-auto max-w-4xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Campaign OS</h1>
        <p className="mt-1 text-sm text-text-secondary">Kelola promo, bundling, dan voucher dalam satu kampanye.</p>
      </div>
      <Button onClick={() => setShowAdd(!showAdd)}><Plus className="mr-2 h-4 w-4" />Kampanye Baru</Button>
    </div>

    {showAdd && (
      <form onSubmit={createCampaign} className="rounded-2xl border border-bg-border bg-bg-surface p-6 space-y-4">
        <h2 className="font-bold text-white">Buat Kampanye</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Input label="Nama Kampanye" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mis. Promo HUT ke-3" required /></div>
          <div className="sm:col-span-2"><Input label="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tujuan kampanye" /></div>
          <div><Select label="Status" options={[{ value: "draft", label: "Draft" }, { value: "active", label: "Aktif" }]} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} /></div>
          <div><Input label="Budget (Rp)" type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0" /></div>
          <div><Input label="Mulai Berlaku" type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} /></div>
          <div><Input label="Berakhir" type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Batal</Button>
          <Button type="submit" loading={saving}>Simpan</Button>
        </div>
      </form>
    )}

    {campaigns.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-bg-border p-12 text-center text-sm text-text-muted">
        <Megaphone className="mx-auto h-10 w-10 text-text-muted mb-3" />
        Belum ada kampanye. Buat kampanye pertama Anda.
      </div>
    ) : (
      <div className="space-y-4">
        {campaigns.map((campaign) => {
          const st = STATUS[campaign.status] || STATUS.draft;
          return (
            <div key={campaign.id} className="rounded-2xl border border-bg-border bg-bg-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{campaign.name}</h3>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${st.className}`}>{st.label}</span>
                  </div>
                  {campaign.description && <p className="mt-1 text-sm text-text-secondary line-clamp-2">{campaign.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-muted">
                    <span>{campaign.vouchers_count} voucher</span>
                    <span>{campaign.voucher_used_total} pemakaian</span>
                    <span>Budget {formatCurrency(campaign.budget)}</span>
                    {campaign.valid_from && <span>Berlaku {formatDateOnly(campaign.valid_from)} – {campaign.valid_until ? formatDateOnly(campaign.valid_until) : "seterusnya"}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {campaign.status === "active" && (
                    <Button variant="outline" size="sm" loading={acting === campaign.id} onClick={() => act(campaign.id, "end")}><Square className="mr-1 h-3.5 w-3.5" />Akhiri</Button>
                  )}
                  {campaign.status === "draft" && (
                    <Button size="sm" loading={acting === campaign.id} onClick={() => act(campaign.id, "activate")}><Play className="mr-1 h-3.5 w-3.5" />Aktifkan</Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => toggleDetail(campaign.id)}>
                    {expanded === campaign.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {expanded === campaign.id && (
                <div className="mt-4 border-t border-bg-border pt-4">
                  {campaign.vouchers?.length ? (
                    <div className="space-y-2">
                      {campaign.vouchers.map((voucher) => (
                        <div key={voucher.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-bg-elevated px-4 py-3">
                          <div>
                            <p className="font-bold text-white">{voucher.code}</p>
                            <p className="text-xs text-text-muted">{voucher.event_title || "Semua event"}</p>
                          </div>
                          <div className="text-right text-xs text-text-muted">
                            <p>{voucher.discount_type === "percent" ? `${voucher.discount_value}%` : formatCurrency(voucher.discount_value)}</p>
                            <p>Pakai {voucher.used_count}/{voucher.max_use} · {voucher.is_active ? "aktif" : "nonaktif"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-sm text-text-muted">Belum ada voucher. Tambahkan voucher pada menu Tickets untuk mengikatnya ke kampanye ini.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>;
}
