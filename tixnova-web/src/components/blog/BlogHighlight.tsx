"use client";

import { BlogCard } from "./BlogCard";
import { Blog } from "@/types";
import Link from "next/link";
import { ArrowRight, BookOpen, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import { useMemo } from "react";

interface BlogHighlightProps {
  blogs: Blog[];
}

export function BlogHighlight({ blogs }: BlogHighlightProps) {
  const featuredBlog = useMemo(() => blogs.find(b => b.is_featured) || blogs[0], [blogs]);
  const otherBlogs = useMemo(() => blogs.filter(b => b.id !== (featuredBlog?.id || 0)).slice(0, 2), [blogs, featuredBlog]);

  const featuredBlogRelativeTime = useMemo(() => {
    return featuredBlog ? formatRelativeTime(featuredBlog.created_at) : "";
  }, [featuredBlog]);

  const otherBlogsRelativeTimes = useMemo(() => {
    const times: Record<string, string> = {};
    otherBlogs.forEach(blog => {
      times[blog.id] = formatRelativeTime(blog.created_at);
    });
    return times;
  }, [otherBlogs]);

  if (blogs.length === 0 || !featuredBlog) {
    return (
      <section className="section" aria-labelledby="blog-heading">
        <div className="container-main">
          <div className="text-center py-16 glass rounded-2xl">
            <BookOpen className="w-12 h-12 mx-auto text-text-muted mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">Belum ada artikel</h3>
            <p className="text-text-secondary">Artikel terbaru akan muncul di sini</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section" aria-labelledby="blog-heading">
      <div className="container-main">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 id="blog-heading" className="text-2xl sm:text-3xl font-bold text-text-primary flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              Artikel Terbaru
            </h2>
            <p className="text-text-secondary mt-1">Tips, review, & panduan seputar konser & event</p>
          </div>
          <Link href="/blogs">
            <Button variant="outline">
              Lihat Semua
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <article className="lg:col-span-7 relative glass rounded-2xl overflow-hidden group">
            <div className="relative aspect-[16/10] lg:aspect-[4/3] overflow-hidden">
              <img
                src={featuredBlog.banner || "/placeholder-blog.jpg"}
                alt={featuredBlog.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { e.currentTarget.src = "/placeholder-blog.jpg"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-base/90 via-transparent to-transparent" />
              
              <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
                {featuredBlog.is_featured && (
                  <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Featured
                  </span>
                )}
                {featuredBlog.category && (
                  <span className="px-3 py-1 bg-info/20 text-info text-xs font-medium rounded-full">
                    {featuredBlog.category.name}
                  </span>
                )}
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <Link href={`/blogs/${featuredBlog.slug}`} className="block p-4 glass rounded-xl">
                  <h3 className="font-bold text-xl lg:text-2xl text-white group-hover:text-primary transition-colors line-clamp-2">
                    {featuredBlog.title}
                  </h3>
                  <div className="mt-3 flex items-center gap-3 text-white/80 text-sm">
                    {featuredBlog.author?.avatar ? (
                      <img src={featuredBlog.author.avatar} alt={featuredBlog.author.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{featuredBlog.author?.name || "TixNova"}</p>
                      <p className="text-xs">{featuredBlogRelativeTime} • {Math.ceil((featuredBlog.content?.length || 1000) / 200)} min read</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </article>

          <div className="lg:col-span-5 grid grid-cols-1 gap-4">
            {otherBlogs.map((blog) => (
              <article key={blog.id} className="relative glass rounded-xl overflow-hidden group">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={blog.banner || "/placeholder-blog.jpg"}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => { e.currentTarget.src = "/placeholder-blog.jpg"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-base/90 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <Link href={`/blogs/${blog.slug}`} className="block p-3 glass rounded-lg">
                      <h4 className="font-semibold text-white group-hover:text-primary transition-colors line-clamp-2">
                        {blog.title}
                      </h4>
                      <div className="mt-2 flex items-center gap-2 text-white/70 text-xs">
                        {blog.author?.avatar ? (
                          <img src={blog.author.avatar} alt="" className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <BookOpen className="w-3 h-3 text-primary" />
                          </div>
                        )}
                        <span>{blog.author?.name || "TixNova"}</span>
                        <span>·</span>
                        <span>{otherBlogsRelativeTimes[blog.id] || ''}</span>
                      </div>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link href="/blogs">
            <Button variant="outline" size="lg">
              Lihat Semua Artikel
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
