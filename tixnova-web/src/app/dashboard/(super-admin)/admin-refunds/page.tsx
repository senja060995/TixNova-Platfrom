"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Landmark } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface Refund { id: number; status: string; amount: number; bank_name?: string; bank_account_name?: string; bank_account_number?: string; order: { order_code: string; event: { title: string } }; requester: { name: string } }

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const requested = useRef(false);
  const load = useCallback(() => api.getClient().get("/super-admin/refunds").then((response) => setRefunds(response.data.data.data || [])).catch(() => toast.error("Gagal memuat refund.")), []);

  useEffect(() => { if (requested.current) return; requested.current = true; const frame = requestAnimationFrame(load); return () => cancelAnimationFrame(frame); }, [load]);

  const process = async (refund: Refund) => { try { await api.getClient().post(`/super-admin/refunds/${refund.id}/process`); toast.success("Refund diproses."); load(); } catch { toast.error("Refund tidak dapat diproses."); } };
  const confirmManual = async (refund: Refund) => { try { await api.getClient().post(`/super-admin/refunds/${refund.id}/confirm-manual`); toast.success("Refund manual dikonfirmasi."); load(); } catch { toast.error("Konfirmasi gagal."); } };

  return <div className="mx-auto max-w-5xl space-y-8"><div><h1 className="text-3xl font-extrabold text-white">Eksekusi Refund</h1><p className="mt-1 text-sm text-text-secondary">Proses refund yang telah disetujui promotor.</p></div><section className="rounded-2xl border border-bg-border bg-bg-surface p-6"><div className="space-y-3">{refunds.length ? refunds.map((refund) => <div key={refund.id} className="rounded-xl bg-bg-elevated p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="flex-1"><p className="font-bold text-white">{refund.order.event.title}</p><p className="text-xs text-text-muted">{refund.order.order_code} · {refund.requester.name}</p>{refund.status === "manual_required" && <p className="mt-2 text-xs text-text-secondary"><Landmark className="mr-1 inline h-3.5 w-3.5" />{refund.bank_name} · {refund.bank_account_name} · {refund.bank_account_number}</p>}</div><div className="text-right"><p className="font-bold text-white">{formatCurrency(refund.amount)}</p><p className="text-xs text-primary">{refund.status}</p></div></div>{refund.status === "approved" && <Button onClick={() => process(refund)} className="mt-4"><CheckCircle2 className="mr-2 h-4 w-4" />Proses Refund</Button>}{refund.status === "manual_required" && <Button onClick={() => confirmManual(refund)} className="mt-4 bg-success hover:bg-emerald-700"><CheckCircle2 className="mr-2 h-4 w-4" />Konfirmasi Transfer</Button>}</div>) : <p className="py-8 text-center text-sm text-text-muted">Tidak ada refund untuk diproses.</p>}</div></section></div>;
}
