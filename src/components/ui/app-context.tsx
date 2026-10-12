"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { EnglishLocale } from "@/components/ui/english-locale";

export type Selection = {
  seasonId?: number;
  seasonName?: string;
  championshipId?: number;
  championshipName?: string;
  championshipLogo?: string | null;
  teamId?: number;
};

export type Locale = "en" | "pt";
export const LOCALE_STORAGE_KEY = "goals-conceded.locale";

type AppContextValue = {
  selection: Selection;
  setSelection: (sel: Selection) => void;
  updatePartial: (partial: Partial<Selection>) => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children, storageNamespace = "default" }: { children: React.ReactNode; storageNamespace?: string }) {
  const storageKey = `goals-conceded.selection.${storageNamespace}`;
  // Start empty on both server and client to keep SSR/CSR markup aligned; then hydrate from localStorage.
  const [selection, setSelectionState] = useState<Selection>({});
  const [hydratedStorageKey, setHydratedStorageKey] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    return window.localStorage.getItem(LOCALE_STORAGE_KEY) === "pt" ? "pt" : "en";
  });

  const setSelection = (sel: Selection) => {
    setSelectionState(sel);
  };

  const updatePartial = (partial: Partial<Selection>) => {
    setSelectionState((prev) => ({ ...prev, ...partial }));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        setSelectionState(JSON.parse(raw) as Selection);
      } else {
        setSelectionState({});
      }
    } catch {
      setSelectionState({});
    } finally {
      setHydratedStorageKey(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined" || hydratedStorageKey !== storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(selection));
    } catch {
      /* ignore */
    }
  }, [hydratedStorageKey, selection, storageKey]);

  const value = useMemo(() => ({ selection, setSelection, updatePartial, locale, setLocale }), [selection, locale]);

  return <AppContext.Provider value={value}><EnglishLocale locale={locale} />{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
