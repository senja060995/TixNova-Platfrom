"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Users, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Community } from "@/types";

export default function MyCommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getClient()
      .get("/me/communities", { params: { _t: Date.now() } })
      .then((res) => {
        const data = res.data?.data;
        setCommunities(Array.isArray(data) ? data : []);
      })
      .catch(() => setCommunities([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-bg-surface rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-bg-surface rounded-2xl border border-bg-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Komunitas Saya</h1>
        <Link href="/communities">
          <Button variant="outline" className="font-bold">
            <Heart className="w-4 h-4" /> Jelajahi Komunitas
          </Button>
        </Link>
      </div>

      {communities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {communities.map((c) => (
            <Link
              key={c.id}
              href={`/communities/${c.slug}`}
              className="bg-bg-surface border border-bg-border rounded-2xl p-6 space-y-4 hover:border-primary/50 hover:bg-bg-surface/80 transition-all shadow-lg group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 font-black text-lg shrink-0">
                  {c.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatar} alt={c.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    c.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate group-hover:text-primary transition-colors">{c.name}</h3>
                  <p className="text-xs font-mono uppercase text-text-muted">{c.code}</p>
                </div>
              </div>

              <p className="text-sm text-text-secondary line-clamp-2">
                {c.description || "Komunitas penggemar untuk saling terhubung."}
              </p>

              <div className="pt-2 border-t border-bg-border/60 flex items-center justify-between text-xs text-text-muted">
                <span className="flex items-center gap-1 font-semibold text-primary">
                  <Users className="w-3.5 h-3.5" /> {c.members_count ?? 0} Anggota
                </span>
                <span className="flex items-center gap-1 text-text-secondary">
                  Buka Detail <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-bg-surface border border-bg-border rounded-3xl p-14 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Belum Bergabung dengan Komunitas</h3>
          <p className="text-text-secondary text-sm mb-6">
            Jelajahi komunitas dan bergabung untuk mendapatkan manfaat dari event favoritmu.
          </p>
          <Link href="/communities" className="inline-flex items-center gap-1.5 font-bold text-primary hover:text-primary-dark">
            <CheckCircle2 className="w-4 h-4" /> Cari Komunitas Sekarang
          </Link>
        </div>
      )}
    </div>
  );
}
