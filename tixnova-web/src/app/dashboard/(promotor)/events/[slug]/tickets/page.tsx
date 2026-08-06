"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Plus, Trash2, Edit3, Save, X,
  Ticket, Users, DollarSign, Tag
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface Ticket {
  id: number;
  name: string;
  type: string;
  price: number;
  quota: number;
  sold: number;
  description?: string;
}

const TICKET_TYPES = ["regular", "vip", "vvip", "early_bird", "student", "group"];

export default function EventTicketsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Add form
  const [newName, setNewName] = useState("Regular");
  const [newType, setNewType] = useState("regular");
  const [newPrice, setNewPrice] = useState<number>(250000);
  const [newQuota, setNewQuota] = useState<number>(500);
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit state per ticket
  const [editData, setEditData] = useState<Partial<Ticket>>({});

  const fetchTickets = () => {
    setLoading(true);
    Promise.all([
      api.getClient().get(`/promotor/events/${slug}`),
      api.getClient().get(`/promotor/events/${slug}/tickets`),
    ])
      .then(([evRes, tkRes]) => {
        setEventTitle(evRes.data?.data?.title || "Event");
        setTickets(tkRes.data?.data || []);
      })
      .catch(() => toast.error("Gagal memuat data tiket."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTickets();
  }, [slug]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.getClient().post(`/promotor/events/${slug}/tickets`, {
        name: newName, type: newType, price: newPrice,
        quota: newQuota, description: newDesc || `Tiket ${newName}`,
      });
      toast.success("Tiket berhasil ditambahkan!");
      setShowAdd(false);
      setNewName("Regular"); setNewType("regular"); setNewPrice(250000); setNewQuota(500); setNewDesc("");
      fetchTickets();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Gagal menambahkan tiket.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (ticketId: number) => {
    setSaving(true);
    try {
      await api.getClient().put(`/promotor/events/${slug}/tickets/${ticketId}`, editData);
      toast.success("Tiket berhasil diperbarui!");
      setEditingId(null);
      fetchTickets();
    } catch {
      toast.error("Gagal memperbarui tiket.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ticketId: number) => {
    if (!confirm("Yakin ingin menghapus tiket ini?")) return;
    try {
      await api.getClient().delete(`/promotor/events/${slug}/tickets/${ticketId}`);
      toast.success("Tiket berhasil dihapus.");
      fetchTickets();
    } catch {
      toast.error("Gagal menghapus tiket.");
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-bg-surface rounded-xl w-64" />
        <div className="h-40 bg-bg-surface rounded-2xl border border-bg-border" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/events">
            <Button variant="outline" size="sm" className="border-bg-border">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Manajemen Tiket</h1>
            <p className="text-text-secondary text-sm">{eventTitle}</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="bg-primary hover:bg-primary-dark font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Tambah Tiket
        </Button>
      </div>

      {/* Add Ticket Form */}
      {showAdd && (
        <div className="bg-bg-surface border border-primary/40 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Tiket Baru
            </h3>
            <button onClick={() => setShowAdd(false)} className="text-text-muted hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Nama Tiket</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)}
                className="bg-bg-elevated border-bg-border text-white" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Tipe</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value)}
                className="input-field text-sm">
                {TICKET_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase().replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Harga (Rp)</label>
              <Input type="number" value={newPrice} onChange={(e) => setNewPrice(Number(e.target.value))}
                className="bg-bg-elevated border-bg-border text-white" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Kuota</label>
              <Input type="number" value={newQuota} onChange={(e) => setNewQuota(Number(e.target.value))}
                className="bg-bg-elevated border-bg-border text-white" required />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-text-secondary mb-2">Deskripsi (opsional)</label>
              <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Deskripsi singkat tiket..."
                className="bg-bg-elevated border-bg-border text-white" />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={saving}
                className="bg-primary hover:bg-primary-dark w-full font-bold flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Menyimpan..." : "Tambah"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets List */}
      {tickets.length > 0 ? (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-bg-surface border border-bg-border rounded-2xl p-5">
              {editingId === ticket.id ? (
                /* Edit Mode */
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-2">Nama</label>
                    <Input
                      value={editData.name ?? ticket.name}
                      onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))}
                      className="bg-bg-elevated border-bg-border text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-2">Tipe</label>
                    <select
                      value={editData.type ?? ticket.type}
                      onChange={(e) => setEditData((d) => ({ ...d, type: e.target.value }))}
                      className="input-field text-sm"
                    >
                      {TICKET_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase().replace("_", " ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-2">Harga (Rp)</label>
                    <Input
                      type="number"
                      value={editData.price ?? ticket.price}
                      onChange={(e) => setEditData((d) => ({ ...d, price: Number(e.target.value) }))}
                      className="bg-bg-elevated border-bg-border text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-2">Kuota</label>
                    <Input
                      type="number"
                      value={editData.quota ?? ticket.quota}
                      onChange={(e) => setEditData((d) => ({ ...d, quota: Number(e.target.value) }))}
                      className="bg-bg-elevated border-bg-border text-white"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 mt-2">
                    <Button variant="outline" onClick={() => setEditingId(null)} className="border-bg-border">Batal</Button>
                    <Button onClick={() => handleUpdate(ticket.id)} disabled={saving}
                      className="bg-primary hover:bg-primary-dark font-bold">
                      {saving ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center border border-primary/30">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{ticket.name}</p>
                      <p className="text-xs text-text-muted capitalize">{ticket.type.replace("_", " ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-primary">{formatCurrency(ticket.price)}</p>
                      <p className="text-xs text-text-muted">Harga</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-white">{ticket.sold ?? 0} / {ticket.quota}</p>
                      <p className="text-xs text-text-muted">Terjual</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-success">{ticket.quota - (ticket.sold ?? 0)}</p>
                      <p className="text-xs text-text-muted">Sisa</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm" variant="outline"
                      onClick={() => { setEditingId(ticket.id); setEditData({}); }}
                      className="border-bg-border text-xs py-1.5 px-3"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      onClick={() => handleDelete(ticket.id)}
                      disabled={(ticket.sold ?? 0) > 0}
                      className="border-danger/40 text-danger hover:bg-danger/10 text-xs py-1.5 px-3 disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-bg-surface border border-bg-border rounded-2xl p-12 text-center space-y-3">
          <Ticket className="w-12 h-12 text-text-muted mx-auto" />
          <p className="text-text-secondary text-sm">Belum ada kategori tiket untuk event ini.</p>
          <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary-dark mt-2">
            <Plus className="w-4 h-4 mr-2" /> Tambah Tiket Pertama
          </Button>
        </div>
      )}
    </div>
  );
}
