"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Plus, Trash2, Tag, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { formatCurrency, formatDateOnly } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface Community {
  id: number;
  name: string;
  slug: string;
  code: string;
  type: string;
  description?: string | null;
  status: string;
  member_count?: number;
  created_at: string;
}

interface CommunityMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

interface CommunityEventItem {
  id: number;
  event_id: number;
  title: string;
  slug: string;
  start_date: string;
  city: string;
  revenue_share_pct: number;
}

interface CommunityPayoutItem {
  id: number;
  order_id: string;
  share_pct: number;
  amount: number;
  status: string;
  earned_at: string;
  event_title: string;
}

interface CommunitySummary {
  member_count: number;
  events_count: number;
  total_share_earned: number;
  total_share_reversed: number;
  orders_count: number;
}

type Tab = "members" | "events" | "payouts";

const client = api.getClient();

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  // Ensure communities is always an array (defensive against hydration issues)
  const safeCommunities = Array.isArray(communities) ? communities : [];
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Community | null>(null);
  const [summary, setSummary] = useState<CommunitySummary | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [events, setEvents] = useState<CommunityEventItem[]>([]);
  const [payouts, setPayouts] = useState<CommunityPayoutItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "komunitas", description: "" });
  const [formEvent, setFormEvent] = useState({ event_id: "", share_pct: "10" });
  const requested = useRef(false);

  // ConfirmDialog state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ open: true, title, message, onConfirm });
  };
  const closeConfirm = () => setConfirmState((s) => ({ ...s, open: false }));


  const fetchCommunities = () => {
    client
      .get("/promotor/communities")
      .then((r) => {
        const communitiesData = r.data?.data?.data ?? r.data?.data ?? [];
        console.log('Fetched communities:', communitiesData);
        setCommunities(Array.isArray(communitiesData) ? communitiesData : []);
      })
      .catch((err) => {
        console.error('Failed to fetch communities:', err);
        toast.error("Gagal memuat komunitas.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    fetchCommunities();
  }, []);

  const openCommunity = (slug: string) => {
    setSelected(slug);
    setLoadingDetail(true);
    setActiveTab("members");
    Promise.all([
      client.get(`/communities/${slug}`).then((r) => setDetail(r.data.data)),
      client.get(`/promotor/communities/${slug}/summary`).then((r) => setSummary(r.data.data)),
      client.get(`/promotor/communities/${slug}/members`).then((r) => setMembers(r.data.data?.data || r.data.data || [])),
      client.get(`/promotor/communities/${slug}/events`).then((r) => setEvents(r.data.data?.data || r.data.data || [])),
      client.get(`/promotor/communities/${slug}/payouts`).then((r) => setPayouts(r.data.data?.data || r.data.data || [])),
    ])
      .catch(() => toast.error("Gagal memuat detail komunitas."))
      .finally(() => setLoadingDetail(false));
  };

  const createCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setCreating(true);
    client
      .post("/promotor/communities", form)
      .then(() => {
        toast.success("Komunitas dibuat.");
        setShowForm(false);
        setForm({ name: "", type: "komunitas", description: "" });
        fetchCommunities();
      })
      .catch(() => toast.error("Gagal membuat komunitas."))
      .finally(() => setCreating(false));
  };

  const removeCommunity = (c: Community) => {
    openConfirm(
      `Hapus Komunitas`,
      `Apakah Anda yakin ingin menghapus komunitas "${c.name}"? Tindakan ini tidak bisa dibatalkan.`,
      () => {
        client
          .delete(`/promotor/communities/${c.slug}`)
          .then(() => {
            toast.success("Komunitas berhasil dihapus.", { title: "Dihapus!" });
            setSelected(null);
            setDetail(null);
            fetchCommunities();
          })
          .catch(() => toast.error("Gagal menghapus komunitas.", { title: "Gagal" }));
        closeConfirm();
      }
    );
  };

  const attachEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !formEvent.event_id) return;
    client
      .post(`/promotor/communities/${selected}/events`, {
        event_id: parseInt(formEvent.event_id),
        revenue_share_pct: parseFloat(formEvent.share_pct),
      })
      .then(() => {
        toast.success("Event ditambahkan.");
        setFormEvent({ event_id: "", share_pct: "10" });
        client.get(`/promotor/communities/${selected}/events`).then((r) => setEvents(r.data.data?.data || r.data.data || []));
      })
      .catch(() => toast.error("Gagal menambahkan event."));
  };

  const detachEvent = (slug: string, ceId: number) => {
    openConfirm(
      "Lepas Event",
      "Yakin ingin melepas event ini dari komunitas? Revenue share akan dihentikan.",
      () => {
        client
          .delete(`/promotor/communities/${slug}/events/${ceId}`)
          .then(() => {
            toast.success("Event berhasil dilepas dari komunitas.", { title: "Berhasil" });
            client.get(`/promotor/communities/${slug}/events`).then((r) => setEvents(r.data.data?.data || r.data.data || []));
          })
          .catch(() => toast.error("Gagal melepas event.", { title: "Gagal" }));
        closeConfirm();
      }
    );
  };

  const updateShare = (slug: string, ceId: number, pct: number) => {
    client
      .put(`/promotor/communities/${slug}/events/${ceId}`, { revenue_share_pct: pct })
      .then(() => toast.success("Share diperbarui."))
      .catch(() => toast.error("Gagal memperbarui share."));
  };

  const updateMemberRole = (slug: string, memberId: number, role: string) => {
    client
      .post(`/promotor/communities/${slug}/members/${memberId}/role`, { role })
      .then(() => toast.success("Peran diperbarui."))
      .catch(() => toast.error("Gagal memperbarui peran."));
  };

  const removeMember = (slug: string, memberId: number) => {
    openConfirm(
      "Keluarkan Anggota",
      "Apakah Anda yakin ingin mengeluarkan anggota ini dari komunitas?",
      () => {
        client
          .delete(`/promotor/communities/${slug}/members/${memberId}`)
          .then(() => {
            toast.success("Anggota berhasil dikeluarkan.", { title: "Berhasil" });
            client.get(`/promotor/communities/${slug}/members`).then((r) => setMembers(r.data.data?.data || r.data.data || []));
          })
          .catch(() => toast.error("Gagal mengeluarkan anggota.", { title: "Gagal" }));
        closeConfirm();
      }
    );
  };

  const TABS: Array<{ key: Tab; label: string }> = [
    { key: "members", label: "Anggota" },
    { key: "events", label: "Event Khusus" },
    { key: "payouts", label: "Revenue Share" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Komunitas</h1>
            <p className="text-sm text-text-secondary">Kelola komunitas, event khusus, dan revenue share.</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> Komunitas Baru
        </Button>
      </div>

      {showForm && (
        <form onSubmit={createCommunity} className="mt-6 rounded-2xl border border-bg-border bg-bg-surface p-5 grid gap-4 md:grid-cols-3 items-end">
          <Input label="Nama *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="mis. Fans Club" />
          <Select
            label="Tipe"
            options={[{ value: "komunitas", label: "Komunitas" }, { value: "fan_club", label: "Fans Club" }, { value: "campus", label: "Campus" }, { value: "corporate", label: "Corporate" }]}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
          <div className="md:col-span-3">
            <Textarea label="Deskripsi" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi komunitas..." />
          </div>
          <div className="md:col-span-3 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
            <Button type="submit" loading={creating}>Buat</Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-bg-surface" />
          ))}
        </div>
      ) :  safeCommunities.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-bg-border bg-bg-surface p-8 text-center text-sm text-text-muted">Belum ada komunitas.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          { safeCommunities.map((c) => (
            <button
              key={c.id}
              onClick={() => openCommunity(c.slug)}
              className="rounded-2xl border border-bg-border bg-bg-surface p-5 text-left transition-all hover:border-primary/40"
            >
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                <p className="font-bold text-white">{c.name}</p>
              </div>
              <p className="mt-2 text-xs text-text-secondary">
                <Tag className="h-3.5 w-3.5 inline mr-1" />
                {c.type} · kode <code className="text-primary">{c.code}</code>
              </p>
              <p className="mt-1 text-xs text-text-muted">{c.member_count ?? 0} anggota</p>
            </button>
          ))}
        </div>
      )}

      {selected && detail && (
        <section className="mt-6 rounded-2xl border border-bg-border bg-bg-surface p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-black text-white flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> {detail.name}</h2>
              <p className="mt-1 text-xs text-text-secondary">kode <code className="text-primary">{detail.code}</code> · {detail.type} · status {detail.status}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => removeCommunity(detail)}>Hapus</Button>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${activeTab === t.key ? "bg-primary text-white" : "bg-bg-elevated text-text-secondary border border-bg-border"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loadingDetail ? (
            <div className="mt-4 h-32 animate-pulse rounded-xl bg-bg-elevated" />
          ) : (
            <>
              {summary && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="rounded-xl border border-bg-border bg-bg-elevated p-3 text-center">
                    <p className="text-xs text-text-muted uppercase tracking-wider">Anggota</p>
                    <p className="mt-1 text-2xl font-black text-white">{summary.member_count}</p>
                  </div>
                  <div className="rounded-xl border border-bg-border bg-bg-elevated p-3 text-center">
                    <p className="text-xs text-text-muted uppercase tracking-wider">Event</p>
                    <p className="mt-1 text-2xl font-black text-white">{summary.events_count}</p>
                  </div>
                  <div className="rounded-xl border border-bg-border bg-bg-elevated p-3 text-center">
                    <p className="text-xs text-text-muted uppercase tracking-wider">Terjual</p>
                    <p className="mt-1 text-2xl font-black text-white">{summary.orders_count}</p>
                  </div>
                  <div className="rounded-xl border border-bg-border bg-bg-elevated p-3 text-center">
                    <p className="text-xs text-text-muted uppercase tracking-wider">Total Share</p>
                    <p className="mt-1 text-2xl font-black text-success">{formatCurrency(summary.total_share_earned)}</p>
                  </div>
                  <div className="rounded-xl border border-bg-border bg-bg-elevated p-3 text-center">
                    <p className="text-xs text-text-muted uppercase tracking-wider">Dibatalkan</p>
                    <p className="mt-1 text-2xl font-black text-danger">{formatCurrency(summary.total_share_reversed)}</p>
                  </div>
                </div>
              )}

              {activeTab === "members" && (
                <>
                  {members.length === 0 ? (
                    <p className="mt-4 text-sm text-text-muted text-center py-6">Belum ada anggota.</p>
                  ) : (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-bg-elevated text-left text-xs uppercase text-text-muted">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Nama</th>
                            <th className="px-4 py-3 font-semibold">Email</th>
                            <th className="px-4 py-3 font-semibold">Peran</th>
                            <th className="px-4 py-3 font-semibold">Bergabung</th>
                            <th className="px-4 py-3 font-semibold">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-bg-border">
                          {members.map((m) => (
                            <tr key={m.id}>
                              <td className="px-4 py-3 font-bold text-white">{m.name}</td>
                              <td className="px-4 py-3 text-xs text-text-secondary">{m.email}</td>
                              <td className="px-4 py-3">
                                <select
                                  value={m.role}
                                  onChange={(e) => updateMemberRole(detail.slug, m.id, e.target.value)}
                                  className="rounded-lg border border-bg-border bg-bg-elevated px-2 py-1 text-xs text-white outline-none focus:border-primary"
                                >
                                  <option value="member">member</option>
                                  <option value="leader">leader</option>
                                </select>
                              </td>
                              <td className="px-4 py-3 text-xs text-text-muted">{formatDateOnly(m.joined_at)}</td>
                              <td className="px-4 py-3">
                                <button onClick={() => removeMember(detail.slug, m.id)} className="p-1 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === "events" && (
                <>
                  <form onSubmit={attachEvent} className="mt-4 flex flex-wrap items-end gap-3">
                    <div className="w-full max-w-md">
                      <Input
                        label="Event ID"
                        type="number"
                        value={formEvent.event_id}
                        onChange={(e) => setFormEvent({ ...formEvent, event_id: e.target.value })}
                        placeholder="ID event"
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        label="Share %"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formEvent.share_pct}
                        onChange={(e) => setFormEvent({ ...formEvent, share_pct: e.target.value })}
                      />
                    </div>
                    <Button type="submit">Tambahkan</Button>
                  </form>
                  {events.length === 0 ? (
                    <p className="mt-4 text-sm text-text-muted text-center py-6">Belum ada event khusus.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {events.map((ev) => (
                        <div key={ev.id} className="flex items-center justify-between gap-3 rounded-xl border border-bg-border bg-bg-elevated p-4 flex-wrap">
                          <div>
                            <a href={`/events/${ev.slug}`} target="_blank" className="font-bold text-white hover:text-primary">
                              {ev.title}
                            </a>
                            <p className="mt-1 text-xs text-text-secondary">
                              <Calendar className="h-3.5 w-3.5 inline mr-1" />
                              {formatDateOnly(ev.start_date)} · {ev.city}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-text-secondary">
                              Share:
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={ev.revenue_share_pct}
                                onChange={(e) => updateShare(detail.slug, ev.id, parseFloat(e.target.value))}
                                className="ml-1 w-20 rounded-lg border border-bg-border bg-bg-surface px-2 py-1 text-xs text-white outline-none focus:border-primary"
                              />
                              %
                            </label>
                            <button onClick={() => detachEvent(detail.slug, ev.id)} className="p-1 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "payouts" && (
                <>
                  {payouts.length === 0 ? (
                    <p className="mt-4 text-sm text-text-muted text-center py-6">Belum ada pembagian revenue.</p>
                  ) : (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-bg-elevated text-left text-xs uppercase text-text-muted">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Event</th>
                            <th className="px-4 py-3 font-semibold">Share</th>
                            <th className="px-4 py-3 font-semibold">Amount</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Waktu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-bg-border">
                          {payouts.map((p) => (
                            <tr key={p.id}>
                              <td className="px-4 py-3 text-sm text-white">{p.event_title}</td>
                              <td className="px-4 py-3 text-xs text-text-secondary">{p.share_pct}%</td>
                              <td className="px-4 py-3 font-bold text-white">{formatCurrency(p.amount)}</td>
                              <td className="px-4 py-3">
                                <span className={`rounded-lg text-xs font-bold px-2 py-0.5 ${p.status === "earned" ? "bg-success/15 text-success border border-success/30" : "bg-danger/15 text-danger border border-danger/30"}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-text-muted">{formatDateOnly(p.earned_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
      )}

      {/* Premium Confirm Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel="Ya, Lanjutkan"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}