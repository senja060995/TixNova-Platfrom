"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookOpen, Calendar, Eye, Search, ArrowRight, User, Newspaper } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

import { useLocale } from "@/components/LocaleProvider";

interface Blog {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  banner?: string;
  view_count: number;
  published_at: string;
  author?: { name: string };
  category?: { name: string };
}

function BlogListContent() {
  const { t, locale } = useLocale();
  const searchParams = useSearchParams();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const fetchBlogs = () => {
    setLoading(true);
    const params: Record<string, unknown> = { lang: locale };
    if (search) params.search = search;

    api.getClient().get("/blogs", { params })
      .then((res) => setBlogs(res.data.data.data || []))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBlogs();
  }, [locale]);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" /> TixNova Journal
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          {t("blog.title")}
        </h1>
        <p className="text-text-secondary text-base leading-relaxed">
          {t("blog.description")}
        </p>

        {/* Search */}
        <div className="flex gap-3 max-w-xl mx-auto pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <Input
              type="text"
              placeholder="Cari judul artikel atau berita..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 bg-bg-surface border-bg-border text-white rounded-2xl focus:border-primary py-3.5"
            />
          </div>
          <Button onClick={fetchBlogs} className="bg-primary hover:bg-primary-dark font-bold rounded-2xl px-6">
            Cari
          </Button>
        </div>
      </div>

      {/* Blog Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-96 bg-bg-surface rounded-3xl border border-bg-border" />
          ))}
        </div>
      ) : blogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <article
              key={blog.id}
              className="bg-bg-surface border border-bg-border rounded-3xl overflow-hidden flex flex-col justify-between hover:border-primary/40 transition-all shadow-xl group"
            >
              <div>
                {/* Banner Image */}
                <div className="h-52 bg-bg-elevated relative overflow-hidden">
                  <Image
                    src={blog.banner || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800"}
                    alt={blog.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span className="flex items-center gap-1.5 text-primary font-bold">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(blog.published_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {blog.view_count} pembaca
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors line-clamp-2">
                    {blog.title}
                  </h3>

                  <p className="text-text-secondary text-sm line-clamp-3 leading-relaxed">
                    {blog.excerpt}
                  </p>
                </div>
              </div>

              {/* Read Action */}
              <div className="p-6 pt-0">
                <Link href={`/blogs/${blog.slug}`}>
                  <Button variant="outline" className="w-full border-bg-border hover:border-primary/50 text-white font-bold text-xs flex items-center justify-center gap-2 py-3 rounded-xl">
                    <span>Baca Selengkapnya</span>
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="bg-bg-surface border border-bg-border rounded-3xl p-16 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Artikel Tidak Ditemukan</h3>
          <p className="text-text-secondary text-sm">Coba kata kunci pencarian artikel lainnya.</p>
        </div>
      )}
    </div>
  );
}

export default function BlogsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-white">Memuat artikel...</div>}>
      <BlogListContent />
    </Suspense>
  );
}
