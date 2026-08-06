"use client";

import { useCallback, useEffect, useState } from "react";
import {
  QrCode,
  CheckCircle2,
  XCircle,
  User,
  Ticket as TicketIcon,
  Calendar,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CameraQrScanner } from "@/components/tickets/CameraQrScanner";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

interface PromotorEvent {
  id: number;
  title: string;
  status: string;
}

interface ScanResult {
  status: "success" | "error";
  message: string;
  data?: {
    attendee_name?: string;
    attendee_email?: string;
    ticket_name?: string;
    event_title?: string;
    scanned_at?: string;
    qr_used_at?: string;
  };
}

export default function PromotorScanPage() {
  const [qrInput, setQrInput] = useState("");
  const [events, setEvents] = useState<PromotorEvent[]>([]);
  const [eventId, setEventId] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<Array<{ code: string; result: ScanResult }>>([]);

  useEffect(() => {
    api.getClient().get("/promotor/events", { params: { per_page: 100, status: "approved" } })
      .then((res) => {
        const data = res.data.data;
        const availableEvents = Array.isArray(data) ? data : data.data || [];
        setEvents(availableEvents);
        if (availableEvents.length === 1) setEventId(String(availableEvents[0].id));
      })
      .catch(() => {
        setEvents([]);
        toast.error("Gagal memuat event untuk check-in.");
      })
      .finally(() => setLoadingEvents(false));
  }, []);

  const submitScan = useCallback(async (code: string) => {
    const codeToScan = code.trim();
    if (!codeToScan || !eventId || scanning) return;

    setScanning(true);
    setLastResult(null);

    try {
      const res = await api.getClient().post(`/promotor/events/${eventId}/scan`, { qr_code: codeToScan });
      const resultData: ScanResult = {
        status: "success",
        message: res.data.message || "CHECK-IN BERHASIL!",
        data: res.data.data,
      };
      setLastResult(resultData);
      setHistory((prev) => [{ code: codeToScan, result: resultData }, ...prev.slice(0, 9)]);
      toast.success("Check-in berhasil.");
      setQrInput("");
    } catch (err: unknown) {
      const errRes = (err as { response?: { data?: { message?: string; data?: ScanResult["data"] } } })?.response;
      const resultData: ScanResult = {
        status: "error",
        message: errRes?.data?.message || "Check-in gagal. Tiket tidak valid.",
        data: errRes?.data?.data,
      };
      setLastResult(resultData);
      setHistory((prev) => [{ code: codeToScan, result: resultData }, ...prev.slice(0, 9)]);
      toast.error(resultData.message);
    } finally {
      setScanning(false);
    }
  }, [eventId, scanning]);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitScan(qrInput);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Venue Gate Check-in App</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Scan QR Tiket Pengunjung</h1>
        <p className="text-text-secondary text-sm mt-1">
          Pindai atau masukkan kode QR E-Tiket untuk verifikasi kehadiran di lokasi event.
        </p>
      </div>

      {/* Main Scanner Box */}
      <div className="bg-bg-surface p-6 sm:p-8 rounded-3xl border border-bg-border shadow-2xl space-y-6">
        <form onSubmit={handleScanSubmit} className="space-y-4">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Event Check-in
          </label>
          <select
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
            disabled={loadingEvents}
            className="w-full rounded-xl border border-bg-border bg-bg-elevated px-4 py-3 text-sm text-white focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">{loadingEvents ? "Memuat event..." : "Pilih event"}</option>
            {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
          </select>
          <CameraQrScanner disabled={!eventId || scanning} onScan={submitScan} />
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Masukkan Kode QR Tiket
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
              <Input
                type="text"
                placeholder="Contoh: QR-X7K9P2M4W8L3"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                autoFocus
                className="pl-14 bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary text-lg font-mono py-4"
              />
            </div>
            <Button
              type="submit"
              disabled={scanning || !qrInput.trim() || !eventId}
              className="bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/30 px-8 font-bold rounded-xl text-base"
            >
              {scanning ? "Verifikasi..." : "Check-in"}
            </Button>
          </div>
        </form>

        {/* Scan Result Display Banner */}
        {lastResult && (
          <div className={`p-8 rounded-2xl border text-center space-y-4 animate-fade-in ${
            lastResult.status === "success"
              ? "bg-success/15 border-success/40 text-white"
              : "bg-danger/15 border-danger/40 text-white"
          }`}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto border shadow-lg">
              {lastResult.status === "success" ? (
                <div className="w-16 h-16 rounded-full bg-success/20 text-success border border-success/40 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-danger/20 text-danger border border-danger/40 flex items-center justify-center">
                  <XCircle className="w-10 h-10" />
                </div>
              )}
            </div>

            <h3 className="text-2xl font-black">{lastResult.message}</h3>

            {lastResult.data && (
              <div className="bg-bg-base/60 backdrop-blur-md p-4 rounded-xl border border-white/10 max-w-md mx-auto text-left text-sm space-y-2">
                {lastResult.data.attendee_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary shrink-0" />
                    <span><strong className="text-white">Pengunjung:</strong> {lastResult.data.attendee_name}</span>
                  </div>
                )}
                {lastResult.data.ticket_name && (
                  <div className="flex items-center gap-2">
                    <TicketIcon className="w-4 h-4 text-accent shrink-0" />
                    <span><strong className="text-white">Tier Tiket:</strong> {lastResult.data.ticket_name}</span>
                  </div>
                )}
                {lastResult.data.event_title && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-info shrink-0" />
                    <span><strong className="text-white">Event:</strong> {lastResult.data.event_title}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Scan Logs */}
      <div className="bg-bg-surface p-6 rounded-2xl border border-bg-border space-y-4">
        <h3 className="text-lg font-bold text-white border-b border-bg-border pb-3">Riwayat Scan Terbaru (Sesi Ini)</h3>
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((h, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-bg-elevated/50 border border-bg-border flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${h.result.status === "success" ? "bg-success" : "bg-danger"}`} />
                  <code className="font-mono font-bold text-white text-xs">{h.code}</code>
                  <span className="text-xs text-text-secondary line-clamp-1">{h.result.message}</span>
                </div>
                <span className="text-xs text-text-muted">{h.result.data?.scanned_at || "baru saja"}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-text-secondary text-sm">
            Belum ada tiket yang discan dalam sesi ini.
          </div>
        )}
      </div>
    </div>
  );
}
