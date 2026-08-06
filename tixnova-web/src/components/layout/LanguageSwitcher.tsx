"use client";

import { Languages } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <label className="flex items-center gap-1.5 rounded-xl border border-bg-border bg-bg-surface px-2 py-1.5 text-xs font-bold text-text-secondary">
      <Languages className="h-4 w-4 text-primary" />
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as "id" | "en")}
        className="cursor-pointer bg-transparent text-xs font-bold text-text-primary outline-none"
        aria-label="Language"
      >
        <option value="id">ID</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}
