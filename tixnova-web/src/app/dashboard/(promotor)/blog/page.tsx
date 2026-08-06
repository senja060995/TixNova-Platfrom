"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText, Plus, Search, Eye, Edit3, Trash2,
  Send, BookOpen, RefreshCw, Image
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { formatDate, truncate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface Blog {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  category?: { name: string };
}

export default function PromotorBlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchBlogs = () => {
    setLoading(true);
    const params: Record<string, unknown> = {};
    if (search) params.search = search;

    api.getClient().get("/promotor/blogs", { params })
      .then((res) => setBlogs(res.data?.data?.data || res.data?.data || []))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBlogs();
  }, []);

  const handlePublish = async (id: number) => {
    try {
      await api.getClient().post(`/promotor/blogs/${id}/publish`);
      toast.success("Artikel berhasil dipublish!");
      fetchBlogs();
    } catch {
      toast.error("Gagal mempublish artikel.");
    }
  };

  const handleUnpublish = async (id: number) => {
    try {
      await api.getClient().post(`/promotor/blogs/${id}/unpublish`);
      toast.success("Artikel berhasil di-unpublish.");
      fetchBlogs();
    } catch {
      toast.error("Gagal mengubah status artikel.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus artikel ini?")) return;
    try {
      await api.getClient().delete(`/promotor/blogs/${id}`);
      toast.success("Artikel berhasil dihapus.");
      fetchBlogs();
    } catch {
      toast.error("Gagal menghapus artikel.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Kelola Blog</h1>
          <p className="text-text-secondary text-sm mt-1">
            Buat dan kelola artikel blog untuk mempromosikan event Anda.
          </p>
        </div>
        <Link href="/dashboard/blog/create">
          <Button className="bg-primary hover:bg-primary-dark font-bold flex items-center gap-2 shadow-lg shadow-primary/30">
            <Plus className="w-4 h-4" /> Tulis Artikel Baru
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            type="text"
            placeholder="Cari judul artikel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchBlogs()}
            className="pl-11 bg-bg-surface border-bg-border text-white rounded-xl"
          />
        </div>
        <Button onClick={fetchBlogs} className="bg-primary hover:bg-primary-dark">Cari</Button>
      </div>

      {/* Blog List */}
      <div className="bg-bg-surface border border-bg-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center animate-pulse text-text-secondary">Memuat artikel...</div>
        ) : blogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="text-xs uppercase bg-bg-elevated/60 text-text-muted border-b border-bg-border">
                <tr>
                  <th className="py-4 px-5">Judul Artikel</th>
                  <th className="py-4 px-5">Kategori</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Tanggal</th>
                  <th className="py-4 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border/60">
                {blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-bg-elevated/30 transition-colors">
                    <td className="py-4 px-5">
                      <p className="font-bold text-white">{truncate(blog.title, 45)}</p>
                      <p className="text-xs text-text-muted font-mono">/blogs/{blog.slug}</p>
                    </td>
                    <td className="py-4 px-5 text-xs">{blog.category?.name || "—"}</td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                        blog.status === "published"
                          ? "bg-success/20 text-success border-success/30"
                          : "bg-text-muted/20 text-text-muted border-bg-border"
                      }`}>
                        {blog.status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-xs">
                      {blog.published_at ? formatDate(blog.published_at) : formatDate(blog.created_at)}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-2">
                        {blog.status === "draft" ? (
                          <Button
                            size="sm"
                            onClick={() => handlePublish(blog.id)}
                            className="bg-success hover:bg-emerald-700 text-xs py-1.5 px-3 font-bold"
                          >
                            <Send className="w-3 h-3 mr-1" /> Publish
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnpublish(blog.id)}
                            className="border-accent/40 text-accent hover:bg-accent/10 text-xs py-1.5 px-3"
                          >
                            Unpublish
                          </Button>
                        )}
                        <Link href={`/blogs/${blog.slug}`} target="_blank">
                          <Button size="sm" variant="outline" className="border-bg-border text-xs py-1.5 px-3">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(blog.id)}
                          className="border-danger/40 text-danger hover:bg-danger/10 text-xs py-1.5 px-3"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <BookOpen className="w-12 h-12 text-text-muted mx-auto" />
            <p className="text-text-secondary text-sm">Belum ada artikel blog.</p>
            <Link href="/dashboard/blog/create">
              <Button className="bg-primary hover:bg-primary-dark mt-2">
                <Plus className="w-4 h-4 mr-2" /> Tulis Artikel Pertama
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
