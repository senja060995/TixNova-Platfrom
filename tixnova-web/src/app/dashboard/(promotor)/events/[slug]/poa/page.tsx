"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FileCheck2, Users, Ticket, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateOnly } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface PoaData {
  event: {
    id: number;
    title: string;
    slug: string;
    start_date?: string;
  };
  summary: {
    tickets_sold: number;
    checked_in: number;
    unique_attendees: number;
    no_show: number;
    attendance_rate_pct: number;
    last_scan_at?: string;
  };
  segmentation: {
    by_gender: Record<string, number>;
    by_age_group: Record<string, number>;
    by_city: Record<string, number>;
  };
  by_ticket: Record<string, number>;
  series: Array<{ date: string; checked_in: number }>;
}

function SegmentBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-sm text-text-secondary">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-bg-elevated overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right text-sm font-bold text-white">{value}</span>
    </div>
  );
}

function SegmentCard({ title, data, color }: { title: string; data: Record<string, number>; color: string }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-2xl border border-bg-border bg-bg-surface p-5">
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <div className="mt-4 space-y-3">
        {entries.length === 0 ? (
          <p className="text-xs text-text-muted">Belum ada data.</p>
        ) : (
          entries.map(([label, value]) => (
            <SegmentBar key={label} label={label} value={value} total={total} color={color} />
          ))
        )}
      </div>
    </div>
  );
}

export default function PoaReportPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [data, setData] = useState<PoaData | null>(null);
  const [loading, setLoading] = useState(true);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    api
      .getClient()
      .get(`/promotor/events/${slug}/poa`)
      .then((res) => setData(res.data?.data || null))
      .catch(() => toast.error("Gagal memuat PoA report."))
      .finally(() => setLoading(false));
  }, [slug]);

  const maxDaily = Math.max(1, ...(data?.series || []).map((s) => s.checked_in));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/dashboard/sponsors" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-white">
        <ChevronLeft className="h-4 w-4" />Kembali ke Sponsor OS
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
          <FileCheck2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Proof of Attendance</h1>
          <p className="text-sm text-text-secondary">
            {data?.event.title || "Memuat..."}
            {data?.event.start_date ? ` · ${formatDateOnly(data.event.start_date)}` : ""}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-text-muted">Memuat PoA report...</p>
      ) : !data ? (
        <p className="mt-8 rounded-2xl border border-bg-border bg-bg-surface p-8 text-center text-sm text-text-muted">
          PoA report tidak tersedia.
        </p>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
            {[
              { label: "Tiket Terjual", value: data.summary.tickets_sold, icon: Ticket, cls: "text-primary bg-primary/15" },
              { label: "Check-in", value: data.summary.checked_in, icon: Users, cls: "text-success bg-success/15" },
              { label: "Pengunjung Unik", value: data.summary.unique_attendees, icon: Users, cls: "text-warning bg-warning/15" },
              { label: "No-show", value: data.summary.no_show, icon: Ticket, cls: "text-danger bg-danger/15" },
              { label: "Tingkat Kehadiran", value: `${data.summary.attendance_rate_pct}%`, icon: TrendingUp, cls: "text-accent bg-accent/15" },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-bg-border bg-bg-surface p-4">
                <div className={`inline-flex p-2 rounded-lg ${card.cls}`}>
                  <card.icon className="h-4 w-4" />
                </div>
                <p className="mt-3 text-xl font-black text-white">{card.value}</p>
                <p className="mt-0.5 text-xs text-text-secondary">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <SegmentCard title="Segmen Gender" data={data.segmentation.by_gender} color="bg-primary" />
            <SegmentCard title="Segmen Usia" data={data.segmentation.by_age_group} color="bg-warning" />
            <SegmentCard title="Segmen Kota" data={data.segmentation.by_city} color="bg-success" />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-bg-border bg-bg-surface p-5">
              <h3 className="text-sm font-bold text-white">Pengunjung per Jenis Tiket</h3>
              <div className="mt-4 space-y-3">
                {Object.entries(data.by_ticket).map(([name, value]) => (
                  <div key={name} className="flex items-center justify-between gap-3 rounded-xl bg-bg-elevated px-4 py-3">
                    <span className="text-sm text-text-secondary">{name}</span>
                    <span className="text-sm font-black text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-bg-border bg-bg-surface p-5">
              <h3 className="text-sm font-bold text-white">Check-in Harian</h3>
              {data.series.length === 0 ? (
                <p className="mt-4 text-xs text-text-muted">Belum ada check-in tercatat.</p>
              ) : (
                <div className="mt-4 flex items-end gap-2 h-40">
                  {data.series.map((s) => (
                    <div key={s.date} className="flex-1 flex flex-col items-center gap-1 justify-end h-full">
                      <span className="text-xs font-bold text-white">{s.checked_in}</span>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-primary to-accent"
                        style={{ height: `${Math.max(4, Math.round((s.checked_in / maxDaily) * 100))}%` }}
                      />
                      <span className="text-[10px] text-text-muted">{formatDateOnly(s.date).slice(0, 6)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {data.summary.last_scan_at && (
            <p className="mt-6 text-xs text-text-muted">
              Check-in terakhir: {formatDateOnly(data.summary.last_scan_at)} · Data dari scan log valid pada event ini.
            </p>
          )}
        </>
      )}
    </div>
  );
}
