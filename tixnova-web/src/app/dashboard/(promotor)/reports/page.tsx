"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, DollarSign, ShoppingBag, Ticket, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface ReportData {
  filters: { start_date: string; end_date: string };
  summary: {
    paid_orders: number;
    ticket_revenue: number;
    gmv: number;
    platform_commission: number;
    promotor_payout: number;
  };
  attendance: { tickets_sold: number; checked_in: number; check_in_rate: number };
  breakdown: Array<{ period: string; paid_orders: number; ticket_revenue: number; gmv: number; promotor_payout: number }>;
  tickets: Array<{ id: number; name: string; sold: number; ticket_revenue: number }>;
}

const downloadReport = async (url: string, format: "csv" | "pdf", days: string, setExporting: (value: boolean) => void) => {
  setExporting(true);
  try {
    const response = await api.getClient().get(url, { params: { days, format }, responseType: "blob" });
    const objectUrl = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `laporan-promotor-${days}-hari.${format}`;
    link.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    toast.error("Gagal mengunduh laporan.");
  } finally {
    setExporting(false);
  }
};

export default function PromotorReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [period, setPeriod] = useState("30");

  const fetchReport = useCallback(() => {
    setLoading(true);
    api.getClient().get("/promotor/reports", { params: { days: period } })
      .then((response) => setData(response.data.data))
      .catch(() => {
        setData(null);
        toast.error("Gagal memuat laporan.");
      })
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => { void fetchReport(); });
    return () => cancelAnimationFrame(frame);
  }, [fetchReport]);

  const cards = [
    { label: "Payout Promotor", value: formatCurrency(data?.summary.promotor_payout || 0), icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
    { label: "GMV", value: formatCurrency(data?.summary.gmv || 0), icon: ShoppingBag, color: "text-accent", bg: "bg-accent/10" },
    { label: "Tiket Terjual", value: `${data?.attendance.tickets_sold || 0} Tiket`, icon: Ticket, color: "text-success", bg: "bg-success/10" },
    { label: "Check-in", value: `${data?.attendance.check_in_rate || 0}%`, icon: Users, color: "text-info", bg: "bg-info/10" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-3xl font-extrabold text-white">Laporan Penjualan</h1><p className="mt-1 text-sm text-text-secondary">Payout, penjualan tiket, dan kehadiran tanpa data pribadi pembeli.</p></div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-xl border border-bg-border bg-bg-surface px-3 py-2.5 text-sm text-text-secondary">
            <option value="7">7 Hari</option><option value="30">30 Hari</option><option value="90">90 Hari</option><option value="365">1 Tahun</option>
          </select>
          <Button onClick={() => downloadReport("/promotor/reports/export", "csv", period, setExporting)} disabled={exporting} variant="outline" className="border-bg-border"><Download className="mr-2 h-4 w-4" />CSV</Button>
          <Button onClick={() => downloadReport("/promotor/reports/export", "pdf", period, setExporting)} disabled={exporting} className="bg-primary hover:bg-primary-dark"><Download className="mr-2 h-4 w-4" />PDF</Button>
        </div>
      </div>

      {loading ? <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 animate-pulse">{[0, 1, 2, 3].map((index) => <div key={index} className="h-32 rounded-2xl border border-bg-border bg-bg-surface" />)}</div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map((card) => <div key={card.label} className="space-y-2 rounded-2xl border border-bg-border bg-bg-surface p-6"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bg}`}><card.icon className={`h-5 w-5 ${card.color}`} /></div><p className="text-xs text-text-muted">{card.label}</p><p className="text-2xl font-black text-white">{card.value}</p></div>)}</div>}

      <section className="rounded-2xl border border-bg-border bg-bg-surface p-6">
        <h2 className="border-b border-bg-border pb-4 font-bold text-white">Ringkasan Kehadiran</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3 text-center"><div><p className="text-2xl font-black text-white">{data?.attendance.tickets_sold || 0}</p><p className="text-xs text-text-muted">Tiket terjual</p></div><div><p className="text-2xl font-black text-white">{data?.attendance.checked_in || 0}</p><p className="text-xs text-text-muted">Check-in valid</p></div><div><p className="text-2xl font-black text-primary">{data?.attendance.check_in_rate || 0}%</p><p className="text-xs text-text-muted">Rasio check-in</p></div></div>
      </section>

      <section className="rounded-2xl border border-bg-border bg-bg-surface p-6">
        <h2 className="border-b border-bg-border pb-4 font-bold text-white">Payout Harian</h2>
        <div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead className="border-b border-bg-border text-left text-xs uppercase text-text-muted"><tr><th className="p-3">Tanggal</th><th className="p-3 text-right">Order</th><th className="p-3 text-right">GMV</th><th className="p-3 text-right">Payout</th></tr></thead><tbody>{data?.breakdown.map((row) => <tr key={row.period} className="border-b border-bg-border/50 text-text-secondary"><td className="p-3 text-white">{row.period}</td><td className="p-3 text-right">{row.paid_orders}</td><td className="p-3 text-right">{formatCurrency(row.gmv)}</td><td className="p-3 text-right font-bold text-primary">{formatCurrency(row.promotor_payout)}</td></tr>)}</tbody></table>{!data?.breakdown.length && <p className="py-8 text-center text-sm text-text-muted">Belum ada transaksi lunas pada periode ini.</p>}</div>
      </section>
    </div>
  );
}
