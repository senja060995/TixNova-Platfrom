"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Gift, LinkIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { formatCurrency, formatDateOnly } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface Affiliate {
  id: number;
  name: string;
  email: string;
  code: string;
  commission_rate: number;
  total_used: number;
  total_earned: number;
  pending_amount: number;
  paid_amount: number;
  links_count: number;
}

interface Reward {
  id: number;
  referrer_name: string;
  referrer_email: string;
  order_code: string;
  event_title?: string;
  amount: number;
  status: string;
  earned_at: string;
  paid_at?: string;
}

interface LinkRow {
  id: number;
  owner: string;
  label: string;
  code: string;
  source?: string;
  is_active: boolean;
  clicks: number;
  created_at: string;
}

type TabKey = "affiliates" | "rewards" | "links";

export default function AffiliatesPage() {
  const [tab, setTab] = useState<TabKey>("affiliates");
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const requested = useRef(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.getClient().get("/super-admin/affiliates", { params: { search: search || undefined } }),
      api.getClient().get("/super-admin/affiliates/rewards", { params: { per_page: 50 } }),
      api.getClient().get("/super-admin/affiliates/links"),
    ])
      .then(([af, rw, lk]) => {
        setAffiliates(af.data.data || []);
        setRewards(rw.data.data?.data || rw.data.data || []);
        setLinks(lk.data.data || []);
      })
      .catch(() => toast.error("Gagal memuat data affiliate."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    load();
  }, []);

  const runSearch = () => load();

  const TABS: Array<{ key: TabKey; label: string; icon: typeof Users }> = [
    { key: "affiliates", label: "Affiliates", icon: Users },
    { key: "rewards", label: "Komisi", icon: Gift },
    { key: "links", label: "Link Distribusi", icon: LinkIcon },
  ];

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-bg-surface" />;

  return <div className="mx-auto max-w-5xl space-y-6">
    <div>
      <h1 className="text-3xl font-extrabold text-white">Affiliate & Distribusi</h1>
      <p className="mt-1 text-sm text-text-secondary">Pantau affiliate, komisi, dan link distribusi di seluruh platform.</p>
    </div>

    <div className="flex flex-wrap gap-2">
      {TABS.map(({ key, label, icon: Icon }) => (
        <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${tab === key ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-bg-surface text-text-secondary border border-bg-border hover:text-white"}`}>
          <Icon className="h-4 w-4" />{label}
        </button>
      ))}
    </div>

    {tab === "affiliates" && (
      <section className="rounded-2xl border border-bg-border bg-bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-white">Daftar Affiliate</h2>
          <div className="flex gap-2">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama/email..." className="w-56" />
            <Button variant="outline" size="sm" onClick={runSearch}><Search className="mr-1 h-3.5 w-3.5" />Cari</Button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border text-left text-xs uppercase tracking-wider text-text-muted">
                <th className="pb-3 pr-4 font-semibold">Affiliate</th>
                <th className="pb-3 pr-4 font-semibold">Kode</th>
                <th className="pb-3 pr-4 font-semibold">Rate</th>
                <th className="pb-3 pr-4 font-semibold">Referral</th>
                <th className="pb-3 pr-4 font-semibold">Menunggu</th>
                <th className="pb-3 pr-4 font-semibold">Dibayar</th>
                <th className="pb-3 font-semibold">Links</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((affiliate) => (
                <tr key={affiliate.id} className="border-b border-bg-border/50">
                  <td className="py-3 pr-4"><p className="font-bold text-white">{affiliate.name}</p><p className="text-xs text-text-muted">{affiliate.email}</p></td>
                  <td className="py-3 pr-4"><code className="rounded bg-bg-elevated px-2 py-0.5 text-xs text-white">{affiliate.code}</code></td>
                  <td className="py-3 pr-4 text-text-secondary">{affiliate.commission_rate}%</td>
                  <td className="py-3 pr-4 text-text-secondary">{affiliate.total_used} referal</td>
                  <td className="py-3 pr-4 font-bold text-accent">{formatCurrency(affiliate.pending_amount)}</td>
                  <td className="py-3 pr-4 font-bold text-success">{formatCurrency(affiliate.paid_amount)}</td>
                  <td className="py-3 text-text-secondary">{affiliate.links_count}</td>
                </tr>
              ))}
              {!affiliates.length && <tr><td colSpan={7} className="py-8 text-center text-sm text-text-muted">Belum ada affiliate.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    )}

    {tab === "rewards" && (
      <section className="rounded-2xl border border-bg-border bg-bg-surface p-6">
        <h2 className="font-bold text-white">Riwayat Komisi</h2>
        <div className="mt-4 space-y-3">
          {rewards.map((reward) => (
            <div key={reward.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-bg-elevated p-4">
              <div className="min-w-0">
                <p className="font-bold text-white">{reward.event_title || "Pembelian tiket"}</p>
                <p className="text-xs text-text-muted">{reward.referrer_name} · {reward.order_code} · {formatDateOnly(reward.earned_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-success">{formatCurrency(reward.amount)}</p>
                <span className={`text-xs ${reward.status === "paid" ? "text-success" : "text-accent"}`}>{reward.status === "paid" ? "Dibayar" : "Menunggu"}</span>
              </div>
            </div>
          ))}
          {!rewards.length && <p className="py-8 text-center text-sm text-text-muted">Belum ada komisi.</p>}
        </div>
      </section>
    )}

    {tab === "links" && (
      <section className="rounded-2xl border border-bg-border bg-bg-surface p-6">
        <h2 className="font-bold text-white">Link Distribusi</h2>
        <div className="mt-4 space-y-3">
          {links.map((link) => (
            <div key={link.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-bg-elevated p-4">
              <div className="min-w-0">
                <p className="font-bold text-white">{link.label}</p>
                <p className="text-xs text-text-muted">{link.owner}{link.source && ` · sumber ${link.source}`}</p>
              </div>
              <div className="flex items-center gap-4 text-right text-xs text-text-muted">
                <div><p className="font-bold text-white">{link.clicks}</p><p>klik</p></div>
                <div><p className={`font-bold ${link.is_active ? "text-success" : "text-text-muted"}`}>{link.is_active ? "Aktif" : "Nonaktif"}</p><p>status</p></div>
                <div><p className="font-bold text-white">{formatDateOnly(link.created_at)}</p><p>dibuat</p></div>
              </div>
            </div>
          ))}
          {!links.length && <p className="py-8 text-center text-sm text-text-muted">Belum ada link distribusi.</p>}
        </div>
      </section>
    )}
  </div>;
}
