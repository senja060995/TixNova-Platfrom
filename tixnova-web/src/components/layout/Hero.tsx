"use client";

import { useState, useEffect, FormEvent } from "react";
import { Search, Calendar, MapPin, ChevronDown, ArrowRight, Sparkles, Shield, Zap, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

const features = [
  { icon: Shield, title: "Aman & Terpercaya", desc: "Payment gateway resmi & enkripsi data bank-level" },
  { icon: Zap, title: "Proses Cepat", desc: "Checkout dalam 3 langkah, e-tiket instan via email & WA" },
  { icon: Users, title: "Ribuan Event", desc: "Konser, festival, komedi, teater di seluruh Indonesia" },
  { icon: Sparkles, title: "Fitur Modern", desc: "QR scan real-time, seat map, referral, voucher" },
];

export function Hero() {
  const [searchData, setSearchData] = useState({
    query: "",
    city: "",
    category: "",
    date: "",
  });
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [minDate, setMinDate] = useState("");

  useEffect(() => {
    // Handle hydration mismatch by checking if we're on client
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMinDate(new Date().toISOString().split("T")[0]);
    }
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

  return (
    <section className="relative flex items-center justify-center overflow-hidden pt-2 lg:pt-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-primary)_0%,_transparent_70%)] opacity-20" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      
      <div className="container-main relative z-10 py-4 lg:py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4 animate-fade-in">
            <TrendingUp className="w-4 h-4" />
            <span>Platform Ticketing Konser #1 Indonesia</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 animate-fade-in text-balance">
            Temukan <span className="text-gradient">Konser Terbaik</span> di Kotamu
          </h1>
          
          <p className="text-lg sm:text-xl text-text-secondary mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "100ms" }}>
            Ribuan konser, festival, & event menunggumu. Beli tiket mudah, aman, & dapat e-tiket instan.
          </p>
          
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-4 sm:p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="space-y-4 sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:gap-3 sm:items-end">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Cari konser, artis, venue..."
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
                  <option value="">Semua Kota</option>
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
                <span>Cari Event</span>
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            
            <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-text-muted">
              <span>Kategori populer:</span>
              {categories.slice(0, 4).map((cat) => (
                <Link
                  key={cat.value}
                  href={`/events?category=${cat.value}`}
                  className="px-3 py-1.5 rounded-full bg-bg-elevated hover:bg-primary/10 hover:text-primary text-text-muted hover:text-primary text-xs transition-colors"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </form>
        </div>
        
        <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass p-6 rounded-xl text-center hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group"
              style={{ animationDelay: `${400 + index * 100}ms` }}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-sm text-text-secondary">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
