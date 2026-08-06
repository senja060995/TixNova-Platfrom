"use client";

/**
 * TixNova Premium Toast System
 *
 * Usage:
 *   import { toast } from '@/components/ui/Toast';
 *   toast.success("Berhasil disimpan!");
 *   toast.error("Gagal menghapus!");
 *   toast.info("Memuat data...");
 *   toast.warning("Perhatian!");
 *   toast.promise(myPromise, { loading: "...", success: "OK!", error: "Gagal!" });
 *
 * For delete confirmations:
 *   import { ConfirmDialog } from '@/components/ui/Toast';
 */


import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  Loader2,
  Trash2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "warning" | "info" | "loading";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // ms, 0 = persistent
  onClose?: () => void;
}

// ─── Event Bus ────────────────────────────────────────────────────────────────

type ToastListener = (toast: ToastItem) => void;
type DismissListener = (id: string) => void;

const listeners: ToastListener[] = [];
const dismissListeners: DismissListener[] = [];

function emitToast(toast: ToastItem) {
  listeners.forEach((l) => l(toast));
}

function emitDismiss(id: string) {
  dismissListeners.forEach((l) => l(id));
}

// ─── Toast API ────────────────────────────────────────────────────────────────

let counter = 0;
function genId() {
  return `tn-toast-${++counter}-${Date.now()}`;
}

function show(
  type: ToastType,
  message: string,
  options?: { title?: string; duration?: number }
): string {
  const id = genId();
  emitToast({
    id,
    type,
    message,
    title: options?.title,
    duration: options?.duration ?? (type === "loading" ? 0 : 4500),
  });
  return id;
}

export const toast = {
  success: (message: string, options?: { title?: string; duration?: number }) =>
    show("success", message, options),
  error: (message: string, options?: { title?: string; duration?: number }) =>
    show("error", message, options),
  warning: (message: string, options?: { title?: string; duration?: number }) =>
    show("warning", message, options),
  info: (message: string, options?: { title?: string; duration?: number }) =>
    show("info", message, options),
  loading: (message: string, options?: { title?: string }) =>
    show("loading", message, { ...options, duration: 0 }),
  dismiss: (id: string) => emitDismiss(id),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  promise: null as any,
};

// Separate async promise helper (avoids generic in object literal TS parse issue)
async function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: unknown) => string);
  }
): Promise<T> {
  const id = show("loading", messages.loading, { duration: 0 });
  try {
    const result = await promise;
    emitDismiss(id);
    const successMsg =
      typeof messages.success === "function" ? messages.success(result) : messages.success;
    show("success", successMsg);
    return result;
  } catch (err) {
    emitDismiss(id);
    const errorMsg =
      typeof messages.error === "function" ? messages.error(err) : messages.error;
    show("error", errorMsg);
    throw err;
  }
}

toast.promise = toastPromise as typeof toastPromise;


// ─── Single Toast Card ────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<
  ToastType,
  { icon: React.ElementType; iconClass: string; barClass: string; borderClass: string; bgClass: string; titleDefault: string }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-400",
    barClass: "bg-emerald-500",
    borderClass: "border-emerald-500/30",
    bgClass: "bg-[#0f2a1f]/90",
    titleDefault: "Berhasil!",
  },
  error: {
    icon: XCircle,
    iconClass: "text-red-400",
    barClass: "bg-red-500",
    borderClass: "border-red-500/30",
    bgClass: "bg-[#2a0f0f]/90",
    titleDefault: "Terjadi Kesalahan",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-400",
    barClass: "bg-amber-500",
    borderClass: "border-amber-500/30",
    bgClass: "bg-[#2a1f0f]/90",
    titleDefault: "Perhatian",
  },
  info: {
    icon: Info,
    iconClass: "text-blue-400",
    barClass: "bg-blue-500",
    borderClass: "border-blue-500/30",
    bgClass: "bg-[#0f1a2a]/90",
    titleDefault: "Informasi",
  },
  loading: {
    icon: Loader2,
    iconClass: "text-violet-400 animate-spin",
    barClass: "bg-violet-500",
    borderClass: "border-violet-500/30",
    bgClass: "bg-[#1a0f2a]/90",
    titleDefault: "Memproses...",
  },
};

