"use client";

import { useEffect, useRef, useState } from "react";
import {
  Code2,
  X,
  Trash2,
  KeyRound,
  Send,
  Copy,
  Webhook,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDateOnly } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface ApiKeyItem {
  id: number;
  name: string;
  prefix: string;
  scopes: string;
  is_active: boolean;
  expires_at?: string | null;
  last_used_at?: string | null;
}

interface WebhookSub {
  id: number;
  name?: string | null;
  event_type: string;
  target_url: string;
  is_active: boolean;
  has_secret: boolean;
  deliveries_count: number;
}

interface Delivery {
  id: number;
  event_type: string;
  status: string;
  response_code?: string | null;
  error?: string | null;
  created_at: string;
  subscription?: { id: number; name?: string | null; target_url: string };
}

const SCOPE_LABEL: Record<string, string> = {
  read: "Baca (GET)",
  write: "Tulis (POST)",
};

const DELIVERY_BADGE: Record<string, { label: string; cls: string }> = {
  sent: { label: "Terkirim", cls: "bg-success/15 text-success border border-success/30" },
  failed: { label: "Gagal", cls: "bg-danger/15 text-danger border border-danger/30" },
  pending: { label: "Pending", cls: "bg-warning/15 text-warning border border-warning/30" },
};

type Tab = "keys" | "webhooks" | "deliveries";

