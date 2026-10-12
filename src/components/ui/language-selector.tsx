"use client";

import { Languages } from "lucide-react";
import { LOCALE_STORAGE_KEY, type Locale, useAppContext } from "@/components/ui/app-context";

export function LanguageSelector() {
  const { locale, setLocale } = useAppContext();

  function changeLocale(nextLocale: Locale) {
    if (nextLocale === locale) return;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    setLocale(nextLocale);
    // Static copy and taxonomy labels are translated after render. A reload restores
    // the original Portuguese DOM before applying the selected locale again.
    window.location.reload();
  }

  return (
    <label className="inline-flex h-9 items-center gap-1 rounded-lg border border-border/70 px-2 text-muted-foreground hover:bg-white/5" title="Language">
      <Languages className="h-4 w-4" aria-hidden="true" />
      <select
        aria-label="Language"
        className="max-w-24 bg-transparent text-xs font-medium text-foreground outline-none"
        value={locale}
        onChange={(event) => changeLocale(event.target.value as Locale)}
      >
        <option value="en">English</option>
        <option value="pt">Português</option>
      </select>
    </label>
  );
}
