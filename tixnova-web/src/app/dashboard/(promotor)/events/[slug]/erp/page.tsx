"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  LayoutDashboard, Wallet, CalendarClock, ListChecks,
  Plus, Trash2, Check, Wallet2, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { formatCurrency, formatDateOnly } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface Overview {
  event: { title: string; slug: string };
  budget: {
    planned_total: number;
    actual_total: number;
    variance: number;
    over_budget: boolean;
    by_category: Record<string, { count: number; planned: number; actual: number }>;
  };
  timeline: { total: number; done: number; missed: number };
  checklist: { total: number; done: number; progress: number };
}

interface BudgetItem {
  id: number;
  category: string;
  label: string;
  notes?: string;
  planned_amount: string;
  actual_amount: string;
}

interface TimelineItem {
  id: number;
  title: string;
  description?: string;
  due_at?: string;
  status: string;
  completed_at?: string;
  sort_order: number;
}

interface ChecklistItem {
  id: number;
  title: string;
  phase: string;
  is_done: boolean;
  completed_at?: string;
  sort_order: number;
}

const BUDGET_CATEGORIES = ["production", "marketing", "artist", "venue", "equipment", "staffing", "other"];
const BUDGET_LABELS: Record<string, string> = {
  production: "Produksi", marketing: "Marketing", artist: "Artis", venue: "Venue",
  equipment: "Perlengkapan", staffing: "SDM", other: "Lainnya",
};
const PHASES = ["pre_event", "event_day", "post_event"];
const PHASE_LABELS: Record<string, string> = { pre_event: "Sebelum Event", event_day: "Hari-H", post_event: "Setelah Event" };

