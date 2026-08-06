"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, TrendingUp, Gauge, Layers, LineChart } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDateOnly } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface EventInfo {
  id: number;
  title: string;
  slug: string;
  city: string;
  start_date: string;
}

interface MarketStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
  p25: number;
  p75: number;
}

interface DemandInfo {
  sold_total: number;
  quota_total: number;
  sell_through: number;
  sold_last_7d: number;
  velocity_7d: number;
  days_on_sale: number;
  days_to_event: number;
  avg_price: number;
  main_price: number;
}

interface Recommendation {
  action: string;
  suggestedPrice: number | null;
  promo: { suggested: boolean; discount_pct: number | null };
  reason: string;
  urgency: string;
}

interface TicketRec {
  id: number;
  name: string;
  price: number;
  sold: number;
  quota: number;
  sell_through_pct: number;
  suggested_action: string;
  suggested_price: number | null;
  note: string;
}

interface DetailData {
  event: EventInfo;
  market: MarketStats;
  demand: DemandInfo;
  health: number;
  recommendation: Recommendation;
  tickets: TicketRec[];
}

interface ForecastTicket {
  ticket_id: number;
  name: string;
  price: number;
  sold: number;
  quota: number;
  remaining: number;
  history_points: number;
  daily_avg: number;
  method: string;
  projected_sales: number;
  projected_remaining: number;
  projected_sell_through_pct: number;
}

interface ForecastData {
  event: EventInfo;
  days: number;
  tickets: ForecastTicket[];
  event_total: { sold: number; quota: number; projected_remaining: number; projected_sell_through_pct: number };
}

const ACTION_META: Record<string, { label: string; cls: string }> = {
  raise: { label: "Naikkan Harga", cls: "bg-success/15 text-success border border-success/30" },
  discount: { label: "Beri Diskon", cls: "bg-warning/15 text-warning border border-warning/30" },
  nearly_sold_out: { label: "Hampir Habis", cls: "bg-success/15 text-success border border-success/30" },
  above_market: { label: "Di Atas Pasar", cls: "bg-danger/15 text-danger border border-danger/30" },
  hold: { label: "Pertahankan", cls: "bg-bg-elevated text-text-secondary border border-bg-border" },
};

const ACTION_BADGE: Record<string, { label: string; cls: string }> = {
  raise: { label: "Naikkan Harga", cls: "bg-success/15 text-success border border-success/30" },
  promo: { label: "Jalankan Promo", cls: "bg-warning/15 text-warning border border-warning/30" },
  hold: { label: "Pertahankan", cls: "bg-primary/15 text-primary border border-primary/30" },
};

const METHOD_LABEL: Record<string, string> = {
  moving_average: "Moving Average",
  baseline: "Baseline",
  no_time: "Tanpa Sisa Waktu",
};

