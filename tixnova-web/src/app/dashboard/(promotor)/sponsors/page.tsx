"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Handshake,
  Plus,
  Trash2,
  ExternalLink,
  Building2,
  FileCheck2,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface Sponsor {
  id: number;
  name: string;
  industry?: string | null;
  website?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  is_active: boolean;
  sponsorships_count: number;
  total_sponsorship_amount: string | number;
}

interface Sponsorship {
  id: number;
  event_id: number;
  sponsor_id: number;
  package_name?: string | null;
  amount: string | number;
  poa_threshold_pct: number;
  status: string;
  sponsor?: Sponsor;
}

interface EventOption {
  id: number;
  title: string;
  slug: string;
  status: string;
  end_date?: string;
}

interface PoaSummary {
  tickets_sold: number;
  checked_in: number;
  unique_attendees: number;
  no_show: number;
  attendance_rate_pct: number;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-bg-elevated text-text-secondary border border-bg-border" },
  active: { label: "Aktif", cls: "bg-primary/15 text-primary border border-primary/30" },
  released: { label: "Dilepas", cls: "bg-success/15 text-success border border-success/30" },
  refunded: { label: "Dikembalikan", cls: "bg-danger/15 text-danger border border-danger/30" },
};

export default function SponsorsPage() {
  const [summary, setSummary] = useState({
    total_sponsors: 0,
    total_sponsorships: 0,
    total_amount: "0",
    active_sponsorships: 0,
    released_sponsorships: 0,
  });
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [eventSponsorships, setEventSponsorships] = useState<Sponsorship[]>([]);
  const [poa, setPoa] = useState<PoaSummary | null>(null);

  const [attachForm, setAttachForm] = useState({
    sponsor_id: "",
    package_name: "",
    amount: "",
    poa_threshold_pct: "80",
  });
  const [submitting, setSubmitting] = useState(false);
  const requested = useRef(false);

  const loadSponsors = () => {
    api
      .getClient()
      .get("/promotor/sponsors")
      .then((res) => {
        setSummary(res.data?.data?.summary || {});
        setSponsors(res.data?.data?.sponsors || []);
      })
      .catch(() => toast.error("Gagal memuat data sponsor."));
  };

  const loadEventSponsorships = (slug: string) => {
    api
      .getClient()
      .get(`/promotor/events/${slug}/sponsorships`)
      .then((res) => {
        setEventSponsorships(res.data?.data?.sponsorships || []);
        setPoa(res.data?.data?.poa || null);
      })
      .catch(() => {
        setEventSponsorships([]);
        setPoa(null);
      });
  };

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    Promise.all([
      api.getClient().get("/promotor/sponsors"),
      api.getClient().get("/promotor/events", { params: { per_page: 100 } }),
    ])
      .then(([sponsorRes, eventRes]) => {
        setSummary(sponsorRes.data?.data?.summary || {});
        setSponsors(sponsorRes.data?.data?.sponsors || []);
        const evList = eventRes.data?.data?.data || [];
        setEvents(evList);
        if (evList.length > 0) {
          setSelectedEvent(evList[0].slug);
          loadEventSponsorships(evList[0].slug);
        }
      })
      .catch(() => toast.error("Gagal memuat data sponsor."))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateSponsor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await api.getClient().post("/promotor/sponsors", {
        name: form.get("name"),
        industry: form.get("industry") || undefined,
        website: form.get("website") || undefined,
        contact_email: form.get("contact_email") || undefined,
        contact_phone: form.get("contact_phone") || undefined,
      });
      toast.success("Sponsor berhasil ditambahkan.");
      setShowAdd(false);
      loadSponsors();
    } catch (err) {
      toast.error("Gagal menambahkan sponsor.");
      void err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSponsor = async (sponsor: Sponsor) => {
    if (!window.confirm(`Hapus sponsor "${sponsor.name}"?`)) return;
    try {
      await api.getClient().delete(`/promotor/sponsors/${sponsor.id}`);
      toast.success("Sponsor dihapus.");
      loadSponsors();
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      toast.error(status === 422 ? "Sponsor masih memiliki sponsorship aktif." : "Gagal menghapus sponsor.");
    }
  };

  const handleAttach = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEvent || !attachForm.sponsor_id || !attachForm.amount) {
      toast.error("Lengkapi sponsor, jumlah, dan event.");
      return;
    }
    setSubmitting(true);
    try {
      await api.getClient().post(`/promotor/events/${selectedEvent}/sponsorships`, {
        sponsor_id: Number(attachForm.sponsor_id),
        package_name: attachForm.package_name || undefined,
        amount: Number(attachForm.amount),
        poa_threshold_pct: Number(attachForm.poa_threshold_pct),
      });
      toast.success("Sponsorship berhasil dibuat.");
      setAttachForm({ sponsor_id: "", package_name: "", amount: "", poa_threshold_pct: "80" });
      loadEventSponsorships(selectedEvent);
    } catch {
      toast.error("Gagal membuat sponsorship.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelease = async (sp: Sponsorship) => {
    if (!window.confirm(`Lepas escrow ${formatCurrency(Number(sp.amount))} untuk sponsorship ini?`)) return;
    try {
      await api.getClient().post(`/promotor/sponsorships/${sp.id}/release`);
      toast.success("Pelepasan escrow diproses.");
      if (selectedEvent) loadEventSponsorships(selectedEvent);
    } catch {
      toast.error("Event belum selesai, escrow belum dapat dilepas.");
    }
  };

  const handleDeleteSponsorship = async (sp: Sponsorship) => {
    if (!window.confirm("Hapus sponsorship ini?")) return;
    try {
      await api.getClient().delete(`/promotor/sponsorships/${sp.id}`);
      toast.success("Sponsorship dihapus.");
      if (selectedEvent) loadEventSponsorships(selectedEvent);
    } catch {
      toast.error("Sponsorship yang sudah dilepas tidak dapat dihapus.");
    }
  };

  const totalAmount = Number(summary.total_amount || 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
            <Handshake className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Sponsor OS</h1>
            <p className="text-sm text-text-secondary">Sponsorship berbasis escrow & PoA report terukur saat event.</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
        >
          {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAdd ? "Batal" : "Tambah Sponsor"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleCreateSponsor} className="mt-6 rounded-2xl border border-bg-border bg-bg-surface p-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-text-secondary">Nama Sponsor *</span>
              <input required name="name" className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-text-secondary">Industri</span>
              <input name="industry" className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-text-secondary">Website</span>
              <input name="website" type="url" className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-text-secondary">Kontak Email</span>
              <input name="contact_email" type="email" className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-text-secondary">Kontak Telepon</span>
              <input name="contact_phone" className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary" />
            </label>
          </div>
          <button disabled={submitting} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">
            {submitting ? "Menyimpan..." : "Simpan Sponsor"}
          </button>
        </form>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Sponsor", value: summary.total_sponsors, icon: Building2, cls: "text-primary bg-primary/15" },
          { label: "Total Sponsorship", value: summary.total_sponsorships, icon: Handshake, cls: "text-warning bg-warning/15" },
          { label: "Nilai Escrow", value: formatCurrency(totalAmount), icon: FileCheck2, cls: "text-success bg-success/15" },
          { label: "Sponsorship Dilepas", value: `${summary.released_sponsorships}/${summary.active_sponsorships + summary.released_sponsorships}`, icon: FileCheck2, cls: "text-text-secondary bg-bg-elevated" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-bg-border bg-bg-surface p-4">
            <div className={`inline-flex p-2 rounded-lg ${card.cls}`}>
              <card.icon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-xl font-black text-white">{card.value}</p>
            <p className="mt-0.5 text-xs text-text-secondary">{card.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="font-bold text-white">Daftar Sponsor</h2>
        {loading ? (
          <p className="mt-4 text-sm text-text-muted">Memuat...</p>
        ) : sponsors.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-bg-border bg-bg-surface p-8 text-center text-sm text-text-muted">
            Belum ada sponsor. Tambahkan sponsor pertama Anda.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sponsors.map((sp) => (
              <div key={sp.id} className="rounded-2xl border border-bg-border bg-bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-white">{sp.name}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{sp.industry || "—"}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteSponsor(sp)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Hapus sponsor"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
                  <span>{sp.sponsorships_count} sponsorship</span>
                  <span>{formatCurrency(Number(sp.total_sponsorship_amount || 0))}</span>
                </div>
                {sp.website && (
                  <a href={sp.website} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    {sp.website} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-bold text-white">Sponsorship per Event</h2>

        <div className="mt-4 rounded-2xl border border-bg-border bg-bg-surface p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <label className="flex-1 min-w-52">
              <span className="text-xs font-semibold text-text-secondary">Pilih Event</span>
              <select
                value={selectedEvent}
                onChange={(e) => {
                  setSelectedEvent(e.target.value);
                  if (e.target.value) loadEventSponsorships(e.target.value);
                }}
                className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.slug}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </label>
            {selectedEvent && (
              <Link
                href={`/dashboard/events/${selectedEvent}/poa`}
                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
              >
                <ExternalLink className="h-4 w-4" /> PoA Report
              </Link>
            )}
          </div>

          {poa && (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              <div className="rounded-xl bg-bg-elevated p-3">
                <p className="text-lg font-black text-white">{poa.tickets_sold}</p>
                <p className="text-xs text-text-secondary">Tiket Terjual</p>
              </div>
              <div className="rounded-xl bg-bg-elevated p-3">
                <p className="text-lg font-black text-success">{poa.checked_in}</p>
                <p className="text-xs text-text-secondary">Check-in</p>
              </div>
              <div className="rounded-xl bg-bg-elevated p-3">
                <p className="text-lg font-black text-white">{poa.unique_attendees}</p>
                <p className="text-xs text-text-secondary">Pengunjung Unik</p>
              </div>
              <div className="rounded-xl bg-bg-elevated p-3">
                <p className="text-lg font-black text-danger">{poa.no_show}</p>
                <p className="text-xs text-text-secondary">No-show</p>
              </div>
              <div className="rounded-xl bg-bg-elevated p-3">
                <p className="text-lg font-black text-primary">{poa.attendance_rate_pct}%</p>
                <p className="text-xs text-text-secondary">Tingkat Kehadiran</p>
              </div>
            </div>
          )}

          <div className="mt-5">
            {eventSponsorships.length === 0 ? (
              <p className="text-sm text-text-muted">Belum ada sponsorship untuk event ini.</p>
            ) : (
              <div className="space-y-3">
                {eventSponsorships.map((sp) => {
                  const badge = STATUS_BADGE[sp.status] || STATUS_BADGE.pending;
                  return (
                    <div key={sp.id} className="flex items-center justify-between gap-4 rounded-xl border border-bg-border bg-bg-elevated p-4 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white">{sp.sponsor?.name || `Sponsor #${sp.sponsor_id}`}</p>
                          <span className={`rounded-lg text-xs font-bold px-2 py-0.5 ${badge.cls}`}>{badge.label}</span>
                        </div>
                        <p className="mt-1 text-xs text-text-secondary">
                          {sp.package_name || "Tanpa paket"} · Threshold PoA {sp.poa_threshold_pct}%
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-white">{formatCurrency(Number(sp.amount))}</span>
                        {sp.status === "active" && (
                          <button
                            onClick={() => handleRelease(sp)}
                            className="rounded-lg bg-success/15 text-success border border-success/30 px-3 py-1.5 text-xs font-bold hover:bg-success/25"
                          >
                            Lepas Escrow
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSponsorship(sp)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10"
                          title="Hapus sponsorship"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleAttach} className="mt-6 border-t border-bg-border pt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
            <label className="block">
              <span className="text-xs font-semibold text-text-secondary">Sponsor *</span>
              <select
                value={attachForm.sponsor_id}
                onChange={(e) => setAttachForm({ ...attachForm, sponsor_id: e.target.value })}
                className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
              >
                <option value="">Pilih sponsor</option>
                {sponsors.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-text-secondary">Paket</span>
              <input
                value={attachForm.package_name}
                onChange={(e) => setAttachForm({ ...attachForm, package_name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-text-secondary">Jumlah (Rp) *</span>
              <input
                type="number"
                min={0}
                value={attachForm.amount}
                onChange={(e) => setAttachForm({ ...attachForm, amount: e.target.value })}
                className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-text-secondary">Threshold PoA (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={attachForm.poa_threshold_pct}
                onChange={(e) => setAttachForm({ ...attachForm, poa_threshold_pct: e.target.value })}
                className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
              />
            </label>
            <button disabled={submitting} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">
              {submitting ? "..." : "Tautkan"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
