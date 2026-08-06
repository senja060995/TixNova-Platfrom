"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Calendar, MapPin, Ticket, Send, Eye, Armchair, Wallet2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Event } from "@/types";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

export default function PromotorEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const fetchEvents = () => {
    setLoading(true);
    api.getClient().get("/promotor/events")
      .then((res) => setEvents(res.data.data.data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handlePublish = async (eventSlug: string) => {
    setPublishingId(eventSlug);
    try {
      await api.getClient().post(`/promotor/events/${eventSlug}/publish`);
      toast.success("Event berhasil disubmit untuk diajukan ke admin!");
      fetchEvents();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Gagal mengajukan event.";
      toast.error(msg);
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Kelola Event Saya</h1>
          <p className="text-text-secondary text-sm mt-1">
            Daftar event yang Anda buat sebagai promotor.
          </p>
        </div>

        <Link href="/dashboard/events/create">
          <Button className="bg-primary hover:bg-primary-dark font-bold flex items-center gap-2 shadow-lg shadow-primary/30">
            <Plus className="w-4 h-4" />
            <span>Buat Event Baru</span>
          </Button>
        </Link>
      </div>

      {/* Events List Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-bg-surface rounded-2xl border border-bg-border" />
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const statusConfig: Record<string, { label: string; bg: string }> = {
              approved: { label: "Disetujui / Aktif", bg: "bg-success/20 text-success border-success/30" },
              pending: { label: "Menunggu Review", bg: "bg-accent/20 text-accent border-accent/30" },
              draft: { label: "Draft", bg: "bg-text-muted/20 text-text-secondary border-text-muted/30" },
              rejected: { label: "Ditolak", bg: "bg-danger/20 text-danger border-danger/30" },
              ongoing: { label: "Sedang Berlangsung", bg: "bg-info/20 text-info border-info/30" },
              completed: { label: "Selesai", bg: "bg-success/20 text-success border-success/30" },
              cancelled: { label: "Dibatalkan", bg: "bg-danger/20 text-danger border-danger/30" },
            };
            const currentStatus = statusConfig[event.status] || { label: event.status, bg: "bg-text-muted/20 text-white" };

            return (
              <div
                key={event.id}
                className="bg-bg-surface border border-bg-border rounded-2xl overflow-hidden flex flex-col justify-between hover:border-primary/40 transition-all"
              >
                <div>
                  {/* Banner Image */}
                  <div className="h-40 bg-bg-elevated relative overflow-hidden">
                    <img
                      src={event.banner || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800"}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${currentStatus.bg}`}>
                        {currentStatus.label}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-white text-lg line-clamp-1">{event.title}</h3>
                    <div className="text-xs text-text-secondary space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>{formatDate(event.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>{event.venue}, {event.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-3.5 h-3.5 text-primary" />
                        <span>{event.tickets?.length || 0} Kategori Tiket</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 border-t border-bg-border/60 bg-bg-surface/50 flex flex-wrap items-center gap-2">
                  <Link href={`/events/${event.slug}`} target="_blank">
                    <Button variant="outline" size="sm" className="border-bg-border text-xs">
                      <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                    </Button>
                  </Link>
                  <Link href={`/dashboard/events/${event.slug}/seat-map`}>
                    <Button variant="outline" size="sm" className="border-bg-border text-xs">
                      <Armchair className="w-3.5 h-3.5 mr-1" /> Seat Map
                    </Button>
                  </Link>
                  <Link href={`/dashboard/events/${event.slug}/tickets`}>
                    <Button variant="outline" size="sm" className="border-bg-border text-xs">
                      <Ticket className="w-3.5 h-3.5 mr-1" /> Tiket
                    </Button>
                  </Link>
                  <Link href={`/dashboard/events/${event.slug}/edit`}>
                    <Button variant="outline" size="sm" className="border-bg-border text-xs">
                      <Eye className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                  </Link>
                  <Link href={`/dashboard/events/${event.slug}/erp`}>
                    <Button variant="outline" size="sm" className="border-bg-border text-xs">
                      <Wallet2 className="w-3.5 h-3.5 mr-1" /> ERP
                    </Button>
                  </Link>

                  {event.status === "draft" && (
                    <Button
                      size="sm"
                      onClick={() => handlePublish(event.slug)}
                      disabled={publishingId === event.slug}
                      className="bg-primary hover:bg-primary-dark text-xs font-bold"
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />
                      {publishingId === event.slug ? "Submitting..." : "Ajukan Event"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-bg-surface border border-bg-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Belum Ada Event</h3>
          <p className="text-text-secondary text-sm max-w-md mx-auto mb-6">
            Anda belum pernah membuat event. Buat event pertama Anda sekarang dan mulai jual tiket secara profesional!
          </p>
          <Link href="/dashboard/events/create">
            <Button className="bg-primary hover:bg-primary-dark font-bold">
              Buat Event Pertama
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
