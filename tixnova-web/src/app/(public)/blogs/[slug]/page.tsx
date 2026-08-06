"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, Eye, User, ArrowLeft, ArrowRight, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ShareModal } from "@/components/ui/ShareModal";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

import { useLocale } from "@/components/LocaleProvider";

interface BlogDetail {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  banner?: string;
  view_count: number;
  published_at: string;
  author?: { name: string };
  category?: { name: string };
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { locale } = useLocale();

  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [related, setRelated] = useState<BlogDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    api.getClient().get(`/blogs/${slug}`, { params: { lang: locale } })
      .then((res) => {
        setBlog(res.data.data.blog);
        setRelated(res.data.data.related || []);
      })
      .catch(() => setBlog(null))
      .finally(() => setLoading(false));
  }, [slug, locale]);

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 w-full animate-pulse space-y-6">
        <div className="h-10 bg-bg-surface rounded-xl w-3/4" />
        <div className="h-96 bg-bg-surface rounded-3xl" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Artikel Tidak Ditemukan</h2>
        <p className="text-text-secondary text-sm">Artikel yang Anda cari mungkin telah dihapus atau dipindahkan.</p>
        <Link href="/blogs">
          <Button className="bg-primary hover:bg-primary-dark font-bold">Kembali ke Blog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/blogs" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Blog
          </Link>
          <Button onClick={handleShare} variant="outline" className="border-bg-border hover:border-primary text-xs py-2 px-4 rounded-xl flex items-center gap-2">
            <Share2 className="w-3.5 h-3.5 text-primary" /> Bagikan
          </Button>
        </div>

        {/* Title Header */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">{blog.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary border-b border-bg-border pb-6">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <User className="w-4 h-4 text-primary" /> {blog.author?.name || "Redaksi TixNova"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" /> {formatDate(blog.published_at)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-primary" /> {blog.view_count} Kali Dibaca
            </span>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="h-80 sm:h-[450px] bg-bg-surface rounded-3xl overflow-hidden relative border border-bg-border shadow-2xl">
          <Image
            src={blog.banner || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200"}
            alt={blog.title}
            fill
            className="object-cover"
          />
        </div>

        {/* Article Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
          <div className="lg:col-span-2 space-y-6 text-text-secondary leading-relaxed text-base whitespace-pre-line bg-bg-surface/50 p-6 sm:p-8 rounded-3xl border border-bg-border/60">
            {blog.content}
          </div>

          {/* Sidebar Related Articles */}
          <aside className="space-y-6">
            <div className="bg-bg-surface p-6 rounded-3xl border border-bg-border space-y-4 shadow-xl">
              <h3 className="font-bold text-white text-lg flex items-center gap-2 border-b border-bg-border pb-3">
                <Sparkles className="w-4 h-4 text-primary" /> Artikel Terkait
              </h3>
              {related.length > 0 ? (
                <div className="space-y-4">
                  {related.map((rel) => (
                    <Link key={rel.id} href={`/blogs/${rel.slug}`} className="block group">
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-sm group-hover:text-primary transition-colors line-clamp-2">
                          {rel.title}
                        </h4>
                        <span className="text-[11px] text-text-muted">{formatDate(rel.published_at)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted">Tidak ada artikel terkait.</p>
              )}
            </div>
          </aside>
        </div>

      {blog && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title={blog.title}
        />
      )}
    </div>
  );
}
