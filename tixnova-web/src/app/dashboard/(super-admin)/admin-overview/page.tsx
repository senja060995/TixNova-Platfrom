"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  Users,
  Building2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface SuperAdminDashboardData {
  stats: {
    total_tenants: number;
    active_tenants: number;
    pending_tenants: number;
    total_events: number;
    pending_events: number;
    approved_events: number;
    total_users: number;
    total_orders: number;
    paid_orders: number;
    total_revenue: number;
    platform_commission: number;
  };
  top_tenants: Array<{
    id: number;
    name: string;
    slug: string;
    orders_count?: number;
    orders_sum_total?: number;
  }>;
}

export default function SuperAdminOverviewPage() {
  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getClient().get("/super-admin/dashboard")
      .then((res) => setData(res.data.data))
      .catch(() => setData(null))
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
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-accent font-semibold text-sm uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Super Admin Control Panel</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Platform Control Overview</h1>
          <p className="text-text-secondary text-sm mt-1">
            Ringkasan performa platform TixNova, komisi platform, dan persetujuan tenant.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/approvals">
            <Button className="bg-primary hover:bg-primary-dark font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Event Pending ({stats?.pending_events || 0})</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total GMV Revenue */}
        <div className="bg-bg-surface p-6 rounded-2xl border border-bg-border space-y-2 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
            <DollarSign className="w-6 h-6" />
          </div>
          <span className="text-xs text-text-muted font-medium block">Total GMV Penjualan</span>
          <h3 className="text-2xl font-black text-white">{formatCurrency(stats?.total_revenue || 0)}</h3>
          <span className="text-[11px] text-success flex items-center gap-1 font-semibold pt-1">
            <TrendingUp className="w-3.5 h-3.5" /> Total dari seluruh tenant
          </span>
        </div>

        {/* Platform Commission Earned */}
        <div className="bg-bg-surface p-6 rounded-2xl border border-bg-border space-y-2 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-accent/20 text-accent flex items-center justify-center border border-accent/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-xs text-text-muted font-medium block">Komisi Platform TixNova</span>
          <h3 className="text-2xl font-black text-white">{formatCurrency(stats?.platform_commission || 0)}</h3>
          <span className="text-[11px] text-accent block pt-1">Pendapatan murni platform</span>
        </div>

        {/* Tenants Count */}
        <div className="bg-bg-surface p-6 rounded-2xl border border-bg-border space-y-2 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-success/20 text-success flex items-center justify-center border border-success/30">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="text-xs text-text-muted font-medium block">Promotor & Tenant</span>
          <h3 className="text-2xl font-black text-white">{stats?.total_tenants || 0} Organisasi</h3>
          <span className="text-[11px] text-text-secondary block pt-1">
            {stats?.active_tenants || 0} Aktif • {stats?.pending_tenants || 0} Pending
          </span>
        </div>

        {/* Total Users */}
        <div className="bg-bg-surface p-6 rounded-2xl border border-bg-border space-y-2 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-info/20 text-info flex items-center justify-center border border-info/30">
            <Users className="w-6 h-6" />
          </div>
          <span className="text-xs text-text-muted font-medium block">Total Pengguna Terdaftar</span>
          <h3 className="text-2xl font-black text-white">{stats?.total_users || 0} Akun</h3>
          <span className="text-[11px] text-text-secondary block pt-1">{stats?.paid_orders || 0} transaksi lunas</span>
        </div>
      </div>

      {/* Top Tenants Table */}
      <div className="bg-bg-surface p-6 sm:p-8 rounded-2xl border border-bg-border space-y-6">
        <div className="flex items-center justify-between border-b border-bg-border pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Promotor & Organisasi Teratas</h3>
            <p className="text-xs text-text-secondary">Penyelenggara event dengan total penjualan tiket tertinggi.</p>
          </div>
          <Link href="/dashboard/tenants" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
            Kelola Semua Tenant <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data?.top_tenants && data.top_tenants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="text-xs uppercase bg-bg-elevated/50 text-text-muted border-b border-bg-border">
                <tr>
                  <th className="py-3 px-4">Nama Promotor</th>
                  <th className="py-3 px-4">Jumlah Transaksi</th>
                  <th className="py-3 px-4">Total GMV Penjualan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border/60">
                {data.top_tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-bg-elevated/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{t.name}</td>
                    <td className="py-3.5 px-4">{t.orders_count || 0} Order</td>
                    <td className="py-3.5 px-4 font-bold text-primary">{formatCurrency(Number(t.orders_sum_total || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-text-secondary text-sm">
            Belum ada data tenant teratas.
          </div>
        )}
      </div>
    </div>
  );
}
