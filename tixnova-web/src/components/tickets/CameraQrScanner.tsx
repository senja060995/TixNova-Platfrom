"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CameraQrScannerProps {
  disabled?: boolean;
  onScan: (value: string) => void;
}

export function CameraQrScanner({ disabled = false, onScan }: CameraQrScannerProps) {
  const scannerElement = useRef<HTMLDivElement | null>(null);
  const scanner = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const scanned = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const start = async () => {
      try {
        const element = scannerElement.current;
        if (!element) return;

        const { Html5Qrcode } = await import("html5-qrcode");
        const instance = new Html5Qrcode(element.id, { verbose: false });
        scanner.current = instance;
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            if (scanned.current) return;
            scanned.current = true;
            onScan(decodedText);
            setIsOpen(false);
          },
          () => {}
        );
      } catch {
        if (!cancelled) setError("Kamera tidak dapat diakses. Periksa izin kamera atau gunakan input manual.");
      }
    };

    start();

    return () => {
      cancelled = true;
      const instance = scanner.current;
      scanner.current = null;
      if (instance) {
        instance.stop().catch(() => {}).finally(() => instance.clear());
      }
    };
  }, [isOpen, onScan]);

  const openScanner = () => {
    scanned.current = false;
    setError(null);
    setIsOpen(true);
  };

  if (!isOpen) {
    return (
      <Button type="button" variant="outline" onClick={openScanner} disabled={disabled} className="border-bg-border px-4">
        <Camera className="mr-2 h-4 w-4" /> Kamera
      </Button>
    );
  }

  return (
    <div className="rounded-2xl border border-bg-border bg-bg-elevated p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Arahkan kamera ke QR tiket</p>
        <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)} className="border-bg-border px-3">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div ref={scannerElement} id="ticket-camera-scanner" className="overflow-hidden rounded-xl bg-black" />
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
