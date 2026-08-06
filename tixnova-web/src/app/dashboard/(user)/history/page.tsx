"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Calendar, MapPin, CheckCircle2, Clock, XCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OrderHistory {
  id: number;
  order_code: string;
  subtotal: number;
  admin_fee: number;
  total: number;
  status: "paid" | "pending" | "cancelled" | "expired";
  created_at: string;
  event?: {
    title: string;
    venue: string;
    city: string;
    start_date: string;
  };
  items?: Array<{
    ticket?: { name: string };
  }>;
}

export default function UserHistoryPage() {
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getClient().get("/user/orders", { params: { _t: Date.now() } })
      .then((res) => setOrders(res.data.data?.data || res.data.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-bg-surface rounded w-48" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-bg-surface rounded-2xl border border-bg-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Riwayat Transaksi Saya</h1>
        <p className="text-text-secondary text-sm mt-1">
          Daftar seluruh pesanan dan riwayat pembayaran tiket konser Anda.
        </p>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = {
              paid: { label: "Lunas / Terverifikasi", bg: "bg-success/20 text-success border-success/30", icon: CheckCircle2 },
              pending: { label: "Menunggu Pembayaran", bg: "bg-accent/20 text-accent border-accent/30", icon: Clock },
              cancelled: { label: "Dibatalkan", bg: "bg-danger/20 text-danger border-danger/30", icon: XCircle },
              expired: { label: "Kadaluarsa", bg: "bg-text-muted/20 text-text-secondary border-text-muted/30", icon: XCircle },
            }[order.status] || { label: order.status, bg: "bg-text-muted/20 text-white", icon: Clock };

            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={order.id}
                className="bg-bg-surface border border-bg-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition-all shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <code className="font-mono font-bold text-white text-sm">{order.order_code}</code>
                    <span className={`px-3 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${statusConfig.bg}`}>
                      <StatusIcon className="w-3.5 h-3.5" /> {statusConfig.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base">{order.event?.title || "Event Konser"}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
                    {order.event?.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {formatDate(order.event.start_date)}
                      </span>
                    )}
                    {order.event?.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        {order.event.venue}, {order.event.city}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-bg-border pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className="text-xs text-text-muted block">Total Pembayaran</span>
                    <span className="font-extrabold text-primary text-lg block">{formatCurrency(order.total)}</span>
                  </div>

                  <Link href={`/checkout/success?code=${order.order_code}`}>
                    <Button variant="outline" size="sm" className="border-bg-border font-bold text-xs flex items-center gap-1">
                      <span>Detail</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-bg-surface border border-bg-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Belum Ada Transaksi</h3>
          <p className="text-text-secondary text-sm max-w-md mx-auto mb-6">
            Anda belum memiliki riwayat pesanan. Cari event favoritmu sekarang!
          </p>
          <Link href="/events">
            <Button className="bg-primary hover:bg-primary-dark font-bold">
              Jelajahi Event Konser
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
