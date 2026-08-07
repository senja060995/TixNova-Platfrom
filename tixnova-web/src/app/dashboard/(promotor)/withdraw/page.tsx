"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Landmark, Loader2, Wallet, XCircle, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface BalanceData {
  net_balance: number;
  available_balance: number;
  reserved: number;
  withdrawn: number;
}

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
  reviewed_at?: string;
  completed_at?: string;
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

export default function PromotorWithdrawPage() {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [note, setNote] = useState("");
  const requested = useRef(false);

  const load = useCallback(() => {
    Promise.all([
      api.getClient().get("/promotor/withdraw/balance"),
      api.getClient().get("/promotor/withdraw/requests", { params: { per_page: 50 } }),
    ])
      .then(([balanceRes, listRes]) => {
        setBalance(balanceRes.data.data);
        setWithdrawals(listRes.data.data.data || []);
      })
      .catch(() => toast.error("Gagal memuat data saldo."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    const frame = requestAnimationFrame(load);
    return () => cancelAnimationFrame(frame);
  }, [load]);

  const submit = async () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 10000) {
      toast.error("Jumlah penarikan minimal Rp10.000.");
      return;
    }
    if (balance && numericAmount > balance.available_balance) {
      toast.error("Saldo tidak mencukupi.");
      return;
    }
    if (!bankName || !accountName || !accountNumber) {
      toast.error("Lengkapi data rekening tujuan.");
      return;
    }

    setSubmitting(true);
    try {
      await api.getClient().post("/promotor/withdraw/requests", {
        amount: numericAmount,
        bank_name: bankName,
        bank_account_name: accountName,
        bank_account_number: accountNumber,
        note: note || undefined,
      });
      toast.success("Permintaan penarikan dana telah diajukan.");
      setAmount("");
      setNote("");
      load();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data?.errors?.amount?.[0] ||
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Penarikan gagal diajukan.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (withdrawal: Withdrawal) => {
    try {
      await api.getClient().post(`/promotor/withdraw/requests/${withdrawal.id}/cancel`);
      toast.success("Permintaan penarikan dibatalkan.");
      load();
    } catch {
      toast.error("Penarikan tidak dapat dibatalkan.");
    }
  };

  const cards = [
    { label: "Saldo Tersedia", value: formatCurrency(balance?.available_balance || 0), icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
    { label: "Sedang Diproses", value: formatCurrency(balance?.reserved || 0), icon: Clock, color: "text-info", bg: "bg-info/10" },
    { label: "Total Dicairkan", value: formatCurrency(balance?.withdrawn || 0), icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "Saldo Kotor", value: formatCurrency(balance?.net_balance || 0), icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" },
  ];

  const inputClass =
    "w-full rounded-xl border border-bg-border bg-bg-base px-3.5 py-2.5 text-sm text-white placeholder:text-text-muted focus:border-primary focus:outline-none";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Saldo & Tarik Dana</h1>
        <p className="mt-1 text-sm text-text-secondary">Cairkan penghasilan event Anda langsung ke rekening bank.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 animate-pulse">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-32 rounded-2xl border border-bg-border bg-bg-surface" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="space-y-2 rounded-2xl border border-bg-border bg-bg-surface p-6">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-xs text-text-muted">{card.label}</p>
              <p className="text-2xl font-black text-white">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-2 rounded-2xl border border-bg-border bg-bg-surface p-6">
          <h2 className="flex items-center gap-2 border-b border-bg-border pb-4 font-bold text-white">
            <Landmark className="h-5 w-5 text-primary" />
            Ajukan Penarikan
          </h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted">Jumlah (Rp)</label>
              <input
                type="number"
                min={10000}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Min. 10.000"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-text-muted">
                Saldo tersedia: <span className="font-bold text-white">{formatCurrency(balance?.available_balance || 0)}</span>
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted">Bank Tujuan</label>
              <input
                type="text"
                value={bankName}
                onChange={(event) => setBankName(event.target.value)}
                placeholder="contoh: BCA, Mandiri, BNI"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted">Nama Pemilik Rekening</label>
              <input
                type="text"
                value={accountName}
                onChange={(event) => setAccountName(event.target.value)}
                placeholder="sesuai nama di buku tabungan"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted">Nomor Rekening</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value)}
                placeholder="nomor rekening tujuan"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted">Catatan (opsional)</label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Catatan untuk admin"
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            <Button onClick={submit} disabled={submitting} fullWidth className="mt-2">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajukan Penarikan Dana
            </Button>
          </div>
        </section>

        <section className="lg:col-span-3 rounded-2xl border border-bg-border bg-bg-surface p-6">
          <h2 className="border-b border-bg-border pb-4 font-bold text-white">Riwayat Penarikan</h2>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-bg-border text-left text-xs uppercase text-text-muted">
                <tr>
                  <th className="p-3">Kode</th>
                  <th className="p-3 text-right">Jumlah</th>
                  <th className="p-3">Rekening</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((withdrawal) => {
                  const meta = statusMeta[withdrawal.status] || { label: withdrawal.status, className: "bg-bg-border/40 text-text-muted border-bg-border" };
                  return (
                    <tr key={withdrawal.id} className="border-b border-bg-border/50 text-text-secondary">
                      <td className="p-3 font-mono text-xs text-white">{withdrawal.code}</td>
                      <td className="p-3 text-right font-bold text-white">{formatCurrency(withdrawal.amount)}</td>
                      <td className="p-3">
                        <p className="text-xs text-white">{withdrawal.bank_account_name}</p>
                        <p className="text-xs text-text-muted">{withdrawal.bank_name} · {withdrawal.bank_account_number}</p>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${meta.className}`}>{meta.label}</span>
                        {withdrawal.review_note && (
                          <p className="mt-1 max-w-[180px] truncate text-[11px] text-text-muted" title={withdrawal.review_note}>{withdrawal.review_note}</p>
                        )}
                      </td>
                      <td className="p-3 text-xs">{formatDate(withdrawal.requested_at)}</td>
                      <td className="p-3 text-right">
                        {withdrawal.status === "pending" && (
                          <Button variant="ghost" size="sm" onClick={() => cancel(withdrawal)} className="text-danger hover:bg-danger/10">
                            <XCircle className="mr-1 h-4 w-4" />Batal
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!withdrawals.length && (
              <p className="py-8 text-center text-sm text-text-muted">Belum ada riwayat penarikan dana.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
