"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Gift, Link as LinkIcon, Plus, Trash2, Wallet, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { formatCurrency, formatDateOnly } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface Reward {
  order_code: string;
  event_title?: string;
  amount: number;
  status: string;
  earned_at?: string;
}

interface ReferralData {
  code: string;
  commission_rate: number;
  is_affiliate: boolean;
  total_used: number;
  total_earned: number;
  pending_amount: number;
  paid_amount: number;
  recent_rewards: Reward[];
}

interface DistributionLink {
  id: number;
  label: string;
  code: string;
  url: string;
  source?: string;
  is_active: boolean;
  clicks: number;
  created_at: string;
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [links, setLinks] = useState<DistributionLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [payouting, setPayouting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkSource, setLinkSource] = useState("");
  const requested = useRef(false);

  const load = () => {
    api.getClient().get("/user/referrals")
      .then((response) => setData(response.data.data))
      .catch(() => toast.error("Gagal memuat data referral."))
      .finally(() => setLoading(false));
  };

  const loadLinks = () => {
    api.getClient().get("/user/distribution-links")
      .then((response) => setLinks(response.data.data))
      .catch(() => toast.error("Gagal memuat link distribusi."));
  };

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    const frame = requestAnimationFrame(() => {
      load();
      loadLinks();
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const copyCode = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.code);
    toast.success("Kode referral disalin.");
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("Link disalin.");
  };

  const activateAffiliate = async () => {
    setActivating(true);
    try {
      await api.getClient().post("/user/referrals/activate-affiliate");
      toast.success("Mode affiliate aktif. Komisi Anda naik otomatis.");
      load();
    } catch {
      toast.error("Gagal mengaktifkan affiliate.");
    } finally {
      setActivating(false);
    }
  };

  const handlePayout = async () => {
    setPayouting(true);
    try {
      const response = await api.getClient().post("/user/referrals/payout");
      toast.success(response.data.message || "Payout diproses.");
      load();
    } catch {
      toast.error("Gagal memproses payout.");
    } finally {
      setPayouting(false);
    }
  };

