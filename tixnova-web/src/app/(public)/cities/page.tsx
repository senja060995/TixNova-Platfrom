"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Ticket, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

import { useLocale } from "@/components/LocaleProvider";

interface CityData {
  name: string;
  slug?: string;
  eventCount?: number;
}

const CITY_IMAGES: Record<string, string> = {
  Jakarta: "https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=800",
  Bandung: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=800",
  Surabaya: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
  Bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800",
  Yogyakarta: "https://images.unsplash.com/photo-1584810359583-96fc3448beaa?w=800",
  Medan: "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=800",
};

export default function CitiesPage() {
  const { t } = useLocale();
  const [cities, setCities] = useState<(string | CityData)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getClient().get("/events/cities")
      .then((res) => {
        const data = res.data.data;
        setCities(Array.isArray(data) && data.length > 0 ? data : ["Jakarta", "Bandung", "Surabaya", "Bali", "Yogyakarta", "Medan"]);
      })
      .catch(() => setCities(["Jakarta", "Bandung", "Surabaya", "Bali", "Yogyakarta", "Medan"]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12 w-full">
      {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-4 h-4" /> TixNova Cities
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            {t("cities.title")}
          </h1>
          <p className="text-text-secondary text-base leading-relaxed">
            {t("cities.description")}
          </p>
        </div>

        {/* Cities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-bg-surface rounded-3xl border border-bg-border" />
            ))}
          </div>
        ) : cities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {cities.map((item, idx) => {
              const cityName = typeof item === "string" ? item : item.name;
              const key = typeof item === "string" ? item : (item.slug || item.name || idx);
              const count = typeof item === "object" && item.eventCount ? item.eventCount : null;
              const bgImg = CITY_IMAGES[cityName] || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800";

              return (
                <Link
                  key={String(key)}
                  href={`/events?city=${encodeURIComponent(cityName)}`}
                  className="group relative h-64 rounded-3xl overflow-hidden border border-bg-border shadow-xl transition-all duration-500 hover:border-primary/60 hover:scale-[1.02]"
                >
                  <Image
                    src={bgImg}
                    alt={cityName}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/40 to-transparent" />

                  <div className="absolute inset-0 p-6 flex flex-col justify-between">
                    <div className="flex justify-end">
                      <span className="px-3 py-1 rounded-full bg-primary/20 text-primary backdrop-blur-md border border-primary/30 text-xs font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> Konser
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors flex items-center justify-between">
                        <span>{cityName}</span>
                        <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </h3>
                      <p className="text-xs text-text-secondary flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5 text-primary" />
                        {count !== null ? `${count} event tersedia di ${cityName}` : `Jelajahi event musik di ${cityName}`}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-bg-surface border border-bg-border rounded-3xl p-16 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8" />
          </div>
            <h3 className="text-xl font-bold text-white mb-2">Kota Belum Tersedia</h3>
            <p className="text-text-secondary text-sm mb-6">Jelajahi seluruh daftar event konser terbaru.</p>
            <Link href="/events">
              <Button className="bg-primary hover:bg-primary-dark font-bold">Semua Event</Button>
            </Link>
          </div>
        )}
    </div>
  );
}
