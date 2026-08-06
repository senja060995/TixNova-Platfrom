"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Save, Send, Image as ImageIcon,
  Tag, AlignLeft, FileText
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, publicApi } from "@/lib/api";
import { generateSlug } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface Category {
  id: number;
  name: string;
}

export default function BlogCreatePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [publishAfter, setPublishAfter] = useState(false);

  // Multi-language state
  const [langTab, setLangTab] = useState<"id" | "en">("id");
  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [excerpt, setExcerpt] = useState("");
  const [excerptEn, setExcerptEn] = useState("");
  const [content, setContent] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [banner, setBanner] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");

  useEffect(() => {
    publicApi.events.categories()
      .then((res) => setCategories(res.data?.data || []))
      .catch(() => setCategories([]));
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlug(generateSlug(title));
  }, [title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error("Judul dan konten (Bahasa Indonesia) wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title,
        slug,
        category_id: categoryId || null,
        excerpt,
        content,
        banner: banner || null,
        meta_title: metaTitle || title,
        meta_description: metaDesc || excerpt,
        translations: {
          en: {
            title: titleEn || title,
            excerpt: excerptEn || excerpt,
            content: contentEn || content,
          },
        },
      };
      const res = await api.getClient().post("/promotor/blogs", payload);
      const blogId = res.data?.data?.id;

      if (publishAfter && blogId) {
        await api.getClient().post(`/promotor/blogs/${blogId}/publish`);
        toast.success("Artikel berhasil dipublish!");
      } else {
        toast.success("Artikel disimpan sebagai draft!");
      }
      router.push("/dashboard/blog");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Gagal menyimpan artikel.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/blog">
          <Button variant="outline" size="sm" className="border-bg-border">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Tulis Artikel Baru</h1>
          <p className="text-text-secondary text-sm">Buat konten blog untuk mempromosikan event Anda.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-bg-surface border border-bg-border rounded-2xl p-6 space-y-5">
              <div className="border-b border-bg-border pb-3 flex items-center justify-between">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Konten Artikel ({langTab.toUpperCase()})
                </h2>

                {/* Language Tabs */}
                <div className="flex items-center gap-2 bg-bg-elevated p-1 rounded-xl border border-bg-border">
                  <button
                    type="button"
                    onClick={() => setLangTab("id")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      langTab === "id"
                        ? "bg-primary text-white font-bold shadow-md"
                        : "text-text-secondary hover:text-white"
                    }`}
                  >
                    <span>🇮🇩</span> ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setLangTab("en")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      langTab === "en"
                        ? "bg-primary text-white font-bold shadow-md"
                        : "text-text-secondary hover:text-white"
                    }`}
                  >
                    <span>🇬🇧</span> EN {titleEn && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                  </button>
                </div>
              </div>

              {langTab === "id" ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">
                      Judul Artikel (ID) <span className="text-danger">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Tulis judul artikel yang menarik..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-bg-elevated border-bg-border text-white text-lg font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">
                      Slug URL
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted text-sm">/blogs/</span>
                      <Input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="bg-bg-elevated border-bg-border text-text-secondary font-mono text-sm flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">
                      Ringkasan (ID Excerpt)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ringkasan singkat artikel..."
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      className="input-field resize-none w-full p-3 bg-bg-elevated border border-bg-border text-white rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">
                      Konten Artikel (ID) <span className="text-danger">*</span>
                    </label>
                    <textarea
                      rows={14}
                      placeholder="Tulis konten artikel lengkap di sini..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="input-field resize-none w-full p-3 bg-bg-elevated border border-bg-border text-white rounded-xl font-mono text-sm"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">
                      Article Title (EN) <span className="text-text-muted text-xs lowercase">(Optional)</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="English article title..."
                      value={titleEn}
                      onChange={(e) => setTitleEn(e.target.value)}
                      className="bg-bg-elevated border-bg-border text-white text-lg font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">
                      Summary Excerpt (EN)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Short English summary..."
                      value={excerptEn}
                      onChange={(e) => setExcerptEn(e.target.value)}
                      className="input-field resize-none w-full p-3 bg-bg-elevated border border-bg-border text-white rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">
                      Article Content (EN)
                    </label>
                    <textarea
                      rows={14}
                      placeholder="Write full article in English..."
                      value={contentEn}
                      onChange={(e) => setContentEn(e.target.value)}
                      className="input-field resize-none w-full p-3 bg-bg-elevated border border-bg-border text-white rounded-xl font-mono text-sm"
                    />
                  </div>
                </>
              )}
            </div>

            {/* SEO */}
            <div className="bg-bg-surface border border-bg-border rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" /> SEO & Meta
              </h2>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">Meta Title</label>
                <Input
                  type="text"
                  placeholder="Biarkan kosong untuk menggunakan judul artikel"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="bg-bg-elevated border-bg-border text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">Meta Description</label>
                <textarea
                  rows={2}
                  placeholder="Biarkan kosong untuk menggunakan excerpt"
                  value={metaDesc}
                  onChange={(e) => setMetaDesc(e.target.value)}
                  className="input-field resize-none w-full"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-bg-surface border border-bg-border rounded-2xl p-5 space-y-4">
              <h2 className="font-semibold text-white text-sm">Pengaturan Artikel</h2>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">Kategori</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
                  className="input-field text-sm"
                >
                  <option value="">Pilih kategori...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">
                  URL Banner / Thumbnail
                </label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                  className="bg-bg-elevated border-bg-border text-white text-sm"
                />
                {banner && (
                  <img
                    src={banner}
                    alt="Preview"
                    className="mt-3 w-full h-32 object-cover rounded-lg border border-bg-border"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
              </div>
            </div>

            {/* Publish Actions */}
            <div className="bg-bg-surface border border-bg-border rounded-2xl p-5 space-y-3">
              <h2 className="font-semibold text-white text-sm">Publikasi</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publishAfter}
                  onChange={(e) => setPublishAfter(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm text-text-secondary">Publish langsung setelah simpan</span>
              </label>

              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-primary-dark w-full font-bold flex items-center justify-center gap-2"
              >
                {publishAfter ? <Send className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {submitting ? "Menyimpan..." : publishAfter ? "Simpan & Publish" : "Simpan Draft"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
