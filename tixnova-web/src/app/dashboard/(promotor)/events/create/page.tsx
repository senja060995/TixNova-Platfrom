"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Tag,
  Plus,
  Trash2,
  ChevronLeft,
  ArrowRight,
  Sparkles,
  Ticket as TicketIcon,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Category } from "@/types";
import { api, publicApi } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

interface TicketDraft {
  name: string;
  type: string;
  price: number;
  quota: number;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form states (ID & EN multi-language)
  const [langTab, setLangTab] = useState<"id" | "en">("id");
  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("Jakarta");
  const [province, setProvince] = useState("DKI Jakarta");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [banner, setBanner] = useState("https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200");
  const [shortDesc, setShortDesc] = useState("");
  const [shortDescEn, setShortDescEn] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");

  // Ticket Tiers draft
  const [tickets, setTickets] = useState<TicketDraft[]>([
    { name: "Regular", type: "regular", price: 250000, quota: 500 },
    { name: "VIP", type: "vip", price: 750000, quota: 100 },
  ]);

  useEffect(() => {
    publicApi.events.categories()
      .then((res) => setCategories(res.data.data || []))
      .catch(() => setCategories([]));
  }, []);

  const addTicketTier = () => {
    setTickets((prev) => [
      ...prev,
      { name: "Early Bird", type: "regular", price: 150000, quota: 200 },
    ]);
  };