export default function ApiPlatformPage() {
  const [tab, setTab] = useState<Tab>("keys");
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [webhooks, setWebhooks] = useState<{ event_types: string[]; subscriptions: WebhookSub[] }>({
    event_types: [],
    subscriptions: [],
  });
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [keyForm, setKeyForm] = useState({ name: "", scopes: { read: true, write: false } });
  const [hookForm, setHookForm] = useState({ name: "", event_type: "order.paid", target_url: "" });
  const [createdKey, setCreatedKey] = useState<{ id: number; key: string; name: string } | null>(null);
  const [createdSecret, setCreatedSecret] = useState<{ id: number; secret: string; target_url: string } | null>(null);
  const requested = useRef(false);

  const loadAll = async () => {
    try {
      const [keyRes, hookRes, delRes] = await Promise.allSettled([
        api.getClient().get("/promotor/api-keys"),
        api.getClient().get("/promotor/webhooks"),
        api.getClient().get("/promotor/webhooks/deliveries"),
      ]);

      let hasSuccess = false;

      if (keyRes.status === "fulfilled") {
        setKeys(keyRes.value.data?.data || []);
        hasSuccess = true;
      }

      if (hookRes.status === "fulfilled") {
        setWebhooks(hookRes.value.data?.data || { event_types: [], subscriptions: [] });
        hasSuccess = true;
      }

      if (delRes.status === "fulfilled") {
        setDeliveries(delRes.value.data?.data || []);
        hasSuccess = true;
      }

      if (!hasSuccess) {
        toast.error("Gagal memuat data developer API.");
      }
    } catch {
      toast.error("Gagal memuat data developer API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    loadAll();
  }, []);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} disalin.`);
    } catch {
      toast.error("Gagal menyalin.");
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyForm.name) return;
    setSubmitting(true);
    try {
      const scopes = Object.entries(keyForm.scopes).filter(([, v]) => v).map(([k]) => k);
      const res = await api.getClient().post("/promotor/api-keys", { name: keyForm.name, scopes });
      setCreatedKey(res.data.data);
      setKeyForm({ name: "", scopes: { read: true, write: false } });
      loadAll();
    } catch {
      toast.error("Gagal membuat API key.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeKey = async (k: ApiKeyItem) => {
    if (!window.confirm(`Nonaktifkan API key "${k.name}"?`)) return;
    try {
      await api.getClient().post(`/promotor/api-keys/${k.id}/revoke`);
      toast.success("API key dinonaktifkan.");
      loadAll();
    } catch {
      toast.error("Gagal menonaktifkan.");
    }
  };

  const handleDeleteKey = async (k: ApiKeyItem) => {
    if (!window.confirm(`Hapus API key "${k.name}"?`)) return;
    try {
      await api.getClient().delete(`/promotor/api-keys/${k.id}`);
      toast.success("API key dihapus.");
      loadAll();
    } catch {
      toast.error("Gagal menghapus.");
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hookForm.target_url) return;
    setSubmitting(true);
    try {
      const res = await api.getClient().post("/promotor/webhooks", {
        name: hookForm.name || undefined,
        event_type: hookForm.event_type,
        target_url: hookForm.target_url,
      });
      setCreatedSecret(res.data.data);
      setHookForm({ name: "", event_type: "order.paid", target_url: "" });
      loadAll();
    } catch {
      toast.error("Gagal mendaftarkan webhook.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestHook = async (h: WebhookSub) => {
    try {
      const res = await api.getClient().post(`/promotor/webhooks/${h.id}/test`);
      toast.success(res.data?.message || "Ping terkirim.");
      loadAll();
    } catch {
      toast.error("Ping gagal.");
    }
  };

  const handleDeleteHook = async (h: WebhookSub) => {
    if (!window.confirm("Hapus webhook endpoint ini?")) return;
    try {
      await api.getClient().delete(`/promotor/webhooks/${h.id}`);
      toast.success("Webhook dihapus.");
      loadAll();
    } catch {
      toast.error("Gagal menghapus.");
    }
  };

  const WIDGET_SNIPPET = `<div class="tixnova-widget" data-event="SLUG"></div>
<script src="${typeof window !== "undefined" ? window.location.origin : ""}/embed.js" async></script>`;

  const TABS: Array<{ key: Tab; label: string; icon: typeof KeyRound }> = [
    { key: "keys", label: "API Keys", icon: KeyRound },
    { key: "webhooks", label: "Webhooks", icon: Webhook },
    { key: "deliveries", label: "Riwayat Pengiriman", icon: FileText },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
          <Code2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Developer API</h1>
          <p className="text-sm text-text-secondary">Public REST API, webhook, dan embed widget untuk integrasi pihak ketiga.</p>
        </div>
      </div>

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
      ) : tab === "keys" ? (
        <>
          <div className="mt-6 rounded-2xl border border-bg-border bg-bg-surface p-5">
            <h2 className="font-bold text-white">Buat API Key Baru</h2>
            <form onSubmit={handleCreateKey} className="mt-4 grid gap-4 md:grid-cols-3 items-end">
              <label className="block">
                <span className="text-xs font-semibold text-text-secondary">Nama Key *</span>
                <input
                  value={keyForm.name}
                  onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })}
                  placeholder="mis. Web Shop"
                  className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
                />
              </label>
              <div className="flex gap-4">
                {Object.entries(SCOPE_LABEL).map(([scope, label]) => (
                  <label key={scope} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keyForm.scopes[scope as keyof typeof keyForm.scopes]}
                      onChange={(e) => setKeyForm({ ...keyForm, scopes: { ...keyForm.scopes, [scope]: e.target.checked } })}
                      className="accent-primary"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <button disabled={submitting} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">
                {submitting ? "..." : "Buat Key"}
              </button>
            </form>
          </div>

          {keys.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-bg-border bg-bg-surface p-8 text-center text-sm text-text-muted">Belum ada API key.</p>
          ) : (
            <div className="mt-6 space-y-3">
              {keys.map((k) => (
                <div key={k.id} className="flex items-center justify-between gap-4 rounded-xl border border-bg-border bg-bg-surface p-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">{k.name}</p>
                      <span className={`rounded-lg text-xs font-bold px-2 py-0.5 ${k.is_active ? "bg-success/15 text-success border border-success/30" : "bg-danger/15 text-danger border border-danger/30"}`}>
                        {k.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">
                      <code className="text-primary">{k.prefix}••••••••</code> · {k.scopes.split(",").map((s) => SCOPE_LABEL[s] || s).join(", ")}
                      {k.last_used_at ? ` · Terakhir dipakai ${formatDateOnly(k.last_used_at)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {k.is_active ? (
                      <button onClick={() => handleRevokeKey(k)} className="rounded-lg bg-warning/15 text-warning border border-warning/30 px-3 py-1.5 text-xs font-bold hover:bg-warning/25">
                        Nonaktifkan
                      </button>
                    ) : null}
                    <button onClick={() => handleDeleteKey(k)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : tab === "webhooks" ? (
        <>
          <div className="mt-6 rounded-2xl border border-bg-border bg-bg-surface p-5">
            <h2 className="font-bold text-white">Daftarkan Webhook Endpoint</h2>
            <form onSubmit={handleCreateWebhook} className="mt-4 grid gap-4 md:grid-cols-4 items-end">
              <label className="block">
                <span className="text-xs font-semibold text-text-secondary">Nama</span>
                <input
                  value={hookForm.name}
                  onChange={(e) => setHookForm({ ...hookForm, name: e.target.value })}
                  placeholder="mis. Partner API"
                  className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-text-secondary">Event *</span>
                <select
                  value={hookForm.event_type}
                  onChange={(e) => setHookForm({ ...hookForm, event_type: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
                >
                  {webhooks.event_types.map((et) => (
                    <option key={et} value={et}>{et}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-text-secondary">Target URL *</span>
                <input
                  type="url"
                  required
                  value={hookForm.target_url}
                  onChange={(e) => setHookForm({ ...hookForm, target_url: e.target.value })}
                  placeholder="https://partner.com/webhook"
                  className="mt-1 w-full rounded-xl border border-bg-border bg-bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
                />
              </label>
              <button disabled={submitting} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">
                {submitting ? "..." : "Daftarkan"}
              </button>
            </form>
          </div>

          {webhooks.subscriptions.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-bg-border bg-bg-surface p-8 text-center text-sm text-text-muted">Belum ada webhook endpoint.</p>
          ) : (
            <div className="mt-6 space-y-3">
              {webhooks.subscriptions.map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-4 rounded-xl border border-bg-border bg-bg-surface p-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-bold text-white">{h.name || h.event_type}</p>
                    <p className="mt-1 text-xs text-text-secondary">
                      <code className="text-primary">{h.event_type}</code> → {h.target_url}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">{h.deliveries_count} pengiriman</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleTestHook(h)} className="inline-flex items-center gap-1 rounded-lg bg-primary/15 text-primary border border-primary/30 px-3 py-1.5 text-xs font-bold hover:bg-primary/25">
                      <Send className="h-3.5 w-3.5" /> Test
                    </button>
                    <button onClick={() => handleDeleteHook(h)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-bg-border bg-bg-surface p-5">
            <h2 className="font-bold text-white">Embed Widget</h2>
            <p className="mt-1 text-xs text-text-secondary">Tempel kode ini di situs Anda — ganti <code className="text-primary">SLUG</code> dengan slug event.</p>
            <div className="mt-3 flex items-center gap-2">
              <pre className="flex-1 overflow-x-auto rounded-xl bg-bg-elevated p-4 text-xs text-text-secondary">{WIDGET_SNIPPET}</pre>
              <button onClick={() => copy(WIDGET_SNIPPET, "Snippet widget")} className="p-2 rounded-lg bg-primary/15 text-primary hover:bg-primary/25">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          {deliveries.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-bg-border bg-bg-surface p-8 text-center text-sm text-text-muted">Belum ada pengiriman webhook.</p>
          ) : (
            <div className="mt-6 rounded-2xl border border-bg-border bg-bg-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-elevated text-left text-xs uppercase text-text-muted">
                    <tr>
                      <th className="px-4 py-3">Event</th>
                      <th className="px-4 py-3">Endpoint</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bg-border">
                    {deliveries.map((d) => {
                      const badge = DELIVERY_BADGE[d.status] || DELIVERY_BADGE.pending;
                      return (
                        <tr key={d.id}>
                          <td className="px-4 py-3 font-mono text-xs text-primary">{d.event_type}</td>
                          <td className="px-4 py-3 text-xs text-text-secondary max-w-56 truncate">{d.subscription?.target_url || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-lg text-xs font-bold px-2 py-0.5 ${badge.cls}`}>{badge.label}</span>
                            {d.response_code ? <span className="ml-2 text-xs text-text-muted">HTTP {d.response_code}</span> : null}
                          </td>
                          <td className="px-4 py-3 text-xs text-text-muted">{formatDateOnly(d.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {createdKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setCreatedKey(null)}>
          <div className="w-full max-w-md rounded-2xl border border-bg-border bg-bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-black text-white">API Key Dibuat</h3>
              <button onClick={() => setCreatedKey(null)} className="p-1 rounded-lg text-text-muted hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-2 text-sm text-warning">Simpan key ini segera. Key hanya ditampilkan sekali dan tidak dapat dilihat lagi.</p>
            <pre className="mt-4 rounded-xl bg-bg-elevated p-4 text-xs text-primary break-all">{createdKey.key}</pre>
            <button
              onClick={() => copy(createdKey.key, "API key")}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
            >
              <Copy className="h-4 w-4" /> Salin Key
            </button>
          </div>
        </div>
      )}

      {createdSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setCreatedSecret(null)}>
          <div className="w-full max-w-md rounded-2xl border border-bg-border bg-bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-black text-white">Signing Secret</h3>
              <button onClick={() => setCreatedSecret(null)} className="p-1 rounded-lg text-text-muted hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-2 text-sm text-text-secondary">Gunakan untuk verifikasi tanda tangan <code className="text-primary">X-TixNova-Signature</code> (HMAC-SHA256 dari body).</p>
            <pre className="mt-4 rounded-xl bg-bg-elevated p-4 text-xs text-primary break-all">{createdSecret.secret}</pre>
            <button
              onClick={() => copy(createdSecret.secret, "Signing secret")}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
            >
              <Copy className="h-4 w-4" /> Salin Secret
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
