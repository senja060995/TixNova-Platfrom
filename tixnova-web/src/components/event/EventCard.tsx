"use client";

import { Heart, MapPin, Calendar, Clock, Tag, ExternalLink, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { Event } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect } from "react";

import { useLocale } from "@/components/LocaleProvider";

interface EventCardProps {
  event: Event;
  variant?: "default" | "featured" | "compact";
  showCategory?: boolean;
}

export function EventCard({ event, variant = "default", showCategory = true }: EventCardProps) {
  const { t, locale } = useLocale();
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";

  const minPrice = event.tickets?.reduce((min, t) => Math.min(min, t.price), Infinity) || 0;
  const maxPrice = event.tickets?.reduce((max, t) => Math.max(max, t.price), 0) || 0;

  const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800";

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = FALLBACK_IMAGE;
  };

  // Use useState and useEffect to avoid hydration mismatch with formatRelativeTime
  const [relativeTime, setRelativeTime] = useState<string>("");
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRelativeTime(formatRelativeTime(event.created_at));
  }, [event.created_at]);

  if (isCompact) {
    return (
      <Link href={`/events/${event.slug}`} className="group flex gap-4 p-3 glass rounded-xl hover:bg-bg-elevated transition-all">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={event.banner || event.poster || FALLBACK_IMAGE}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />
          {event.is_featured && (
            <Badge variant="primary" className="absolute top-2 left-2">
              Featured
            </Badge>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-text-primary group-hover:text-primary transition-colors line-clamp-1">
            {event.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(event.start_date, { dateStyle: "medium" })}</span>
            <span className="hidden sm:inline">·</span>
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">{event.city}, {event.venue}</span>
          </div>
          <div className="mt-1 font-semibold text-primary">
            {minPrice === maxPrice
              ? minPrice === 0
                ? (locale === "en" ? "Free" : "Gratis")
                : formatCurrency(minPrice)
              : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article className={cn(
      "group relative glass rounded-2xl overflow-hidden flex flex-col h-full",
      isFeatured && "border-primary/30 animate-pulse-glow"
    )}>
      <div className="relative aspect-video overflow-hidden">
        <img
          src={event.banner || event.poster || FALLBACK_IMAGE}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={handleImageError}
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base/90 via-transparent to-transparent" />
        
        <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2">
          {event.is_featured && <Badge variant="primary">Featured</Badge>}
          {showCategory && event.category && (
            <Badge variant="info">{event.category.name}</Badge>
          )}
          <Badge variant={event.is_free ? "success" : "default"} className="ml-auto">
            {event.is_free ? (locale === "en" ? "Free" : "Gratis") : (locale === "en" ? "Paid" : "Bayar")}
          </Badge>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{event.venue}, {event.city}</span>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(event.start_date, { dateStyle: "medium" })}</span>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-lg text-text-primary line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          {event.is_featured && (
            <Heart className="w-5 h-5 text-primary/50 group-hover:text-primary transition-colors" />
          )}
        </div>

        <p className="text-sm text-text-secondary line-clamp-2 mb-4 flex-1">
          {event.short_desc || event.description?.slice(0, 120) + "..."}
        </p>

        <div className="flex items-center gap-3 text-xs text-text-muted mb-4">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {relativeTime}
          </span>
          <span className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            {event.tickets?.length || 0} {locale === "en" ? "ticket types" : "tipe tiket"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-bg-border/60">
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">
              {locale === "en" ? "Starting from" : "Mulai dari"}
            </span>
            <div className="text-base sm:text-lg font-black text-white truncate">
              {minPrice === maxPrice ? (
                minPrice === 0 ? (
                  <span className="text-success">{locale === "en" ? "Free" : "Gratis"}</span>
                ) : (
                  formatCurrency(minPrice)
                )
              ) : (
                formatCurrency(minPrice)
              )}
            </div>
          </div>

          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-bold text-xs sm:text-sm whitespace-nowrap shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.03] active:scale-95 transition-all duration-200 shrink-0 group"
          >
            <span>{locale === "en" ? "View Details" : "Lihat Detail"}</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
