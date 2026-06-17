"use client";

import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-[#0a0f1a]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Image
            src="/icon-192.png"
            alt="AP - Golos Sofridos"
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl shadow-lg shadow-emerald-500/30"
            priority
          />
          <div className="text-sm font-semibold tracking-tight md:text-lg">AP - Golos Sofridos</div>
        </div>
        <nav className="flex items-center gap-3 text-sm font-medium">
          <a href="/manage/config" className="rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-white/5">
            Configurações
          </a>
          <a href="/manage/teams" className="rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-white/5">
            Equipas
          </a>
          <a href="/manage/players" className="rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-white/5">
            Jogadores
          </a>
          <a href="/goals" className="rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-white/5">
            Registar Golo Sofrido
          </a>
          <a href="/teams" className="rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-white/5">
            Estatísticas
          </a>
          <a href="/rankings" className="rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-white/5">
            🏆 Rankings
          </a>
        </nav>
      </div>
    </header>
  );
}
