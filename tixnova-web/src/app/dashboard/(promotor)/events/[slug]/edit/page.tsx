"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Save, Send, Sparkles, MapPin,
  AlignLeft, CalendarClock
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, publicApi } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

interface Category { id: number; name: string; }
interface EventData {
  id: number;
  title: string;
  category_id: number | null;
  venue: string;
  city: string;
  province: string;
  start_date: string;
  end_date: string;
  banner: string;
  short_desc: string;
  description: string;
  status: string;
  reschedules?: Array<{
    id: number;
    status: "requested" | "approved" | "rejected";
    new_start_date: string;
    new_end_date: string;
    reason: string;
    review_note?: string;
  }>;
}

export default function EventEditPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<EventData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [rescheduleEnd, setRescheduleEnd] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  // Form state (ID & EN)
  const [langTab, setLangTab] = useState<"id" | "en">("id");
  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [banner, setBanner] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [shortDescEn, setShortDescEn] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");

  useEffect(() => {
    Promise.all([
      api.getClient().get(`/promotor/events/${slug}`),
      publicApi.events.categories(),
    ])
      .then(([evRes, catRes]) => {
        const ev = evRes.data?.data;
        setEvent(ev);
        setTitle(ev.title || "");
        setCategoryId(ev.category_id || "");
        setVenue(ev.venue || "");
        setCity(ev.city || "");
        setProvince(ev.province || "");
        setStartDate(ev.start_date?.slice(0, 16) || "");
        setEndDate(ev.end_date?.slice(0, 16) || "");
        setBanner(ev.banner || "");
        setShortDesc(ev.short_desc || "");
        setDescription(ev.description || "");

        // Load translations if available
        if (ev.translations && Array.isArray(ev.translations)) {
          const en = ev.translations.find((t: { locale: string; title: string; short_desc: string; description: string }) => t.locale === "en");
          if (en) {
            setTitleEn(en.title || "");
            setShortDescEn(en.short_desc || "");
            setDescriptionEn(en.description || "");
          }
        }
        setCategories(catRes.data?.data || []);
      })
      .catch(() => toast.error("Gagal memuat data event."))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.getClient().put(`/promotor/events/${slug}`, {
        title, category_id: categoryId || null,
        venue, city, province,
        start_date: startDate.replace("T", " ") + ":00",
        end_date: endDate.replace("T", " ") + ":00",
        banner, short_desc: shortDesc, description,
        translations: {
          en: {
            title: titleEn || title,
            short_desc: shortDescEn || shortDesc || title,
            description: descriptionEn || description || shortDesc || title,
          },
        },
      });
      toast.success("Event berhasil diperbarui!");
      router.push("/dashboard/events");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Gagal memperbarui event.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setRescheduling(true);
    try {
      await api.getClient().post(`/promotor/events/${slug}/reschedules`, {
        new_start_date: rescheduleStart.replace("T", " ") + ":00",
        new_end_date: rescheduleEnd.replace("T", " ") + ":00",
        reason: rescheduleReason,
      });
      toast.success("Permintaan perubahan jadwal dikirim untuk review admin.");
      setRescheduleOpen(false);
      setRescheduleReason("");
      const response = await api.getClient().get(`/promotor/events/${slug}`);
      setEvent(response.data.data);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Gagal mengirim perubahan jadwal.";
      toast.error(message);
    } finally {
      setRescheduling(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm("Submit event ini untuk review admin?")) return;
    setPublishing(true);
    try {
      await api.getClient().post(`/promotor/events/${slug}/publish`);
      toast.success("Event berhasil disubmit untuk review!");
      router.push("/dashboard/events");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Gagal mengajukan event.";
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-3xl">
        <div className="h-10 bg-bg-surface rounded-xl w-48" />
        <div className="h-64 bg-bg-surface rounded-2xl border border-bg-border" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/events">
            <Button variant="outline" size="sm" className="border-bg-border">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Edit Event</h1>
            <p className="text-text-secondary text-sm">{event?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {event?.status === "approved" && (
            <Button
              variant="outline"
              onClick={() => setRescheduleOpen(true)}
              className="border-accent text-accent hover:bg-accent/10 font-bold flex items-center gap-2"
            >
              <CalendarClock className="w-4 h-4" /> Ajukan Ubah Jadwal
            </Button>
          )}
          {event?.status === "draft" && (
            <Button
              onClick={handlePublish}
              disabled={publishing}
              className="bg-accent hover:bg-amber-600 font-bold flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {publishing ? "Mengajukan..." : "Submit Review"}
            </Button>
          )}
        </div>
      </div>

      {event?.reschedules?.[0]?.status === "requested" && (
        <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm text-accent">
          Permintaan perubahan jadwal untuk {event.reschedules[0].new_start_date} sedang menunggu review admin.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info Utama */}
        <div className="bg-bg-surface border border-bg-border rounded-2xl p-6 space-y-5">
          <div className="border-b border-bg-border pb-3 flex items-center justify-between">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Informasi Utama
            </h2>

            {/* Language Selector Tabs */}
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
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Judul Event (ID) <span className="text-primary">*</span></label>
              <Input
                value={title} onChange={(e) => setTitle(e.target.value)}
                className="bg-bg-elevated border-bg-border text-white" required
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Event Title (EN) <span className="text-text-muted text-[10px] lowercase">(Optional)</span></label>
              <Input
                value={titleEn} onChange={(e) => setTitleEn(e.target.value)}
                placeholder="English event title..."
                className="bg-bg-elevated border-bg-border text-white"
              />
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Kategori</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-4 py-3 bg-bg-elevated border border-bg-border text-white rounded-xl focus:outline-none focus:border-primary text-sm"
              >
                <option value="">Pilih Kategori</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">URL Banner</label>
              <Input
                type="url" value={banner} onChange={(e) => setBanner(e.target.value)}
                placeholder="https://..." className="bg-bg-elevated border-bg-border text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Lokasi & Waktu */}
        <div className="bg-bg-surface border border-bg-border rounded-2xl p-6 space-y-5">
          <h2 className="font-bold text-white flex items-center gap-2 border-b border-bg-border pb-3">
            <MapPin className="w-4 h-4 text-primary" /> Lokasi & Waktu
          </h2>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">Nama Venue</label>
            <Input value={venue} onChange={(e) => setVenue(e.target.value)}
              className="bg-bg-elevated border-bg-border text-white" required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Kota</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)}
                className="bg-bg-elevated border-bg-border text-white" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Provinsi</label>
              <Input value={province} onChange={(e) => setProvince(e.target.value)}
                className="bg-bg-elevated border-bg-border text-white" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Tanggal Mulai</label>
              <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="bg-bg-elevated border-bg-border text-white" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Tanggal Selesai</label>
              <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="bg-bg-elevated border-bg-border text-white" required />
            </div>
          </div>
        </div>

        {/* Deskripsi */}
        <div className="bg-bg-surface border border-bg-border rounded-2xl p-6 space-y-5">
          <h2 className="font-bold text-white flex items-center gap-2 border-b border-bg-border pb-3">
            <AlignLeft className="w-4 h-4 text-primary" /> Deskripsi ({langTab.toUpperCase()})
          </h2>
          {langTab === "id" ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">Ringkasan Singkat (ID)</label>
                <textarea rows={2} value={shortDesc} onChange={(e) => setShortDesc(e.target.value)}
                  className="input-field resize-none w-full p-3 bg-bg-elevated border border-bg-border text-white rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">Deskripsi Lengkap (ID)</label>
                <textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)}
                  className="input-field resize-none w-full p-3 bg-bg-elevated border border-bg-border text-white rounded-xl" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">Short Summary (EN)</label>
                <textarea rows={2} value={shortDescEn} onChange={(e) => setShortDescEn(e.target.value)}
                  placeholder="English summary..."
                  className="input-field resize-none w-full p-3 bg-bg-elevated border border-bg-border text-white rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">Full Description (EN)</label>
                <textarea rows={6} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)}
                  placeholder="English full description..."
                  className="input-field resize-none w-full p-3 bg-bg-elevated border border-bg-border text-white rounded-xl" />
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/events">
            <Button variant="outline" className="border-bg-border">Batal</Button>
          </Link>
          <Button type="submit" disabled={submitting}
            className="bg-primary hover:bg-primary-dark font-bold flex items-center gap-2">
            <Save className="w-4 h-4" />
            {submitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>

      {rescheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form onSubmit={handleReschedule} className="w-full max-w-lg space-y-5 rounded-3xl border border-bg-border bg-bg-surface p-6">
            <div>
              <h3 className="text-xl font-bold text-white">Ajukan Perubahan Jadwal</h3>
              <p className="mt-1 text-sm text-text-secondary">Perubahan akan ditinjau admin. Tiket yang sudah dibeli tetap berlaku setelah disetujui.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold text-text-secondary">Tanggal Mulai Baru</label>
                <Input type="datetime-local" value={rescheduleStart} onChange={(e) => setRescheduleStart(e.target.value)} className="bg-bg-elevated border-bg-border text-white" required />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-text-secondary">Tanggal Selesai Baru</label>
                <Input type="datetime-local" value={rescheduleEnd} onChange={(e) => setRescheduleEnd(e.target.value)} className="bg-bg-elevated border-bg-border text-white" required />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-text-secondary">Alasan Perubahan</label>
              <textarea value={rescheduleReason} onChange={(e) => setRescheduleReason(e.target.value)} rows={4} minLength={10} className="w-full rounded-xl border border-bg-border bg-bg-elevated p-3 text-sm text-white" required />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setRescheduleOpen(false)}>Batal</Button>
              <Button type="submit" loading={rescheduling}>Kirim untuk Review</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
