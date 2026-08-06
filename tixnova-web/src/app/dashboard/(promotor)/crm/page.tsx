"use client";

import { useEffect, useRef, useState } from "react";
import { Users, UserPlus, Repeat, Star, UserX, Sparkles, Megaphone, Send, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select, Textarea, Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { formatCurrency, formatDateOnly } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface SegmentData {
  segments: Record<string, number>;
  labels: Record<string, string>;
}

interface SegmentMember {
  user_id: number;
  name: string;
  email: string;
  orders: number;
  total_spend: number;
  last_order_at?: string;
}

interface SimpleEvent {
  slug: string;
  title: string;
}

interface SimilarEvent {
  id: number;
  title: string;
  slug: string;
  city: string;
  start_date: string;
  tenant?: { name: string; badge?: string; trust_score?: number };
}

interface Campaign {
  id: number;
  name: string;
  segment: string;
  channel: string;
  subject: string;
  message: string;
  status: "draft" | "sent";
  recipients_count: number;
  sent_at?: string;
  created_at: string;
  event?: { id: number; title: string; slug: string; start_date: string; city: string };
}

const SEGMENTS = ["new", "first_timer", "repeat", "vip", "churned"];

const SEGMENT_ICONS: Record<string, typeof Users> = {
  new: Users,
  first_timer: UserPlus,
  repeat: Repeat,
  vip: Star,
  churned: UserX,
};

const SEGMENT_COLORS: Record<string, string> = {
  new: "text-text-muted",
  first_timer: "text-primary",
  repeat: "text-accent",
  vip: "text-success",
  churned: "text-danger",
};

export default function CrmPage() {
  const [segmentData, setSegmentData] = useState<SegmentData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [members, setMembers] = useState<SegmentMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [events, setEvents] = useState<SimpleEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [similar, setSimilar] = useState<SimilarEvent[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [loading, setLoading] = useState(true);
  const requested = useRef(false);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignForm, setCampaignForm] = useState({ name: "", segment: "repeat", subject: "", message: "", event_id: "" });
  const [preview, setPreview] = useState<{ recipients_count: number; sample: SegmentMember[] } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState<number | null>(null);

  const fetchSegments = () => {
    api.getClient().get("/promotor/crm/segments")
      .then((response) => setSegmentData(response.data.data))
      .catch(() => toast.error("Gagal memuat segmen CRM."))
      .finally(() => setLoading(false));
  };

  const fetchEvents = () => {
    api.getClient().get("/promotor/events", { params: { per_page: 100 } })
      .then((response) => {
        const list = Array.isArray(response.data.data) ? response.data.data : response.data.data?.data || [];
        setEvents(list.map((e: { slug: string; title: string }) => ({ slug: e.slug, title: e.title })));
      })
      .catch(() => toast.error("Gagal memuat daftar event."));
  };

  const fetchCampaigns = () => {
    api.getClient().get("/promotor/crm/campaigns")
      .then((response) => setCampaigns(response.data.data || []))
      .catch(() => toast.error("Gagal memuat kampanye."));
  };

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    fetchSegments();
    fetchEvents();
    fetchCampaigns();
  }, []);

  const openSegment = (segment: string) => {
    setSelected(segment);
    setLoadingMembers(true);
    api.getClient().get(`/promotor/crm/segments/${segment}`)
      .then((response) => setMembers(response.data.data || []))
      .catch(() => toast.error("Gagal memuat anggota segmen."))
      .finally(() => setLoadingMembers(false));
  };

  const loadSimilar = () => {
    if (!selectedEvent) return;
    setLoadingSimilar(true);
    api.getClient().get(`/promotor/crm/similar/${selectedEvent}`)
      .then((response) => setSimilar(response.data.data || []))
      .catch(() => toast.error("Gagal memuat event serupa."))
      .finally(() => setLoadingSimilar(false));
  };

  const previewCampaign = () => {
    if (!campaignForm.segment) return;
    setPreviewing(true);
    api.getClient().post("/promotor/crm/campaigns/preview", { segment: campaignForm.segment })
      .then((response) => setPreview(response.data.data))
      .catch(() => toast.error("Gagal menghitung calon penerima."))
      .finally(() => setPreviewing(false));
  };

  const createCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.name || !campaignForm.subject || !campaignForm.message) {
      toast.error("Lengkapi nama, subjek, dan pesan kampanye.");
      return;
    }
    setCreating(true);
    api.getClient().post("/promotor/crm/campaigns", {
      ...campaignForm,
      event_id: campaignForm.event_id || undefined,
    })
      .then(() => {
        toast.success("Kampanye dibuat sebagai draft.");
        setCampaignForm({ name: "", segment: "repeat", subject: "", message: "", event_id: "" });
        setPreview(null);
        fetchCampaigns();
      })
      .catch(() => toast.error("Gagal membuat kampanye."))
      .finally(() => setCreating(false));
  };

  const sendCampaign = (c: Campaign) => {
    if (!window.confirm(`Kirim kampanye "${c.name}" ke segmen ini?`)) return;
    setSending(c.id);
    api.getClient().post(`/promotor/crm/campaigns/${c.id}/send`)
      .then(() => {
        toast.success("Kampanye dikirim.");
        fetchCampaigns();
      })
      .catch(() => toast.error("Gagal mengirim kampanye."))
      .finally(() => setSending(null));
  };

  const deleteCampaign = (c: Campaign) => {
    if (!window.confirm(`Hapus draft kampanye "${c.name}"?`)) return;
    api.getClient().delete(`/promotor/crm/campaigns/${c.id}`)
      .then(() => {
        toast.success("Kampanye dihapus.");
        fetchCampaigns();
      })
      .catch(() => toast.error("Gagal menghapus kampanye."));
  };

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-bg-surface" />;

  return <div className="mx-auto max-w-5xl space-y-6">
    <div>
      <h1 className="text-3xl font-extrabold text-white">Event CRM</h1>
      <p className="mt-1 text-sm text-text-secondary">Segmentasi pembeli (RFM) dan rekomendasi event serupa untuk re-marketing.</p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {SEGMENTS.map((segment) => {
        const Icon = SEGMENT_ICONS[segment];
        const count = segmentData?.segments[segment] ?? 0;
        const isActive = selected === segment;
        return (
          <button
            key={segment}
            onClick={() => openSegment(segment)}
            className={`rounded-2xl border p-5 text-left transition-all ${isActive ? "border-primary bg-primary/10" : "border-bg-border bg-bg-surface hover:border-primary/40"}`}
          >
            <Icon className={`h-6 w-6 ${SEGMENT_COLORS[segment]}`} />
            <p className="mt-3 text-2xl font-black text-white">{count}</p>
            <p className="mt-1 text-xs font-medium text-text-secondary">{segmentData?.labels[segment] || segment}</p>
          </button>
        );
      })}
    </div>

    {selected && (
      <section className="rounded-2xl border border-bg-border bg-bg-surface p-6">
        <h2 className="font-bold text-white">Anggota: {segmentData?.labels[selected] || selected}</h2>
        {loadingMembers ? <div className="mt-4 h-32 animate-pulse rounded-xl bg-bg-elevated" /> : members.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border text-left text-xs uppercase tracking-wider text-text-muted">
                  <th className="pb-3 pr-4 font-semibold">Nama</th>
                  <th className="pb-3 pr-4 font-semibold">Order</th>
                  <th className="pb-3 pr-4 font-semibold">Total Belanja</th>
                  <th className="pb-3 font-semibold">Terakhir Beli</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.user_id} className="border-b border-bg-border/50">
                    <td className="py-3 pr-4"><p className="font-bold text-white">{member.name}</p><p className="text-xs text-text-muted">{member.email}</p></td>
                    <td className="py-3 pr-4 text-text-secondary">{member.orders}x</td>
                    <td className="py-3 pr-4 font-bold text-white">{formatCurrency(member.total_spend)}</td>
                    <td className="py-3 text-text-secondary">{member.last_order_at ? formatDateOnly(member.last_order_at) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="mt-4 py-6 text-center text-sm text-text-muted">Tidak ada anggota pada segmen ini.</p>}
      </section>
    )}

    <section className="rounded-2xl border border-bg-border bg-bg-surface p-6">
      <h2 className="font-bold text-white flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Event Serupa</h2>
      <p className="mt-1 text-sm text-text-secondary">Pilih salah satu event Anda untuk melihat event lain di kategori/kota yang sama sebagai rekomendasi.</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="w-full max-w-md">
          <Select
            label="Event"
            placeholder="Pilih event..."
            options={events.map((e) => ({ value: e.slug, label: e.title }))}
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          />
        </div>
        <Button onClick={loadSimilar} loading={loadingSimilar} disabled={!selectedEvent}>Cari</Button>
      </div>
      {similar.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {similar.map((event) => (
            <a key={event.id} href={`/events/${event.slug}`} target="_blank" className="rounded-xl border border-bg-border bg-bg-elevated p-4 transition-all hover:border-primary/40">
              <p className="font-bold text-white line-clamp-1">{event.title}</p>
              <p className="mt-1 text-xs text-text-muted">{event.city} · {formatDateOnly(event.start_date)}</p>
              {event.tenant && <p className="mt-2 text-xs"><span className="text-text-muted">oleh {event.tenant.name}</span> {event.tenant.trust_score !== undefined && <span className="ml-1 text-success">Trust {event.tenant.trust_score}</span>}</p>}
            </a>
          ))}
        </div>
      )}
    </section>

    <section className="rounded-2xl border border-bg-border bg-bg-surface p-6">
      <h2 className="font-bold text-white flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" />Re-marketing</h2>
      <p className="mt-1 text-sm text-text-secondary">Buat kampanye email ke segmen pembeli tertentu untuk mempromosikan event serupa.</p>

      <form onSubmit={createCampaign} className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <Input label="Nama Kampanye *" value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder="mis. Reaktivasi VIP" />
        </div>
        <div>
          <Select
            label="Segmen Target *"
            options={SEGMENTS.map((s) => ({ value: s, label: segmentData?.labels[s] || s }))}
            value={campaignForm.segment}
            onChange={(e) => {
              setCampaignForm({ ...campaignForm, segment: e.target.value });
              setPreview(null);
            }}
          />
        </div>
        <div>
          <Select
            label="Event yang Dipromosikan"
            options={events.map((e) => ({ value: e.slug, label: e.title }))}
            value={campaignForm.event_id}
            onChange={(e) => setCampaignForm({ ...campaignForm, event_id: e.target.value })}
            placeholder="Pilih event..."
          />
        </div>
        <div>
          <Input label="Subjek Email *" value={campaignForm.subject} onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })} placeholder="mis. Event serupa untuk Anda" />
        </div>
        <div className="md:col-span-2">
          <Textarea label="Pesan Email *" rows={4} value={campaignForm.message} onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })} placeholder="Halo, kami punya event spesial untuk Anda..." />
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={previewCampaign} loading={previewing}>
          <Eye className="h-4 w-4" /> Preview Penerima
        </Button>
        <Button type="button" onClick={createCampaign} loading={creating}>
          <Sparkles className="h-4 w-4" /> Buat Draft
        </Button>
      </div>

      {preview && (
        <div className="mt-4 rounded-xl border border-bg-border bg-bg-elevated p-4">
          <p className="text-sm text-text-secondary">
            <strong className="text-white">{preview.recipients_count} calon penerima</strong> pada segmen ini.
          </p>
          {preview.sample.length > 0 && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {preview.sample.map((m) => (
                <div key={m.user_id} className="rounded-lg bg-bg-surface px-3 py-2">
                  <p className="text-sm font-bold text-white">{m.name}</p>
                  <p className="text-xs text-text-muted">{m.email} · {m.orders}x order</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {campaigns.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border text-left text-xs uppercase tracking-wider text-text-muted">
                <th className="pb-3 pr-4 font-semibold">Kampanye</th>
                <th className="pb-3 pr-4 font-semibold">Segmen</th>
                <th className="pb-3 pr-4 font-semibold">Penerima</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-bg-border/50">
                  <td className="py-3 pr-4">
                    <p className="font-bold text-white">{c.name}</p>
                    <p className="text-xs text-text-muted">{c.event ? `→ ${c.event.title}` : c.subject}</p>
                  </td>
                  <td className="py-3 pr-4 text-text-secondary">{segmentData?.labels[c.segment] || c.segment}</td>
                  <td className="py-3 pr-4 font-bold text-white">{c.recipients_count}</td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-lg text-xs font-bold px-2 py-0.5 border ${c.status === "sent" ? "bg-success/15 text-success border-success/30" : "bg-warning/15 text-warning border-warning/30"}`}>
                      {c.status === "sent" ? `Terkirim${c.sent_at ? ` ${formatDateOnly(c.sent_at)}` : ""}` : "Draft"}
                    </span>
                  </td>
                  <td className="py-3">
                    {c.status === "draft" ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => sendCampaign(c)} disabled={sending === c.id} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50">
                          <Send className="h-3.5 w-3.5" /> Kirim
                        </button>
                        <button onClick={() => deleteCampaign(c)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : <span className="text-xs text-text-muted">Selesai</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  </div>;
}
