"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface Refund { id: number; status: string; amount: number; reason: string; order: { order_code: string; event: { title: string } }; requester: { name: string } }

export default function PromotorRefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const requested = useRef(false);
  const load = useCallback(() => api.getClient().get("/promotor/refunds").then((response) => setRefunds(response.data.data.data || [])).catch(() => toast.error("Gagal memuat refund.")).finally(() => setLoading(false)), []);

  useEffect(() => { if (requested.current) return; requested.current = true; const frame = requestAnimationFrame(load); return () => cancelAnimationFrame(frame); }, [load]);

  const review = async (refund: Refund, approved: boolean) => {
    try { await api.getClient().post(`/promotor/refunds/${refund.id}/review`, { approved }); toast.success(approved ? "Refund disetujui." : "Refund ditolak."); load(); } catch { toast.error("Refund tidak dapat diperbarui."); }
  };

  return <div className="mx-auto max-w-5xl space-y-8"><div><h1 className="text-3xl font-extrabold text-white">Review Refund</h1><p className="mt-1 text-sm text-text-secondary">Setujui atau tolak permintaan refund event Anda.</p></div><section className="rounded-2xl border border-bg-border bg-bg-surface p-6">{loading ? <div className="h-48 animate-pulse rounded-xl bg-bg-elevated" /> : <div className="space-y-3">{refunds.length ? refunds.map((refund) => <div key={refund.id} className="rounded-xl bg-bg-elevated p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="flex-1"><p className="font-bold text-white">{refund.order.event.title}</p><p className="text-xs text-text-muted">{refund.order.order_code} · {refund.requester.name}</p><p className="mt-2 text-sm text-text-secondary">{refund.reason}</p></div><div className="text-right"><p className="font-bold text-white">{formatCurrency(refund.amount)}</p><p className="text-xs text-primary">{refund.status}</p></div></div>{refund.status === "requested" && <div className="mt-4 flex gap-2"><Button onClick={() => review(refund, true)} className="bg-success hover:bg-emerald-700"><CheckCircle2 className="mr-2 h-4 w-4" />Setujui</Button><Button onClick={() => review(refund, false)} variant="outline" className="border-danger text-danger"><XCircle className="mr-2 h-4 w-4" />Tolak</Button></div>}</div>) : <p className="py-8 text-center text-sm text-text-muted">Belum ada permintaan refund.</p>}</div>}</section></div>;
}
