"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { TicketQrCode } from "@/components/tickets/TicketQrCode";
import { Armchair, Calendar, MapPin, QrCode, Ticket, X, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface UserTicket {
  id: number;
  qr_code: string;
  qr_used: boolean;
  seat_label?: string;
  attendee_name: string;
  attendee_email: string;
  ticket: {
    name: string;
    type: string;
    price: number;
  };
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

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null);

  useEffect(() => {
    api.getClient().get("/user/tickets", { params: { _t: Date.now() } })
      .then((res) => setTickets(res.data.data || []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-bg-surface rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-56 bg-bg-surface rounded-2xl border border-bg-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>E-Ticket Vault</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Tiket Saya ({tickets.length})</h1>
        <p className="text-text-secondary text-sm mt-1">
          Seluruh tiket konser resmi yang telah Anda beli. Tunjukkan QR Code saat check-in di venue.
        </p>
      </div>

      {/* Tickets Grid */}
      {tickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="bg-bg-surface border border-bg-border rounded-2xl overflow-hidden flex flex-col justify-between hover:border-primary/40 transition-all shadow-lg group"
            >
              {/* Event Header Banner */}
              <div className="h-36 bg-bg-elevated relative overflow-hidden">
                <Image
                  src={t.order.event.banner || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800"}
                  alt={t.order.event.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-bg-surface/30 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-white shadow-md">
                    {t.ticket.name}
                  </span>
                </div>
              </div>

              {/* Body Info */}
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-white text-lg line-clamp-1">{t.order.event.title}</h3>
                <div className="text-xs text-text-secondary space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{formatDate(t.order.event.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{t.order.event.venue}, {t.order.event.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>Pemegang: <strong className="text-white">{t.attendee_name}</strong></span>
                  </div>
                  {t.seat_label && (
                    <div className="flex items-center gap-2">
                      <Armchair className="w-3.5 h-3.5 text-primary" />
                      <span>Kursi: <strong className="text-white">{t.seat_label}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Ticket Action */}
              <div className="p-4 border-t border-bg-border/60 bg-bg-surface/50 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-text-muted block">Kode QR:</span>
                  <code className="font-mono text-primary font-bold text-xs">{t.qr_code}</code>
                </div>
                <Button
                  size="sm"
                  onClick={() => setSelectedTicket(t)}
                  className="bg-primary hover:bg-primary-dark font-bold text-xs flex items-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" /> Tampilkan QR
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-bg-surface border border-bg-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Belum Memiliki Tiket</h3>
          <p className="text-text-secondary text-sm max-w-md mx-auto mb-6">
            Anda belum pernah membeli tiket konser. Jelajahi event seru hari ini dan pesan tiket pertamamu!
          </p>
          <Link href="/events">
            <Button className="bg-primary hover:bg-primary-dark font-bold">
              Jelajahi Event Konser
            </Button>
          </Link>
        </div>
      )}

      {/* Enlarged QR Code Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-bg-border rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-6 animate-fade-in relative">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs text-primary font-bold uppercase tracking-wider block mb-1">E-Ticket Scan Gate</span>
              <h3 className="text-xl font-bold text-white line-clamp-1">{selectedTicket.order.event.title}</h3>
              <p className="text-xs text-text-secondary mt-1">
                {selectedTicket.ticket.name} • {selectedTicket.attendee_name}
                {selectedTicket.seat_label ? ` • Kursi ${selectedTicket.seat_label}` : ""}
              </p>
            </div>

            {/* QR Code Graphic */}
            <div className="bg-white p-6 rounded-2xl border flex flex-col items-center">
              <TicketQrCode value={selectedTicket.qr_code} />
              <code className="text-xs font-mono font-bold text-black mt-3 uppercase tracking-wider">
                {selectedTicket.qr_code}
              </code>
            </div>

            <p className="text-xs text-text-muted">
              Tunjukkan kode QR ini kepada petugas di lokasi venue untuk check-in.
            </p>

            <Button onClick={() => setSelectedTicket(null)} className="w-full bg-primary hover:bg-primary-dark font-bold">
              Tutup Modal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
