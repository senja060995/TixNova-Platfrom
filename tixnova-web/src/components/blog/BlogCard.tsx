"use client";

import Link from "next/link";
import { Calendar, MapPin, Tag, ArrowRight, ExternalLink, TrendingUp, BookOpen, Clock } from "lucide-react";
import { Blog } from "@/types";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

import { useLocale } from "@/components/LocaleProvider";

interface BlogCardProps {
  blog: Blog;
  variant?: "default" | "featured" | "compact";
}

export function BlogCard({ blog, variant = "default" }: BlogCardProps) {
  const { t, locale } = useLocale();
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";

  // Use useState and useEffect to avoid hydration mismatch with formatRelativeTime
  const [blogRelativeTime, setBlogRelativeTime] = useState<string>("");
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBlogRelativeTime(formatRelativeTime(blog.created_at));
  }, [blog.created_at]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "/placeholder-blog.jpg";
  };

  if (isCompact) {
    return (
      <Link href={`/blogs/${blog.slug}`} className="group flex gap-3 p-2 glass rounded-xl hover:bg-bg-elevated transition-all">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={blog.banner || "/placeholder-blog.jpg"}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />
          {blog.is_featured && (
            <Badge variant="primary" className="absolute top-1 left-1 text-xs">
              Featured
            </Badge>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-text-primary group-hover:text-primary transition-colors line-clamp-1">
            {blog.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
            <Calendar className="w-3 h-3" />
            <span>{blogRelativeTime}</span>
            <span className="hidden sm:inline">·</span>
            <Clock className="w-3 h-3" />
            <span>{Math.ceil((blog.content?.length || 1000) / 200)} {locale === "en" ? "min read" : "menit baca"}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article className={cn(
      "group relative glass rounded-2xl overflow-hidden flex flex-col h-full",
      isFeatured && "border-primary/30 animate-pulse-glow"
    )}>
      <div className="relative aspect-video overflow-hidden">
        <img
          src={blog.banner || "/placeholder-blog.jpg"}
          alt={blog.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={handleImageError}
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base/90 via-transparent to-transparent" />
        
        <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2">
          {blog.is_featured && <Badge variant="primary" className="text-xs">Featured</Badge>}
          {blog.category && (
            <Badge variant="info" className="text-xs">{blog.category.name}</Badge>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/90 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(blog.created_at, { dateStyle: "medium" })}</span>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>{Math.ceil((blog.content?.length || 1000) / 200)} {locale === "en" ? "min read" : "menit baca"}</span>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-lg text-text-primary line-clamp-2 group-hover:text-primary transition-colors">
            {blog.title}
          </h3>
          {blog.is_featured && (
            <TrendingUp className="w-5 h-5 text-primary/50 group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
          )}
        </div>

        <p className="text-text-secondary line-clamp-2 mb-4 flex-1">
          {blog.excerpt || blog.content?.slice(0, 150) + "..."}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-bg-border">
          <div className="flex items-center gap-3">
            {blog.author?.avatar ? (
              <img src={blog.author.avatar} alt={blog.author.name} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-text-primary">{blog.author?.name || "TixNova"}</p>
              <p className="text-xs text-text-muted">{blogRelativeTime}</p>
            </div>
          </div>
          
          <Link
            href={`/blogs/${blog.slug}`}
            className="btn-outline text-sm py-1.5 px-3 group"
          >
            {t("blog.readMore")}
            <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}
