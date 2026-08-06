"use client";

import { useCallback, useEffect, useState } from "react";
import { DollarSign, Download, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface PlatformReport {
  summary: { paid_orders: number; ticket_revenue: number; gmv: number; platform_commission: number; promotor_payout: number; total_tenants: number };
  breakdown: Array<{ period: string; paid_orders: number; gmv: number; platform_commission: number }>;
  top_tenants: Array<{ id: number; name: string; paid_orders: number; gmv: number; promotor_payout: number }>;
}

export default function SuperAdminReportsPage() {
  const [data, setData] = useState<PlatformReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [period, setPeriod] = useState("30");

  const fetchReport = useCallback(() => {
    setLoading(true);
    api.getClient().get("/super-admin/reports/revenue", { params: { days: period } })
      .then((response) => setData(response.data.data))
      .catch(() => { setData(null); toast.error("Gagal memuat laporan platform."); })
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => { void fetchReport(); });
    return () => cancelAnimationFrame(frame);
  }, [fetchReport]);

  const exportReport = async (format: "csv" | "pdf") => {
    setExporting(true);
    try {
      const response = await api.getClient().get("/super-admin/reports/export", { params: { days: period, format }, responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `laporan-platform-${period}-hari.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Gagal mengunduh laporan."); } finally { setExporting(false); }
  };

  const cards = [
    { label: "GMV", value: formatCurrency(data?.summary.gmv || 0), icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
    { label: "Komisi Platform", value: formatCurrency(data?.summary.platform_commission || 0), icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" },
    { label: "Order Lunas", value: `${data?.summary.paid_orders || 0} Order`, icon: ShoppingBag, color: "text-success", bg: "bg-success/10" },
    { label: "Tenant Aktif", value: `${data?.summary.total_tenants || 0} Tenant`, icon: Users, color: "text-info", bg: "bg-info/10" },
  ];

  return <div className="space-y-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-3xl font-extrabold text-white">Laporan Platform</h1><p className="mt-1 text-sm text-text-secondary">GMV, komisi platform, dan performa promotor tanpa PII pembeli.</p></div><div className="flex flex-wrap gap-3"><select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-xl border border-bg-border bg-bg-surface px-3 py-2.5 text-sm text-text-secondary"><option value="7">7 Hari</option><option value="30">30 Hari</option><option value="90">90 Hari</option><option value="365">1 Tahun</option></select><Button variant="outline" onClick={() => exportReport("csv")} disabled={exporting} className="border-bg-border"><Download className="mr-2 h-4 w-4" />CSV</Button><Button onClick={() => exportReport("pdf")} disabled={exporting} className="bg-primary hover:bg-primary-dark"><Download className="mr-2 h-4 w-4" />PDF</Button></div></div>
    {loading ? <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 animate-pulse">{[0, 1, 2, 3].map((index) => <div key={index} className="h-32 rounded-2xl border border-bg-border bg-bg-surface" />)}</div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map((card) => <div key={card.label} className="space-y-2 rounded-2xl border border-bg-border bg-bg-surface p-6"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bg}`}><card.icon className={`h-5 w-5 ${card.color}`} /></div><p className="text-xs text-text-muted">{card.label}</p><p className="text-2xl font-black text-white">{card.value}</p></div>)}</div>}
    <section className="rounded-2xl border border-bg-border bg-bg-surface p-6"><h2 className="border-b border-bg-border pb-4 font-bold text-white">Performa Harian</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead className="border-b border-bg-border text-left text-xs uppercase text-text-muted"><tr><th className="p-3">Tanggal</th><th className="p-3 text-right">Order</th><th className="p-3 text-right">GMV</th><th className="p-3 text-right">Komisi</th></tr></thead><tbody>{data?.breakdown.map((row) => <tr key={row.period} className="border-b border-bg-border/50 text-text-secondary"><td className="p-3 text-white">{row.period}</td><td className="p-3 text-right">{row.paid_orders}</td><td className="p-3 text-right">{formatCurrency(row.gmv)}</td><td className="p-3 text-right text-accent">{formatCurrency(row.platform_commission)}</td></tr>)}</tbody></table></div></section>
    <section className="rounded-2xl border border-bg-border bg-bg-surface p-6"><h2 className="border-b border-bg-border pb-4 font-bold text-white">Top Promotor</h2><div className="mt-4 space-y-3">{data?.top_tenants.map((tenant, index) => <div key={tenant.id} className="flex items-center gap-4 rounded-xl bg-bg-elevated p-4"><span className="font-black text-primary">#{index + 1}</span><div className="flex-1"><p className="font-bold text-white">{tenant.name}</p><p className="text-xs text-text-muted">{tenant.paid_orders} order lunas</p></div><div className="text-right"><p className="font-bold text-white">{formatCurrency(tenant.gmv)}</p><p className="text-xs text-primary">Payout {formatCurrency(tenant.promotor_payout)}</p></div></div>)}</div></section>
  </div>;
}
