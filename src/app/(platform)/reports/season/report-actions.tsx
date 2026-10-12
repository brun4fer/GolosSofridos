"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportActions({ teamHref }: { teamHref: string }) {
  return (
    <div className="no-print sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <Link href={teamHref} className="inline-flex items-center gap-2 text-sm text-slate-200 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <Button type="button" className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Guardar PDF
        </Button>
      </div>
    </div>
  );
}
