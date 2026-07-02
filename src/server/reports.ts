import { sql } from "drizzle-orm";
import { db } from "../db/client";
import {
  actions,
  championships,
  goalActions,
  goalInvolvements,
  goals,
  moments,
  players,
  seasons,
  subMoments,
  teams
} from "../schema/schema";
import { ensurePlayerProfileColumns, ensureTeamMetadataColumns } from "./schema-maintenance";
import { ensureDefensiveTaxonomyNames } from "./lookups";

type Point = { x: number; y: number };
type CountRow = { label: string; value: number; percent: number };

type RawReportGoal = {
  id: number;
  minute: number;
  notes: string | null;
  playerId: number;
  playerName: string | null;
  opponentName: string | null;
  moment: string | null;
  subMoment: string | null;
  action: string | null;
  goalCoordinates: unknown;
  fieldDrawing: unknown;
  assistDrawing: unknown;
  transitionDrawing: unknown;
  lossZoneId: number | null;
};

export type ReportGoal = Omit<
  RawReportGoal,
  "goalCoordinates" | "fieldDrawing" | "assistDrawing" | "transitionDrawing" | "action"
> & {
  action: string | null;
  actions: string[];
  involvedPlayers: string[];
  goalCoordinates: Point | null;
  fieldDrawing: Point | null;
  assistDrawing: Point | null;
  transitionDrawing: Point | null;
};

export type SeasonGoalReport = {
  generatedAt: string;
  team: {
    id: number;
    name: string;
    emblemPath: string | null;
    coach: string | null;
    stadium: string | null;
    pitchDimensions: string | null;
    championshipId: number;
    championshipName: string;
    seasonId: number;
    seasonName: string;
  };
  metrics: {
    totalGoals: number;
    goalsWithGoalPoint: number;
    goalsWithFieldPoint: number;
    goalsWithLossZone: number;
    averageMinute: number | null;
    setPieceGoals: number;
    openPlayGoals: number;
    opponentsCount: number;
    mostCommonMoment: string;
    mostCommonAction: string;
    mostFrequentOpponent: string;
  };
  breakdowns: {
    moments: CountRow[];
    subMoments: CountRow[];
    actions: CountRow[];
    opponents: CountRow[];
    timeBands: CountRow[];
    goalZones: CountRow[];
    setPieces: CountRow[];
    referencePlayers: CountRow[];
    involvedPlayers: CountRow[];
  };
  maps: {
    goalPoints: Array<Point & { label: string; minute: number }>;
    fieldPoints: Array<Point & { label: string; minute: number }>;
    referencePoints: Array<Point & { label: string; minute: number }>;
    lossPoints: Array<Point & { label: string; minute: number; zoneId: number | null }>;
  };
  goals: ReportGoal[];
};

const normalizeToken = (value?: string | null) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const toPoint = (value: unknown): Point | null => {
  if (!value || typeof value !== "object") return null;
  const raw = value as { x?: unknown; y?: unknown };
  if (typeof raw.x !== "number" || typeof raw.y !== "number") return null;
  return { x: raw.x, y: raw.y };
};

const percent = (value: number, total: number) =>
  total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;

const addCount = (map: Map<string, number>, label?: string | null, amount = 1) => {
  const key = label?.toString().trim() || "Sem dados";
  map.set(key, (map.get(key) ?? 0) + amount);
};

const rankCounts = (map: Map<string, number>, total: number): CountRow[] =>
  Array.from(map.entries())
    .map(([label, value]) => ({ label, value, percent: percent(value, total) }))
    .sort((a, b) => (b.value === a.value ? a.label.localeCompare(b.label, "pt-PT") : b.value - a.value));

const topLabel = (rows: CountRow[], fallback = "Sem dados") => rows[0]?.label ?? fallback;

const timeBandForMinute = (minute: number) => {
  if (minute <= 15) return "0-15";
  if (minute <= 30) return "16-30";
  if (minute <= 45) return "31-45";
  if (minute <= 60) return "46-60";
  if (minute <= 75) return "61-75";
  if (minute <= 90) return "76-90";
  return "90+";
};

const goalZoneForPoint = (point: Point | null) => {
  if (!point) return "Sem ponto";
  const horizontal = point.x < 1 / 3 ? "Esquerdo" : point.x < 2 / 3 ? "Centro" : "Direito";
  const vertical = point.y < 1 / 3 ? "Superior" : point.y < 2 / 3 ? "Médio" : "Inferior";
  return `${vertical} ${horizontal}`;
};

