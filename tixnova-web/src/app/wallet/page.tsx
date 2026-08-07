"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TicketQrCode } from "@/components/tickets/TicketQrCode";
import { AppBottomNav } from "@/components/wallet/AppBottomNav";
import {
  Wallet as WalletIcon,
  Calendar,
  MapPin,
  QrCode,
  X,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface UserTicket {
  id: number;
  qr_code: string;
  qr_used: boolean;
  seat_label?: string;
  attendee_name: string;
  attendee_email: string;
  ticket: { name: string; type: string; price: number };
  order: {
    order_code: string;
    event: {
      title: string;
      venue: string;
      city: string;
      start_date: string;
      banner?: string;
    };
  };
}

export default function WalletPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [upcoming, setUpcoming] = useState<UserTicket[]>([]);
  const [past, setPast] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null);
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
      .get("/user/tickets")
      .then((res) => {
        const all: UserTicket[] = res.data.data || [];
        setTickets(all);
        const now = Date.now();
        setUpcoming(all.filter((t) => new Date(t.order.event.start_date).getTime() > now));
        setPast(all.filter((t) => new Date(t.order.event.start_date).getTime() <= now));
      })
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-24 pt-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> TixNova
          </p>
          <h1 className="mt-1 text-2xl font-black text-white">Dompet Tiket</h1>
        </div>
        <div className="rounded-2xl border border-bg-border bg-bg-surface px-3 py-2 text-center">
          <p className="text-lg font-black text-white leading-none">{tickets.length}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-text-muted">Tiket</p>
        </div>
      </header>

      {/* Content */}
      <main className="mt-6 flex-1">
        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-3xl border border-bg-border bg-bg-surface" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-bg-border bg-bg-surface p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <WalletIcon className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">Dompet masih kosong</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Belum ada tiket aktif. Jelajahi konser terbaru dan simpan tiketmu di sini.
            </p>
            <Link
              href="/events"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-bold text-white"
            >
              Jelajahi Event <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className="group w-full rounded-3xl border border-bg-border bg-bg-surface p-5 text-left transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">{t.ticket.name}</p>
                    <h3 className="mt-1 truncate text-base font-bold text-white">{t.order.event.title}</h3>
                    <div className="mt-2 space-y-1 text-xs text-text-secondary">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {formatDate(t.order.event.start_date)}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {t.order.event.venue}, {t.order.event.city}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 rounded-xl bg-white p-2">
                    <QrCode className="h-9 w-9 text-black" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-bg-border/60 pt-3">
                  <span className="text-xs text-text-muted">{t.attendee_name}</span>
                  <span className="text-xs font-semibold text-primary">Ketuk untuk QR</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {past.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Tiket Lalu ({past.length})</p>
            <div className="mt-3 space-y-2">
              {past.slice(0, 5).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className="flex w-full items-center justify-between rounded-2xl border border-bg-border/60 bg-bg-surface/60 px-4 py-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{t.order.event.title}</p>
                    <p className="text-xs text-text-muted">{formatDate(t.order.event.start_date)}</p>
                  </div>
                  <QrCode className="h-5 w-5 shrink-0 text-text-muted" />
                </button>
              ))}
            </div>
          </div>
        )}

        <Link
          href="/dashboard/my-tickets"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-primary"
        >
          Kelola semua tiket <ArrowRight className="h-4 w-4" />
        </Link>
      </main>

      {/* Bottom nav (app-lite) */}
      <AppBottomNav />

      {/* Fullscreen QR modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <button
            onClick={() => setSelectedTicket(null)}
            className="absolute right-4 top-4 rounded-full bg-bg-surface p-2 text-text-muted hover:text-white"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="w-full max-w-sm space-y-5 text-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">{selectedTicket.ticket.name}</p>
              <h3 className="mt-1 truncate text-xl font-black text-white">
                {selectedTicket.order.event.title}
              </h3>
              <p className="mt-1 text-xs text-text-secondary">
                {selectedTicket.attendee_name}
                {selectedTicket.seat_label ? ` • Kursi ${selectedTicket.seat_label}` : ""}
              </p>
            </div>
            <div className="rounded-3xl bg-white p-6">
              <TicketQrCode value={selectedTicket.qr_code} size={240} />
              <code className="mt-3 block text-xs font-mono font-bold uppercase tracking-wider text-black">
                {selectedTicket.qr_code}
              </code>
            </div>
            <p className="text-xs text-text-muted">
              {selectedTicket.qr_used
                ? "Tiket ini sudah digunakan untuk check-in."
                : "Tunjukkan QR ini kepada petugas di venue untuk check-in."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
