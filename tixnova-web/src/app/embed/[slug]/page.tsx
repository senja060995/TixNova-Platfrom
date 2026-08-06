"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Calendar, MapPin, Ticket as TicketIcon, ExternalLink } from "lucide-react";
import { Event } from "@/types";
import { publicApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

export default function EmbedWidgetPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { locale } = useLocale();
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    publicApi.events
      .show(slug, { lang: locale })
      .then((res) => setEvent(res.data.data))
      .catch(() => setError(true));
  }, [slug, locale]);

  useEffect(() => {
    const post = () => {
      const height = rootRef.current?.offsetHeight || 0;
      window.parent?.postMessage({ tixnovaEmbedHeight: height }, "*");
    };
    post();
    const t = window.setInterval(post, 400);
    return () => window.clearInterval(t);
  }, []);

  const minPrice = event?.tickets?.length
    ? Math.min(...event.tickets.map((t) => Number(t.price) || 0))
    : 0;
  const imgSrc = event?.poster || event?.banner;

  return (
    <div ref={rootRef} className="w-full min-h-40">
      {error ? (
        <div className="rounded-xl border border-bg-border bg-bg-surface p-4 text-center text-sm text-text-muted">
          Event tidak ditemukan atau sudah berakhir.
        </div>
      ) : !event ? (
        <div className="rounded-xl border border-bg-border bg-bg-surface p-4 text-center text-sm text-text-muted">
          Memuat event...
        </div>
      ) : (
        <a
          href={`/events/${event.slug}`}
          target="_top"
          className="group flex gap-3 rounded-xl border border-bg-border bg-bg-surface p-3 hover:border-primary/50 transition-colors no-underline"
        >
          {imgSrc ? (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
              <Image src={imgSrc} alt={event.title} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-bg-elevated text-primary">
              <TicketIcon className="h-8 w-8" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-bold text-white group-hover:text-primary transition-colors">{event.title}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-text-secondary">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {formatDate(event.start_date, { dateStyle: "medium", timeStyle: "short" })}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-text-secondary">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {event.venue}, {event.city}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-sm font-black text-primary">
                {event.is_free ? "Gratis" : formatCurrency(minPrice)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-white group-hover:bg-primary/90">
                Beli Tiket <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          </div>
        </a>
      )}
    </div>
  );
}
