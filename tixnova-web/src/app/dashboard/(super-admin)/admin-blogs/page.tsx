"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText, Plus, Search, Eye, Trash2, Edit3, Globe, Clock, CheckCircle2, X,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Code, Link2, ImageIcon, Heading1, Heading2, Heading3,
  MapPin, Tag, SearchCheck, Sparkles, ArrowLeft, UploadCloud, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface BlogArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  banner?: string;
  location?: string;
  tags?: string[] | string;
  meta_title?: string;
  meta_description?: string;
  status: "draft" | "published";
  view_count: number;
  published_at?: string;
  created_at: string;
  author?: { name: string };
  category?: { id: number; name: string };
}

interface CategoryOption {
  id: number;
  name: string;
}

export default function SuperAdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogArticle[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Editor View vs Table View
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogArticle | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [banner, setBanner] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingInlineImg, setUploadingInlineImg] = useState(false);
  const [location, setLocation] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");

  const editorRef = useRef<HTMLDivElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);
  const inlineImgFileRef = useRef<HTMLInputElement>(null);

  const fetchBlogs = () => {
    setLoading(true);
    const params: Record<string, unknown> = {};
    if (search) params.search = search;

    api.getClient().get("/super-admin/blogs", { params })
      .then((res) => setBlogs(res.data.data.data || []))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBlogs();
    api.getClient().get("/categories")
      .then((res) => setCategories(res.data.data || []))
      .catch(() => setCategories([]));
  }, []);

  const openCreateEditor = () => {
    setEditingBlog(null);
    setTitle("");
    setSlug("");
    setCategoryId("");
    setExcerpt("");
    setContent("");
    setBanner("");
    setLocation("");
    setTags([]);
    setMetaTitle("");
    setMetaDescription("");
    setStatus("published");
    setActiveTab("content");
    setIsEditorOpen(true);
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  const openEditEditor = (blog: BlogArticle) => {
    setEditingBlog(blog);
    setTitle(blog.title);
    setSlug(blog.slug);
    setCategoryId(blog.category?.id ? String(blog.category.id) : "");
    setExcerpt(blog.excerpt || "");
    setContent(blog.content || "");
    setBanner(blog.banner || "");
    setLocation(blog.location || "");
    setTags(Array.isArray(blog.tags) ? blog.tags : (typeof blog.tags === "string" ? blog.tags.split(",") : []));
    setMetaTitle(blog.meta_title || blog.title);
    setMetaDescription(blog.meta_description || blog.excerpt);
    setStatus(blog.status);
    setActiveTab("content");
    setIsEditorOpen(true);

    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = blog.content || "";
      }
    }, 100);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingBlog) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
      if (!metaTitle) setMetaTitle(val);
    }
  };

  // Upload Banner Image File
  const handleBannerUpload = async (file: File) => {
    setUploadingBanner(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await api.getClient().post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.url) {
        setBanner(res.data.url);
        toast.success("Gambar banner berhasil diunggah!");
      }
    } catch {
      toast.error("Gagal mengunggah gambar banner.");
    } finally {
      setUploadingBanner(false);
    }
  };

  // Upload Inline Article Image File
  const handleInlineImageUpload = async (file: File) => {
    setUploadingInlineImg(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await api.getClient().post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.url) {
        formatDoc("insertImage", res.data.url);
        toast.success("Gambar berhasil disisipkan ke artikel!");
      }
    } catch {
      toast.error("Gagal mengunggah gambar ke artikel.");
    } finally {
      setUploadingInlineImg(false);
    }
  };

  // Rich Text Editor Commands
  const formatDoc = (cmd: string, value: string | undefined = undefined) => {
    document.execCommand(cmd, false, value);
    if (editorRef.current) setContent(editorRef.current.innerHTML);
  };

  const insertLink = () => {
    const url = prompt("Masukkan URL Link (contoh: https://tixnova.id):");
    if (url) formatDoc("createLink", url);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, "");
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentHtmlContent = editorRef.current ? editorRef.current.innerHTML : content;

    if (!title || !excerpt || !currentHtmlContent) {
      toast.error("Mohon lengkapi judul, ringkasan, dan isi artikel.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        category_id: categoryId ? Number(categoryId) : null,
        excerpt,
        content: currentHtmlContent,
        banner: banner.trim() || null,
        location: location.trim() || null,
        tags: tags,
        meta_title: metaTitle || title,
        meta_description: metaDescription || excerpt,
        status,
      };

      if (editingBlog) {
        await api.getClient().put(`/super-admin/blogs/${editingBlog.id}`, payload);
        toast.success("Artikel berhasil diperbarui!");
      } else {
        await api.getClient().post("/super-admin/blogs", payload);
        toast.success("Artikel baru berhasil diterbitkan!");
      }

      setIsEditorOpen(false);
      fetchBlogs();
    } catch {
      toast.error("Gagal menyimpan artikel blog.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (id: number) => {
    try {
      await api.getClient().post(`/super-admin/blogs/${id}/toggle-publish`);
      toast.success("Status publikasi artikel diubah.");
      fetchBlogs();
    } catch {
      toast.error("Gagal mengubah status publikasi.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus artikel ini?")) return;
    try {
      await api.getClient().delete(`/super-admin/blogs/${id}`);
      toast.success("Artikel berhasil dihapus.");
      fetchBlogs();
    } catch {
      toast.error("Gagal menghapus artikel.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Hidden File Inputs */}
      <input
        ref={bannerFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleBannerUpload(e.target.files[0]);
        }}
      />
      <input
        ref={inlineImgFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleInlineImageUpload(e.target.files[0]);
        }}
      />

      {/* Editor View */}
      {isEditorOpen ? (
        <div className="space-y-6">
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between border-b border-bg-border pb-4">
            <button
              onClick={() => setIsEditorOpen(false)}
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Artikel
            </button>

            <div className="flex items-center gap-3">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className="bg-bg-elevated border border-bg-border text-white text-xs font-bold rounded-xl px-3 py-2"
              >
                <option value="published">Status: Published</option>
                <option value="draft">Status: Draft</option>
              </select>

              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-primary hover:bg-primary-dark font-extrabold px-6 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/30"
              >
                {saving ? "Menyimpan..." : (editingBlog ? "Perbarui Artikel" : "Simpan & Terbitkan")}
              </Button>
            </div>
          </div>

          {/* Main Grid: Form Inputs + SEO Tab */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Rich Text Content (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & Slug */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Masukkan Judul Artikel Blog..."
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-transparent text-2xl sm:text-3xl font-black text-white placeholder-text-muted focus:outline-none border-b border-bg-border pb-3 focus:border-primary transition-colors"
                />
                {slug && (
                  <p className="text-xs text-text-muted font-mono flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-primary" /> Permalink: https://tixnova.id/blogs/<span className="text-primary">{slug}</span>
                  </p>
                )}
              </div>

              {/* Tab Navigation (Content vs SEO) */}
              <div className="flex border-b border-bg-border gap-6">
                <button
                  type="button"
                  onClick={() => setActiveTab("content")}
                  className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === "content" ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-white"
                  }`}
                >
                  <FileText className="w-4 h-4" /> Content & Formatting (Word Editor)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("seo")}
                  className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === "seo" ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-white"
                  }`}
                >
                  <SearchCheck className="w-4 h-4" /> SEO & Meta Data
                </button>
              </div>

              {activeTab === "content" ? (
                <div className="space-y-6">
                  {/* Rich Text Toolbar (Microsoft Word Style) */}
                  <div className="bg-bg-surface border border-bg-border rounded-2xl overflow-hidden shadow-xl">
                    <div className="bg-bg-elevated/80 border-b border-bg-border p-2 flex flex-wrap items-center gap-1 text-text-secondary">
                      <button type="button" title="Bold" onClick={() => formatDoc("bold")} className="p-2 hover:bg-bg-surface hover:text-white rounded-lg transition-colors">
                        <Bold className="w-4 h-4" />
                      </button>
                      <button type="button" title="Italic" onClick={() => formatDoc("italic")} className="p-2 hover:bg-bg-surface hover:text-white rounded-lg transition-colors">
                        <Italic className="w-4 h-4" />
                      </button>
                      <button type="button" title="Underline" onClick={() => formatDoc("underline")} className="p-2 hover:bg-bg-surface hover:text-white rounded-lg transition-colors">
                        <Underline className="w-4 h-4" />
                      </button>
                      <button type="button" title="Strikethrough" onClick={() => formatDoc("strikeThrough")} className="p-2 hover:bg-bg-surface hover:text-white rounded-lg transition-colors">
                        <Strikethrough className="w-4 h-4" />
                      </button>

                      <div className="h-4 w-px bg-bg-border mx-1" />

                      <button type="button" title="Heading 1" onClick={() => formatDoc("formatBlock", "<h1>")} className="p-2 hover:bg-bg-surface hover:text-white rounded-lg transition-colors">
                        <Heading1 className="w-4 h-4" />
                      </button>
                      <button type="button" title="Heading 2" onClick={() => formatDoc("formatBlock", "<h2>")} className="p-2 hover:bg-bg-surface hover:text-white rounded-lg transition-colors">
                        <Heading2 className="w-4 h-4" />
                      </button>
                      <button type="button" title="Heading 3" onClick={() => formatDoc("formatBlock", "<h3>")} className="p-2 hover:bg-bg-surface hover:text-white rounded-lg transition-colors">
                        <Heading3 className="w-4 h-4" />
                      </button>

                      <div className="h-4 w-px bg-bg-border mx-1" />

                      <button type="button" title="Align Left" onClick={() => formatDoc("justifyLeft")} className="p-2 hover:bg-bg-surface hover:text-white rounded-lg transition-colors">
                        <AlignLeft className="w-4 h-4" />
                      </button>
                      <button type="button" title="Align Center" onClick={() => formatDoc("justifyCenter")} className="p-2 hover:bg-bg-surface hover:text-white rounded-lg transition-colors">
                        <AlignCenter className="w-4 h-4" />
                      </button>
                      <button type="button" title="Align Right" onClick={() => formatDoc("justifyRight")} className="p-2 hover:bg-bg-surface hover:text-white rounded-lg transition-colors">
                        <AlignRight className="w-4 h-4" />
                      </button>
                      <button type="button" title="Justify" onClick={() => formatDoc("justifyFull")} className="p-2 hover:bg-bg-surface hover:text-white rounded-lg transition-colors">
                        <AlignJustify className="w-4 h-4" />
                      </button>

                      <div className="h-4 w-px bg-bg-border mx-1" />

                      <button type="button" title="Unordered List" onClick={() => formatDoc("insertUnorderedList")} className="p-2 hover:bg-bg-surface hover:text-white rounded-lg transition-colors">
                        <List className="w-4 h-4" />
                      </button>
                      <button type="button" title="Ordered List" onClick={() => formatDoc("insertOrderedList")} className="p-2 hover:bg-bg-surface hover:text-white rounded-lg transition-colors">
                        <ListOrdered className="w-4 h-4" />
                      </button>
                      <button type="button" title="Quote" onClick={() => formatDoc("formatBlock", "<blockquote>")} className="p-2 hover:bg-bg-surface hover:text-white rounded-lg transition-colors">
                        <Quote className="w-4 h-4" />
                      </button>

                      <div className="h-4 w-px bg-bg-border mx-1" />

                      <button type="button" title="Insert Link" onClick={insertLink} className="p-2 hover:bg-bg-surface hover:text-white rounded-lg transition-colors">
                        <Link2 className="w-4 h-4" />
                      </button>

                      {/* Upload Image Button */}
                      <button
                        type="button"
                        title="Upload & Sisipkan Gambar File"
                        onClick={() => inlineImgFileRef.current?.click()}
                        disabled={uploadingInlineImg}
                        className="p-2 hover:bg-bg-surface hover:text-white rounded-lg transition-colors text-primary flex items-center gap-1"
                      >
                        {uploadingInlineImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                        <span className="text-xs font-bold hidden sm:inline">Upload Gambar</span>
                      </button>
                    </div>

                    {/* Content editable Word area */}
                    <div
                      ref={editorRef}
                      contentEditable
                      onInput={() => editorRef.current && setContent(editorRef.current.innerHTML)}
                      className="p-6 min-h-[400px] text-white text-base leading-relaxed focus:outline-none prose prose-invert max-w-none font-sans"
                    />
                  </div>

                  {/* Excerpt Summary */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase text-text-secondary">Ringkasan / Excerpt Artikel</label>
                    <textarea
                      rows={3}
                      placeholder="Tulis ringkasan singkat artikel (tampil pada kartu daftar blog)..."
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      className="w-full p-4 bg-bg-surface border border-bg-border text-white text-sm rounded-2xl focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                /* SEO Settings Tab */
                <div className="bg-bg-surface border border-bg-border rounded-3xl p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase text-text-secondary">Meta Title (Judul Google)</label>
                    <Input
                      type="text"
                      placeholder="Judul optimal SEO (50-60 karakter)..."
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      className="bg-bg-elevated border-bg-border text-white text-sm py-3"
                    />
                    <p className="text-[11px] text-text-muted">{metaTitle.length} / 60 Karakter</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase text-text-secondary">Meta Description (Deskripsi Google)</label>
                    <textarea
                      rows={4}
                      placeholder="Deskripsi singkat yang muncul pada hasil pencarian Google (150-160 karakter)..."
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      className="w-full p-4 bg-bg-elevated border border-bg-border text-white text-sm rounded-2xl focus:border-primary focus:outline-none"
                    />
                    <p className="text-[11px] text-text-muted">{metaDescription.length} / 160 Karakter</p>
                  </div>

                  {/* Live Google Search Preview */}
                  <div className="border-t border-bg-border pt-6 space-y-3">
                    <span className="text-xs font-bold uppercase text-primary tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Live Google Search Snippet Preview
                    </span>
                    <div className="bg-bg-elevated/70 border border-bg-border rounded-2xl p-4 space-y-1">
                      <div className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                        https://tixnova.id › blogs › {slug || "judul-artikel"}
                      </div>
                      <h4 className="text-lg font-semibold text-blue-400 hover:underline cursor-pointer">
                        {metaTitle || title || "Judul Artikel Blog TixNova"}
                      </h4>
                      <p className="text-xs text-text-secondary line-clamp-2">
                        {metaDescription || excerpt || "Pratinjau deskripsi artikel blog yang akan dibaca oleh calon pembeli tiket di hasil pencarian Google..."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Metadata (Banner, Category, Location, Tags) */}
            <div className="space-y-6">
              {/* Banner Image Upload Card */}
              <div className="bg-bg-surface border border-bg-border rounded-3xl p-6 space-y-4 shadow-xl">
                <span className="text-xs font-bold uppercase text-text-secondary tracking-wider block">Gambar Banner Utama</span>
                
                {banner ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-bg-border group">
                    <img src={banner} alt="Banner preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setBanner("")}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-danger text-white p-1.5 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => bannerFileRef.current?.click()}
                    className="border-2 border-dashed border-bg-border hover:border-primary/50 cursor-pointer rounded-2xl p-6 text-center space-y-3 transition-colors bg-bg-elevated/40"
                  >
                    {uploadingBanner ? (
                      <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-primary mx-auto" />
                    )}
                    <div>
                      <p className="text-sm font-bold text-white">
                        {uploadingBanner ? "Mengunggah Gambar..." : "Upload File Gambar Banner"}
                      </p>
                      <p className="text-xs text-text-muted mt-1">Klik atau drag & drop file JPG, PNG, WEBP (Max 10MB)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Category & Location */}
              <div className="bg-bg-surface border border-bg-border rounded-3xl p-6 space-y-5 shadow-xl">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase text-text-secondary">Kategori Event / Blog</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-3 bg-bg-elevated border border-bg-border text-white text-sm rounded-xl"
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase text-text-secondary flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> Lokasi / Venue
                  </label>
                  <Input
                    type="text"
                    placeholder="Contoh: GBK Senayan, Jakarta"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-bg-elevated border-bg-border text-white text-sm py-2.5"
                  />
                </div>
              </div>

              {/* Tags Section */}
              <div className="bg-bg-surface border border-bg-border rounded-3xl p-6 space-y-4 shadow-xl">
                <span className="text-xs font-bold uppercase text-text-secondary tracking-wider block flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-primary" /> Tag Artikel (Tekan Enter)
                </span>
                <Input
                  type="text"
                  placeholder="Ketik tag & tekan Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="bg-bg-elevated border-bg-border text-white text-xs py-2.5"
                />
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold">
                      #{t}
                      <button type="button" onClick={() => removeTag(t)} className="hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Kelola Blog & Artikel</h1>
              <p className="text-text-secondary text-sm mt-1">
                Buat, sunting, dan publikasikan artikel edukasi & tips konser untuk platform TixNova.
              </p>
            </div>

            <Button
              onClick={openCreateEditor}
              className="bg-primary hover:bg-primary-dark font-extrabold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" /> Tulis Artikel Baru
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <Input
                type="text"
                placeholder="Cari judul artikel atau lokasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 bg-bg-surface border-bg-border text-white rounded-xl focus:border-primary py-3"
              />
            </div>
            <Button onClick={fetchBlogs} className="bg-primary hover:bg-primary-dark font-bold">
              Cari
            </Button>
          </div>

          {/* Table */}
          <div className="bg-bg-surface border border-bg-border rounded-3xl overflow-hidden shadow-2xl">
            {loading ? (
              <div className="p-12 text-center animate-pulse text-text-secondary">Memuat artikel blog...</div>
            ) : blogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-text-secondary">
                  <thead className="text-xs uppercase bg-bg-elevated/60 text-text-muted border-b border-bg-border">
                    <tr>
                      <th className="py-4 px-6">Artikel</th>
                      <th className="py-4 px-6">Penulis</th>
                      <th className="py-4 px-6">Lokasi</th>
                      <th className="py-4 px-6">Pembaca</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Tanggal Publikasi</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bg-border/60">
                    {blogs.map((b) => (
                      <tr key={b.id} className="hover:bg-bg-elevated/30 transition-colors">
                        <td className="py-4 px-6 font-bold text-white max-w-xs">
                          <Link href={`/blogs/${b.slug}`} target="_blank" className="hover:text-primary transition-colors line-clamp-1 block">
                            {b.title}
                          </Link>
                          <span className="text-[11px] text-text-muted font-mono block font-normal">/{b.slug}</span>
                        </td>
                        <td className="py-4 px-6 text-xs text-white">
                          {b.author?.name || "Super Admin"}
                        </td>
                        <td className="py-4 px-6 text-xs text-text-secondary">
                          {b.location || "-"}
                        </td>
                        <td className="py-4 px-6 font-bold text-primary text-xs">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> {b.view_count} views
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            b.status === "published"
                              ? "bg-success/20 text-success border border-success/30"
                              : "bg-accent/20 text-accent border border-accent/30"
                          }`}>
                            {b.status === "published" ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-text-muted">
                          {b.published_at ? formatDate(b.published_at) : "Belum dipublikasikan"}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTogglePublish(b.id)}
                            className="border-bg-border text-xs py-1.5 px-3"
                          >
                            {b.status === "published" ? "Draftkan" : "Terbitkan"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditEditor(b)}
                            className="border-bg-border text-xs py-1.5 px-3"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(b.id)}
                            className="border-danger/40 text-danger hover:bg-danger/10 text-xs py-1.5 px-3"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-text-secondary text-sm">Belum ada artikel blog.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
