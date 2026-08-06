"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface Reschedule {
  id: number;
  new_start_date: string;
  new_end_date: string;
  previous_start_date: string;
  reason: string;
  event: { title: string; venue: string; city: string };
  requester: { name: string };
}

export default function EventReschedulesPage() {
  const [reschedules, setReschedules] = useState<Reschedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Reschedule | null>(null);
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = () => {
    setLoading(true);
    api.getClient().get("/super-admin/event-reschedules")
      .then((response) => setReschedules(response.data.data.data || []))
      .catch(() => toast.error("Gagal memuat permintaan perubahan jadwal."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const frame = requestAnimationFrame(load);

    return () => cancelAnimationFrame(frame);
  }, []);

  const review = async (approved: boolean) => {
    if (!selected) return;
    setProcessing(true);
    try {
      await api.getClient().post(`/super-admin/event-reschedules/${selected.id}/review`, {
        approved,
        review_note: note || undefined,
      });
      toast.success(approved ? "Jadwal event diperbarui dan pembeli akan diberi email." : "Permintaan perubahan jadwal ditolak.");
      setSelected(null);
      setNote("");
      load();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Gagal memproses permintaan.";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
          <CalendarClock className="h-4 w-4" /> Perubahan Jadwal
        </div>
        <h1 className="text-3xl font-extrabold text-white">Review Jadwal Event</h1>
        <p className="mt-1 text-sm text-text-secondary">Setujui perubahan jadwal sebelum jadwal event dan notifikasi pembeli diperbarui.</p>
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-bg-surface" />
      ) : reschedules.length ? (
        <div className="space-y-4">
          {reschedules.map((reschedule) => (
            <div key={reschedule.id} className="rounded-2xl border border-bg-border bg-bg-surface p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div className="space-y-2">
                  <h2 className="font-bold text-white">{reschedule.event.title}</h2>
                  <p className="text-xs text-text-secondary">{reschedule.event.venue}, {reschedule.event.city} · Pengaju: {reschedule.requester.name}</p>
                  <p className="text-sm text-text-secondary">Lama: {formatDate(reschedule.previous_start_date)}</p>
                  <p className="text-sm font-semibold text-primary">Baru: {formatDate(reschedule.new_start_date)} — {formatDate(reschedule.new_end_date)}</p>
                  <p className="rounded-xl bg-bg-elevated p-3 text-sm text-text-secondary">{reschedule.reason}</p>
                </div>
                <Button onClick={() => setSelected(reschedule)} className="self-start">Review</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-bg-border bg-bg-surface p-12 text-center text-sm text-text-secondary">Tidak ada perubahan jadwal yang menunggu review.</div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-5 rounded-3xl border border-bg-border bg-bg-surface p-6">
            <div>
              <h3 className="text-xl font-bold text-white">Review Perubahan Jadwal</h3>
              <p className="mt-1 text-sm text-text-secondary">{selected.event.title}: {formatDate(selected.previous_start_date)} menjadi {formatDate(selected.new_start_date)}.</p>
            </div>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Catatan review (opsional)" className="w-full rounded-xl border border-bg-border bg-bg-elevated p-3 text-sm text-white" />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelected(null)}>Batal</Button>
              <Button variant="danger" loading={processing} onClick={() => review(false)}><XCircle className="h-4 w-4" /> Tolak</Button>
              <Button loading={processing} onClick={() => review(true)}><CheckCircle2 className="h-4 w-4" /> Setujui</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