  const createLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkLabel.trim()) return;
    setCreating(true);
    try {
      await api.getClient().post("/user/distribution-links", {
        label: linkLabel,
        source: linkSource || undefined,
      });
      toast.success("Link distribusi dibuat.");
      setLinkLabel("");
      setLinkSource("");
      loadLinks();
    } catch {
      toast.error("Gagal membuat link.");
    } finally {
      setCreating(false);
    }
  };

  const deactivateLink = async (link: DistributionLink) => {
    try {
      await api.getClient().delete(`/user/distribution-links/${link.id}`);
      toast.success("Link dinonaktifkan.");
      loadLinks();
    } catch {
      toast.error("Gagal menonaktifkan link.");
    }
  };

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-bg-surface" />;

  return <div className="mx-auto max-w-4xl space-y-8">
    <div>
      <h1 className="text-3xl font-extrabold text-white">Referral & Affiliate Saya</h1>
      <p className="mt-1 text-sm text-text-secondary">Bagikan kode atau link distribusi, dapatkan komisi dari setiap pembelian tiket yang berhasil.</p>
    </div>

    <section className="rounded-2xl border border-primary/30 bg-primary/10 p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-primary p-3 text-white"><Gift className="h-6 w-6" /></div>
        <div className="flex-1">
          <p className="text-sm text-text-secondary">Kode referral Anda</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <code className="rounded-lg bg-bg-base px-4 py-2 text-xl font-black tracking-wider text-white">{data?.code}</code>
            <Button onClick={copyCode} className="bg-primary hover:bg-primary-dark"><Copy className="mr-2 h-4 w-4" />Salin</Button>
          </div>
          <p className="mt-3 text-xs text-text-muted">Komisi {data?.commission_rate}% dari subtotal tiket, dicatat setelah pembayaran lunas.</p>
        </div>
        {!data?.is_affiliate && (
          <Button onClick={activateAffiliate} loading={activating} className="bg-accent hover:opacity-90 shrink-0">
            <UserCheck className="mr-2 h-4 w-4" />Jadi Affiliate
          </Button>
        )}
        {data?.is_affiliate && (
          <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-bold text-success shrink-0">Affiliate Aktif</span>
        )}
      </div>
    </section>

    <div className="grid gap-4 sm:grid-cols-4">
      <div className="rounded-2xl border border-bg-border bg-bg-surface p-6"><LinkIcon className="h-5 w-5 text-primary" /><p className="mt-3 text-xs text-text-muted">Referral Berhasil</p><p className="text-2xl font-black text-white">{data?.total_used || 0}</p></div>
      <div className="rounded-2xl border border-bg-border bg-bg-surface p-6"><Wallet className="h-5 w-5 text-accent" /><p className="mt-3 text-xs text-text-muted">Menunggu Payout</p><p className="text-2xl font-black text-accent">{formatCurrency(data?.pending_amount || 0)}</p></div>
      <div className="rounded-2xl border border-bg-border bg-bg-surface p-6"><Wallet className="h-5 w-5 text-success" /><p className="mt-3 text-xs text-text-muted">Sudah Dibayar</p><p className="text-2xl font-black text-success">{formatCurrency(data?.paid_amount || 0)}</p></div>
      <div className="rounded-2xl border border-bg-border bg-bg-surface p-6"><Gift className="h-5 w-5 text-primary" /><p className="mt-3 text-xs text-text-muted">Rate Komisi</p><p className="text-2xl font-black text-white">{data?.commission_rate || 0}%</p></div>
    </div>

    {(data?.pending_amount || 0) > 0 && (
      <section className="rounded-2xl border border-accent/30 bg-accent/10 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-bold text-white">Komisi {formatCurrency(data?.pending_amount || 0)} siap dicairkan</p>
          <p className="text-xs text-text-muted mt-1">Klik payout untuk memproses seluruh komisi yang menunggu.</p>
        </div>
        <Button onClick={handlePayout} loading={payouting} className="bg-accent hover:opacity-90"><Wallet className="mr-2 h-4 w-4" />Cairkan Sekarang</Button>
      </section>
    )}

    <section className="rounded-2xl border border-bg-border bg-bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bg-border pb-4">
        <h2 className="font-bold text-white">Link Distribusi</h2>
        <form onSubmit={createLink} className="flex flex-wrap items-end gap-2">
          <div className="w-48"><Input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Label (mis. IG bio)" /></div>
          <div className="w-40"><Input value={linkSource} onChange={(e) => setLinkSource(e.target.value)} placeholder="Sumber (mis. instagram)" /></div>
          <Button type="submit" loading={creating} size="sm"><Plus className="mr-1 h-4 w-4" />Buat</Button>
        </form>
      </div>
      {links.length ? <div className="mt-4 space-y-3">{links.map((link) => <div key={link.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-bg-elevated p-4">
        <div className="min-w-0">
          <p className="font-bold text-white">{link.label}</p>
          <p className="text-xs text-text-muted mt-0.5 break-all">{link.url}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
            <span className={link.is_active ? "text-success" : "text-text-muted"}>{link.is_active ? "Aktif" : "Nonaktif"}</span>
            <span>{link.clicks} klik</span>
            {link.source && <span>sumber: {link.source}</span>}
            <span>dibuat {formatDateOnly(link.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => copyUrl(link.url)}><Copy className="mr-1 h-3.5 w-3.5" />Salin</Button>
          {link.is_active && <Button variant="ghost" size="sm" onClick={() => deactivateLink(link)}><Trash2 className="h-4 w-4 text-danger" /></Button>}
        </div>
      </div>)}</div> : <p className="py-8 text-center text-sm text-text-muted">Belum ada link distribusi. Buat link pertama untuk kampanye Anda.</p>}
    </section>

    <section className="rounded-2xl border border-bg-border bg-bg-surface p-6">
      <h2 className="border-b border-bg-border pb-4 font-bold text-white">Komisi Terbaru</h2>
      {data?.recent_rewards.length ? <div className="mt-4 space-y-3">{data.recent_rewards.map((reward) => <div key={reward.order_code} className="flex items-center justify-between rounded-xl bg-bg-elevated p-4">
        <div>
          <p className="font-bold text-white">{reward.event_title || "Pembelian tiket"}</p>
          <p className="text-xs text-text-muted">{reward.order_code}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-success">{formatCurrency(reward.amount)}</p>
          <span className={`text-xs ${reward.status === "paid" ? "text-success" : reward.status === "pending" ? "text-accent" : "text-text-muted"}`}>{reward.status}</span>
        </div>
      </div>)}</div> : <p className="py-8 text-center text-sm text-text-muted">Belum ada komisi referral.</p>}
    </section>
  </div>;
}
