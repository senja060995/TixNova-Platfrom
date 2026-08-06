"use client";

import { EventCard } from "./EventCard";
import { Event } from "@/types";
import { Calendar, ArrowRight, Ticket } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/components/LocaleProvider";

interface UpcomingEventsProps {
  events: Event[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  const { t } = useLocale();

  if (events.length === 0) {
    return (
      <section className="section" aria-labelledby="upcoming-heading">
        <div className="container-main">
          <div className="text-center py-16 glass rounded-2xl">
            <Ticket className="w-12 h-12 mx-auto text-text-muted mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">{t("home.noUpcoming")}</h3>
            <p className="text-text-secondary">{t("home.upcomingSoon")}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section" aria-labelledby="upcoming-heading">
      <div className="container-main">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 id="upcoming-heading" className="text-2xl sm:text-3xl font-bold text-text-primary flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              {t("home.upcoming")}
            </h2>
            <p className="text-text-secondary mt-1">{t("home.upcomingDescription")}</p>
          </div>
          <Link href="/events">
            <Button variant="outline">
              {t("home.viewAll")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.slice(0, 8).map((event) => (
            <EventCard key={event.id} event={event} variant="default" />
          ))}
        </div>

        {events.length > 8 && (
          <div className="mt-10 text-center">
            <Link href="/events">
              <Button size="lg" variant="outline">
                {t("home.viewAll")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}