const TABS = [
  { key: "overview", label: "Ringkasan", icon: LayoutDashboard },
  { key: "budget", label: "Budget", icon: Wallet },
  { key: "timeline", label: "Timeline", icon: CalendarClock },
  { key: "checklist", label: "Checklist", icon: ListChecks },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function EventErpPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tab, setTab] = useState<TabKey>("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const requested = useRef(false);

  // Budget form
  const [budgetForm, setBudgetForm] = useState({ category: "production", label: "", notes: "", planned_amount: "", actual_amount: "" });
  const [savingBudget, setSavingBudget] = useState(false);
  // Timeline form
  const [timelineForm, setTimelineForm] = useState({ title: "", description: "", due_at: "" });
  const [savingTimeline, setSavingTimeline] = useState(false);
  // Checklist form
  const [checklistForm, setChecklistForm] = useState({ title: "", phase: "pre_event" });
  const [savingChecklist, setSavingChecklist] = useState(false);

  const load = () => {
    Promise.all([
      api.getClient().get(`/promotor/events/${slug}/erp/overview`),
      api.getClient().get(`/promotor/events/${slug}/erp/budget-items`),
      api.getClient().get(`/promotor/events/${slug}/erp/timeline`),
      api.getClient().get(`/promotor/events/${slug}/erp/checklists`),
    ])
      .then(([ov, bg, tl, cl]) => {
        setOverview(ov.data.data);
        setBudgetItems(bg.data.data || []);
        setTimeline(tl.data.data || []);
        setChecklist(cl.data.data || []);
      })
      .catch(() => toast.error("Gagal memuat data ERP."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    load();
  }, [slug]);

  const createBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetForm.label.trim()) return;
    setSavingBudget(true);
    try {
      await api.getClient().post(`/promotor/events/${slug}/erp/budget-items`, {
        category: budgetForm.category,
        label: budgetForm.label,
        notes: budgetForm.notes || undefined,
        planned_amount: budgetForm.planned_amount ? Number(budgetForm.planned_amount) : undefined,
        actual_amount: budgetForm.actual_amount ? Number(budgetForm.actual_amount) : undefined,
      });
      toast.success("Item anggaran ditambahkan.");
      setBudgetForm({ category: "production", label: "", notes: "", planned_amount: "", actual_amount: "" });
      load();
    } catch {
      toast.error("Gagal menambahkan item anggaran.");
    } finally {
      setSavingBudget(false);
    }
  };

  const deleteBudget = async (itemId: number) => {
    try {
      await api.getClient().delete(`/promotor/events/${slug}/erp/budget-items/${itemId}`);
      toast.success("Item dihapus.");
      load();
    } catch {
      toast.error("Gagal menghapus item.");
    }
  };

  const createTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelineForm.title.trim()) return;
    setSavingTimeline(true);
    try {
      await api.getClient().post(`/promotor/events/${slug}/erp/timeline`, {
        title: timelineForm.title,
        description: timelineForm.description || undefined,
        due_at: timelineForm.due_at || undefined,
      });
      toast.success("Milestone ditambahkan.");
      setTimelineForm({ title: "", description: "", due_at: "" });
      load();
    } catch {
      toast.error("Gagal menambahkan milestone.");
    } finally {
      setSavingTimeline(false);
    }
  };

  const toggleTimeline = async (item: TimelineItem) => {
    try {
      await api.getClient().post(`/promotor/events/${slug}/erp/timeline/${item.id}/toggle`);
      load();
    } catch {
      toast.error("Gagal memperbarui milestone.");
    }
  };

  const deleteTimeline = async (itemId: number) => {
    try {
      await api.getClient().delete(`/promotor/events/${slug}/erp/timeline/${itemId}`);
      toast.success("Milestone dihapus.");
      load();
    } catch {
      toast.error("Gagal menghapus milestone.");
    }
  };

  const createChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistForm.title.trim()) return;
    setSavingChecklist(true);
    try {
      await api.getClient().post(`/promotor/events/${slug}/erp/checklists`, {
        title: checklistForm.title,
        phase: checklistForm.phase,
      });
      toast.success("Item checklist ditambahkan.");
      setChecklistForm({ title: "", phase: "pre_event" });
      load();
    } catch {
      toast.error("Gagal menambahkan item checklist.");
    } finally {
      setSavingChecklist(false);
    }
  };

  const toggleChecklist = async (item: ChecklistItem) => {
    try {
      await api.getClient().post(`/promotor/events/${slug}/erp/checklists/${item.id}/toggle`);
      load();
    } catch {
      toast.error("Gagal memperbarui checklist.");
    }
  };

  const deleteChecklist = async (itemId: number) => {
    try {
      await api.getClient().delete(`/promotor/events/${slug}/erp/checklists/${itemId}`);
      toast.success("Item checklist dihapus.");
      load();
    } catch {
      toast.error("Gagal menghapus item checklist.");
    }
  };

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-bg-surface" />;

  return <div className="mx-auto max-w-5xl space-y-6">
    <div>
      <h1 className="text-3xl font-extrabold text-white">Event ERP</h1>
      <p className="mt-1 text-sm text-text-secondary">{overview?.event.title || "Event"} — budget, timeline, dan checklist produksi.</p>
    </div>

    <div className="flex flex-wrap gap-2">
      {TABS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setTab(key)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${tab === key ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-bg-surface text-text-secondary border border-bg-border hover:text-white"}`}
        >
          <Icon className="h-4 w-4" />{label}
        </button>
      ))}
    </div>

    {tab === "overview" && overview && (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-bg-border bg-bg-surface p-6"><Wallet2 className="h-5 w-5 text-primary" /><p className="mt-3 text-xs text-text-muted">Rencana (Planned)</p><p className="text-2xl font-black text-white">{formatCurrency(overview.budget.planned_total)}</p></div>
          <div className="rounded-2xl border border-bg-border bg-bg-surface p-6"><Wallet className="h-5 w-5 text-accent" /><p className="mt-3 text-xs text-text-muted">Realisasi (Actual)</p><p className="text-2xl font-black text-accent">{formatCurrency(overview.budget.actual_total)}</p></div>
          <div className={`rounded-2xl border p-6 ${overview.budget.over_budget ? "border-danger/30 bg-danger/10" : "border-success/30 bg-success/10"}`}><Wallet2 className={`h-5 w-5 ${overview.budget.over_budget ? "text-danger" : "text-success"}`} /><p className="mt-3 text-xs text-text-muted">Selisih (Variance)</p><p className={`text-2xl font-black ${overview.budget.over_budget ? "text-danger" : "text-success"}`}>{formatCurrency(overview.budget.variance)}</p></div>
        </div>

        <div className="rounded-2xl border border-bg-border bg-bg-surface p-6">
          <h2 className="font-bold text-white">Budget per Kategori</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(overview.budget.by_category).map(([category, value]) => (
              <div key={category} className="flex items-center justify-between rounded-xl bg-bg-elevated px-4 py-3">
                <p className="font-bold text-white">{BUDGET_LABELS[category] || category}</p>
                <p className="text-sm text-text-secondary">{value.count} item · {formatCurrency(value.planned)} rencana / <span className="text-accent">{formatCurrency(value.actual)}</span> realisasi</p>
              </div>
            ))}
            {Object.keys(overview.budget.by_category).length === 0 && <p className="py-4 text-center text-sm text-text-muted">Belum ada item anggaran.</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-bg-border bg-bg-surface p-6">
            <h2 className="font-bold text-white">Timeline</h2>
            <p className="mt-3 text-3xl font-black text-white">{overview.timeline.done}<span className="text-lg text-text-muted">/{overview.timeline.total} selesai</span></p>
            {overview.timeline.missed > 0 && <p className="mt-1 text-sm text-danger">{overview.timeline.missed} terlewat</p>}
          </div>
          <div className="rounded-2xl border border-bg-border bg-bg-surface p-6">
            <h2 className="font-bold text-white">Checklist Produksi</h2>
            <div className="mt-3 flex items-center gap-4">
              <p className="text-3xl font-black text-white">{overview.checklist.progress}%</p>
              <div className="flex-1 h-3 overflow-hidden rounded-full bg-bg-elevated">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${overview.checklist.progress}%` }} />
              </div>
            </div>
            <p className="mt-2 text-sm text-text-muted">{overview.checklist.done} dari {overview.checklist.total} item selesai</p>
          </div>
        </div>
      </div>
    )}

    {tab === "budget" && (
      <div className="space-y-4">
        <form onSubmit={createBudget} className="rounded-2xl border border-bg-border bg-bg-surface p-6 space-y-4">
          <h2 className="font-bold text-white flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" />Tambah Item Anggaran</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Select label="Kategori" options={BUDGET_CATEGORIES.map((c) => ({ value: c, label: BUDGET_LABELS[c] }))} value={budgetForm.category} onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })} /></div>
            <div className="sm:col-span-2"><Input label="Label" value={budgetForm.label} onChange={(e) => setBudgetForm({ ...budgetForm, label: e.target.value })} placeholder="Mis. Sound system" required /></div>
            <div className="sm:col-span-3"><Input label="Catatan" value={budgetForm.notes} onChange={(e) => setBudgetForm({ ...budgetForm, notes: e.target.value })} placeholder="Opsional" /></div>
            <div><Input label="Planned (Rp)" type="number" min="0" value={budgetForm.planned_amount} onChange={(e) => setBudgetForm({ ...budgetForm, planned_amount: e.target.value })} /></div>
            <div><Input label="Actual (Rp)" type="number" min="0" value={budgetForm.actual_amount} onChange={(e) => setBudgetForm({ ...budgetForm, actual_amount: e.target.value })} /></div>
            <div className="flex items-end"><Button type="submit" loading={savingBudget} fullWidth><Plus className="mr-2 h-4 w-4" />Simpan</Button></div>
          </div>
        </form>

        {budgetItems.length ? (
          <div className="space-y-3">
            {budgetItems.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bg-border bg-bg-surface p-4">
                <div className="min-w-0">
                  <p className="font-bold text-white">{item.label}</p>
                  <p className="text-xs text-text-muted">{BUDGET_LABELS[item.category] || item.category}{item.notes ? ` · ${item.notes}` : ""}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-text-secondary">Plan <span className="font-bold text-white">{formatCurrency(Number(item.planned_amount))}</span></p>
                  <p className="text-sm text-text-secondary">Actual <span className="font-bold text-accent">{formatCurrency(Number(item.actual_amount))}</span></p>
                  <Button variant="ghost" size="sm" onClick={() => deleteBudget(item.id)}><Trash2 className="h-4 w-4 text-danger" /></Button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="rounded-2xl border border-dashed border-bg-border p-10 text-center text-sm text-text-muted">Belum ada item anggaran.</p>}
      </div>
    )}

    {tab === "timeline" && (
      <div className="space-y-4">
        <form onSubmit={createTimeline} className="rounded-2xl border border-bg-border bg-bg-surface p-6 space-y-4">
          <h2 className="font-bold text-white flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" />Tambah Milestone</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2"><Input label="Judul" value={timelineForm.title} onChange={(e) => setTimelineForm({ ...timelineForm, title: e.target.value })} placeholder="Mis. Rilis tiket" required /></div>
            <div><Input label="Tenggat" type="date" value={timelineForm.due_at} onChange={(e) => setTimelineForm({ ...timelineForm, due_at: e.target.value })} /></div>
            <div className="sm:col-span-2"><Input label="Deskripsi" value={timelineForm.description} onChange={(e) => setTimelineForm({ ...timelineForm, description: e.target.value })} /></div>
            <div className="flex items-end"><Button type="submit" loading={savingTimeline} fullWidth><Plus className="mr-2 h-4 w-4" />Simpan</Button></div>
          </div>
        </form>

        {timeline.length ? (
          <div className="space-y-3">
            {timeline.map((item) => (
              <div key={item.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${item.status === "done" ? "border-success/30 bg-success/5" : item.status === "missed" ? "border-danger/30 bg-danger/5" : "border-bg-border bg-bg-surface"}`}>
                <div className="min-w-0">
                  <p className={`font-bold text-white ${item.status === "done" ? "line-through opacity-60" : ""}`}>{item.title}</p>
                  <p className="text-xs text-text-muted">{item.description}{item.due_at && ` · Tenggat ${formatDateOnly(item.due_at)}`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${item.status === "done" ? "border-success/30 text-success" : item.status === "missed" ? "border-danger/30 text-danger" : "border-bg-border text-text-secondary"}`}>{item.status}</span>
                  <Button variant="outline" size="sm" onClick={() => toggleTimeline(item)}><Check className="mr-1 h-3.5 w-3.5" />{item.status === "done" ? "Buka" : "Selesai"}</Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteTimeline(item.id)}><Trash2 className="h-4 w-4 text-danger" /></Button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="rounded-2xl border border-dashed border-bg-border p-10 text-center text-sm text-text-muted">Belum ada milestone.</p>}
      </div>
    )}

    {tab === "checklist" && (
      <div className="space-y-4">
        <form onSubmit={createChecklist} className="rounded-2xl border border-bg-border bg-bg-surface p-6 space-y-4">
          <h2 className="font-bold text-white flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />Tambah Item Checklist</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2"><Input label="Judul" value={checklistForm.title} onChange={(e) => setChecklistForm({ ...checklistForm, title: e.target.value })} placeholder="Mis. Cek soundcheck" required /></div>
            <div><Select label="Fase" options={PHASES.map((p) => ({ value: p, label: PHASE_LABELS[p] }))} value={checklistForm.phase} onChange={(e) => setChecklistForm({ ...checklistForm, phase: e.target.value })} /></div>
            <div className="flex items-end"><Button type="submit" loading={savingChecklist} fullWidth><Plus className="mr-2 h-4 w-4" />Simpan</Button></div>
          </div>
        </form>

        {checklist.length ? (
          <div className="space-y-4">
            {PHASES.map((phase) => {
              const items = checklist.filter((c) => c.phase === phase);
              if (!items.length) return null;
              return (
                <div key={phase} className="rounded-2xl border border-bg-border bg-bg-surface p-6">
                  <h3 className="font-bold text-white">{PHASE_LABELS[phase]} <span className="text-sm font-medium text-text-muted">({items.filter((i) => i.is_done).length}/{items.length})</span></h3>
                  <div className="mt-3 space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${item.is_done ? "bg-success/10" : "bg-bg-elevated"}`}>
                        <button className="flex items-center gap-3 text-left" onClick={() => toggleChecklist(item)}>
                          <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${item.is_done ? "border-success bg-success text-white" : "border-bg-border"}`}>{item.is_done && <Check className="h-3.5 w-3.5" />}</span>
                          <p className={`font-medium text-white ${item.is_done ? "line-through opacity-60" : ""}`}>{item.title}</p>
                        </button>
                        <Button variant="ghost" size="sm" onClick={() => deleteChecklist(item.id)}><Trash2 className="h-4 w-4 text-danger" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="rounded-2xl border border-dashed border-bg-border p-10 text-center text-sm text-text-muted">Belum ada item checklist.</p>}
      </div>
    )}
  </div>;
}
