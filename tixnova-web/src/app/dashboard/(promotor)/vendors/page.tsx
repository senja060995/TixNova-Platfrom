"use client";

import { useEffect, useRef, useState } from "react";
import {
  Wrench,
  Plus,
  Trash2,
  X,
  Package,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDateOnly } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface Vendor {
  id: number;
  name: string;
  category: string;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  rating: string | number;
  description?: string | null;
  bookings_count: number;
  total_booked_amount: string | number;
}

interface Booking {
  id: number;
  vendor_id: number;
  service?: string | null;
  amount: string | number;
  deposit_pct: number;
  deposit: string | number;
  status: string;
  notes?: string | null;
  vendor?: Vendor;
}

interface RfqOffer {
  id: number;
  vendor_id: number;
  quote: string | number;
  message?: string | null;
  is_winner: boolean;
  vendor?: Vendor;
}

interface Rfq {
  id: number;
  event_id: number;
  service: string;
  description?: string | null;
  budget?: string | number | null;
  deadline?: string | null;
  status: string;
  event?: { id: number; title: string; slug: string };
  offers?: RfqOffer[];
}

interface EventOption {
  id: number;
  title: string;
  slug: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  lighting: "Lighting",
  sound: "Sound",
  catering: "Katering",
  security: "Keamanan",
  stage: "Panggung",
  transport: "Transport",
  other: "Lainnya",
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  requested: { label: "Diminta", cls: "bg-bg-elevated text-text-secondary border border-bg-border" },
  confirmed: { label: "Dikonfirmasi", cls: "bg-primary/15 text-primary border border-primary/30" },
  fulfilled: { label: "Terpenuhi", cls: "bg-warning/15 text-warning border border-warning/30" },
  released: { label: "Dilepas", cls: "bg-success/15 text-success border border-success/30" },
  cancelled: { label: "Batal", cls: "bg-danger/15 text-danger border border-danger/30" },
};

type Tab = "vendors" | "bookings" | "rfqs";

