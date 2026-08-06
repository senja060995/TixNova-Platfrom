"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Wallet2, CheckCircle, RotateCcw, ListChecks } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface TenantTrust {
  id: number;
  name: string;
  slug: string;
  status: string;
  trust_score: number;
  badge: string;
  paid_orders: number;
  refunded_orders: number;
  ledger_entries: number;
  balance: number;
}

const BADGE_STYLE: Record<string, { label: string; className: string }> = {
  none: { label: "—", className: "bg-bg-elevated text-text-muted border-bg-border" },
  bronze: { label: "Bronze", className: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
  silver: { label: "Silver", className: "bg-gray-400/10 text-gray-300 border-gray-400/30" },
  gold: { label: "Gold", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
  verified: { label: "Verified", className: "bg-success/10 text-success border-success/30" },
};

export default function TrustPage() {
  const [tenants, setTenants] = useState<TenantTrust[]>([]);
  const [loading, setLoading] = useState(true);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    api.getClient().get("/super-admin/trust")
      .then((response) => setTenants(response.data.data || []))
      .catch(() => toast.error("Gagal memuat data trust."))
      .finally(() => setLoading(false));
  }, []);

  const averageScore = tenants.length ? tenants.reduce((sum, t) => sum + t.trust_score, 0) / tenants.length : 0;

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-bg-surface" />;

  return <div className="mx-auto max-w-5xl space-y-6">
    <div>
      <h1 className="text-3xl font-extrabold text-white">Trust Ledger</h1>
      <p className="mt-1 text-sm text-text-secondary">Skor kepercayaan & ledger setiap promotor (EO) — dasar identitas kategori.</p>
    </div>

    <div className="grid gap-4 sm:grid-cols-4">
      <div className="rounded-2xl border border-bg-border bg-bg-surface p-6"><ShieldCheck className="h-5 w-5 text-primary" /><p className="mt-3 text-xs text-text-muted">EO Terpantau</p><p className="text-2xl font-black text-white">{tenants.length}</p></div>
      <div className="rounded-2xl border border-bg-border bg-bg-surface p-6"><ShieldCheck className="h-5 w-5 text-accent" /><p className="mt-3 text-xs text-text-muted">Rata-rata Skor</p><p className="text-2xl font-black text-accent">{averageScore.toFixed(1)}</p></div>
      <div className="rounded-2xl border border-bg-border bg-bg-surface p-6"><CheckCircle className="h-5 w-5 text-success" /><p className="mt-3 text-xs text-text-muted">Order Dibayar</p><p className="text-2xl font-black text-white">{tenants.reduce((s, t) => s + t.paid_orders, 0)}</p></div>
      <div className="rounded-2xl border border-bg-border bg-bg-surface p-6"><RotateCcw className="h-5 w-5 text-danger" /><p className="mt-3 text-xs text-text-muted">Refund</p><p className="text-2xl font-black text-danger">{tenants.reduce((s, t) => s + t.refunded_orders, 0)}</p></div>
    </div>

    <section className="rounded-2xl border border-bg-border bg-bg-surface p-6">
      <h2 className="font-bold text-white">Peringkat EO</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-bg-border text-left text-xs uppercase tracking-wider text-text-muted">
              <th className="pb-3 pr-4 font-semibold">EO / Tenant</th>
              <th className="pb-3 pr-4 font-semibold">Badge</th>
              <th className="pb-3 pr-4 font-semibold">Trust Score</th>
              <th className="pb-3 pr-4 font-semibold">Paid</th>
              <th className="pb-3 pr-4 font-semibold">Refund</th>
              <th className="pb-3 pr-4 font-semibold">Entri Ledger</th>
              <th className="pb-3 font-semibold">Balance Escrow</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => {
              const badge = BADGE_STYLE[tenant.badge] || BADGE_STYLE.none;
              return (
                <tr key={tenant.id} className="border-b border-bg-border/50">
                  <td className="py-3 pr-4"><p className="font-bold text-white">{tenant.name}</p><p className="text-xs text-text-muted">{tenant.slug} · {tenant.status}</p></td>
                  <td className="py-3 pr-4"><span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${badge.className}`}>{badge.label}</span></td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white">{tenant.trust_score.toFixed(1)}</span>
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-bg-elevated">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.min(100, tenant.trust_score)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-text-secondary">{tenant.paid_orders}</td>
                  <td className="py-3 pr-4 text-text-secondary">{tenant.refunded_orders}</td>
                  <td className="py-3 pr-4 text-text-secondary">{tenant.ledger_entries}</td>
                  <td className="py-3 font-bold text-white flex items-center gap-1"><Wallet2 className="h-4 w-4 text-primary" />{formatCurrency(tenant.balance)}</td>
                </tr>
              );
            })}
            {!tenants.length && <tr><td colSpan={7} className="py-8 text-center text-sm text-text-muted">Belum ada data trust.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    <section className="rounded-2xl border border-bg-border bg-bg-surface p-6 flex items-start gap-4">
      <ListChecks className="h-6 w-6 text-primary shrink-0" />
      <div className="text-sm text-text-secondary">
        <p className="font-bold text-white">Cara skor dihitung</p>
        <p className="mt-1">Skor = 60% tingkat penyelesaian event + 40% (1 − rasio refund). Badge: bronze ≥ 40, silver ≥ 60, gold ≥ 80, verified ≥ 90 tanpa refund. Skor diperbarui otomatis dari setiap transaksi paid/refund melalui Trust Ledger.</p>
      </div>
    </section>
  </div>;
}
