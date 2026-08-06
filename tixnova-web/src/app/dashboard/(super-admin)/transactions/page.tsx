"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Filter, RefreshCw, Search, ShoppingBag, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface Transaction {
  id: number;
  order_code: string;
  buyer: { name: string | null; email: string | null; phone: string | null };
  total: number;
  status: "pending" | "paid" | "cancelled" | "expired" | "refunded";
  created_at: string;
  paid_at?: string;
  event?: { id: number; title: string; slug: string } | null;
  tenant?: { id: number; name: string } | null;
  payment?: { provider: string; method: string; status: string; paid_at?: string } | null;
  refund?: { status: string; amount: number } | null;
}

interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  current_page: number;
  last_page: number;
}

const statusConfig: Record<Transaction["status"], { label: string; cls: string }> = {
  paid: { label: "Lunas", cls: "bg-success/20 text-success border-success/30" },
  pending: { label: "Pending", cls: "bg-accent/20 text-accent border-accent/30" },
  cancelled: { label: "Batal", cls: "bg-danger/20 text-danger border-danger/30" },
  expired: { label: "Kadaluarsa", cls: "bg-text-muted/20 text-text-muted border-bg-border" },
  refunded: { label: "Refund", cls: "bg-info/20 text-info border-info/30" },
};

export default function SuperAdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginatedTransactions>({ data: [], total: 0, current_page: 1, last_page: 1 });

  const fetchTransactions = () => {
    setLoading(true);
    const params: Record<string, unknown> = { page, per_page: 15 };
    if (search.trim()) params.search = search.trim();
    if (statusFilter !== "all") params.status = statusFilter;

    api.getClient().get("/super-admin/orders", { params })
      .then((response) => {
        const data = response.data.data as PaginatedTransactions;
        setTransactions(data.data || []);
        setMeta(data);
      })
      .catch(() => {
        setTransactions([]);
        toast.error("Gagal memuat transaksi platform.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const frame = requestAnimationFrame(fetchTransactions);

    return () => cancelAnimationFrame(frame);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const stats = [
    { label: "Total Transaksi", value: meta.total, icon: ShoppingBag, color: "text-primary", bg: "bg-primary/10" },
    { label: "Lunas di Halaman", value: transactions.filter((transaction) => transaction.status === "paid").length, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "Pending di Halaman", value: transactions.filter((transaction) => transaction.status === "pending").length, icon: Clock, color: "text-accent", bg: "bg-accent/10" },
    { label: "Refund di Halaman", value: transactions.filter((transaction) => transaction.status === "refunded").length, icon: XCircle, color: "text-info", bg: "bg-info/10" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Semua Transaksi</h1>
          <p className="mt-1 text-sm text-text-secondary">Monitor transaksi lintas tenant. Data kontak pembeli dimasking secara default.</p>
        </div>
        <Button onClick={fetchTransactions} variant="outline" className="border-bg-border"><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-bg-border bg-bg-surface p-5"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div><div><p className="text-xs text-text-muted">{stat.label}</p><p className="text-xl font-black text-white">{stat.value}</p></div></div>)}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" /><Input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { setPage(1); fetchTransactions(); } }} placeholder="Cari kode order atau pembeli..." className="border-bg-border bg-bg-surface pl-11 text-white" /></div>
        <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="rounded-xl border border-bg-border bg-bg-surface px-4 py-2.5 text-sm text-text-secondary"><option value="all">Semua Status</option>{Object.entries(statusConfig).map(([value, status]) => <option key={value} value={value}>{status.label}</option>)}</select>
        <Button onClick={() => { setPage(1); fetchTransactions(); }}><Filter className="mr-2 h-4 w-4" /> Filter</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-surface">
        {loading ? <div className="p-12 text-center text-text-secondary">Memuat transaksi...</div> : transactions.length ? (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm text-text-secondary"><thead className="border-b border-bg-border bg-bg-elevated/60 text-xs uppercase text-text-muted"><tr><th className="px-5 py-4">Kode Order</th><th className="px-5 py-4">Pembeli</th><th className="px-5 py-4">Event</th><th className="px-5 py-4">Promotor</th><th className="px-5 py-4">Total</th><th className="px-5 py-4">Pembayaran</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Tanggal</th></tr></thead><tbody className="divide-y divide-bg-border/60">
            {transactions.map((transaction) => {
              const status = statusConfig[transaction.status];
              return <tr key={transaction.id} className="hover:bg-bg-elevated/30"><td className="px-5 py-3.5 font-mono text-xs font-bold text-white">{transaction.order_code}</td><td className="px-5 py-3.5"><p className="font-medium text-white">{transaction.buyer.name || "—"}</p><p className="text-xs text-text-muted">{transaction.buyer.email || "—"}</p></td><td className="px-5 py-3.5 text-xs">{transaction.event?.title || "—"}</td><td className="px-5 py-3.5 text-xs">{transaction.tenant?.name || "—"}</td><td className="px-5 py-3.5 font-bold text-primary">{formatCurrency(transaction.total)}</td><td className="px-5 py-3.5 text-xs"><p className="capitalize">{transaction.payment?.provider || "—"}</p><p className="text-text-muted">{transaction.payment?.status || "Belum ada"}</p></td><td className="px-5 py-3.5"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${status.cls}`}>{status.label}</span>{transaction.refund && <p className="mt-1 text-xs text-info">Refund: {transaction.refund.status}</p>}</td><td className="px-5 py-3.5 text-xs">{formatDate(transaction.created_at)}</td></tr>;
            })}
          </tbody></table></div>
        ) : <div className="space-y-3 p-12 text-center"><AlertCircle className="mx-auto h-12 w-12 text-text-muted" /><p className="text-sm text-text-secondary">Tidak ada transaksi yang sesuai.</p></div>}
      </div>

      {meta.last_page > 1 && <div className="flex justify-center gap-3"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Sebelumnya</Button><span className="py-2 text-sm text-text-secondary">Halaman {meta.current_page} / {meta.last_page}</span><Button variant="outline" size="sm" disabled={page === meta.last_page} onClick={() => setPage((current) => current + 1)}>Berikutnya</Button></div>}
    </div>
  );
}