export default function VendorsPage() {
  const [tab, setTab] = useState<Tab>("vendors");
  const [summary, setSummary] = useState({
    total_vendors: 0,
    active_bookings: 0,
    released_bookings: 0,
    escrow_in_hold: "0",
    categories: {} as Record<string, number>,
  });
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [vendorForm, setVendorForm] = useState({ name: "", category: "other", contact_phone: "", contact_email: "" });
  const [bookingForm, setBookingForm] = useState({ vendor_id: "", service: "", amount: "", deposit_pct: "20" });
  const [rfqForm, setRfqForm] = useState({ event_id: "", service: "", budget: "" });
  const [offerForm, setOfferForm] = useState<Record<string, { vendor_id: string; quote: string }>>({});
  const requested = useRef(false);

  const loadVendors = () => {
    api
      .getClient()
      .get("/promotor/vendors")
      .then((res) => {
        setSummary(res.data?.data?.summary || {});
        setVendors(res.data?.data?.vendors || []);
      })
      .catch(() => toast.error("Gagal memuat data vendor."));
  };

  const loadBookings = (slug: string) => {
    api
      .getClient()
      .get(`/promotor/events/${slug}/vendor-bookings`)
      .then((res) => setBookings(res.data?.data?.bookings || []))
      .catch(() => setBookings([]));
  };

  const loadRfqs = () => {
    api
      .getClient()
      .get("/promotor/rfqs")
      .then((res) => setRfqs(res.data?.data || []))
      .catch(() => toast.error("Gagal memuat RFQ."));
  };

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    Promise.all([
      api.getClient().get("/promotor/vendors"),
      api.getClient().get("/promotor/events", { params: { per_page: 100 } }),
      api.getClient().get("/promotor/rfqs"),
    ])
      .then(([vendorRes, eventRes, rfqRes]) => {
        setSummary(vendorRes.data?.data?.summary || {});
        setVendors(vendorRes.data?.data?.vendors || []);
        setRfqs(rfqRes.data?.data || []);
        const evList = eventRes.data?.data?.data || [];
        setEvents(evList);
        if (evList.length > 0) {
          setSelectedEvent(evList[0].slug);
          loadBookings(evList[0].slug);
        }
      })
      .catch(() => toast.error("Gagal memuat data vendor."))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.getClient().post("/promotor/vendors", vendorForm);
      toast.success("Vendor berhasil ditambahkan.");
      setShowAdd(false);
      setVendorForm({ name: "", category: "other", contact_phone: "", contact_email: "" });
      loadVendors();
    } catch {
      toast.error("Gagal menambahkan vendor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVendor = async (v: Vendor) => {
    if (!window.confirm(`Hapus vendor "${v.name}"?`)) return;
    try {
      await api.getClient().delete(`/promotor/vendors/${v.id}`);
      toast.success("Vendor dihapus.");
      loadVendors();
    } catch {
      toast.error("Vendor masih memiliki booking aktif.");
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !bookingForm.vendor_id || !bookingForm.amount) {
      toast.error("Lengkapi vendor, jumlah, dan event.");
      return;
    }
    setSubmitting(true);
    try {
      await api.getClient().post(`/promotor/events/${selectedEvent}/vendor-bookings`, {
        vendor_id: Number(bookingForm.vendor_id),
        service: bookingForm.service || undefined,
        amount: Number(bookingForm.amount),
        deposit_pct: Number(bookingForm.deposit_pct),
      });
      toast.success("Booking vendor dibuat.");
      setBookingForm({ vendor_id: "", service: "", amount: "", deposit_pct: "20" });
      loadBookings(selectedEvent);
    } catch {
      toast.error("Gagal membuat booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelease = async (b: Booking) => {
    if (!window.confirm(`Lepas escrow ${formatCurrency(Number(b.deposit))} untuk booking ini?`)) return;
    try {
      await api.getClient().post(`/promotor/vendor-bookings/${b.id}/release`);
      toast.success("Escrow dilepas.");
      if (selectedEvent) loadBookings(selectedEvent);
    } catch {
      toast.error("Event belum selesai atau booking belum dikonfirmasi.");
    }
  };

  const handleDeleteBooking = async (b: Booking) => {
    if (!window.confirm("Hapus booking ini?")) return;
    try {
      await api.getClient().delete(`/promotor/vendor-bookings/${b.id}`);
      toast.success("Booking dihapus.");
      if (selectedEvent) loadBookings(selectedEvent);
    } catch {
      toast.error("Booking yang sudah dilepas tidak dapat dihapus.");
    }
  };

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqForm.event_id || !rfqForm.service) {
      toast.error("Pilih event dan layanan.");
      return;
    }
    setSubmitting(true);
    try {
      await api.getClient().post(`/promotor/events/${rfqForm.event_id}/rfqs`, {
        service: rfqForm.service,
        budget: rfqForm.budget ? Number(rfqForm.budget) : undefined,
      });
      toast.success("RFQ dibuat.");
      setRfqForm({ event_id: "", service: "", budget: "" });
      loadRfqs();
    } catch {
      toast.error("Gagal membuat RFQ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddOffer = async (rfq: Rfq) => {
    const form = offerForm[rfq.id];
    if (!form?.vendor_id || !form.quote) {
      toast.error("Lengkapi vendor dan penawaran.");
      return;
    }
    try {
      await api.getClient().post(`/promotor/rfqs/${rfq.id}/offers`, {
        vendor_id: Number(form.vendor_id),
        quote: Number(form.quote),
      });
      toast.success("Penawaran tercatat.");
      loadRfqs();
    } catch {
      toast.error("RFQ sudah tertutup.");
    }
  };

  const handleAward = async (rfq: Rfq, offer: RfqOffer) => {
    if (!window.confirm(`Pilih penawaran ${formatCurrency(Number(offer.quote))} ini dan buat booking?`)) return;
    try {
      await api.getClient().post(`/promotor/rfqs/${rfq.id}/award`, { offer_id: offer.id });
      toast.success("Booking dibuat dari RFQ.");
      loadRfqs();
    } catch {
      toast.error("Gagal memilih penawaran.");
    }
  };

  const escrowHold = Number(summary.escrow_in_hold || 0);
  const TABS: Array<{ key: Tab; label: string; icon: typeof Package }> = [
    { key: "vendors", label: "Vendor Directory", icon: Package },
    { key: "bookings", label: "Booking & Escrow", icon: FileText },
    { key: "rfqs", label: "RFQ", icon: FileText },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Vendor OS</h1>
            <p className="text-sm text-text-secondary">Directory vendor, booking escrow, dan RFQ untuk kebutuhan produksi event.</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
        >
          {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAdd ? "Batal" : "Tambah Vendor"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleCreateVendor} className="mt-6 rounded-2xl border border-bg-border bg-bg-surface p-5 grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
          <label className="block">
            <span className="text-xs font-semibold text-text-secondary">Nama Vendor *</span>
            <input required value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-text-secondary">Kategori *</span>
            <select value={vendorForm.category} onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })} className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary">
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-text-secondary">Telepon</span>
            <input value={vendorForm.contact_phone} onChange={(e) => setVendorForm({ ...vendorForm, contact_phone: e.target.value })} className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-text-secondary">Email</span>
            <input type="email" value={vendorForm.contact_email} onChange={(e) => setVendorForm({ ...vendorForm, contact_email: e.target.value })} className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary" />
          </label>
          <button disabled={submitting} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">
            {submitting ? "..." : "Simpan"}
          </button>
        </form>
      )}

      <div className="mt-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              tab === t.key ? "bg-primary text-white" : "bg-bg-surface text-text-secondary border border-bg-border hover:text-white"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-text-muted">Memuat...</p>
      ) : tab === "vendors" ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Total Vendor", value: summary.total_vendors, cls: "text-primary bg-primary/15" },
              { label: "Booking Aktif", value: summary.active_bookings, cls: "text-warning bg-warning/15" },
              { label: "Escrow Ditahan", value: formatCurrency(escrowHold), cls: "text-success bg-success/15" },
              { label: "Booking Dilepas", value: summary.released_bookings, cls: "text-text-secondary bg-bg-elevated" },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-bg-border bg-bg-surface p-4">
                <div className={`inline-flex p-2 rounded-lg ${card.cls}`}>
                  <Package className="h-4 w-4" />
                </div>
                <p className="mt-3 text-xl font-black text-white">{card.value}</p>
                <p className="mt-0.5 text-xs text-text-secondary">{card.label}</p>
              </div>
            ))}
          </div>

          {vendors.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-bg-border bg-bg-surface p-8 text-center text-sm text-text-muted">Belum ada vendor.</p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vendors.map((v) => (
                <div key={v.id} className="rounded-2xl border border-bg-border bg-bg-surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-white">{v.name}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{CATEGORY_LABEL[v.category] || v.category} · Rating {Number(v.rating).toFixed(1)}</p>
                    </div>
                    <button onClick={() => handleDeleteVendor(v)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10" title="Hapus vendor">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
                    <span>{v.bookings_count} booking</span>
                    <span>{formatCurrency(Number(v.total_booked_amount || 0))}</span>
                  </div>
                  {(v.contact_phone || v.contact_email) && (
                    <p className="mt-2 text-xs text-text-muted">{v.contact_phone || v.contact_email}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : tab === "bookings" ? (
        <div className="mt-6 rounded-2xl border border-bg-border bg-bg-surface p-5">
          <label className="block max-w-xs">
            <span className="text-xs font-semibold text-text-secondary">Pilih Event</span>
            <select
              value={selectedEvent}
              onChange={(e) => {
                setSelectedEvent(e.target.value);
                if (e.target.value) loadBookings(e.target.value);
              }}
              className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.slug}>{ev.title}</option>
              ))}
            </select>
          </label>

          {bookings.length === 0 ? (
            <p className="mt-5 text-sm text-text-muted">Belum ada booking untuk event ini.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {bookings.map((b) => {
                const badge = STATUS_BADGE[b.status] || STATUS_BADGE.requested;
                return (
                  <div key={b.id} className="flex items-center justify-between gap-4 rounded-xl border border-bg-border bg-bg-elevated p-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white">{b.vendor?.name || `Vendor #${b.vendor_id}`}</p>
                        <span className={`rounded-lg text-xs font-bold px-2 py-0.5 ${badge.cls}`}>{badge.label}</span>
                      </div>
                      <p className="mt-1 text-xs text-text-secondary">{b.service || "Tanpa layanan"} · Deposit {b.deposit_pct}%</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-black text-white">{formatCurrency(Number(b.amount))}</p>
                        <p className="text-xs text-text-muted">escrow {formatCurrency(Number(b.deposit))}</p>
                      </div>
                      {b.status === "confirmed" && (
                        <button onClick={() => handleRelease(b)} className="rounded-lg bg-success/15 text-success border border-success/30 px-3 py-1.5 text-xs font-bold hover:bg-success/25">
                          Lepas Escrow
                        </button>
                      )}
                      <button onClick={() => handleDeleteBooking(b)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={handleCreateBooking} className="mt-6 border-t border-bg-border pt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
            <label className="block">
              <span className="text-xs font-semibold text-text-secondary">Vendor *</span>
              <select value={bookingForm.vendor_id} onChange={(e) => setBookingForm({ ...bookingForm, vendor_id: e.target.value })} className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary">
                <option value="">Pilih vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-text-secondary">Layanan</span>
              <input value={bookingForm.service} onChange={(e) => setBookingForm({ ...bookingForm, service: e.target.value })} className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-text-secondary">Nilai (Rp) *</span>
              <input type="number" min={0} value={bookingForm.amount} onChange={(e) => setBookingForm({ ...bookingForm, amount: e.target.value })} className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-text-secondary">Deposit (%)</span>
              <input type="number" min={0} max={100} value={bookingForm.deposit_pct} onChange={(e) => setBookingForm({ ...bookingForm, deposit_pct: e.target.value })} className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary" />
            </label>
            <button disabled={submitting} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">
              {submitting ? "..." : "Booking"}
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <form onSubmit={handleCreateRfq} className="rounded-2xl border border-bg-border bg-bg-surface p-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-end">
            <label className="block">
              <span className="text-xs font-semibold text-text-secondary">Event *</span>
              <select value={rfqForm.event_id} onChange={(e) => setRfqForm({ ...rfqForm, event_id: e.target.value })} className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary">
                <option value="">Pilih event</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.slug}>{ev.title}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-text-secondary">Kebutuhan *</span>
              <input value={rfqForm.service} onChange={(e) => setRfqForm({ ...rfqForm, service: e.target.value })} placeholder="mis. Sound 5000 watt" className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-text-secondary">Budget (Rp)</span>
              <input type="number" min={0} value={rfqForm.budget} onChange={(e) => setRfqForm({ ...rfqForm, budget: e.target.value })} className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary" />
            </label>
            <button disabled={submitting} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">
              {submitting ? "..." : "Buat RFQ"}
            </button>
          </form>

          {rfqs.length === 0 ? (
            <p className="rounded-2xl border border-bg-border bg-bg-surface p-8 text-center text-sm text-text-muted">Belum ada RFQ.</p>
          ) : (
            rfqs.map((rfq) => (
              <div key={rfq.id} className="rounded-2xl border border-bg-border bg-bg-surface p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">{rfq.service}</p>
                      <span className={`rounded-lg text-xs font-bold px-2 py-0.5 ${rfq.status === "open" ? "bg-primary/15 text-primary border border-primary/30" : "bg-success/15 text-success border border-success/30"}`}>
                        {rfq.status === "open" ? "Terbuka" : "Terpilih"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">
                      {rfq.event?.title || `Event #${rfq.event_id}`}
                      {rfq.budget ? ` · Budget ${formatCurrency(Number(rfq.budget))}` : ""}
                      {rfq.deadline ? ` · Deadline ${formatDateOnly(rfq.deadline)}` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {(rfq.offers || []).map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between gap-3 rounded-xl bg-bg-elevated px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">{offer.vendor?.name || `Vendor #${offer.vendor_id}`}</p>
                        {offer.message && <p className="text-xs text-text-muted">{offer.message}</p>}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-black text-white">{formatCurrency(Number(offer.quote))}</span>
                        {offer.is_winner ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-success/15 text-success text-xs font-bold px-2.5 py-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Dipilih
                          </span>
                        ) : rfq.status === "open" ? (
                          <button onClick={() => handleAward(rfq, offer)} className="rounded-lg bg-primary/15 text-primary border border-primary/30 px-3 py-1.5 text-xs font-bold hover:bg-primary/25">
                            Pilih
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                {rfq.status === "open" && (
                  <div className="mt-4 grid gap-3 md:grid-cols-3 items-end">
                    <label className="block">
                      <span className="text-xs font-semibold text-text-secondary">Vendor</span>
                      <select
                        value={offerForm[rfq.id]?.vendor_id || ""}
                        onChange={(e) => setOfferForm({ ...offerForm, [rfq.id]: { ...offerForm[rfq.id], vendor_id: e.target.value } })}
                        className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
                      >
                        <option value="">Pilih vendor</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-text-secondary">Penawaran (Rp)</span>
                      <input
                        type="number"
                        min={0}
                        value={offerForm[rfq.id]?.quote || ""}
                        onChange={(e) => setOfferForm({ ...offerForm, [rfq.id]: { ...offerForm[rfq.id], quote: e.target.value } })}
                        className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
                      />
                    </label>
                    <button onClick={() => handleAddOffer(rfq)} className="rounded-xl border border-bg-border bg-bg-elevated px-4 py-2.5 text-sm font-bold text-white hover:bg-bg-surface">
                      Catat Penawaran
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