function ToastCard({ toast: t, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const cfg = TOAST_CONFIG[t.type];
  const Icon = cfg.icon;

  // Slide-in animation
  useEffect(() => {
    const timer = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  // Auto-dismiss with progress bar
  useEffect(() => {
    if (!t.duration || t.duration === 0) return;

    const start = Date.now();
    const end = start + t.duration;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, end - now);
      setProgress((remaining / t.duration!) * 100);
      if (remaining <= 0) {
        clearInterval(interval);
        handleClose();
      }
    }, 30);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.duration]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      onRemove(t.id);
      t.onClose?.();
    }, 300);
  }, [t, onRemove]);

  return (
    <div
      className={`
        relative flex flex-col items-center text-center w-full max-w-xs
        backdrop-blur-md ${cfg.bgClass} border ${cfg.borderClass}
        rounded-3xl shadow-2xl px-6 pt-6 pb-5 overflow-hidden
        transition-all duration-300 ease-out
        ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-4"}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Close button top-right */}
      {t.type !== "loading" && (
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Tutup"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Center Icon */}
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${cfg.bgClass} border ${cfg.borderClass} shadow-lg`}>
        <Icon className={`w-8 h-8 ${cfg.iconClass}`} />
      </div>

      {/* Title */}
      <p className="text-base font-extrabold text-white leading-tight">
        {t.title || cfg.titleDefault}
      </p>

      {/* Message */}
      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-[200px]">
        {t.message}
      </p>

      {/* Progress bar */}
      {t.duration && t.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-3xl overflow-hidden">
          <div
            className={`h-full ${cfg.barClass} transition-all duration-75 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Toast Container (Portal) ─────────────────────────────────────────────────

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const addToast = (t: ToastItem) => {
      setToasts((prev) => {
        // Replace existing loading toast with same id
        const exists = prev.find((p) => p.id === t.id);
        if (exists) return prev.map((p) => (p.id === t.id ? t : p));
        return [...prev, t];
      });
    };

    const removeToast = (id: string) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    listeners.push(addToast);
    dismissListeners.push(removeToast);

    return () => {
      const li = listeners.indexOf(addToast);
      if (li > -1) listeners.splice(li, 1);
      const di = dismissListeners.indexOf(removeToast);
      if (di > -1) dismissListeners.splice(di, 1);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-label="Notifications"
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center gap-4 pointer-events-none"
    >
      {/* Subtle backdrop only when toast is visible */}
      {toasts.length > 0 && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      )}

      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto relative z-10">
          <ToastCard
            toast={t}
            onRemove={(id) => setToasts((prev) => prev.filter((x) => x.id !== id))}
          />
        </div>
      ))}
    </div>,
    document.body
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = "Konfirmasi",
  message,
  confirmLabel = "Ya, Hapus",
  cancelLabel = "Batal",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!mounted || !open) return null;

  const variantConfig = {
    danger: {
      icon: Trash2,
      iconBg: "bg-red-500/15",
      iconColor: "text-red-400",
      btnClass: "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30",
    },
    warning: {
      icon: AlertTriangle,
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-400",
      btnClass: "bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-500/30",
    },
    info: {
      icon: Info,
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-400",
      btnClass: "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30",
    },
  };

  const cfg = variantConfig[variant];
  const Icon = cfg.icon;

  return createPortal(
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog Card */}
      <div className="relative z-10 w-full max-w-sm bg-[#1A1A2E] border border-[#2D2D4E] rounded-3xl shadow-2xl overflow-hidden animate-[fadeInScale_0.2s_ease-out]">
        
        {/* Top accent line */}
        <div className={`h-1 w-full ${variant === "danger" ? "bg-gradient-to-r from-red-600 to-red-400" : variant === "warning" ? "bg-gradient-to-r from-amber-600 to-amber-400" : "bg-gradient-to-r from-blue-600 to-blue-400"}`} />

        <div className="p-6 text-center">
          {/* Icon */}
          <div className={`w-16 h-16 ${cfg.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-8 h-8 ${cfg.iconColor}`} />
          </div>

          {/* Title */}
          <h2
            id="confirm-dialog-title"
            className="text-lg font-extrabold text-white mb-2"
          >
            {title}
          </h2>

          {/* Message */}
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-slate-300 bg-[#252540] hover:bg-[#2D2D4E] border border-[#2D2D4E] hover:border-slate-500 transition-all"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white ${cfg.btnClass} transition-all`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