export default function EventPricingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    Promise.all([
      api.getClient().get(`/promotor/pricing/${slug}`),
      api.getClient().get(`/promotor/pricing/${slug}/forecast?days=30`),
    ])
      .then(([d, f]) => {
        setDetail(d.data.data);
        setForecast(f.data.data);
      })
      .catch(() => toast.error("Gagal memuat analisis harga event."))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-sm text-text-muted">Memuat analisis harga...</p>
      </div>
    );
  }

  if (!detail) return null;

  const rec = detail.recommendation;
  const badge = ACTION_BADGE[rec.action] || ACTION_BADGE.hold;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/dashboard/pricing" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-white">
        <ChevronLeft className="h-4 w-4" />Kembali ke AI Pricing
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-white line-clamp-1">{detail.event.title}</h1>
          <p className="text-sm text-text-secondary">
            {detail.event.city} · {formatDateOnly(detail.event.start_date)} · H-{detail.demand.days_to_event}
          </p>
        </div>
        <span className={`ml-auto shrink-0 rounded-xl text-sm font-bold px-3 py-1.5 ${badge.cls}`}>{badge.label}</span>
      </div>

      {/* Recommendation */}
      <section className="mt-6 rounded-2xl border border-bg-border bg-bg-surface p-6">
        <h2 className="font-bold text-white flex items-center gap-2"><Gauge className="h-5 w-5 text-primary" />Rekomendasi</h2>
        <p className="mt-3 text-sm text-text-secondary">{rec.reason}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="rounded-xl border border-bg-border bg-bg-elevated px-4 py-3">
            <p className="text-xs text-text-muted">Health Score</p>
            <p className="mt-1 text-xl font-black text-white">{detail.health}<span className="text-sm text-text-muted">/100</span></p>
          </div>
          {rec.suggestedPrice && (
            <div className="rounded-xl border border-bg-border bg-bg-elevated px-4 py-3">
              <p className="text-xs text-text-muted">Harga Disarankan</p>
              <p className="mt-1 text-xl font-black text-primary">{formatCurrency(rec.suggestedPrice)}</p>
            </div>
          )}
          {rec.promo.suggested && (
            <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3">
              <p className="text-xs text-text-muted">Diskon Disarankan</p>
              <p className="mt-1 text-xl font-black text-warning">{rec.promo.discount_pct}%</p>
            </div>
          )}
        </div>
      </section>

      {/* Demand + Market */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-bg-border bg-bg-surface p-6">
          <h2 className="font-bold text-white flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Permintaan</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-text-secondary">Terjual / Kuota</dt><dd className="font-bold text-white">{detail.demand.sold_total} / {detail.demand.quota_total}</dd></div>
            <div className="flex justify-between"><dt className="text-text-secondary">Sell-through</dt><dd className="font-bold text-white">{Math.round(detail.demand.sell_through * 100)}%</dd></div>
            <div className="flex justify-between"><dt className="text-text-secondary">Penjualan 7 hari terakhir</dt><dd className="font-bold text-white">{detail.demand.sold_last_7d}</dd></div>
            <div className="flex justify-between"><dt className="text-text-secondary">Rata-rata / hari (7d)</dt><dd className="font-bold text-white">{detail.demand.velocity_7d.toFixed(1)}</dd></div>
            <div className="flex justify-between"><dt className="text-text-secondary">Hari dijual</dt><dd className="font-bold text-white">{detail.demand.days_on_sale} hari</dd></div>
            <div className="flex justify-between"><dt className="text-text-secondary">Harga utama</dt><dd className="font-bold text-white">{formatCurrency(detail.demand.main_price)}</dd></div>
          </dl>
        </section>

        <section className="rounded-2xl border border-bg-border bg-bg-surface p-6">
          <h2 className="font-bold text-white flex items-center gap-2"><Layers className="h-5 w-5 text-primary" />Pasar (Event Serupa)</h2>
          {detail.market.count === 0 ? (
            <p className="mt-4 text-sm text-text-muted">Belum ada event serupa (kategori/kota sama) untuk dibandingkan.</p>
          ) : (
            <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div><dt className="text-xs text-text-muted">Data pasar</dt><dd className="mt-1 font-bold text-white">{detail.market.count}</dd></div>
              <div><dt className="text-xs text-text-muted">Min</dt><dd className="mt-1 font-bold text-white">{formatCurrency(detail.market.min)}</dd></div>
              <div><dt className="text-xs text-text-muted">Max</dt><dd className="mt-1 font-bold text-white">{formatCurrency(detail.market.max)}</dd></div>
              <div><dt className="text-xs text-text-muted">Rata-rata</dt><dd className="mt-1 font-bold text-white">{formatCurrency(detail.market.avg)}</dd></div>
              <div><dt className="text-xs text-text-muted">Median</dt><dd className="mt-1 font-bold text-white">{formatCurrency(detail.market.median)}</dd></div>
              <div><dt className="text-xs text-text-muted">p75</dt><dd className="mt-1 font-bold text-white">{formatCurrency(detail.market.p75)}</dd></div>
              <div><dt className="text-xs text-text-muted">p25</dt><dd className="mt-1 font-bold text-white">{formatCurrency(detail.market.p25)}</dd></div>
            </dl>
          )}
        </section>
      </div>

      {/* Ticket recommendations */}
      <section className="mt-6 rounded-2xl border border-bg-border bg-bg-surface p-6">
        <h2 className="font-bold text-white">Rekomendasi per Tiket</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border text-left text-xs uppercase tracking-wider text-text-muted">
                <th className="pb-3 pr-4 font-semibold">Tiket</th>
                <th className="pb-3 pr-4 font-semibold">Harga</th>
                <th className="pb-3 pr-4 font-semibold">Terjual</th>
                <th className="pb-3 pr-4 font-semibold">Sell-through</th>
                <th className="pb-3 font-semibold">Rekomendasi</th>
              </tr>
            </thead>
            <tbody>
              {detail.tickets.map((t) => {
                const meta = ACTION_META[t.suggested_action] || ACTION_META.hold;
                return (
                  <tr key={t.id} className="border-b border-bg-border/50">
                    <td className="py-3 pr-4 font-bold text-white">{t.name}</td>
                    <td className="py-3 pr-4 text-text-secondary">{formatCurrency(t.price)}</td>
                    <td className="py-3 pr-4 text-text-secondary">{t.sold} / {t.quota}</td>
                    <td className="py-3 pr-4 text-text-secondary">{t.sell_through_pct}%</td>
                    <td className="py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-lg text-xs font-bold px-2 py-1 ${meta.cls}`}>{meta.label}</span>
                        {t.suggested_price && <span className="text-xs text-text-muted">→ {formatCurrency(t.suggested_price)}</span>}
                        {t.note && <span className="text-xs text-text-muted">{t.note}</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Forecast */}
      {forecast && (
        <section className="mt-6 rounded-2xl border border-bg-border bg-bg-surface p-6">
          <h2 className="font-bold text-white flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" />Proyeksi Penjualan ({forecast.days} hari ke depan)
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-bg-border bg-bg-elevated p-4">
              <p className="text-xs text-text-muted">Terjual (event)</p>
              <p className="mt-1 text-xl font-black text-white">{forecast.event_total.sold} / {forecast.event_total.quota}</p>
            </div>
            <div className="rounded-xl border border-bg-border bg-bg-elevated p-4">
              <p className="text-xs text-text-muted">Proyeksi sell-through</p>
              <p className="mt-1 text-xl font-black text-success">{forecast.event_total.projected_sell_through_pct}%</p>
            </div>
            <div className="rounded-xl border border-bg-border bg-bg-elevated p-4">
              <p className="text-xs text-text-muted">Sisa kuota diproyeksikan</p>
              <p className="mt-1 text-xl font-black text-warning">{forecast.event_total.projected_remaining}</p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border text-left text-xs uppercase tracking-wider text-text-muted">
                  <th className="pb-3 pr-4 font-semibold">Tiket</th>
                  <th className="pb-3 pr-4 font-semibold">Metode</th>
                  <th className="pb-3 pr-4 font-semibold">Rata-rata/hari</th>
                  <th className="pb-3 pr-4 font-semibold">Proyeksi tambahan</th>
                  <th className="pb-3 pr-4 font-semibold">Proyeksi sisa</th>
                  <th className="pb-3 font-semibold">Sell-through akhir</th>
                </tr>
              </thead>
              <tbody>
                {forecast.tickets.map((t) => (
                  <tr key={t.ticket_id} className="border-b border-bg-border/50">
                    <td className="py-3 pr-4 font-bold text-white">{t.name}</td>
                    <td className="py-3 pr-4 text-text-secondary">{METHOD_LABEL[t.method] || t.method}</td>
                    <td className="py-3 pr-4 text-text-secondary">{t.daily_avg}</td>
                    <td className="py-3 pr-4 text-text-secondary">+{t.projected_sales}</td>
                    <td className="py-3 pr-4 text-text-secondary">{t.projected_remaining}</td>
                    <td className="py-3 font-bold text-white">{t.projected_sell_through_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
