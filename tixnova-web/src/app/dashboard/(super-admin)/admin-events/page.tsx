"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, CheckCircle2, Eye, Filter, RefreshCw, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { formatDate, truncate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface AdminEvent {
  id: number;
  title: string;
  slug: string;
  city: string;
  start_date: string;
  status: string;
  is_featured: boolean;
  tenant?: { name: string };
  tickets_count: number;
  orders_count: number;
}

interface PaginatedEvents {
  data: AdminEvent[];
  total: number;
  current_page: number;
  last_page: number;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  approved: { label: "Disetujui", cls: "bg-success/20 text-success border-success/30" },
  pending: { label: "Pending", cls: "bg-accent/20 text-accent border-accent/30" },
  draft: { label: "Draft", cls: "bg-text-muted/20 text-text-muted border-bg-border" },
  rejected: { label: "Ditolak", cls: "bg-danger/20 text-danger border-danger/30" },
  ongoing: { label: "Berlangsung", cls: "bg-info/20 text-info border-info/30" },
  completed: { label: "Selesai", cls: "bg-primary/20 text-primary border-primary/30" },
  cancelled: { label: "Dibatalkan", cls: "bg-danger/20 text-danger border-danger/30" },
};

export default function SuperAdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginatedEvents>({ data: [], total: 0, current_page: 1, last_page: 1 });

  const fetchEvents = () => {
    setLoading(true);
    const params: Record<string, unknown> = { page, per_page: 15 };
    if (search.trim()) params.search = search.trim();
    if (statusFilter !== "all") params.status = statusFilter;

    api.getClient().get("/super-admin/events", { params })
      .then((response) => {
        const data = response.data.data as PaginatedEvents;
        setEvents(data.data || []);
        setMeta(data);
      })
      .catch(() => {
        setEvents([]);
        toast.error("Gagal memuat event platform.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const frame = requestAnimationFrame(fetchEvents);

    return () => cancelAnimationFrame(frame);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const toggleFeatured = async (eventId: number) => {
    try {
      await api.getClient().post(`/super-admin/events/${eventId}/toggle-featured`);
      toast.success("Status featured diperbarui.");
      fetchEvents();
    } catch {
      toast.error("Gagal mengubah status featured.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Semua Event</h1>
          <p className="mt-1 text-sm text-text-secondary">Pantau seluruh event lintas tenant di platform TixNova.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/approvals"><Button variant="outline" className="border-bg-border"><CheckCircle2 className="mr-2 h-4 w-4" /> Review Pending</Button></Link>
          <Button onClick={fetchEvents} variant="outline" className="border-bg-border"><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { setPage(1); fetchEvents(); } }} placeholder="Cari event, slug, atau promotor..." className="border-bg-border bg-bg-surface pl-11 text-white" />
        </div>
        <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="rounded-xl border border-bg-border bg-bg-surface px-4 py-2.5 text-sm text-text-secondary">
          <option value="all">Semua Status</option>
          {Object.entries(statusConfig).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
        </select>
        <Button onClick={() => { setPage(1); fetchEvents(); }}><Filter className="mr-2 h-4 w-4" /> Filter</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-surface">
        {loading ? <div className="p-12 text-center text-text-secondary">Memuat event...</div> : events.length ? (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm text-text-secondary"><thead className="border-b border-bg-border bg-bg-elevated/60 text-xs uppercase text-text-muted"><tr><th className="px-5 py-4">Event</th><th className="px-5 py-4">Promotor</th><th className="px-5 py-4">Kota</th><th className="px-5 py-4">Tanggal</th><th className="px-5 py-4">Tiket / Order</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-bg-border/60">
            {events.map((event) => {
              const status = statusConfig[event.status] || statusConfig.draft;
              return <tr key={event.id} className="hover:bg-bg-elevated/30"><td className="px-5 py-4"><p className="font-bold text-white">{truncate(event.title, 42)}</p><p className="font-mono text-xs text-text-muted">{event.slug}</p></td><td className="px-5 py-4 text-xs">{event.tenant?.name || "—"}</td><td className="px-5 py-4 text-xs">{event.city}</td><td className="px-5 py-4 text-xs">{formatDate(event.start_date)}</td><td className="px-5 py-4 text-xs">{event.tickets_count} / {event.orders_count}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${status.cls}`}>{status.label}</span></td><td className="flex justify-end gap-2 px-5 py-4"><button onClick={() => toggleFeatured(event.id)} className={`flex h-8 w-8 items-center justify-center rounded-lg ${event.is_featured ? "bg-accent/20 text-accent" : "bg-bg-elevated text-text-muted"}`}><Star className="h-4 w-4" fill={event.is_featured ? "currentColor" : "none"} /></button><Link href={`/events/${event.slug}`} target="_blank"><Button size="sm" variant="outline" className="border-bg-border"><Eye className="h-3.5 w-3.5" /></Button></Link></td></tr>;
            })}
          </tbody></table></div>
        ) : <div className="space-y-3 p-12 text-center"><Calendar className="mx-auto h-12 w-12 text-text-muted" /><p className="text-sm text-text-secondary">Tidak ada event yang sesuai.</p></div>}
      </div>

      {meta.last_page > 1 && <div className="flex justify-center gap-3"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Sebelumnya</Button><span className="py-2 text-sm text-text-secondary">Halaman {meta.current_page} / {meta.last_page}</span><Button variant="outline" size="sm" disabled={page === meta.last_page} onClick={() => setPage((current) => current + 1)}>Berikutnya</Button></div>}
    </div>
  );
}
