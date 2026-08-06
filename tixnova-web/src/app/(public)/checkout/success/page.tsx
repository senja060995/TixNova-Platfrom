"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

interface PaymentStatus {
  order_code: string;
  order_status: "pending" | "paid" | "cancelled" | "refunded" | "expired";
  expires_at?: string;
  community_code?: string | null;
  payment?: {
    status: string;
    paid_at?: string;
  };
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("code");
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(Boolean(orderCode));

  useEffect(() => {
    if (!orderCode) return;

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const loadStatus = async () => {
      try {
        const response = await api.getClient().get(`/payments/${orderCode}/status`, {
          params: { _t: Date.now() },
        });
        const nextStatus = response.data.data as PaymentStatus;

        if (!active) return;

        setStatus(nextStatus);
        if (nextStatus.order_status === "pending") {
          timer = setTimeout(loadStatus, 3000);
        }
      } catch {
        if (active) setStatus(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    setLoading(true);
    loadStatus();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [orderCode]);

  if (loading) {
    return <div className="min-h-screen bg-bg-base" />;
  }

  if (!status) {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center p-4 text-center">
        <section className="max-w-md rounded-2xl border border-bg-border bg-bg-surface p-8">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-danger" />
          <h1 className="text-xl font-bold text-white">Order Tidak Ditemukan</h1>
          <p className="mt-2 text-sm text-text-secondary">Masuk dengan akun yang digunakan saat checkout untuk melihat status pesanan.</p>
          <Link href="/login" className="mt-6 inline-block"><Button>Masuk</Button></Link>
        </section>
      </main>
    );
  }

  const isPaid = status.order_status === "paid";
  const isPending = status.order_status === "pending";

  return (
    <main className="min-h-screen bg-bg-base px-4 py-12 text-text-primary">
      <section className="mx-auto max-w-xl rounded-3xl border border-bg-border bg-bg-surface p-8 text-center">
        {isPaid ? <CheckCircle2 className="mx-auto h-16 w-16 text-success" /> : isPending ? <Clock className="mx-auto h-16 w-16 text-accent" /> : <AlertCircle className="mx-auto h-16 w-16 text-danger" />}
        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-text-muted">Kode transaksi</p>
        <h1 className="mt-1 text-2xl font-black text-white">{status.order_code}</h1>
        <p className="mt-4 text-sm text-text-secondary">
          {isPaid ? "Pembayaran berhasil diverifikasi. E-tiket tersedia di menu Tiket Saya." : isPending ? "Kami sedang menunggu konfirmasi pembayaran dari Midtrans." : "Order ini tidak dapat diproses. Silakan buat order baru."}
        </p>
        {isPending && status.expires_at && <p className="mt-3 text-xs text-accent">Batas pembayaran: {new Date(status.expires_at).toLocaleString("id-ID")}</p>}
        {isPaid && status.community_code && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
            <span className="text-text-muted">Kode Komunitas:</span>{" "}
            <span className="font-bold text-primary">{status.community_code}</span>
            <span className="ml-2 text-text-muted">• Revenue share aktif</span>
          </div>
        )}
        {isPaid && <Link href="/dashboard/my-tickets" className="mt-6 inline-block"><Button>Lihat Tiket Saya</Button></Link>}
        {!isPaid && <Link href="/events" className="mt-6 inline-block"><Button variant="outline">Kembali ke Event</Button></Link>}
      </section>
    </main>
  );
}

export default function OrderSuccessPage() {
  return <Suspense fallback={<div className="min-h-screen bg-bg-base" />}><OrderSuccessContent /></Suspense>;
}
