"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CircleDollarSign, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface Order {
  order_code: string;
  total: number;
  subtotal: number;
  discount: number;
  status: string;
  event: { title: string; start_date: string };
}

interface Refund {
  id: number;
  status: string;
  amount: number;
  reason: string;
  requested_at: string;
  order: Order;
}

const statusLabel: Record<string, string> = {
  requested: "Menunggu review promotor",
  approved: "Disetujui",
  rejected: "Ditolak",
  processing: "Diproses Midtrans",
  manual_required: "Menunggu transfer manual",
  refunded: "Refund selesai",
  failed: "Refund gagal",
};

export default function RefundsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const requested = useRef(false);

  const load = useCallback(() => {
    Promise.all([api.getClient().get("/user/orders"), api.getClient().get("/user/refunds")])
      .then(([ordersResponse, refundsResponse]) => {
        setOrders(ordersResponse.data.data.data || []);
        setRefunds(refundsResponse.data.data.data || []);
      })
      .catch(() => toast.error("Gagal memuat data refund."));
  }, []);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    const frame = requestAnimationFrame(load);
    return () => cancelAnimationFrame(frame);
  }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      await api.getClient().post(`/user/orders/${selectedOrder.order_code}/refunds`, {
        reason,
        bank_name: bankName,
        bank_account_name: accountName,
        bank_account_number: accountNumber,
      });
      toast.success("Permintaan refund berhasil dikirim.");
      setSelectedOrder(null);
      setReason("");
      setBankName("");
      setAccountName("");
      setAccountNumber("");
      load();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data?.message || "Refund tidak dapat diajukan.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const requestedOrders = new Set(refunds.map((refund) => refund.order.order_code));
  const eligibleOrders = orders.filter((order) => order.status === "paid" && !requestedOrders.has(order.order_code));

  return <div className="mx-auto max-w-5xl space-y-8">
    <div><h1 className="text-3xl font-extrabold text-white">Refund Saya</h1><p className="mt-1 text-sm text-text-secondary">Refund penuh dapat diajukan sampai 7 hari sebelum event. Biaya admin tidak dapat dikembalikan.</p></div>
    <section className="rounded-2xl border border-bg-border bg-bg-surface p-6"><h2 className="border-b border-bg-border pb-4 font-bold text-white">Order yang Dapat Diajukan</h2><div className="mt-4 space-y-3">{eligibleOrders.length ? eligibleOrders.map((order) => <div key={order.order_code} className="flex flex-col gap-4 rounded-xl bg-bg-elevated p-4 sm:flex-row sm:items-center"><div className="flex-1"><p className="font-bold text-white">{order.event.title}</p><p className="text-xs text-text-muted">{order.order_code} · {new Date(order.event.start_date).toLocaleDateString("id-ID")}</p></div><div className="text-sm text-text-secondary">Estimasi refund <strong className="text-white">{formatCurrency(Math.max(0, order.subtotal - order.discount))}</strong></div><Button onClick={() => setSelectedOrder(order)}><FileText className="mr-2 h-4 w-4" />Ajukan</Button></div>) : <p className="py-6 text-center text-sm text-text-muted">Tidak ada order yang dapat diajukan refund.</p>}</div></section>
    <section className="rounded-2xl border border-bg-border bg-bg-surface p-6"><h2 className="border-b border-bg-border pb-4 font-bold text-white">Status Refund</h2><div className="mt-4 space-y-3">{refunds.length ? refunds.map((refund) => <div key={refund.id} className="flex items-center gap-4 rounded-xl bg-bg-elevated p-4"><CircleDollarSign className="h-5 w-5 text-primary" /><div className="flex-1"><p className="font-bold text-white">{refund.order.event.title}</p><p className="text-xs text-text-muted">{refund.order.order_code}</p></div><div className="text-right"><p className="font-bold text-white">{formatCurrency(refund.amount)}</p><p className="text-xs text-primary">{statusLabel[refund.status] || refund.status}</p></div></div>) : <p className="py-6 text-center text-sm text-text-muted">Belum ada permintaan refund.</p>}</div></section>
    {selectedOrder && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"><form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-3xl border border-bg-border bg-bg-surface p-6"><div><h2 className="text-xl font-bold text-white">Ajukan Refund</h2><p className="mt-1 text-sm text-text-secondary">{selectedOrder.event.title}</p></div><p className="rounded-xl bg-bg-elevated p-3 text-sm text-text-secondary">Estimasi refund: <strong className="text-white">{formatCurrency(Math.max(0, selectedOrder.subtotal - selectedOrder.discount))}</strong></p><textarea required minLength={10} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Alasan refund" className="min-h-28 w-full rounded-xl border border-bg-border bg-bg-elevated p-3 text-sm text-white" /><Input required value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="Nama bank" className="bg-bg-elevated border-bg-border text-white" /><Input required value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder="Nama pemilik rekening" className="bg-bg-elevated border-bg-border text-white" /><Input required value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} placeholder="Nomor rekening" className="bg-bg-elevated border-bg-border text-white" /><div className="flex gap-3"><Button type="button" variant="outline" onClick={() => setSelectedOrder(null)} className="flex-1 border-bg-border">Batal</Button><Button type="submit" disabled={submitting} className="flex-1"><Send className="mr-2 h-4 w-4" />{submitting ? "Mengirim..." : "Kirim"}</Button></div></form></div>}
  </div>;
}
