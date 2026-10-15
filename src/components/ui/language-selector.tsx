"use client";

import { Languages } from "lucide-react";
import { type Locale, useLocale } from "@/components/ui/locale-provider";

export function LanguageSelector() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="inline-flex shrink-0 items-center rounded-lg border border-border/70 bg-slate-950/40 p-0.5" aria-label="Language">
      <Languages className="mx-1.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <div className="relative grid w-14 grid-cols-2">
        <span
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-y-0 left-0 w-1/2 rounded-md bg-cyan-400/15 transition-transform duration-200 ease-out",
            locale === "en" ? "translate-x-full" : "translate-x-0"
          ].join(" ")}
        />
        {(["pt", "en"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setLocale(option as Locale)}
            className={[
              "relative z-10 w-full rounded-md px-2 py-1 text-[11px] font-semibold uppercase transition-colors duration-200",
              locale === option ? "text-cyan-100" : "text-muted-foreground hover:text-white"
            ].join(" ")}
            aria-pressed={locale === option}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
