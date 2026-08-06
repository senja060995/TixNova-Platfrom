"use client";

import { useEffect, useState } from "react";
import { Smartphone, Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaSetup() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    const onAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);

    const detectEnv = () => {
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream);
      setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    };

    const timer = window.setTimeout(detectEnv, 0);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }
    setInstalling(true);
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
    setInstalling(false);
  };

  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2">
      <div className="rounded-2xl border border-primary/30 bg-bg-surface p-4 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-xl bg-primary/15 p-2.5 text-primary">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">Pasang Aplikasi TixNova</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              {isIOS
                ? "Ketuk ikon Bagikan lalu pilih \"Tambah ke Layar Utama\" untuk membuka TixNova seperti aplikasi."
                : "Instal di perangkatmu untuk akses cepat ke dompet tiket & QR check-in."}
            </p>
          </div>
          <button
            onClick={() => setShowPrompt(false)}
            className="shrink-0 text-text-muted hover:text-white p-1"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {!isIOS && (
          <button
            onClick={handleInstall}
            disabled={installing}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-4 py-2.5 text-sm font-bold text-white transition-colors hover:brightness-110 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {installing ? "Memasang..." : "Instal Aplikasi"}
          </button>
        )}
      </div>
    </div>
  );
}
