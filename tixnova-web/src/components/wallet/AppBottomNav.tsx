"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet as WalletIcon, Home, History, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Beranda", href: "/", icon: Home },
  { label: "Dompet", href: "/wallet", icon: WalletIcon },
  { label: "Riwayat", href: "/wallet/history", icon: History },
  { label: "Profil", href: "/wallet/profile", icon: User },
];

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md">
      <div className="m-2 flex items-center justify-around rounded-2xl border border-bg-border bg-bg-surface/95 px-2 py-2 backdrop-blur">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-[10px] font-semibold transition-colors",
                active ? "text-primary" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
