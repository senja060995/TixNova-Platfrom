"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Users, Calendar, MapPin, ChevronLeft, Sparkles, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { Community } from "@/types";
import { publicApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!slug) return;
    publicApi.communities
      .show(slug)
      .then((res) => {
        setCommunity(res.data.data);
        setError(null);
      })
      .catch(() => {
        setError("Komunitas tidak ditemukan.");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleJoin = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!community) return;
    setActing(true);
    publicApi.communities
      .join(community.slug)
      .then(() => {
        setCommunity((prev) => (prev ? { ...prev, is_member: true } : prev));
        toast.success("Berhasil bergabung dengan komunitas.");
      })
      .catch(() => toast.error("Gagal bergabung dengan komunitas."))
      .finally(() => setActing(false));
  };

  const handleLeave = () => {
    if (!community) return;
    setActing(true);
    publicApi.communities
      .leave(community.slug)
      .then(() => {
        setCommunity((prev) => (prev ? { ...prev, is_member: false } : prev));
        toast.success("Berhasil keluar dari komunitas.");
      })
      .catch(() => toast.error("Gagal keluar dari komunitas."))
      .finally(() => setActing(false));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col">
        <Navbar />
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 w-full flex-1 animate-pulse space-y-6">
          <div className="h-8 w-32 bg-bg-surface rounded-xl" />
          <div className="h-56 bg-bg-surface rounded-3xl border border-bg-border" />
          <div className="h-40 bg-bg-surface rounded-3xl border border-bg-border" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col">
        <Navbar />
        <div className="max-w-xl mx-auto py-24 px-4 w-full flex-1">
          <div className="bg-bg-surface border border-bg-border rounded-3xl p-16 text-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Komunitas Tidak Ditemukan</h3>
            <p className="text-text-secondary text-sm mb-6">{error}</p>
            <Link href="/communities">
              <Button variant="outline" className="font-bold">Kembali ke Daftar</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const leader = community.members?.find((m) => m.role === "leader");

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <Navbar />
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-8">
        <Link
          href="/communities"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Semua Komunitas
        </Link>

        <div className="bg-bg-surface border border-bg-border rounded-3xl p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 font-black text-3xl shrink-0">
              {community.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={community.avatar} alt={community.name} className="w-full h-full object-cover rounded-3xl" />
              ) : (
                community.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono uppercase text-text-muted bg-bg-elevated px-2.5 py-0.5 rounded-full">
                  {community.code}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  {community.type}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{community.name}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-text-secondary">
                <Users className="w-4 h-4" /> {community.members_count ?? community.members?.length ?? 0} anggota
              </p>
            </div>
            {community.is_member ? (
              <Button variant="outline" className="font-bold border-primary/40 text-primary hover:bg-primary/10" onClick={handleLeave} disabled={acting}>
                Keluar dari Komunitas
              </Button>
            ) : (
              <Button className="bg-primary hover:bg-primary-dark font-bold shadow-md shadow-primary/20" onClick={handleJoin} disabled={acting}>
                <Heart className="w-4 h-4" /> Gabung Sekarang
              </Button>
            )}
          </div>

          {community.description && (
            <p className="text-text-secondary text-base leading-relaxed">{community.description}</p>
          )}

          {community.is_member && (
            <div className="flex items-center gap-2 text-sm font-semibold text-green-400 bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4" /> Anda adalah anggota komunitas ini.
            </div>
          )}
        </div>

        {leader && (
          <div className="bg-bg-surface border border-bg-border rounded-3xl p-6 shadow-xl">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Dipimpin oleh
            </h2>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">
                {leader.name ? leader.name.charAt(0).toUpperCase() : "L"}
              </div>
              <div>
                <p className="font-bold text-white">{leader.name || "Pemimpin Komunitas"}</p>
                {leader.email && <p className="text-xs text-text-secondary">{leader.email}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="bg-bg-surface border border-bg-border rounded-3xl p-6 shadow-xl">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Event Komunitas
          </h2>
          {community.events && community.events.length > 0 ? (
            <div className="space-y-3">
              {community.events.map((ce) => (
                <Link
                  key={ce.id}
                  href={ce.event ? `/events/${ce.event.slug}` : "/events"}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-bg-border hover:border-primary/50 hover:bg-bg-base/60 transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate group-hover:text-primary transition-colors">
                      {ce.event?.title || "Event"}
                    </p>
                    <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {ce.event?.city || "-"}
                    </p>
                  </div>
                  <span className="text-xs text-text-muted shrink-0">
                    {ce.event?.start_date ? formatDate(ce.event.start_date) : ""}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">Belum ada event yang terhubung dengan komunitas ini.</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
