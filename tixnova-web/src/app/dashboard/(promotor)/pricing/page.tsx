"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TrendingUp, AlertTriangle, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateOnly } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface PricingItem {
  id: number;
  title: string;
  slug: string;
  city: string;
  status: string;
  start_date: string;
  sell_through_pct: number;
  days_to_event: number;
  velocity_7d: number;
  health: number;
  urgency: string;
  action: string;
  promo_suggested: boolean;
  reason: string;
}

interface Anomaly {
  event_id: number;
  event_title: string;
  slug: string;
  type: string;
  metric: number;
  date: string;
  message: string;
}

const ACTION_BADGE: Record<string, { label: string; cls: string }> = {
  raise: { label: "Naikkan Harga", cls: "bg-success/15 text-success border border-success/30" },
  promo: { label: "Jalankan Promo", cls: "bg-warning/15 text-warning border border-warning/30" },
  hold: { label: "Pertahankan", cls: "bg-primary/15 text-primary border border-primary/30" },
};

const URGENCY_BADGE: Record<string, { label: string; cls: string }> = {
  high: { label: "Urgent", cls: "bg-danger/15 text-danger border border-danger/30" },
  medium: { label: "Perlu Perhatian", cls: "bg-warning/15 text-warning border border-warning/30" },
  low: { label: "Normal", cls: "bg-bg-elevated text-text-secondary border border-bg-border" },
};

function healthColor(health: number): string {
  if (health >= 75) return "text-success";
  if (health >= 50) return "text-warning";
  return "text-danger";
}

export default function PricingPage() {
  const [items, setItems] = useState<PricingItem[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    Promise.all([
      api.getClient().get("/promotor/pricing?limit=20"),
      api.getClient().get("/promotor/pricing/anomalies"),
    ])
      .then(([list, anom]) => {
        setItems(list.data.data || []);
        setAnomalies(anom.data.data || []);
      })
      .catch(() => toast.error("Gagal memuat analisis harga."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">AI Pricing</h1>
          <p className="text-sm text-text-secondary">Rekomendasi harga berbasis permintaan & pasar untuk event mendatang.</p>
        </div>
      </div>

      {anomalies.length > 0 && (
        <section className="mt-8 rounded-2xl border border-warning/30 bg-warning/5 p-5">
          <h2 className="font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />Anomali Terdeteksi
          </h2>
          <div className="mt-3 space-y-3">
            {anomalies.map((a, i) => (
              <Link
                key={i}
                href={`/dashboard/events/${a.slug}/pricing`}
                className="flex items-start justify-between gap-4 rounded-xl border border-bg-border bg-bg-surface p-4 transition-colors hover:border-warning/40"
              >
                <div>
                  <p className="font-bold text-white">{a.event_title}</p>
                  <p className="mt-1 text-sm text-text-secondary">{a.message}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-warning/15 text-warning text-xs font-bold px-2.5 py-1">
                  {a.type === "spike" ? `Lonjakan ${a.metric}x` : "Penurunan"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-bold text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />Event Mendatang
        </h2>

        {loading ? (
          <p className="mt-4 text-sm text-text-muted">Memuat analisis...</p>
        ) : items.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-bg-border bg-bg-surface p-8 text-center text-sm text-text-muted">
            Belum ada event mendatang untuk dianalisis.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {items.map((item) => {
              const action = ACTION_BADGE[item.action] || ACTION_BADGE.hold;
              const urgency = URGENCY_BADGE[item.urgency] || URGENCY_BADGE.low;
              return (
                <Link
                  key={item.id}
                  href={`/dashboard/events/${item.slug}/pricing`}
                  className="rounded-2xl border border-bg-border bg-bg-surface p-5 transition-all hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-white line-clamp-1">{item.title}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {item.city} · {formatDateOnly(item.start_date)} · H-{item.days_to_event}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-lg text-xs font-bold px-2.5 py-1 ${action.cls}`}>{action.label}</span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span>Okupansi {item.sell_through_pct}%</span>
                      <span className={healthColor(item.health)}>Health {item.health}/100</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-bg-elevated overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-success"
                        style={{ width: `${Math.min(100, item.sell_through_pct)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-lg text-xs font-semibold px-2 py-1 ${urgency.cls}`}>{urgency.label}</span>
                      {item.promo_suggested && (
                        <span className="rounded-lg bg-warning/15 text-warning text-xs font-semibold px-2 py-1">Promo disarankan</span>
                      )}
                    </div>
                    <span className="text-xs text-text-muted">Rata-rata {item.velocity_7d.toFixed(1)}/hari</span>
                  </div>

                  <p className="mt-3 text-xs text-text-secondary line-clamp-2">{item.reason}</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