  const removeTicketTier = (index: number) => {
    setTickets((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTicketTier = (index: number, key: keyof TicketDraft, value: string | number) => {
    setTickets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !venue || !city || !startDate || !endDate) {
      toast.error("Lengkapi informasi utama event (Bahasa Indonesia).");
      return;
    }

    if (tickets.length === 0) {
      toast.error("Tambahkan minimal 1 kategori tiket.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create Event with Translations
      const eventPayload = {
        title,
        category_id: categoryId || categories[0]?.id || 1,
        venue,
        city,
        province,
        start_date: startDate.replace("T", " ") + ":00",
        end_date: endDate.replace("T", " ") + ":00",
        short_desc: shortDesc || title,
        description: description || shortDesc || title,
        banner,
        status: "draft",
        translations: {
          en: {
            title: titleEn || title,
            short_desc: shortDescEn || shortDesc || title,
            description: descriptionEn || description || shortDesc || title,
          },
        },
      };

      const res = await api.getClient().post("/promotor/events", eventPayload);
      const event = res.data.data;

      // 2. Create Tickets
      for (const t of tickets) {
        await api.getClient().post(`/promotor/events/${event.slug}/tickets`, {
          name: t.name,
          type: t.type,
          price: t.price,
          quota: t.quota,
          description: `Tiket ${t.name} untuk ${title}`,
        });
      }

      toast.success("Event dan tiket berhasil dibuat!");
      router.push("/dashboard/events");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Gagal membuat event.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header & Back */}
      <div>
        <Link href="/dashboard/events" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white mb-4">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Daftar Event
        </Link>
        <h1 className="text-3xl font-extrabold text-white">Buat Event Konser Baru</h1>
        <p className="text-text-secondary text-sm mt-1">
          Isi detail informasi konser dan atur kategori tiket yang akan dijual.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Informasi Utama */}
        <div className="bg-bg-surface p-6 sm:p-8 rounded-2xl border border-bg-border space-y-6">
          <div className="border-b border-bg-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>1. Informasi Utama Event</span>
            </h3>

            {/* Language Selector Tabs */}
            <div className="flex items-center gap-2 bg-bg-elevated p-1 rounded-xl border border-bg-border self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setLangTab("id")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  langTab === "id"
                    ? "bg-primary text-white shadow-md font-bold"
                    : "text-text-secondary hover:text-white"
                }`}
              >
                <span>🇮🇩</span> Bahasa Indonesia (ID)
              </button>
              <button
                type="button"
                onClick={() => setLangTab("en")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  langTab === "en"
                    ? "bg-primary text-white shadow-md font-bold"
                    : "text-text-secondary hover:text-white"
                }`}
              >
                <span>🇬🇧</span> English (EN) {titleEn && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {langTab === "id" ? (
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Judul Konser / Event (ID) <span className="text-primary">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Dewa 19 Live in Jakarta 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Event Title (EN) <span className="text-text-muted text-[10px] lowercase">(Optional)</span>
                </label>
                <Input
                  type="text"
                  placeholder="Example: Dewa 19 Live in Jakarta 2026"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Kategori Event
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full px-4 py-3.5 bg-bg-elevated border border-bg-border text-white rounded-xl focus:outline-none focus:border-primary text-sm font-medium"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  URL Banner / Poster Image
                </label>
                <Input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                  className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Nama Venue / Lokasi
                </label>
                <Input
                  type="text"
                  placeholder="Stadion GBK / Sabuga"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Kota
                </label>
                <Input
                  type="text"
                  placeholder="Jakarta"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Provinsi
                </label>
                <Input
                  type="text"
                  placeholder="DKI Jakarta"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Waktu Mulai Event
                </label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Waktu Selesai Event
                </label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
                  required
                />
              </div>
            </div>

            {langTab === "id" ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Deskripsi Singkat (ID)
                  </label>
                  <Input
                    type="text"
                    placeholder="Konser spektakuler perayaan 30 tahun berkarya..."
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                    className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Deskripsi Lengkap Event (ID)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Jelaskan guest star, tata tertib venue, rundown singkat..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-4 bg-bg-elevated border border-bg-border text-white rounded-xl focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Short Description (EN)
                  </label>
                  <Input
                    type="text"
                    placeholder="Spectacular 30th anniversary concert..."
                    value={shortDescEn}
                    onChange={(e) => setShortDescEn(e.target.value)}
                    className="bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Full Description (EN)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe guest stars, venue rules, schedule..."
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    className="w-full p-4 bg-bg-elevated border border-bg-border text-white rounded-xl focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section 2: Kategori & Kuota Tiket */}
        <div className="bg-bg-surface p-6 sm:p-8 rounded-2xl border border-bg-border space-y-6">
          <div className="flex items-center justify-between border-b border-bg-border pb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <TicketIcon className="w-5 h-5 text-primary" />
              <span>2. Atur Tiket Konser</span>
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTicketTier}
              className="border-bg-border text-xs flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Tambah Tier Tiket
            </Button>
          </div>

          <div className="space-y-4">
            {tickets.map((t, idx) => (
              <div key={idx} className="p-4 bg-bg-elevated rounded-xl border border-bg-border relative space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-primary uppercase">Tier #{idx + 1}</span>
                  {tickets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTicketTier(idx)}
                      className="text-text-muted hover:text-danger p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1">Nama Tiket</label>
                    <Input
                      type="text"
                      placeholder="VIP / Regular"
                      value={t.name}
                      onChange={(e) => updateTicketTier(idx, "name", e.target.value)}
                      className="bg-bg-surface border-bg-border text-white text-xs py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1">Tipe Tier</label>
                    <select
                      value={t.type}
                      onChange={(e) => updateTicketTier(idx, "type", e.target.value)}
                      className="w-full px-3 py-2 bg-bg-surface border border-bg-border text-white rounded-lg text-xs"
                    >
                      <option value="regular">Regular</option>
                      <option value="vip">VIP</option>
                      <option value="early_bird">Early Bird</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1">Harga (Rp)</label>
                    <Input
                      type="number"
                      placeholder="250000"
                      value={t.price}
                      onChange={(e) => updateTicketTier(idx, "price", Number(e.target.value))}
                      className="bg-bg-surface border-bg-border text-white text-xs py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1">Kuota (Tiket)</label>
                    <Input
                      type="number"
                      placeholder="500"
                      value={t.quota}
                      onChange={(e) => updateTicketTier(idx, "quota", Number(e.target.value))}
                      className="bg-bg-surface border-bg-border text-white text-xs py-2"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4 pt-4">
          <Link href="/dashboard/events">
            <Button variant="outline" type="button" className="border-bg-border">
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/30 font-bold px-8 py-3.5 rounded-xl"
          >
            {submitting ? "Menyimpan Event..." : "Simpan Event & Tiket"}
          </Button>
        </div>
      </form>
    </div>
  );
}
