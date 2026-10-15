"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { EnglishLocale } from "@/components/ui/english-locale";

export type Locale = "en" | "pt";
export const LOCALE_STORAGE_KEY = "goals-conceded.locale";

type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void };
const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [appliedLocale, setAppliedLocale] = useState<Locale>("en");
  const [hydrated, setHydrated] = useState(false);
  const reloadTimer = useRef<number | null>(null);

  useEffect(() => {
    let savedLocale: Locale = "en";
    try {
      savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY) === "pt" ? "pt" : "en";
    } catch {
      // Use English when storage is unavailable.
    }
    setLocaleState(savedLocale);
    setAppliedLocale(savedLocale);
    setHydrated(true);
  }, []);

  useEffect(() => () => {
    if (reloadTimer.current !== null) window.clearTimeout(reloadTimer.current);
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    if (nextLocale === locale) return;
    setLocaleState(nextLocale);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    } catch {
      // The selected language still works for this session if storage is unavailable.
    }
    if (reloadTimer.current !== null) window.clearTimeout(reloadTimer.current);
    // Let the selection indicator complete its movement, then rebuild the
    // page from the original UI text for a complete and reliable translation.
    reloadTimer.current = window.setTimeout(() => window.location.reload(), 230);
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{hydrated && <EnglishLocale locale={appliedLocale} />}{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}
