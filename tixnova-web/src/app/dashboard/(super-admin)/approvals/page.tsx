"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, XCircle, Sparkles, Calendar, MapPin, Building2, Ticket as TicketIcon, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Event } from "@/types";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

export default function SuperAdminEventApprovalsPage() {
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingEvent, setRejectingEvent] = useState<Event | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPendingEvents = () => {
    setLoading(true);
    api.getClient().get("/super-admin/events/pending")
      .then((res) => setPendingEvents(res.data.data.data || []))
      .catch(() => setPendingEvents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPendingEvents();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await api.getClient().post(`/super-admin/events/${id}/approve`);
      toast.success("Event berhasil disetujui & tayang di marketplace!");
      fetchPendingEvents();
    } catch {
      toast.error("Gagal menyetujui event.");
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingEvent || !rejectReason.trim()) return;

    setSubmitting(true);
    try {
      await api.getClient().post(`/super-admin/events/${rejectingEvent.id}/reject`, {
        reason: rejectReason,
      });
      toast.success("Event telah ditolak.");
      setRejectingEvent(null);
      setRejectReason("");
      fetchPendingEvents();
    } catch {
      toast.error("Gagal menolak event.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Persetujuan Event Platform</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Event Menunggu Review ({pendingEvents.length})</h1>
        <p className="text-text-secondary text-sm mt-1">
          Daftar pengajuan event baru dari promotor. Periksa kelengkapan info & harga tiket sebelum menyetujui.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-bg-surface rounded-2xl border border-bg-border" />
          ))}
        </div>
      ) : pendingEvents.length > 0 ? (
        <div className="space-y-6">
          {pendingEvents.map((event) => (
            <div
              key={event.id}
              className="bg-bg-surface border border-bg-border rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center shadow-xl hover:border-primary/40 transition-all"
            >
              {/* Event Image Banner */}
              <div className="h-44 rounded-xl bg-bg-elevated relative overflow-hidden border border-bg-border">
                <img
                  src={event.banner || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800"}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Event Information */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-accent/20 text-accent font-bold text-xs border border-accent/30">
                    Menunggu Persetujuan
                  </span>
                  {event.tenant && (
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> {event.tenant.name}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white">{event.title}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-secondary">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{formatDate(event.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{event.venue}, {event.city}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <TicketIcon className="w-4 h-4 text-primary" />
                    <span>{event.tickets?.length || 0} Kategori Tiket</span>
                  </div>
                </div>

                <p className="text-xs text-text-muted line-clamp-2">{event.short_desc}</p>

                {/* Actions */}
                <div className="pt-3 border-t border-bg-border/60 flex items-center justify-between gap-3">
                  <Link href={`/events/${event.slug}`} target="_blank">
                    <Button variant="outline" size="sm" className="border-bg-border text-xs">
                      <Eye className="w-3.5 h-3.5 mr-1" /> Preview Event
                    </Button>
                  </Link>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectingEvent(event)}
                      className="border-danger/40 text-danger hover:bg-danger/10 text-xs font-bold"
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Tolak
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(event.id)}
                      className="bg-success hover:bg-emerald-700 text-xs font-bold text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Setujui Event
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-bg-surface border border-bg-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-4 border border-success/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Semua Event Telah Di-review!</h3>
          <p className="text-text-secondary text-sm max-w-md mx-auto">
            Tidak ada pengajuan event baru yang sedang menunggu persetujuan saat ini.
          </p>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRejectSubmit} className="bg-bg-surface border border-bg-border rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Tolak Pengajuan Event</h3>
            <p className="text-xs text-text-secondary">
              Berikan alasan penolakan event <strong>{rejectingEvent.title}</strong> agar promotor dapat memperbaikinya.
            </p>
            <div>
              <label className="block text-xs font-semibold mb-2">Alasan Penolakan</label>
              <textarea
                rows={3}
                placeholder="Contoh: Info venue belum jelas, harga tiket tidak sesuai standar..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 bg-bg-elevated border border-bg-border text-white text-sm rounded-xl focus:border-primary"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setRejectingEvent(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="bg-danger hover:bg-red-700 font-bold text-white">
                {submitting ? "Memproses..." : "Konfirmasi Tolak"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
