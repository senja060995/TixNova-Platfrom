"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, ChevronRight, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

interface City {
  name: string;
  slug: string;
  eventCount: number;
  image?: string;
}

interface BrowseByCityProps {
  cities?: City[];
}

const defaultCities: City[] = [
  { name: "Jakarta", slug: "Jakarta", eventCount: 156, image: "https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=800" },
  { name: "Bandung", slug: "Bandung", eventCount: 89, image: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=800" },
  { name: "Surabaya", slug: "Surabaya", eventCount: 67, image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800" },
  { name: "Bali", slug: "Bali", eventCount: 45, image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800" },
  { name: "Yogyakarta", slug: "Yogyakarta", eventCount: 38, image: "https://images.unsplash.com/photo-1584810359583-96fc3448beaa?w=800" },
  { name: "Medan", slug: "Medan", eventCount: 32, image: "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=800" },
  { name: "Semarang", slug: "Semarang", eventCount: 28, image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800" },
  { name: "Makassar", slug: "Makassar", eventCount: 24, image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800" },
];

export function BrowseByCity({ cities }: BrowseByCityProps = {}) {
  const { t } = useLocale();
  const displayCities = cities && cities.length > 0 ? cities : defaultCities;

  return (
    <section className="section bg-bg-surface/30 py-12" aria-labelledby="browse-city-heading">
      <div className="container-main">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 id="browse-city-heading" className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              {t("home.browseCity")}
            </h2>
            <p className="text-text-secondary text-sm mt-1">{t("home.browseCityDescription")}</p>
          </div>
          <Link href="/cities" className="hidden sm:flex items-center gap-1.5 text-primary font-bold text-sm hover:underline">
            {t("home.viewAllCities")}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {displayCities.slice(0, 8).map((city) => (
            <Link
              key={city.slug}
              href={`/events?city=${encodeURIComponent(city.name || city.slug)}`}
              className="group relative h-56 rounded-3xl overflow-hidden border border-bg-border shadow-xl transition-all duration-500 hover:border-primary/60 hover:scale-[1.02]"
            >
              <Image
                src={city.image || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800"}
                alt={city.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/30 to-transparent" />

              <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                <div className="flex justify-end">
                  <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary backdrop-blur-md border border-primary/30 text-[11px] font-bold">
                    {city.eventCount || 10}+ {t("city.events")}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>{city.name}</span>
                    <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </h3>
                  <p className="text-xs text-text-secondary flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> {t("city.explore")}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <Link href="/cities" className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline">
            {t("home.viewAllCities")}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}