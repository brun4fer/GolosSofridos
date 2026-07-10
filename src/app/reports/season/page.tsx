import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeasonGoalReport, type SeasonGoalReport } from "@/server/reports";
import { ReportActions } from "./report-actions";

export const dynamic = "force-dynamic";

type CountRow = SeasonGoalReport["breakdowns"]["moments"][number];
type MapPoint = SeasonGoalReport["maps"]["goalPoints"][number];

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeStyle: "short"
  }).format(new Date(value));

const formatPercent = (value: number) => {
  if (!Number.isFinite(value)) return "0%";
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
};

function MetricCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-950">{value}</div>
      {helper && <div className="mt-1 text-xs text-slate-500">{helper}</div>}
    </div>
  );
}

function ReportSection({
  title,
  description,
  children,
  className = ""
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`report-section rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function BarList({ rows, limit = 8 }: { rows: CountRow[]; limit?: number }) {
  const visibleRows = rows.slice(0, limit);
  const maxValue = Math.max(...visibleRows.map((row) => row.value), 1);

  if (visibleRows.length === 0) {
    return <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">Sem dados registados.</div>;
  }

  return (
    <div className="space-y-3">
      {visibleRows.map((row) => {
        const width = Math.max(4, Math.round((row.value / maxValue) * 100));
        return (
          <div key={row.label} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(140px,1.7fr)] sm:items-center">
            <div className="min-w-0 text-sm font-medium text-slate-700">{row.label}</div>
            <div className="relative h-8 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <div className="absolute inset-y-0 left-0 rounded-lg bg-cyan-500" style={{ width: `${width}%` }} />
              <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-semibold text-slate-950">
                <span>{row.value}</span>
                <span>{formatPercent(row.percent)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MiniTable({ rows, valueLabel = "golos" }: { rows: CountRow[]; valueLabel?: string }) {
  if (rows.length === 0) return <div className="text-sm text-slate-500">Sem dados registados.</div>;
  return (
    <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
      {rows.slice(0, 8).map((row, index) => (
        <div key={row.label} className="grid grid-cols-[32px_minmax(0,1fr)_auto] gap-3 px-3 py-2 text-sm">
          <span className="text-slate-400">{index + 1}</span>
          <span className="font-medium text-slate-800">{row.label}</span>
          <span className="text-right font-semibold text-slate-950">
            {row.value} <span className="text-xs font-normal text-slate-500">{valueLabel}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function GoalNetMap({ points }: { points: MapPoint[] }) {
  return (
    <svg viewBox="0 0 120 80" className="h-auto w-full rounded-xl border border-slate-200 bg-slate-950">
      <rect x="6" y="8" width="108" height="64" rx="5" fill="#0f172a" stroke="#67e8f9" strokeWidth="0.8" />
      <path d="M6 24h108M6 40h108M6 56h108M28 8v64M50 8v64M72 8v64M94 8v64" stroke="rgba(226,232,240,0.22)" strokeWidth="0.6" />
      {points.map((point, index) => (
        <g key={`${point.minute}-${index}`} transform={`translate(${point.x * 120}, ${point.y * 80})`}>
          <circle r="4.4" fill="#f97316" stroke="#fff" strokeWidth="0.8" />
          <text y="-6" textAnchor="middle" className="fill-white text-[4px] font-semibold">
            {point.minute}'
          </text>
        </g>
      ))}
    </svg>
  );
}

function PitchMap({ points, pinColor = "#22c55e" }: { points: MapPoint[]; pinColor?: string }) {
  return (
    <svg viewBox="0 0 120 80" className="h-auto w-full rounded-xl border border-slate-200 bg-emerald-950">
      <rect x="5" y="7" width="110" height="66" rx="4" fill="#064e3b" stroke="rgba(255,255,255,0.8)" strokeWidth="0.8" />
      <line x1="60" y1="7" x2="60" y2="73" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" />
      <circle cx="60" cy="40" r="10" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" />
      <rect x="5" y="24" width="16" height="32" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" />
      <rect x="99" y="24" width="16" height="32" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" />
      {points.map((point, index) => (
        <g key={`${point.minute}-${index}`} transform={`translate(${point.x * 120}, ${point.y * 80})`}>
          <circle r="4.2" fill={pinColor} stroke="#fff" strokeWidth="0.8" />
          <text y="-6" textAnchor="middle" className="fill-white text-[4px] font-semibold">
            {point.minute}'
          </text>
        </g>
      ))}
    </svg>
  );
}

function GoalsTable({ report }: { report: SeasonGoalReport }) {
  if (report.goals.length === 0) {
    return <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">Ainda sem golos sofridos neste contexto.</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="bg-slate-100 text-[11px] uppercase tracking-[0.12em] text-slate-500">
          <tr>
            <th className="px-3 py-2">Min.</th>
            <th className="px-3 py-2">Adversário</th>
            <th className="px-3 py-2">Jogador ref.</th>
            <th className="px-3 py-2">Momento</th>
            <th className="px-3 py-2">Sub-momento</th>
            <th className="px-3 py-2">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {report.goals.map((goal) => (
            <tr key={goal.id} className="align-top">
              <td className="px-3 py-2 font-semibold text-slate-950">{goal.minute}'</td>
              <td className="px-3 py-2 text-slate-700">{goal.opponentName ?? "Sem adversário"}</td>
              <td className="px-3 py-2 text-slate-700">{goal.playerName ?? "Sem jogador"}</td>
              <td className="px-3 py-2 text-slate-700">{goal.moment ?? "Sem momento"}</td>
              <td className="px-3 py-2 text-slate-700">{goal.subMoment ?? "Sem sub-momento"}</td>
              <td className="px-3 py-2 text-slate-700">{goal.actions.join(", ") || goal.action || "Sem ação"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function SeasonReportPage({ searchParams }: { searchParams: { teamId?: string } }) {
  const teamId = Number(searchParams.teamId);
  if (!teamId || Number.isNaN(teamId)) notFound();

  const report = await getSeasonGoalReport(teamId);
  if (!report) notFound();

  const reportHref = `/teams`;
  const topSetPiece = report.breakdowns.setPieces[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-950">
      <ReportActions teamHref={reportHref} />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page { size: A4; margin: 12mm; }
            @media print {
              html, body { background: white !important; }
              .no-print { display: none !important; }
              .report-page { margin: 0 !important; max-width: none !important; border: 0 !important; box-shadow: none !important; }
              .report-section { break-inside: avoid; page-break-inside: avoid; }
              .print-break { break-before: page; page-break-before: always; }
            }
          `
        }}
      />
      <main className="report-page mx-auto my-8 max-w-6xl overflow-hidden rounded-[28px] border border-slate-800 bg-slate-100 shadow-2xl">
        <header className="relative overflow-hidden bg-slate-950 px-8 py-8 text-white">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_20%,rgba(34,211,238,0.28),transparent_35%),radial-gradient(circle_at_45%_80%,rgba(16,185,129,0.22),transparent_34%)]" />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">Relatório Defensivo</div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">{report.team.name}</h1>
              <p className="mt-3 text-sm text-slate-300">
                {report.team.seasonName} · {report.team.championshipName}
              </p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Resumo consolidado dos golos sofridos, com distribuição por momentos, zonas, adversários,
                jogadores envolvidos e histórico completo dos lances.
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              {report.team.emblemPath ? (
                <img src={report.team.emblemPath} alt={report.team.name} className="h-16 w-16 rounded-full border border-white/20 object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs text-slate-300">
                  Sem emblema
                </div>
              )}
              <div className="text-sm">
                <div className="font-semibold text-white">{report.team.coach || "Treinador por definir"}</div>
                <div className="text-slate-300">{report.team.stadium || "Estádio por definir"}</div>
                <div className="text-slate-400">{report.team.pitchDimensions || "Dimensões por definir"}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total" value={report.metrics.totalGoals} helper="golos sofridos" />
            <MetricCard label="Média temporal" value={report.metrics.averageMinute ? `${report.metrics.averageMinute}'` : "—"} helper="minuto médio" />
            <MetricCard label="Bola parada" value={report.metrics.setPieceGoals} helper={`${report.metrics.openPlayGoals} em jogo corrido`} />
            <MetricCard label="Adversários" value={report.metrics.opponentsCount} helper={`mais frequente: ${report.metrics.mostFrequentOpponent}`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ReportSection title="Síntese Tática" className="lg:col-span-2">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-100 p-4">
                  <div className="text-xs text-slate-500">Momento dominante</div>
                  <div className="mt-1 text-lg font-semibold text-slate-950">{report.metrics.mostCommonMoment}</div>
                </div>
                <div className="rounded-xl bg-slate-100 p-4">
                  <div className="text-xs text-slate-500">Ação dominante</div>
                  <div className="mt-1 text-lg font-semibold text-slate-950">{report.metrics.mostCommonAction}</div>
                </div>
                <div className="rounded-xl bg-slate-100 p-4">
                  <div className="text-xs text-slate-500">Bola parada principal</div>
                  <div className="mt-1 text-lg font-semibold text-slate-950">{topSetPiece?.label ?? "Sem dados"}</div>
                </div>
              </div>
            </ReportSection>
            <ReportSection title="Cobertura de Dados">
              <MiniTable
                valueLabel="reg."
                rows={[
                  { label: "Ponto na baliza", value: report.metrics.goalsWithGoalPoint, percent: 0 },
                  { label: "Zona de remate", value: report.metrics.goalsWithFieldPoint, percent: 0 },
                  { label: "Zona da perda", value: report.metrics.goalsWithLossZone, percent: 0 }
                ]}
              />
            </ReportSection>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ReportSection title="Momentos do Golo Sofrido">
              <BarList rows={report.breakdowns.moments} />
            </ReportSection>
            <ReportSection title="Períodos do Jogo">
              <BarList rows={report.breakdowns.timeBands} />
            </ReportSection>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ReportSection title="Mapa da Baliza" description="Pontos de entrada registados.">
              <GoalNetMap points={report.maps.goalPoints} />
            </ReportSection>
            <ReportSection title="Zonas de Remate" description="Localização do remate no campo.">
              <PitchMap points={report.maps.fieldPoints} />
            </ReportSection>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ReportSection title="Sub-momentos">
              <BarList rows={report.breakdowns.subMoments} />
            </ReportSection>
            <ReportSection title="Ações">
              <BarList rows={report.breakdowns.actions} />
            </ReportSection>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ReportSection title="Adversários">
              <MiniTable rows={report.breakdowns.opponents} />
            </ReportSection>
            <ReportSection title="Jogadores Referência">
              <MiniTable rows={report.breakdowns.referencePlayers} />
            </ReportSection>
            <ReportSection title="Mais Envolvidos">
              <MiniTable rows={report.breakdowns.involvedPlayers} valueLabel="envolv." />
            </ReportSection>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ReportSection title="Zonas da Baliza">
              <BarList rows={report.breakdowns.goalZones} />
            </ReportSection>
            <ReportSection title="Bolas Paradas Defensivas">
              <BarList rows={report.breakdowns.setPieces} />
            </ReportSection>
          </div>

          <div className="print-break">
            <ReportSection title="Histórico Completo dos Golos Sofridos" description="Lista de todos os lances considerados neste relatório.">
              <GoalsTable report={report} />
            </ReportSection>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-300 pt-4 text-xs text-slate-500">
            <span>Gerado em {formatDate(report.generatedAt)}</span>
            <span>AP - Goals Conceded</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
