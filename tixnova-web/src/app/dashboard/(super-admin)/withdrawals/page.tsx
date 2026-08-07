"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Landmark, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface Withdrawal {
  id: number;
  code: string;
  amount: number;
  status: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  note?: string;
  review_note?: string;
  requested_at: string;
  tenant: { name: string; slug: string };
  requester: { name: string };
}

const statusMeta: Record<string, { label: string; className: string }> = {
  pending: { label: "Menunggu", className: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  approved: { label: "Disetujui", className: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  processing: { label: "Diproses", className: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  completed: { label: "Selesai", className: "bg-success/10 text-success border-success/30" },
  rejected: { label: "Ditolak", className: "bg-danger/10 text-danger border-danger/30" },
  failed: { label: "Gagal", className: "bg-danger/10 text-danger border-danger/30" },
  cancelled: { label: "Dibatalkan", className: "bg-bg-border/40 text-text-muted border-bg-border" },
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const requested = useRef(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getClient()
      .get("/super-admin/withdrawals", { params: { per_page: 50, ...(statusFilter ? { status: statusFilter } : {}) } })
      .then((response) => setWithdrawals(response.data.data.data || []))
      .catch(() => toast.error("Gagal memuat penarikan dana."))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    const frame = requestAnimationFrame(load);
    return () => cancelAnimationFrame(frame);
  }, [load]);

  const act = async (withdrawal: Withdrawal, action: "approve" | "reject" | "complete" | "fail", body?: Record<string, unknown>) => {
    setActing(withdrawal.id);
    try {
      await api.getClient().post(`/super-admin/withdrawals/${withdrawal.id}/${action}`, body || {});
      toast.success(
        action === "approve" ? "Penarikan disetujui." :
        action === "reject" ? "Penarikan ditolak." :
        action === "complete" ? "Penarikan ditandai selesai." :
        "Penarikan ditandai gagal."
      );
      load();
    } catch {
      toast.error("Aksi gagal dilakukan.");
    } finally {
      setActing(null);
    }
  };

  const reject = async (withdrawal: Withdrawal) => {
    const note = window.prompt("Alasan penolakan (opsional):", "");
    if (note === null) return;
    await act(withdrawal, "reject", note ? { note } : {});
  };

  const fail = async (withdrawal: Withdrawal) => {
    const note = window.prompt("Alasan kegagalan transfer (opsional):", "");
    if (note === null) return;
    await act(withdrawal, "fail", note ? { note } : {});
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Withdrawal Promotor</h1>
          <p className="mt-1 text-sm text-text-secondary">Tinjau dan proses penarikan dana promotor.</p>
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-bg-border bg-bg-surface px-3 py-2.5 text-sm text-text-secondary"
        >
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="approved">Disetujui</option>
          <option value="completed">Selesai</option>
          <option value="rejected">Ditolak</option>
          <option value="failed">Gagal</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      <section className="rounded-2xl border border-bg-border bg-bg-surface p-6">
        {loading ? (
          <div className="h-48 animate-pulse rounded-xl bg-bg-elevated" />
        ) : (
          <div className="space-y-3">
            {withdrawals.length ? (
              withdrawals.map((withdrawal) => {
                const meta = statusMeta[withdrawal.status] || { label: withdrawal.status, className: "bg-bg-border/40 text-text-muted border-bg-border" };
                const busy = acting === withdrawal.id;
                return (
                  <div key={withdrawal.id} className="rounded-xl bg-bg-elevated p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white">{withdrawal.tenant.name}</p>
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${meta.className}`}>{meta.label}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {withdrawal.code} · diajukan oleh {withdrawal.requester.name}
                        </p>
                        <p className="mt-2 text-xs text-text-secondary">
                          <Landmark className="mr-1 inline h-3.5 w-3.5" />
                          {withdrawal.bank_name} · {withdrawal.bank_account_name} · {withdrawal.bank_account_number}
                        </p>
                        {withdrawal.note && <p className="mt-2 text-xs text-text-secondary">Catatan: {withdrawal.note}</p>}
                        {withdrawal.review_note && <p className="mt-1 text-xs text-text-muted">Alasan: {withdrawal.review_note}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{formatCurrency(withdrawal.amount)}</p>
                        <p className="text-xs text-text-muted">{formatDate(withdrawal.requested_at)}</p>
                      </div>
                    </div>

                    {withdrawal.status === "pending" && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button onClick={() => act(withdrawal, "approve")} disabled={busy} className="bg-success hover:bg-emerald-700">
                          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                          Setujui
                        </Button>
                        <Button onClick={() => reject(withdrawal)} disabled={busy} variant="outline" className="border-danger text-danger">
                          <XCircle className="mr-2 h-4 w-4" />Tolak
                        </Button>
                      </div>
                    )}

                    {withdrawal.status === "approved" && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button onClick={() => act(withdrawal, "complete")} disabled={busy} className="bg-success hover:bg-emerald-700">
                          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                          Konfirmasi Transfer Selesai
                        </Button>
                        <Button onClick={() => fail(withdrawal)} disabled={busy} variant="outline" className="border-danger text-danger">
                          <XCircle className="mr-2 h-4 w-4" />Tandai Gagal
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-sm text-text-muted">Tidak ada penarikan dana.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
