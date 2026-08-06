"use client";

import { useState, useEffect, FormEvent } from "react";
import { Search, Calendar, MapPin, ChevronDown, ArrowRight, Sparkles, Shield, Zap, Users } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

const cities = [
  "Jakarta", "Bandung", "Surabaya", "Medan", "Semarang",
  "Makassar", "Palembang", "Tangerang", "Depok", "Bekasi"
];

const categories = [
  { value: "music", label: "Musik & Konser" },
  { value: "festival", label: "Festival" },
  { value: "comedy", label: "Komedi" },
  { value: "theater", label: "Teater & Drama" },
  { value: "sports", label: "Olahraga" },
  { value: "exhibition", label: "Pameran" },
];

export function Hero() {
  const { t } = useLocale();
  const [searchData, setSearchData] = useState({
    query: "",
    city: "",
    category: "",
    date: "",
  });
  const [minDate, setMinDate] = useState("");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMinDate(new Date().toISOString().split("T")[0]);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchData.query) params.set("search", searchData.query);
    if (searchData.city) params.set("city", searchData.city);
    if (searchData.category) params.set("category", searchData.category);
    if (searchData.date) params.set("date_from", searchData.date);
    window.location.href = `/events?${params.toString()}`;
  };

  const features = [
    { icon: Shield, title: "Aman & Terpercaya", desc: "Payment gateway resmi & enkripsi data bank-level" },
    { icon: Zap, title: "Proses Cepat", desc: "Checkout dalam 3 langkah, e-tiket instan via email & WA" },
    { icon: Users, title: "Ribuan Event", desc: "Konser, festival, komedi, teater di seluruh Indonesia" },
    { icon: Sparkles, title: "Fitur Modern", desc: "QR scan real-time, seat map, referral, voucher" },
  ];

  return (
    <section className="relative flex items-center justify-center overflow-hidden pt-2 lg:pt-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-primary)_0%,_transparent_70%)] opacity-20" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      
      <div className="container-main relative z-10 py-4 lg:py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span>{t("hero.badge")}</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 animate-fade-in text-balance">
            {t("hero.titleBefore")} <span className="text-gradient">{t("hero.titleHighlight")}</span> {t("hero.titleAfter")}
          </h1>
          
          <p className="text-lg sm:text-xl text-text-secondary mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "100ms" }}>
            {t("hero.description")}
          </p>
          
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-4 sm:p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="space-y-4 sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:gap-3 sm:items-end">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  placeholder={t("hero.searchPlaceholder")}
                  value={searchData.query}
                  onChange={(e) => setSearchData({ ...searchData, query: e.target.value })}
                  className="input-field pl-12 w-full"
                />
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted z-10 pointer-events-none" />
                <select
                  value={searchData.city}
                  onChange={(e) => setSearchData({ ...searchData, city: e.target.value })}
                  className="input-field pl-10 pr-9 appearance-none w-full text-sm"
                >
                  <option value="">{t("hero.allCities")}</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
              
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted z-10 pointer-events-none" />
                <input
                  type="date"
                  value={searchData.date}
                  onChange={(e) => setSearchData({ ...searchData, date: e.target.value })}
                  min={minDate || undefined}
                  className="input-field pl-10 pr-3 w-full text-sm cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
              
              <button type="submit" className="btn-primary w-full sm:w-auto whitespace-nowrap group">
                <span>{t("hero.search")}</span>
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            
            <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-text-muted">
              <span>{t("hero.popularCategories")}</span>
              {categories.slice(0, 4).map((cat) => (
                <Link
                  key={cat.value}
                  href={`/events?category=${cat.value}`}
                  className="px-3 py-1.5 rounded-full bg-bg-elevated border border-bg-border text-text-secondary hover:border-primary/30 hover:text-primary transition-all"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </form>
        </div>
        
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
          {features.map((feature) => (
            <div key={feature.title} className="text-left p-4 glass rounded-xl hover:border-primary/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-text-primary mb-1">{feature.title}</h3>
              <p className="text-sm text-text-secondary">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowRight className="w-6 h-6 text-text-muted rotate-90" />
      </div>
    </section>
  );
}
