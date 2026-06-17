# AP - Golos Sofridos

Aplicacao Next.js para registar, analisar e consultar golos sofridos com contexto tatico, jogadores envolvidos, zonas no campo e ponto de entrada na baliza.

## Stack

- Next.js App Router + React + TypeScript
- Drizzle ORM + PostgreSQL
- Zod para validacao
- TailwindCSS + Radix primitives + Recharts
- TanStack Query no cliente

## Setup local

1. Instalar dependencias: `npm install`
2. Configurar `DATABASE_URL` no `.env`
3. Executar migracoes: `npm run db:migrate`
4. Arrancar em desenvolvimento: `npm run dev`

## Logica principal

- O registo usa jogadores envolvidos no lance do golo sofrido.
- Nao existe marcador do golo nem assistencia no fluxo da aplicacao.
- Por compatibilidade com o schema atual, o primeiro jogador envolvido e guardado em `scorer_id`.
- `assist_id` e guardado como `null`.
- Rankings de envolvidos contam cada jogador uma vez por golo, sem duplicar o primeiro envolvido.

## Deploy

Para Vercel/Neon, configurar `DATABASE_URL` no ambiente da Vercel e correr as migracoes contra a base de dados Neon.
