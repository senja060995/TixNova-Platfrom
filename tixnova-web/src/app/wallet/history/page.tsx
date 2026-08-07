"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AppBottomNav } from "@/components/wallet/AppBottomNav";

interface OrderHistory {
  id: number;
  order_code: string;
  total: number;
  status: "paid" | "pending" | "cancelled" | "expired";
  event?: {
    title: string;
    venue: string;
    city: string;
    start_date: string;
  };
}

const STATUS_CONFIG: Record<
  OrderHistory["status"],
  { label: string; bg: string; icon: typeof Clock }
> = {
  paid: { label: "Lunas", bg: "bg-success/20 text-success border-success/30", icon: CheckCircle2 },
  pending: { label: "Menunggu", bg: "bg-accent/20 text-accent border-accent/30", icon: Clock },
  cancelled: { label: "Dibatalkan", bg: "bg-danger/20 text-danger border-danger/30", icon: XCircle },
  expired: { label: "Kadaluarsa", bg: "bg-text-muted/20 text-text-secondary border-text-muted/30", icon: XCircle },
};

export default function WalletHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const requested = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("access_token")) {
      router.replace("/login");
      return;
    }
    if (requested.current) return;
    requested.current = true;

    api
      .getClient()
      .get("/user/orders", { params: { _t: Date.now() } })
      .then((res) => setOrders(res.data.data?.data || res.data.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-24 pt-6">
      <header className="flex items-center gap-2">
        <Link
          href="/wallet"
          aria-label="Kembali ke Dompet"
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-bg-border bg-bg-surface text-text-secondary hover:text-primary hover:border-primary/50 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Riwayat Transaksi</h1>
          <p className="text-xs text-text-secondary">Semua pesanan dan pembayaranmu.</p>
        </div>
      </header>

      <main className="mt-6 flex-1">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-bg-border bg-bg-surface" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-bg-border bg-bg-surface p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CreditCard className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">Belum Ada Transaksi</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Anda belum memiliki riwayat pesanan. Cari event favoritmu sekarang!
            </p>
            <Link
              href="/events"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-bold text-white"
            >
              Jelajahi Event <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const config = STATUS_CONFIG[order.status] || {
                label: order.status,
                bg: "bg-text-muted/20 text-white",
                icon: Clock,
              };
              const StatusIcon = config.icon;

              return (
                <Link
                  key={order.id}
                  href={`/checkout/success?code=${order.order_code}`}
                  className="block rounded-2xl border border-bg-border bg-bg-surface p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">
                        {order.event?.title || "Event Konser"}
                      </p>
                      <div className="mt-1.5 space-y-1 text-xs text-text-secondary">
                        {order.event?.start_date && (
                          <p className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            {formatDate(order.event.start_date)}
                          </p>
                        )}
                        {order.event?.venue && (
                          <p className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            {order.event.venue}, {order.event.city}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${config.bg}`}>
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </span>
                      <p className="mt-1.5 text-sm font-extrabold text-primary">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-bg-border/60 pt-2 flex items-center justify-between">
                    <code className="font-mono text-[10px] text-text-muted">{order.order_code}</code>
                    <span className="text-[10px] font-semibold text-primary">Detail</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <AppBottomNav />
    </div>
  );
}
