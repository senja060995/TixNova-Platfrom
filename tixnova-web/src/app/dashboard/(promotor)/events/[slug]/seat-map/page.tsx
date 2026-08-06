"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Armchair } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SeatMapBuilder } from "@/components/event/SeatMapBuilder";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

interface Ticket { id: number; name: string; }
interface Section { name: string; ticket_id: number; rows: Array<{ label: string; seats: number }>; }
interface Seat { section: string; ticket_id: number; row_label: string; number: number; }
interface SeatMap { name: string; locked_at?: string; is_published: boolean; seats: Seat[]; }

export default function SeatMapPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [map, setMap] = useState<SeatMap | null>(null);
  const [loading, setLoading] = useState(true);
  const loaded = useRef(false);

  const load = useCallback(() => {
    Promise.all([
      api.getClient().get(`/promotor/events/${slug}/tickets`),
      api.getClient().get(`/promotor/events/${slug}/seat-map`),
    ]).then(([ticketsResponse, mapResponse]) => {
      setTickets(ticketsResponse.data.data || []);
      setMap(mapResponse.data.data);
    }).catch(() => toast.error("Gagal memuat seat map.")).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const frame = requestAnimationFrame(load);
    return () => cancelAnimationFrame(frame);
  }, [load]);

  const sections: Section[] = Object.values((map?.seats || []).reduce<Record<string, Section>>((groups, seat) => {
    const key = `${seat.section}-${seat.ticket_id}`;
    groups[key] ??= { name: seat.section, ticket_id: seat.ticket_id, rows: [] };
    const row = groups[key].rows.find((current) => current.label === seat.row_label);
    if (row) row.seats += 1;
    else groups[key].rows.push({ label: seat.row_label, seats: 1 });
    return groups;
  }, {}));

  const save = async (nextSections: Section[]) => {
    await api.getClient().put(`/promotor/events/${slug}/seat-map`, { name: "Denah Kursi", is_published: true, sections: nextSections });
    toast.success("Seat map berhasil disimpan.");
    load();
  };

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-bg-surface" />;

  return <div className="mx-auto max-w-5xl space-y-6"><div className="flex items-center gap-4"><Link href={`/dashboard/events/${slug}/tickets`}><Button variant="outline" size="sm" className="border-bg-border"><ChevronLeft className="h-4 w-4" /></Button></Link><div><h1 className="flex items-center gap-2 text-2xl font-extrabold text-white"><Armchair className="h-6 w-6 text-primary" />Seat Map</h1><p className="text-sm text-text-secondary">Konfigurasikan section, baris, dan tier tiket untuk event ini.</p></div></div>{tickets.length ? <SeatMapBuilder tickets={tickets} initialSections={sections} locked={Boolean(map?.locked_at)} onSave={save} /> : <p className="rounded-2xl border border-bg-border bg-bg-surface p-6 text-sm text-text-secondary">Tambahkan tier tiket terlebih dahulu sebelum membuat seat map.</p>}</div>;
}
