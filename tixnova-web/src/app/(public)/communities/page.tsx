"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Users, ArrowRight, Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Community } from "@/types";
import { publicApi } from "@/lib/api";

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi.communities
      .list()
      .then((res) => {
        const data = res.data?.data;
        setCommunities(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
      })
      .catch(() => setCommunities([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <Navbar />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12 w-full flex-1">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
            <Heart className="w-4 h-4" /> Komunitas Penggemar
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Gabung ke Komunitas & Dapatkan Manfaat
          </h1>
          <p className="text-text-secondary text-base leading-relaxed">
            Masukkan kode komunitas saat checkout untuk mendukung komunitas favoritmu, atau langsung bergabung di sini.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 bg-bg-surface rounded-3xl border border-bg-border" />
            ))}
          </div>
        ) : communities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((c) => (
              <Link
                key={c.id}
                href={`/communities/${c.slug}`}
                className="bg-bg-surface border border-bg-border rounded-3xl p-6 space-y-4 hover:border-primary/50 hover:bg-bg-surface/80 transition-all shadow-xl group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform font-black text-xl">
                    {c.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatar} alt={c.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      c.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-lg truncate group-hover:text-primary transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-xs font-mono uppercase text-text-muted">{c.code}</p>
                  </div>
                </div>

                <p className="text-sm text-text-secondary line-clamp-2">
                  {c.description || "Komunitas penggemar untuk saling terhubung dan mendukung event favoritmu."}
                </p>

                <div className="pt-2 border-t border-bg-border/60 flex items-center justify-between text-xs text-text-muted">
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <Users className="w-3.5 h-3.5" />
                    {c.members_count ?? 0} Anggota
                  </span>
                  <span className="flex items-center gap-1 text-text-secondary">
                    Lihat Detail <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-bg-surface border border-bg-border rounded-3xl p-16 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Belum Ada Komunitas</h3>
            <p className="text-text-secondary text-sm mb-6">Komunitas akan tampil di sini begitu dipublikasikan promotor.</p>
            <Link href="/events">
              <Button className="bg-primary hover:bg-primary-dark font-bold">Jelajahi Event</Button>
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
