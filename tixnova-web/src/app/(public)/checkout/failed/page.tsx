"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

function CheckoutFailedContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("order");

  return (
    <main className="min-h-screen bg-bg-base flex items-center justify-center p-4 text-center">
      <section className="max-w-md rounded-2xl border border-bg-border bg-bg-surface p-8">
        <XCircle className="mx-auto mb-4 h-12 w-12 text-danger" />
        <h1 className="text-xl font-bold text-white">Pembayaran Tidak Selesai</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Kamu keluar dari halaman pembayaran sebelum menyelesaikannya. Kamu bisa mencoba kembali kapan saja.
        </p>
        {orderCode && (
          <p className="mt-2 text-xs text-text-muted font-mono">
            Order: {orderCode}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/events">
            <Button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark">
              <RefreshCcw className="h-4 w-4" />
              Cari Event Lain
            </Button>
          </Link>
          <Link href="/login?redirect=/checkout">
            <Button className="w-full bg-bg-elevated border border-bg-border text-white hover:bg-bg-surface">
              Lanjutkan Pembayaran
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function CheckoutFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
          <div className="h-[360px] w-full max-w-md animate-pulse rounded-2xl bg-bg-elevated" />
        </div>
      }
    >
      <CheckoutFailedContent />
    </Suspense>
  );
}
