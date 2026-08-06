"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { EventCard } from "./EventCard";
import { Event } from "@/types";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

interface FeaturedEventsProps {
  events: Event[];
  title?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
}

export function FeaturedEvents({ events, title, showViewAll = true, viewAllHref = "/events" }: FeaturedEventsProps) {
  const { t } = useLocale();
  const items = Array.isArray(events) ? events : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const heading = title || t("home.featured");
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [itemsPerView, setItemsPerView] = useState(4);
  const maxIndex = Math.max(0, items.length - itemsPerView);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const newItemsPerView = w >= 1280 ? 4 : w >= 1024 ? 3 : w >= 640 ? 2 : 1;
      setItemsPerView(newItemsPerView);
      setCurrentIndex(prev => Math.min(prev, Math.max(0, items.length - newItemsPerView)));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [items.length]);

  useEffect(() => {
    if (!isAutoPlay || maxIndex <= 0) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlay, maxIndex]);

  const goToPrev = () => {
    setIsAutoPlay(false);
    setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
    setTimeout(() => setIsAutoPlay(true), 8000);
  };

  const goToNext = () => {
    setIsAutoPlay(false);
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
    setTimeout(() => setIsAutoPlay(true), 8000);
  };

  if (items.length === 0) {
    return (
      <section className="section" aria-labelledby="featured-events-heading">
        <div className="container-main">
          <div className="text-center py-16 glass rounded-3xl border border-bg-border">
            <Sparkles className="w-10 h-10 text-primary/40 mx-auto mb-3" />
            <p className="text-text-secondary font-medium">{t("home.noFeatured")}</p>
          </div>
        </div>
      </section>
    );
  }

  // Gap between items in px
  const gapPx = 24;

  return (
    <section className="section py-12" aria-labelledby="featured-events-heading">
      <div className="container-main">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Featured Selection
            </div>
            <h2 id="featured-events-heading" className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {heading}
            </h2>
          </div>

          {showViewAll && (
            <Link href={viewAllHref} className="hidden sm:flex items-center gap-2 text-primary font-bold text-sm hover:underline group">
              <span>{t("home.viewAll")}</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {/* Carousel Container */}
        <div 
          className="relative group/carousel overflow-hidden p-1 -m-1"
          onMouseEnter={() => setIsAutoPlay(false)}
          onMouseLeave={() => setIsAutoPlay(true)}
        >
          {/* Sliding Track */}
          <div
            className="flex gap-6 transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(calc(-${currentIndex} * (100% + ${gapPx}px) / ${itemsPerView}))`,
            }}
          >
            {items.map((event) => (
              <div
                key={event.id}
                className="flex-shrink-0"
                style={{
                  width: `calc((100% - ${(itemsPerView - 1) * gapPx}px) / ${itemsPerView})`,
                }}
              >
                <EventCard event={event} variant="default" />
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {items.length > itemsPerView && (
            <>
              <button
                onClick={goToPrev}
                disabled={currentIndex === 0}
                className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-bg-surface/90 backdrop-blur-md border border-bg-border flex items-center justify-center text-white shadow-2xl transition-all duration-200 hover:border-primary hover:bg-primary/20 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                )}
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={goToNext}
                disabled={currentIndex >= maxIndex}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-bg-surface/90 backdrop-blur-md border border-bg-border flex items-center justify-center text-white shadow-2xl transition-all duration-200 hover:border-primary hover:bg-primary/20 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                )}
                aria-label="Next Slide"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Carousel Slide Indicators */}
        {maxIndex > 0 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            {Array.from({ length: maxIndex + 1 }, (_, i) => (
              <button
                key={i}
                onClick={() => {
                  setIsAutoPlay(false);
                  setCurrentIndex(i);
                  setTimeout(() => setIsAutoPlay(true), 8000);
                }}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === currentIndex
                    ? "bg-gradient-to-r from-primary to-primary-light w-8 shadow-sm shadow-primary/50"
                    : "bg-bg-border hover:bg-text-muted/40 w-2"
                )}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === currentIndex ? "true" : "false"}
              />
            ))}
          </div>
        )}

        {/* Mobile View All Button */}
        {showViewAll && (
          <div className="text-center mt-6 sm:hidden">
            <Link href={viewAllHref}>
              <Button variant="outline" className="w-full justify-center">
                <span>{t("home.viewAll")}</span>
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}