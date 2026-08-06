"use client";

import { useState, useEffect } from "react";
import {
  ShoppingBag, Search, Eye, Download, RefreshCw, Filter
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Order {
  id: number;
  order_code: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  total: number;
  status: "pending" | "paid" | "cancelled" | "expired" | "refunded";
  created_at: string;
  event?: { title: string; id: number };
  items_count?: number;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  paid:      { label: "Lunas",      cls: "bg-success/20 text-success border-success/30" },
  pending:   { label: "Pending",    cls: "bg-accent/20 text-accent border-accent/30" },
  cancelled: { label: "Dibatalkan", cls: "bg-danger/20 text-danger border-danger/30" },
  expired:   { label: "Kadaluarsa", cls: "bg-text-muted/20 text-text-muted border-bg-border" },
  refunded:  { label: "Refund",     cls: "bg-info/20 text-info border-info/30" },
};

export default function PromotorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [events, setEvents] = useState<Array<{ id: number; title: string }>>([]);

  const fetchOrders = () => {
    setLoading(true);
    const params: Record<string, unknown> = {};
    if (search) params.search = search;
    if (statusFilter !== "all") params.status = statusFilter;
    if (eventFilter !== "all") params.event_id = eventFilter;

    // Coba ambil dari event pertama sebagai contoh (idealnya ada route /promotor/orders)
    api.getClient().get("/promotor/events")
      .then((res) => {
        const evList = res.data?.data?.data || [];
        setEvents(evList);
        if (evList.length > 0) {
          const evId = eventFilter !== "all" ? eventFilter : evList[0]?.id;
          return api.getClient().get(`/promotor/events/${evId}/orders`, { params });
        }
        return null;
      })
      .then((res) => {
        if (res) setOrders(res.data?.data?.data || res.data?.data || []);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [statusFilter, eventFilter]);

  const totals = {
    all: orders.length,
    paid: orders.filter((o) => o.status === "paid").length,
    pending: orders.filter((o) => o.status === "pending").length,
    revenue: orders.filter((o) => o.status === "paid").reduce((a, o) => a + o.total, 0),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Kelola Pesanan</h1>
          <p className="text-text-secondary text-sm mt-1">
            Monitor dan kelola semua pesanan tiket dari event Anda.
          </p>
        </div>
        <Button onClick={fetchOrders} variant="outline" className="border-bg-border flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Order", value: totals.all, cls: "text-white" },
          { label: "Lunas", value: totals.paid, cls: "text-success" },
          { label: "Pending", value: totals.pending, cls: "text-accent" },
          { label: "Revenue", value: formatCurrency(totals.revenue), cls: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="bg-bg-surface p-5 rounded-2xl border border-bg-border">
            <p className="text-xs text-text-muted mb-1">{s.label}</p>
            <p className={`text-xl font-black ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            type="text"
            placeholder="Cari kode order / nama pembeli..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchOrders()}
            className="pl-11 bg-bg-surface border-bg-border text-white rounded-xl"
          />
        </div>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-text-secondary text-sm focus:outline-none focus:border-primary"
        >
          <option value="all">Semua Event</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-text-secondary text-sm focus:outline-none focus:border-primary"
        >
          <option value="all">Semua Status</option>
          <option value="paid">Lunas</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-bg-surface border border-bg-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center animate-pulse text-text-secondary">Memuat data pesanan...</div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="text-xs uppercase bg-bg-elevated/60 text-text-muted border-b border-bg-border">
                <tr>
                  <th className="py-4 px-5">Kode Order</th>
                  <th className="py-4 px-5">Pembeli</th>
                  <th className="py-4 px-5">Event</th>
                  <th className="py-4 px-5">Total</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border/60">
                {orders.map((order) => {
                  const sc = statusConfig[order.status] || statusConfig.pending;
                  return (
                    <tr key={order.id} className="hover:bg-bg-elevated/30 transition-colors">
                      <td className="py-4 px-5 font-mono text-xs font-bold text-white">{order.order_code}</td>
                      <td className="py-4 px-5">
                        <p className="font-medium text-white">{order.buyer_name}</p>
                        <p className="text-xs text-text-muted">{order.buyer_email}</p>
                      </td>
                      <td className="py-4 px-5 text-xs">{order.event?.title || "—"}</td>
                      <td className="py-4 px-5 font-bold text-primary">{formatCurrency(order.total)}</td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${sc.cls}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-xs">{formatDate(order.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-text-muted mx-auto" />
            <p className="text-text-secondary text-sm">
              {events.length === 0
                ? "Buat event terlebih dahulu untuk melihat pesanan."
                : "Belum ada pesanan untuk event Anda."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
