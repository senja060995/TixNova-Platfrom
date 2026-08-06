"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Grid, Ticket, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { api } from "@/lib/api";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  events_count?: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getClient().get("/categories")
      .then((res) => setCategories(res.data.data || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12 w-full">
      {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
            <Grid className="w-4 h-4" /> Kategori Event & Konser
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Jelajahi Konser Berdasarkan Kategori
          </h1>
          <p className="text-text-secondary text-base leading-relaxed">
            Temukan konser musik pilihanmu dari genre Pop, K-Pop, Rock, Jazz, hingga Festival Internasional.
          </p>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-44 bg-bg-surface rounded-3xl border border-bg-border" />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/events?category=${cat.slug}`}
                className="bg-bg-surface border border-bg-border rounded-3xl p-6 space-y-4 hover:border-primary/50 hover:bg-bg-surface/80 transition-all shadow-xl group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                  <CategoryIcon name={cat.name} icon={cat.icon} className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-white text-lg group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>{cat.name}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-text-secondary line-clamp-2">
                    {cat.description || `Semua konser & pertunjukan musik kategori ${cat.name}.`}
                  </p>
                </div>

                <div className="pt-2 border-t border-bg-border/60 flex items-center justify-between text-xs text-text-muted">
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <Ticket className="w-3.5 h-3.5" /> Lihat Event
                  </span>
                  <span className="bg-bg-elevated px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase text-text-secondary">Explore</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-bg-surface border border-bg-border rounded-3xl p-16 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              <Grid className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Kategori Belum Tersedia</h3>
            <p className="text-text-secondary text-sm mb-6">Jelajahi seluruh daftar event konser terbaru.</p>
            <Link href="/events">
              <Button className="bg-primary hover:bg-primary-dark font-bold">Semua Event</Button>
            </Link>
          </div>
        )}
    </div>
  );
}
