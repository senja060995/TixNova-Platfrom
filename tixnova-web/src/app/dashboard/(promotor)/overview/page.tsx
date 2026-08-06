"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  Ticket,
  Calendar,
  ShoppingBag,
  Plus,
  QrCode,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

interface StatsData {
  total_events: number;
  active_events: number;
  total_orders: number;
  total_revenue: number;
  tickets_sold: number;
  recent_orders: Array<{
    id: number;
    order_code: string;
    buyer_name: string;
    total: number;
    status: string;
    created_at: string;
    event?: { title: string };
  }>;
}

export default function PromotorOverviewPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getClient().get("/promotor/dashboard/stats")
      .then((res) => setStats(res.data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-bg-surface rounded-xl w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-bg-surface rounded-2xl border border-bg-border" />
          ))}
        </div>
        <div className="h-64 bg-bg-surface rounded-2xl border border-bg-border" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Dashboard Promotor</h1>
          <p className="text-text-secondary text-sm mt-1">
            Ringkasan performa penjualan tiket & event Anda secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/scan">
            <Button variant="outline" className="border-bg-border flex items-center gap-2">
              <QrCode className="w-4 h-4 text-primary" />
              <span>Scan QR Tiket</span>
            </Button>
          </Link>
          <Link href="/dashboard/events/create">
            <Button className="bg-primary hover:bg-primary-dark flex items-center gap-2 font-bold shadow-lg shadow-primary/30">
              <Plus className="w-4 h-4" />
              <span>Buat Event Baru</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Revenue */}
        <div className="bg-bg-surface p-6 rounded-2xl border border-bg-border space-y-2 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
            <DollarSign className="w-6 h-6" />
          </div>
          <span className="text-xs text-text-muted font-medium block">Total Pendapatan</span>
          <h3 className="text-2xl font-black text-white">{formatCurrency(stats?.total_revenue || 0)}</h3>
          <span className="text-[11px] text-success flex items-center gap-1 font-semibold pt-1">
            <TrendingUp className="w-3.5 h-3.5" /> Pendapatan lunas
          </span>
        </div>

        {/* Tickets Sold */}
        <div className="bg-bg-surface p-6 rounded-2xl border border-bg-border space-y-2 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-accent/20 text-accent flex items-center justify-center border border-accent/30">
            <Ticket className="w-6 h-6" />
          </div>
          <span className="text-xs text-text-muted font-medium block">Tiket Terjual</span>
          <h3 className="text-2xl font-black text-white">{stats?.tickets_sold || 0} Tiket</h3>
          <span className="text-[11px] text-text-secondary block pt-1">Dari seluruh event</span>
        </div>

        {/* Active Events */}
        <div className="bg-bg-surface p-6 rounded-2xl border border-bg-border space-y-2 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-success/20 text-success flex items-center justify-center border border-success/30">
            <Calendar className="w-6 h-6" />
          </div>
          <span className="text-xs text-text-muted font-medium block">Event Aktif</span>
          <h3 className="text-2xl font-black text-white">{stats?.active_events || 0} Event</h3>
          <span className="text-[11px] text-text-secondary block pt-1">Total {stats?.total_events || 0} event</span>
        </div>

        {/* Total Orders */}
        <div className="bg-bg-surface p-6 rounded-2xl border border-bg-border space-y-2 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-info/20 text-info flex items-center justify-center border border-info/30">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <span className="text-xs text-text-muted font-medium block">Total Transaksi</span>
          <h3 className="text-2xl font-black text-white">{stats?.total_orders || 0} Order</h3>
          <span className="text-[11px] text-text-secondary block pt-1">Transaksi terverifikasi</span>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-bg-surface p-6 sm:p-8 rounded-2xl border border-bg-border space-y-6">
        <div className="flex items-center justify-between border-b border-bg-border pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Transaksi Terbaru</h3>
            <p className="text-xs text-text-secondary">Daftar pembelian tiket paling baru dari pengunjung.</p>
          </div>
          <Link href="/dashboard/orders" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
            Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.recent_orders && stats.recent_orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="text-xs uppercase bg-bg-elevated/50 text-text-muted border-b border-bg-border">
                <tr>
                  <th className="py-3 px-4">Kode Order</th>
                  <th className="py-3 px-4">Pemesan</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border/60">
                {stats.recent_orders.map((order) => (
                  <tr key={order.id} className="hover:bg-bg-elevated/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white text-xs">{order.order_code}</td>
                    <td className="py-3.5 px-4 font-medium text-white">{order.buyer_name}</td>
                    <td className="py-3.5 px-4 text-text-secondary">{order.event?.title || "-"}</td>
                    <td className="py-3.5 px-4 font-bold text-primary">{formatCurrency(order.total)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        order.status === "paid"
                          ? "bg-success/20 text-success"
                          : order.status === "pending"
                          ? "bg-accent/20 text-accent"
                          : "bg-danger/20 text-danger"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-text-secondary text-sm">
            Belum ada transaksi pembelian tiket terbaru.
          </div>
        )}
      </div>
    </div>
  );
}