const setPieceCategory = (subMoment?: string | null) => {
  const normalized = normalizeToken(subMoment);
  if (normalized.includes("canto")) return "Cantos";
  if (normalized.includes("livre direto") || normalized.includes("livre directo")) return "Livres Diretos";
  if (normalized.includes("livre")) return "Livres";
  if (normalized.includes("penal") || normalized.includes("penalty")) return "Penáltis";
  if (normalized.includes("lancamento")) return "Lançamentos Laterais";
  return null;
};

const mapPoint = (
  point: Point | null,
  goal: ReportGoal,
  extra?: { zoneId?: number | null }
): (Point & { label: string; minute: number; zoneId?: number | null }) | null => {
  if (!point) return null;
  return {
    ...point,
    label: `${goal.playerName ?? "Jogador"} vs ${goal.opponentName ?? "Adversário"}`,
    minute: goal.minute,
    ...extra
  };
};

export async function getSeasonGoalReport(teamId: number): Promise<SeasonGoalReport | null> {
  await ensureTeamMetadataColumns();
  await ensurePlayerProfileColumns();
  await ensureDefensiveTaxonomyNames();

  const teamResult = await db.execute<SeasonGoalReport["team"]>(sql`
    SELECT
      t.id,
      t.name,
      t.emblem_path AS "emblemPath",
      t.coach,
      t.stadium,
      t.pitch_dimensions AS "pitchDimensions",
      c.id AS "championshipId",
      c.name AS "championshipName",
      s.id AS "seasonId",
      s.name AS "seasonName"
    FROM ${teams} t
    JOIN ${championships} c ON c.id = t.championship_id
    JOIN ${seasons} s ON s.id = c.season_id
    WHERE t.id = ${teamId}
    LIMIT 1
  `);

  const team = teamResult.rows[0];
  if (!team) return null;

  const goalResult = await db.execute<RawReportGoal>(sql`
    SELECT
      g.id,
      g.minute,
      g.notes,
      g.scorer_id AS "playerId",
      p.name AS "playerName",
      opponent.name AS "opponentName",
      m.name AS moment,
      sm.name AS "subMoment",
      a.name AS action,
      g.goal_coordinates AS "goalCoordinates",
      g.field_drawing AS "fieldDrawing",
      g.assist_drawing AS "assistDrawing",
      g.transition_drawing AS "transitionDrawing",
      g.attacking_space_id AS "lossZoneId"
    FROM ${goals} g
    JOIN ${players} p ON p.id = g.scorer_id
    LEFT JOIN ${teams} opponent ON opponent.id = g.opponent_team_id
    LEFT JOIN ${moments} m ON m.id = g.moment_id
    LEFT JOIN ${subMoments} sm ON sm.id = g.sub_moment_id
    LEFT JOIN ${actions} a ON a.id = g.action_id
    WHERE g.team_id = ${teamId}
    ORDER BY g.minute ASC, g.id ASC
  `);

  const actionResult = await db.execute<{ goalId: number; actionName: string | null }>(sql`
    SELECT ga.goal_id AS "goalId", a.name AS "actionName"
    FROM ${goalActions} ga
    JOIN ${goals} g ON g.id = ga.goal_id
    JOIN ${actions} a ON a.id = ga.action_id
    WHERE g.team_id = ${teamId}
    ORDER BY ga.goal_id ASC, a.name ASC
  `);

  const involvementResult = await db.execute<{ goalId: number; playerName: string | null }>(sql`
    SELECT gi.goal_id AS "goalId", p.name AS "playerName"
    FROM ${goalInvolvements} gi
    JOIN ${goals} g ON g.id = gi.goal_id
    JOIN ${players} p ON p.id = gi.player_id
    WHERE g.team_id = ${teamId}
    ORDER BY gi.goal_id ASC, p.name ASC
  `);

  const actionsByGoal = new Map<number, string[]>();
  for (const row of actionResult.rows) {
    if (!row.actionName) continue;
    const list = actionsByGoal.get(row.goalId) ?? [];
    list.push(row.actionName);
    actionsByGoal.set(row.goalId, list);
  }

  const involvementByGoal = new Map<number, string[]>();
  for (const row of involvementResult.rows) {
    if (!row.playerName) continue;
    const list = involvementByGoal.get(row.goalId) ?? [];
    list.push(row.playerName);
    involvementByGoal.set(row.goalId, list);
  }

  const reportGoals: ReportGoal[] = goalResult.rows.map((goal) => {
    const actionNames = actionsByGoal.get(goal.id) ?? (goal.action ? [goal.action] : []);
    const involvedPlayers = involvementByGoal.get(goal.id) ?? [];
    return {
      ...goal,
      action: actionNames[0] ?? goal.action,
      actions: actionNames,
      involvedPlayers,
      goalCoordinates: toPoint(goal.goalCoordinates),
      fieldDrawing: toPoint(goal.fieldDrawing),
      assistDrawing: toPoint(goal.assistDrawing),
      transitionDrawing: toPoint(goal.transitionDrawing)
    };
  });

  const totalGoals = reportGoals.length;
  const momentsMap = new Map<string, number>();
  const subMomentsMap = new Map<string, number>();
  const actionsMap = new Map<string, number>();
  const opponentsMap = new Map<string, number>();
  const timeBandsMap = new Map<string, number>();
  const goalZonesMap = new Map<string, number>();
  const setPiecesMap = new Map<string, number>();
  const referencePlayersMap = new Map<string, number>();
  const involvedPlayersMap = new Map<string, number>();

  for (const goal of reportGoals) {
    addCount(momentsMap, goal.moment);
    addCount(subMomentsMap, goal.subMoment);
    addCount(opponentsMap, goal.opponentName);
    addCount(timeBandsMap, timeBandForMinute(goal.minute));
    addCount(goalZonesMap, goalZoneForPoint(goal.goalCoordinates));
    addCount(referencePlayersMap, goal.playerName);
    for (const actionName of goal.actions.length > 0 ? goal.actions : [goal.action ?? "Sem ação"]) {
      addCount(actionsMap, actionName);
    }
    for (const playerName of goal.involvedPlayers.length > 0 ? goal.involvedPlayers : [goal.playerName ?? "Sem dados"]) {
      addCount(involvedPlayersMap, playerName);
    }
    const setPiece = setPieceCategory(goal.subMoment);
    if (setPiece) addCount(setPiecesMap, setPiece);
  }

  const momentsBreakdown = rankCounts(momentsMap, totalGoals);
  const actionsBreakdown = rankCounts(actionsMap, totalGoals);
  const opponentsBreakdown = rankCounts(opponentsMap, totalGoals);
  const setPiecesBreakdown = rankCounts(setPiecesMap, totalGoals);
  const setPieceGoals = setPiecesBreakdown.reduce((sum, row) => sum + row.value, 0);
  const minuteTotal = reportGoals.reduce((sum, goal) => sum + goal.minute, 0);

  return {
    generatedAt: new Date().toISOString(),
    team,
    metrics: {
      totalGoals,
      goalsWithGoalPoint: reportGoals.filter((goal) => goal.goalCoordinates).length,
      goalsWithFieldPoint: reportGoals.filter((goal) => goal.fieldDrawing).length,
      goalsWithLossZone: reportGoals.filter((goal) => goal.lossZoneId).length,
      averageMinute: totalGoals > 0 ? Math.round(minuteTotal / totalGoals) : null,
      setPieceGoals,
      openPlayGoals: Math.max(0, totalGoals - setPieceGoals),
      opponentsCount: opponentsBreakdown.length,
      mostCommonMoment: topLabel(momentsBreakdown),
      mostCommonAction: topLabel(actionsBreakdown),
      mostFrequentOpponent: topLabel(opponentsBreakdown)
    },
    breakdowns: {
      moments: momentsBreakdown,
      subMoments: rankCounts(subMomentsMap, totalGoals),
      actions: actionsBreakdown,
      opponents: opponentsBreakdown,
      timeBands: rankCounts(timeBandsMap, totalGoals),
      goalZones: rankCounts(goalZonesMap, totalGoals),
      setPieces: setPiecesBreakdown,
      referencePlayers: rankCounts(referencePlayersMap, totalGoals),
      involvedPlayers: rankCounts(involvedPlayersMap, totalGoals)
    },
    maps: {
      goalPoints: reportGoals.map((goal) => mapPoint(goal.goalCoordinates, goal)).filter(Boolean) as Array<
        Point & { label: string; minute: number }
      >,
      fieldPoints: reportGoals.map((goal) => mapPoint(goal.fieldDrawing, goal)).filter(Boolean) as Array<
        Point & { label: string; minute: number }
      >,
      referencePoints: reportGoals.map((goal) => mapPoint(goal.assistDrawing, goal)).filter(Boolean) as Array<
        Point & { label: string; minute: number }
      >,
      lossPoints: reportGoals
        .map((goal) => mapPoint(goal.transitionDrawing, goal, { zoneId: goal.lossZoneId }))
        .filter(Boolean) as Array<Point & { label: string; minute: number; zoneId: number | null }>
    },
    goals: reportGoals
  };
}
