import { eq, desc, inArray, asc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db/client";
import { actions, goalActions, goals, goalInvolvements, goalSubMomentActions, moments, players, subMoments, teams } from "../schema/schema";
import { goalInputSchema } from "../lib/validation";
import { ensureActionsContextColumn, ensurePlayerProfileColumns, ensureTeamMetadataColumns } from "./schema-maintenance";

type RawGoalPayload = Record<string, unknown>;

function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isTransitionLossSubMomentName(value: string) {
  const normalized = normalizeToken(value);
  return (
    normalized.includes("perda") &&
    (normalized.includes("meio campo proprio") || normalized.includes("meio campo adversario"))
  );
}

const transitionActionWhitelist = new Set([
  "cruzamento direita",
  "cruzamento esquerda",
  "remate fora de area",
  "remate de fora da area",
  "profundidade"
]);

const DEFENSIVE_ORGANIZATION_MOMENT = "organizacao defensiva";
const DEFENSIVE_ORGANIZATION_SEQUENCE = ["saida do gr", "construcao", "criacao", "finalizacao"] as const;

type GoalSubMomentSequenceEntry = {
  subMomentId: number;
  actionId: number;
  sequenceOrder: number;
};

function normalizeTransitionActionName(value: string) {
  const normalized = normalizeToken(value);
  if (normalized === "remate de fora da area") return "remate fora de area";
  return normalized;
}

async function hasGoalsColumn(columnName: string) {
  try {
    const res = await db.execute<{ exists: boolean }>(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = ANY(current_schemas(false))
          AND table_name = 'goals'
          AND column_name = ${columnName}
      ) AS "exists"
    `);
    return Boolean(res.rows[0]?.exists);
  } catch {
    return false;
  }
}

async function hasTable(tableName: string) {
  try {
    const res = await db.execute<{ exists: boolean }>(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = ANY(current_schemas(false))
          AND table_name = ${tableName}
      ) AS "exists"
    `);
    return Boolean(res.rows[0]?.exists);
  } catch {
    return false;
  }
}

async function hasGoalSubMomentActionsTable() {
  return hasTable("goal_sub_moment_actions");
}

async function ensureGoalsStorageSchema() {
  try {
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = ANY(current_schemas(false))
            AND table_name = 'goals'
            AND column_name = 'match_id'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = ANY(current_schemas(false))
            AND table_name = 'goals'
            AND column_name = 'opponent_team_id'
        ) THEN
          ALTER TABLE "goals" DROP CONSTRAINT IF EXISTS "goals_match_id_matches_id_fk";
          ALTER TABLE "goals" DROP CONSTRAINT IF EXISTS "goals_match_id_fkey";
          ALTER TABLE "goals" RENAME COLUMN "match_id" TO "opponent_team_id";
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = ANY(current_schemas(false))
            AND table_name = 'goals'
            AND column_name = 'video_url'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = ANY(current_schemas(false))
            AND table_name = 'goals'
            AND column_name = 'video_path'
        ) THEN
          ALTER TABLE "goals" RENAME COLUMN "video_url" TO "video_path";
        END IF;
      END $$;
    `);

    await db.execute(sql`
      ALTER TABLE "goals"
        ADD COLUMN IF NOT EXISTS "opponent_team_id" bigint,
        ADD COLUMN IF NOT EXISTS "assist_id" bigint,
        ADD COLUMN IF NOT EXISTS "video_path" text,
        ADD COLUMN IF NOT EXISTS "corner_taker_id" bigint,
        ADD COLUMN IF NOT EXISTS "freekick_taker_id" bigint,
        ADD COLUMN IF NOT EXISTS "penalty_taker_id" bigint,
        ADD COLUMN IF NOT EXISTS "cross_author_id" bigint,
        ADD COLUMN IF NOT EXISTS "throw_in_taker_id" bigint,
        ADD COLUMN IF NOT EXISTS "reference_player_id" bigint,
        ADD COLUMN IF NOT EXISTS "foul_suffered_by_id" bigint,
        ADD COLUMN IF NOT EXISTS "previous_moment_description" text,
        ADD COLUMN IF NOT EXISTS "field_drawing" jsonb,
        ADD COLUMN IF NOT EXISTS "assist_coordinates" jsonb,
        ADD COLUMN IF NOT EXISTS "assist_drawing" jsonb,
        ADD COLUMN IF NOT EXISTS "transition_drawing" jsonb,
        ADD COLUMN IF NOT EXISTS "attacking_space_id" integer,
        ADD COLUMN IF NOT EXISTS "assist_sector" text,
        ADD COLUMN IF NOT EXISTS "shot_sector" text,
        ADD COLUMN IF NOT EXISTS "finish_sector" text,
        ADD COLUMN IF NOT EXISTS "corner_profile" text,
        ADD COLUMN IF NOT EXISTS "freekick_profile" text,
        ADD COLUMN IF NOT EXISTS "throw_in_profile" text,
        ADD COLUMN IF NOT EXISTS "goalkeeper_outlet" text
    `);

    await db.execute(sql`ALTER TABLE "goals" ALTER COLUMN "goal_zone_id" DROP NOT NULL`);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_goals_opponent" ON "goals" ("opponent_team_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_goals_assist" ON "goals" ("assist_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_goals_corner_taker" ON "goals" ("corner_taker_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_goals_freekick_taker" ON "goals" ("freekick_taker_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_goals_penalty_taker" ON "goals" ("penalty_taker_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_goals_cross_author" ON "goals" ("cross_author_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_goals_throw_in_taker" ON "goals" ("throw_in_taker_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_goals_reference_player" ON "goals" ("reference_player_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_goals_foul_suffered_by" ON "goals" ("foul_suffered_by_id")`);

    await db.execute(sql`ALTER TABLE "goals" DROP CONSTRAINT IF EXISTS "goals_corner_profile_check"`);
    await db.execute(sql`
      ALTER TABLE "goals" ADD CONSTRAINT "goals_corner_profile_check"
      CHECK ("corner_profile" IS NULL OR "corner_profile" IN ('fechado','aberto','combinado')) NOT VALID
    `);
    await db.execute(sql`ALTER TABLE "goals" DROP CONSTRAINT IF EXISTS "goals_freekick_profile_check"`);
    await db.execute(sql`
      ALTER TABLE "goals" ADD CONSTRAINT "goals_freekick_profile_check"
      CHECK ("freekick_profile" IS NULL OR "freekick_profile" IN ('fechado','aberto','combinado')) NOT VALID
    `);
    await db.execute(sql`ALTER TABLE "goals" DROP CONSTRAINT IF EXISTS "goals_throw_in_profile_check"`);
    await db.execute(sql`
      ALTER TABLE "goals" ADD CONSTRAINT "goals_throw_in_profile_check"
      CHECK ("throw_in_profile" IS NULL OR "throw_in_profile" IN ('area','organizacao')) NOT VALID
    `);
    await db.execute(sql`ALTER TABLE "goals" DROP CONSTRAINT IF EXISTS "goals_goalkeeper_outlet_check"`);
    await db.execute(sql`
      ALTER TABLE "goals" ADD CONSTRAINT "goals_goalkeeper_outlet_check"
      CHECK ("goalkeeper_outlet" IS NULL OR "goalkeeper_outlet" IN ('organizacao','curto_para_longo','bola_longa')) NOT VALID
    `);
  } catch {
    // Se nÃ£o for possÃ­vel alterar schema em runtime, o fluxo segue e o erro original serÃ¡ devolvido no insert/update.
  }
}

async function ensureGoalActionsTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "goal_actions" (
        "id" bigserial PRIMARY KEY NOT NULL,
        "goal_id" bigint NOT NULL REFERENCES "goals"("id") ON DELETE CASCADE,
        "action_id" bigint NOT NULL REFERENCES "actions"("id") ON DELETE CASCADE
      )
    `);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "goal_actions_goal_action_key" ON "goal_actions" ("goal_id","action_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_goal_actions_goal" ON "goal_actions" ("goal_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_goal_actions_action" ON "goal_actions" ("action_id")`);
    await db.execute(sql`
      INSERT INTO "goal_actions" ("goal_id", "action_id")
      SELECT g."id", g."action_id"
      FROM "goals" g
      WHERE g."action_id" IS NOT NULL
      ON CONFLICT ("goal_id", "action_id") DO NOTHING
    `);
  } catch {
    // Se nao for possivel alterar schema em runtime, o fluxo segue e o erro original sera devolvido no insert/update.
  }
}

async function ensureGoalSubMomentActionsTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "goal_sub_moment_actions" (
        "id" bigserial PRIMARY KEY NOT NULL,
        "goal_id" bigint NOT NULL REFERENCES "goals"("id") ON DELETE CASCADE,
        "sub_moment_id" bigint NOT NULL REFERENCES "sub_moments"("id") ON DELETE CASCADE,
        "action_id" bigint NOT NULL REFERENCES "actions"("id") ON DELETE CASCADE,
        "sequence_order" integer NOT NULL,
        CONSTRAINT "goal_sub_moment_actions_sequence_order_check" CHECK ("sequence_order" > 0)
      )
    `);
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS "goal_sub_moment_actions_goal_sequence_key" ON "goal_sub_moment_actions" ("goal_id","sequence_order")`
    );
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS "goal_sub_moment_actions_goal_sub_moment_key" ON "goal_sub_moment_actions" ("goal_id","sub_moment_id")`
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "idx_goal_sub_moment_actions_goal" ON "goal_sub_moment_actions" ("goal_id")`
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "idx_goal_sub_moment_actions_sub_moment" ON "goal_sub_moment_actions" ("sub_moment_id")`
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "idx_goal_sub_moment_actions_action" ON "goal_sub_moment_actions" ("action_id")`
    );
    await db.execute(sql`
      INSERT INTO "goal_sub_moment_actions" ("goal_id", "sub_moment_id", "action_id", "sequence_order")
      SELECT g."id", g."sub_moment_id", g."action_id", 1
      FROM "goals" g
      WHERE g."sub_moment_id" IS NOT NULL
        AND g."action_id" IS NOT NULL
      ON CONFLICT ("goal_id", "sequence_order") DO NOTHING
    `);
  } catch {
    // Se nao for possivel alterar schema em runtime, o fluxo segue e o erro original sera devolvido no insert/update.
  }
}

async function normalizeGoalPayload(payload: RawGoalPayload) {
  const minuteValue = payload?.minute;
  const minute =
    minuteValue === undefined || minuteValue === null
      ? minuteValue
      : Number(String(minuteValue).replace(/[^\d.-]/g, ""));

  const goalCoordinates =
    payload?.goalCoordinates && typeof payload.goalCoordinates === "object"
      ? JSON.parse(JSON.stringify(payload.goalCoordinates))
      : payload?.goalCoordinates ?? null;
  const fieldDrawing =
    payload?.fieldDrawing && typeof payload.fieldDrawing === "object"
      ? JSON.parse(JSON.stringify(payload.fieldDrawing))
      : payload?.fieldDrawing ?? null;
  const assistCoordinates =
    payload?.assistCoordinates && typeof payload.assistCoordinates === "object"
      ? JSON.parse(JSON.stringify(payload.assistCoordinates))
      : payload?.assistCoordinates ?? null;
  const assistDrawingFromCoordinates =
    assistCoordinates &&
    typeof assistCoordinates === "object" &&
    typeof (assistCoordinates as any).x === "number" &&
    typeof (assistCoordinates as any).y === "number"
      ? {
          x: (assistCoordinates as any).x,
          y: (assistCoordinates as any).y
        }
      : null;
  const assistDrawing =
    payload?.assistDrawing && typeof payload.assistDrawing === "object"
      ? JSON.parse(JSON.stringify(payload.assistDrawing))
      : assistDrawingFromCoordinates;
  const transitionDrawing =
    payload?.transitionDrawing && typeof payload.transitionDrawing === "object"
      ? JSON.parse(JSON.stringify(payload.transitionDrawing))
      : payload?.transitionDrawing ?? null;
  const attackingSpaceIdRaw = payload?.attackingSpaceId;
  const attackingSpaceId =
    attackingSpaceIdRaw === undefined || attackingSpaceIdRaw === null || attackingSpaceIdRaw === ""
      ? null
      : Number(String(attackingSpaceIdRaw).replace(/[^\d.-]/g, ""));

  const actionIdsRaw = Array.isArray(payload?.actionIds)
    ? payload.actionIds
    : payload && "actionId" in payload && payload.actionId
      ? [payload.actionId]
      : [];
  const actionIds = actionIdsRaw
    .map((v) => Number(String(v).replace(/[^\d.-]/g, "")))
    .filter((v) => !Number.isNaN(v) && v > 0);

  const subMomentIdRaw = payload?.subMomentId;
  const subMomentId =
    subMomentIdRaw === undefined || subMomentIdRaw === null || subMomentIdRaw === ""
      ? undefined
      : Number(String(subMomentIdRaw).replace(/[^\d.-]/g, ""));

  const subMomentSequenceRaw = Array.isArray(payload?.subMomentSequence) ? payload.subMomentSequence : [];
  const subMomentSequence = subMomentSequenceRaw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const raw = entry as Record<string, unknown>;
      const parsedSubMomentId = Number(String(raw.subMomentId ?? "").replace(/[^\d.-]/g, ""));
      const parsedActionId = Number(String(raw.actionId ?? "").replace(/[^\d.-]/g, ""));
      const parsedSequenceOrder = Number(String(raw.sequenceOrder ?? "").replace(/[^\d.-]/g, ""));
      if (
        Number.isNaN(parsedSubMomentId) ||
        Number.isNaN(parsedActionId) ||
        Number.isNaN(parsedSequenceOrder) ||
        parsedSubMomentId <= 0 ||
        parsedActionId <= 0 ||
        parsedSequenceOrder <= 0
      ) {
        return null;
      }
      return {
        subMomentId: parsedSubMomentId,
        actionId: parsedActionId,
        sequenceOrder: parsedSequenceOrder
      };
    })
    .filter((entry): entry is GoalSubMomentSequenceEntry => Boolean(entry))
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  return {
    ...payload,
    minute,
    subMomentId: Number.isNaN(subMomentId) ? undefined : subMomentId,
    actionIds,
    subMomentSequence,
    goalCoordinates,
    goalZoneId: null,
    fieldDrawing,
    assistCoordinates,
    assistDrawing,
    transitionDrawing,
    attackingSpaceId: Number.isNaN(attackingSpaceId) ? null : attackingSpaceId
  };
}

function buildSequenceEntries(parsed: ReturnType<typeof goalInputSchema.parse>): GoalSubMomentSequenceEntry[] {
  if (parsed.subMomentSequence && parsed.subMomentSequence.length > 0) {
    return [...parsed.subMomentSequence].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  }
  if (!parsed.subMomentId || parsed.actionIds.length === 0) return [];
  return [
    {
      subMomentId: parsed.subMomentId,
      actionId: parsed.actionIds[0],
      sequenceOrder: 1
    }
  ];
}

function isDefensiveOrganizationMomentName(value: string) {
  const normalized = normalizeToken(value);
  return normalized === DEFENSIVE_ORGANIZATION_MOMENT;
}

export async function getGoalsByTeam(teamId: number) {
  await ensureActionsContextColumn();
  await ensurePlayerProfileColumns();
  await ensureTeamMetadataColumns();
  await ensureGoalsStorageSchema();
  await ensureGoalActionsTable();
  await ensureGoalSubMomentActionsTable();

  const [supportsAssistDrawing, supportsTransitionDrawing, supportsAttackingSpace, supportsGoalSubMomentActions] = await Promise.all([
    hasGoalsColumn("assist_drawing"),
    hasGoalsColumn("transition_drawing"),
    hasGoalsColumn("attacking_space_id"),
    hasGoalSubMomentActionsTable()
  ]);
  const rows = await db
    .select({
      id: goals.id,
      opponentTeamId: goals.opponentTeamId,
      teamId: goals.teamId,
      scorerId: goals.scorerId,
      assistId: goals.assistId,
      minute: goals.minute,
      notes: goals.notes,
      fieldDrawing: goals.fieldDrawing,
      goalCoordinates: goals.goalCoordinates,
      assistDrawing: supportsAssistDrawing ? goals.assistDrawing : sql<null>`null`,
      transitionDrawing: supportsTransitionDrawing ? goals.transitionDrawing : sql<null>`null`,
      attackingSpaceId: supportsAttackingSpace ? goals.attackingSpaceId : sql<null>`null`,
      moment: moments.name,
      subMoment: subMoments.name,
      action: actions.name,
      goalZoneId: goals.goalZoneId,
      scorerName: players.name,
      opponentName: teams.name,
      cornerTakerId: goals.cornerTakerId,
      freekickTakerId: goals.freekickTakerId,
      penaltyTakerId: goals.penaltyTakerId,
      crossAuthorId: goals.crossAuthorId
    })
    .from(goals)
    .leftJoin(moments, eq(goals.momentId, moments.id))
    .leftJoin(subMoments, eq(goals.subMomentId, subMoments.id))
    .leftJoin(actions, eq(goals.actionId, actions.id))
    .leftJoin(players, eq(goals.scorerId, players.id))
    .leftJoin(teams, eq(goals.opponentTeamId, teams.id))
    .where(eq(goals.teamId, teamId))
    .orderBy(desc(goals.id));

  if (rows.length === 0) return [];

  const referenceByGoalId = new Map<number, number | null>();
  if (await hasGoalsColumn("reference_player_id")) {
    const referenceRows = await db
      .select({
        goalId: goals.id,
        referencePlayerId: goals.referencePlayerId
      })
      .from(goals)
      .where(inArray(goals.id, rows.map((r) => r.id)));
    referenceRows.forEach((r) => referenceByGoalId.set(r.goalId, r.referencePlayerId ?? null));
  }
  const throwInTakerByGoalId = new Map<number, number | null>();
  if (await hasGoalsColumn("throw_in_taker_id")) {
    const throwInRows = await db
      .select({
        goalId: goals.id,
        throwInTakerId: goals.throwInTakerId
      })
      .from(goals)
      .where(inArray(goals.id, rows.map((r) => r.id)));
    throwInRows.forEach((r) => throwInTakerByGoalId.set(r.goalId, r.throwInTakerId ?? null));
  }

  const involvementRows = await db
    .select({
      goalId: goalInvolvements.goalId,
      playerId: goalInvolvements.playerId,
      role: goalInvolvements.role
    })
    .from(goalInvolvements)
    .where(inArray(goalInvolvements.goalId, rows.map((r) => r.id)));

  const grouped = new Map<number, typeof involvementRows>();
  involvementRows.forEach((row) => {
    const list = grouped.get(row.goalId) ?? [];
    list.push(row);
    grouped.set(row.goalId, list);
  });

  const actionRows =
    rows.length === 0
      ? []
      : await db
          .select({
            goalId: goalActions.goalId,
            actionId: goalActions.actionId,
            actionName: actions.name
          })
          .from(goalActions)
          .leftJoin(actions, eq(goalActions.actionId, actions.id))
          .where(inArray(goalActions.goalId, rows.map((r) => r.id)));

  const actionGrouped = new Map<
    number,
    { actionId: number; actionName: string | null }[]
  >();
  actionRows.forEach((row) => {
    const list = actionGrouped.get(row.goalId) ?? [];
    list.push({ actionId: row.actionId, actionName: row.actionName });
    actionGrouped.set(row.goalId, list);
  });

  const sequenceRows = supportsGoalSubMomentActions
    ? await db
        .select({
          goalId: goalSubMomentActions.goalId,
          subMomentId: goalSubMomentActions.subMomentId,
          subMomentName: subMoments.name,
          actionId: goalSubMomentActions.actionId,
          actionName: actions.name,
          sequenceOrder: goalSubMomentActions.sequenceOrder
        })
        .from(goalSubMomentActions)
        .leftJoin(subMoments, eq(goalSubMomentActions.subMomentId, subMoments.id))
        .leftJoin(actions, eq(goalSubMomentActions.actionId, actions.id))
        .where(inArray(goalSubMomentActions.goalId, rows.map((r) => r.id)))
        .orderBy(asc(goalSubMomentActions.sequenceOrder))
    : [];
  const sequenceGrouped = new Map<
    number,
    Array<{
      subMomentId: number;
      subMomentName: string | null;
      actionId: number;
      actionName: string | null;
      sequenceOrder: number;
    }>
  >();
  sequenceRows.forEach((row) => {
    const list = sequenceGrouped.get(row.goalId) ?? [];
    list.push({
      subMomentId: row.subMomentId,
      subMomentName: row.subMomentName,
      actionId: row.actionId,
      actionName: row.actionName,
      sequenceOrder: row.sequenceOrder
    });
    sequenceGrouped.set(row.goalId, list);
  });

  return rows.map((g) => {
    const actionsForGoal = actionGrouped.get(g.id) ?? [];
    const primaryActionName = actionsForGoal[0]?.actionName ?? (g as any).action;
    return {
      ...g,
      referencePlayerId: referenceByGoalId.get(g.id) ?? null,
      throwInTakerId: throwInTakerByGoalId.get(g.id) ?? null,
      action: primaryActionName,
      actions: actionsForGoal,
      actionIds: actionsForGoal.map((a) => a.actionId),
      subMomentSequence: sequenceGrouped.get(g.id) ?? [],
      involvements: grouped.get(g.id) ?? []
    };
  });
}

export async function getGoalById(goalId: number) {
  await ensureActionsContextColumn();
  await ensurePlayerProfileColumns();
  await ensureTeamMetadataColumns();
  await ensureGoalsStorageSchema();
  await ensureGoalActionsTable();
  await ensureGoalSubMomentActionsTable();

  const [supportsAssistDrawing, supportsTransitionDrawing, supportsAttackingSpace, supportsGoalSubMomentActions] = await Promise.all([
    hasGoalsColumn("assist_drawing"),
    hasGoalsColumn("transition_drawing"),
    hasGoalsColumn("attacking_space_id"),
    hasGoalSubMomentActionsTable()
  ]);
  const assistPlayer = alias(players, "assist_player");
  const cornerTaker = alias(players, "corner_taker");
  const freekickTaker = alias(players, "freekick_taker");
  const penaltyTaker = alias(players, "penalty_taker");
  const crossAuthor = alias(players, "cross_author");
  const foulSufferedBy = alias(players, "foul_suffered_by");
  const teamTable = alias(teams, "team_table");
  const invPlayer = alias(players, "inv_player");

  const row = await db
    .select({
      id: goals.id,
      opponentTeamId: goals.opponentTeamId,
      teamId: goals.teamId,
      scorerId: goals.scorerId,
      assistId: goals.assistId,
      minute: goals.minute,
      momentId: goals.momentId,
      subMomentId: goals.subMomentId,
      actionId: goals.actionId,
      momentName: moments.name,
      subMomentName: subMoments.name,
      actionName: actions.name,
      videoPath: goals.videoPath,
      fieldDrawing: goals.fieldDrawing,
      goalCoordinates: goals.goalCoordinates,
      assistCoordinates: goals.assistCoordinates,
      assistDrawing: supportsAssistDrawing ? goals.assistDrawing : sql<null>`null`,
      transitionDrawing: supportsTransitionDrawing ? goals.transitionDrawing : sql<null>`null`,
      attackingSpaceId: supportsAttackingSpace ? goals.attackingSpaceId : sql<null>`null`,
      cornerProfile: goals.cornerProfile,
      freekickProfile: goals.freekickProfile,
      throwInProfile: goals.throwInProfile,
      goalkeeperOutlet: goals.goalkeeperOutlet,
      notes: goals.notes,
      scorerName: players.name,
      opponentName: teams.name,
      teamName: teamTable.name,
      teamCoach: teamTable.coach,
      teamStadium: teamTable.stadium,
      teamPitchDimensions: teamTable.pitchDimensions,
      assistName: assistPlayer.name,
      cornerTakerName: cornerTaker.name,
      freekickTakerName: freekickTaker.name,
      penaltyTakerName: penaltyTaker.name,
      crossAuthorName: crossAuthor.name,
      foulSufferedByName: foulSufferedBy.name,
      cornerTakerId: goals.cornerTakerId,
      freekickTakerId: goals.freekickTakerId,
      penaltyTakerId: goals.penaltyTakerId,
      crossAuthorId: goals.crossAuthorId,
      foulSufferedById: goals.foulSufferedById,
      previousMomentDescription: goals.previousMomentDescription
    })
    .from(goals)
    .leftJoin(players, eq(goals.scorerId, players.id))
    .leftJoin(moments, eq(goals.momentId, moments.id))
    .leftJoin(subMoments, eq(goals.subMomentId, subMoments.id))
    .leftJoin(actions, eq(goals.actionId, actions.id))
    .leftJoin(assistPlayer, eq(goals.assistId, assistPlayer.id))
    .leftJoin(cornerTaker, eq(goals.cornerTakerId, cornerTaker.id))
    .leftJoin(freekickTaker, eq(goals.freekickTakerId, freekickTaker.id))
    .leftJoin(penaltyTaker, eq(goals.penaltyTakerId, penaltyTaker.id))
    .leftJoin(crossAuthor, eq(goals.crossAuthorId, crossAuthor.id))
    .leftJoin(foulSufferedBy, eq(goals.foulSufferedById, foulSufferedBy.id))
    .leftJoin(teams, eq(goals.opponentTeamId, teams.id))
    .leftJoin(teamTable, eq(goals.teamId, teamTable.id))
    .where(eq(goals.id, goalId))
    .limit(1);
  if (!row[0]) return null;

  let referencePlayerId: number | null = null;
  let referencePlayerName: string | null = null;
  if (await hasGoalsColumn("reference_player_id")) {
    const referencePlayer = alias(players, "reference_player");
    const referenceRow = await db
      .select({
        referencePlayerId: goals.referencePlayerId,
        referencePlayerName: referencePlayer.name
      })
      .from(goals)
      .leftJoin(referencePlayer, eq(goals.referencePlayerId, referencePlayer.id))
      .where(eq(goals.id, goalId))
      .limit(1);
    referencePlayerId = referenceRow[0]?.referencePlayerId ?? null;
    referencePlayerName = referenceRow[0]?.referencePlayerName ?? null;
  }
  let throwInTakerId: number | null = null;
  let throwInTakerName: string | null = null;
  if (await hasGoalsColumn("throw_in_taker_id")) {
    const throwInTaker = alias(players, "throw_in_taker");
    const throwInRow = await db
      .select({
        throwInTakerId: goals.throwInTakerId,
        throwInTakerName: throwInTaker.name
      })
      .from(goals)
      .leftJoin(throwInTaker, eq(goals.throwInTakerId, throwInTaker.id))
      .where(eq(goals.id, goalId))
      .limit(1);
    throwInTakerId = throwInRow[0]?.throwInTakerId ?? null;
    throwInTakerName = throwInRow[0]?.throwInTakerName ?? null;
  }

  const involvements = await db
    .select({
      goalId: goalInvolvements.goalId,
      playerId: goalInvolvements.playerId,
      role: goalInvolvements.role,
      playerName: invPlayer.name,
      photoPath: invPlayer.photoPath
    })
    .from(goalInvolvements)
    .leftJoin(invPlayer, eq(invPlayer.id, goalInvolvements.playerId))
    .where(eq(goalInvolvements.goalId, goalId));

  const actionsForGoal = await db
    .select({
      goalId: goalActions.goalId,
      actionId: goalActions.actionId,
      actionName: actions.name
    })
    .from(goalActions)
    .leftJoin(actions, eq(goalActions.actionId, actions.id))
    .where(eq(goalActions.goalId, goalId));

  const subMomentSequence = supportsGoalSubMomentActions
    ? await db
        .select({
          subMomentId: goalSubMomentActions.subMomentId,
          subMomentName: subMoments.name,
          actionId: goalSubMomentActions.actionId,
          actionName: actions.name,
          sequenceOrder: goalSubMomentActions.sequenceOrder
        })
        .from(goalSubMomentActions)
        .leftJoin(subMoments, eq(goalSubMomentActions.subMomentId, subMoments.id))
        .leftJoin(actions, eq(goalSubMomentActions.actionId, actions.id))
        .where(eq(goalSubMomentActions.goalId, goalId))
        .orderBy(asc(goalSubMomentActions.sequenceOrder))
    : [];

  return {
    ...row[0],
    referencePlayerId,
    referencePlayerName,
    throwInTakerId,
    throwInTakerName,
    foulVictimName: row[0].foulSufferedByName ?? null,
    actions: actionsForGoal,
    actionIds: actionsForGoal.map((a) => a.actionId),
    subMomentSequence,
    involvements
  };
}

async function upsertGoal(
  mode: "create" | "update",
  payload: unknown,
  existingGoalId?: number
) {
  await ensureActionsContextColumn();
  await ensurePlayerProfileColumns();
  await ensureTeamMetadataColumns();
  await ensureGoalsStorageSchema();
  await ensureGoalActionsTable();
  await ensureGoalSubMomentActionsTable();
  const normalized = await normalizeGoalPayload((payload ?? {}) as RawGoalPayload);
  const parsed = goalInputSchema.parse(normalized);

  const sequenceEntries = buildSequenceEntries(parsed);
  if (sequenceEntries.length === 0) {
    throw new Error("Sub-moment sequence is required");
  }

  const [
    supportsReferencePlayer,
    supportsThrowInTaker,
    supportsAssistDrawing,
    supportsTransitionDrawing,
    supportsAttackingSpace,
    supportsGoalSubMomentActions
  ] = await Promise.all([
    hasGoalsColumn("reference_player_id"),
    hasGoalsColumn("throw_in_taker_id"),
    hasGoalsColumn("assist_drawing"),
    hasGoalsColumn("transition_drawing"),
    hasGoalsColumn("attacking_space_id"),
    hasGoalSubMomentActionsTable()
  ]);

  const existingGoal =
    mode === "update" && existingGoalId
      ? await db.query.goals.findFirst({ where: eq(goals.id, existingGoalId) })
      : null;
  if (mode === "update") {
    if (!existingGoal) throw new Error("Goal not found");
    if (existingGoal.teamId !== parsed.teamId) throw new Error("Cannot move goal to another team");
  }

  const submittedInvolvements = parsed.involvements ?? [];
  const primaryPlayerId = submittedInvolvements[0]?.playerId ?? parsed.scorerId ?? null;
  if (!primaryPlayerId) {
    throw new Error("Seleciona pelo menos um jogador envolvido no golo sofrido");
  }
  const normalizedInvolvements =
    submittedInvolvements.length > 0
      ? submittedInvolvements.map((inv) => ({
          playerId: inv.playerId,
          role: "involvement" as const
        }))
      : [{ playerId: primaryPlayerId, role: "involvement" as const }];

  const [team, primaryPlayer, opponent, moment] = await Promise.all([
    db.query.teams.findFirst({ where: eq(teams.id, parsed.teamId) }),
    db.query.players.findFirst({ where: eq(players.id, primaryPlayerId) }),
    db.query.teams.findFirst({ where: eq(teams.id, parsed.opponentTeamId) }),
    db.query.moments.findFirst({ where: eq(moments.id, parsed.momentId) })
  ]);

  if (!team) throw new Error("Team not found");
  if (!opponent) throw new Error("Opponent team not found");
  if (opponent.id === parsed.teamId) throw new Error("Opponent cannot be the same as team");
  if (team.championshipId && opponent.championshipId && team.championshipId !== opponent.championshipId) {
    throw new Error("Opponent must belong to the same championship");
  }
  if (!primaryPlayer) throw new Error("Jogador envolvido nao encontrado");
  if (primaryPlayer.teamId !== parsed.teamId) throw new Error("Jogador envolvido tem de pertencer a equipa");
  if (!moment) throw new Error("Moment not found");

  const orderedSequenceEntries = [...sequenceEntries].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  const sequenceSubMomentIds = [...new Set(orderedSequenceEntries.map((entry) => entry.subMomentId))];
  const subMomentRows = await db
    .select({
      id: subMoments.id,
      name: subMoments.name,
      momentId: subMoments.momentId
    })
    .from(subMoments)
    .where(inArray(subMoments.id, sequenceSubMomentIds));
  if (subMomentRows.length !== sequenceSubMomentIds.length) throw new Error("Sub-moment not found");
  const subMomentById = new Map(subMomentRows.map((row) => [row.id, row]));

  orderedSequenceEntries.forEach((entry) => {
    const sequenceSubMoment = subMomentById.get(entry.subMomentId);
    if (!sequenceSubMoment) throw new Error("Sub-moment not found");
    if (sequenceSubMoment.momentId !== parsed.momentId) {
      throw new Error("Sub-moment does not match moment");
    }
  });

  const isDefensiveOrganizationMoment = isDefensiveOrganizationMomentName(moment.name);
  if (isDefensiveOrganizationMoment) {
    if (orderedSequenceEntries.length > DEFENSIVE_ORGANIZATION_SEQUENCE.length) {
      throw new Error("Organizacao Defensiva permite no maximo 4 fases.");
    }
  }

  const sequenceActionIds = [...new Set(orderedSequenceEntries.map((entry) => entry.actionId))];
  const requestedActionIds = isDefensiveOrganizationMoment
    ? sequenceActionIds
    : parsed.actionIds.length > 0
      ? [...new Set(parsed.actionIds)]
      : sequenceActionIds;
  const actionIdsToLookup = [...new Set([...requestedActionIds, ...sequenceActionIds])];
  const actionRows =
    actionIdsToLookup.length === 0
      ? []
      : await db
          .select({
            id: actions.id,
            name: actions.name,
            subMomentId: actions.subMomentId,
            context: actions.context
          })
          .from(actions)
          .where(inArray(actions.id, actionIdsToLookup));

  if (actionRows.length !== actionIdsToLookup.length) throw new Error("Action not found");
  const actionById = new Map(actionRows.map((row) => [row.id, row]));
  const requestedActionRows = requestedActionIds
    .map((actionId) => actionById.get(actionId))
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const normalizedMomentName = normalizeToken(moment.name);
  const isDefensiveTransitionMoment = normalizedMomentName === "transicao defensiva";
  let isDefensiveTransitionLoss = false;
  for (const entry of orderedSequenceEntries) {
    const sequenceSubMoment = subMomentById.get(entry.subMomentId);
    const sequenceAction = actionById.get(entry.actionId);
    if (!sequenceSubMoment || !sequenceAction) throw new Error("Sub-moment/action sequence invalida");

    const isTransitionLoss = isDefensiveTransitionMoment && isTransitionLossSubMomentName(sequenceSubMoment.name);
    const wrongSubMoment = sequenceAction.subMomentId !== entry.subMomentId;
    const canUseFallbackAction = isTransitionLoss && transitionActionWhitelist.has(normalizeTransitionActionName(sequenceAction.name));
    if (wrongSubMoment && !canUseFallbackAction) {
      throw new Error("All actions must belong to the selected sub-moment");
    }
    if (isTransitionLoss) isDefensiveTransitionLoss = true;
  }
  if (isDefensiveTransitionLoss && !parsed.attackingSpaceId) {
    throw new Error("Transicao Defensiva por perda requer a zona da perda.");
  }

  const requiresGoal = requestedActionRows.some((action) => action.context === "field_goal");
  const requiresField = requestedActionRows.length > 0;
  if (requiresField && !parsed.fieldDrawing) {
    throw new Error("Esta acao requer marcar o ponto no campo (field drawing obrigatorio).");
  }
  if (requiresGoal && !parsed.goalCoordinates) {
    throw new Error("Esta acao requer selecionar um ponto na baliza.");
  }

  const assistId = null;

  const primarySequenceEntry = orderedSequenceEntries[orderedSequenceEntries.length - 1];
  const primarySubMoment = subMomentById.get(primarySequenceEntry.subMomentId);
  if (!primarySubMoment) throw new Error("Primary sub-moment not found");

  const subName = normalizeToken(primarySubMoment.name);
  const actionNames = requestedActionRows.map((action) => normalizeToken(action.name));
  const isCorner = subName.includes("canto");
  const isFreeKick = subName.includes("livre");
  const isThrowIn = subName.includes("lancamento");
  const hasFoulSufferedAction = actionNames.some(
    (name) =>
      name.includes("falta sobre") ||
      name.includes("falta sofrida") ||
      name.includes("sofreu a falta")
  );

  async function validateTaker(playerId: number | null | undefined, label: string) {
    if (!playerId) throw new Error(`${label} e obrigatorio para esta jogada`);
    const p = await db.query.players.findFirst({ where: eq(players.id, playerId) });
    if (!p) throw new Error(`${label} nao encontrado`);
    if (p.teamId !== parsed.teamId) throw new Error(`${label} tem de pertencer a equipa`);
    return p.id;
  }

  const cornerTakerId = null;
  const freekickTakerId = null;
  const penaltyTakerId = null;
  const crossAuthorId = null;
  const throwInTakerId = null;
  const referencePlayerId = supportsReferencePlayer && parsed.referencePlayerId
    ? await validateTaker(parsed.referencePlayerId, "Jogador referencia")
    : null;
  const foulSufferedById = hasFoulSufferedAction
    ? await validateTaker(parsed.foulSufferedById, "Jogador que sofreu a falta")
    : null;
  const previousMomentDescription = parsed.previousMomentDescription?.toString().trim() || null;

  if (normalizedInvolvements.length > 0) {
    const duplicateRole = new Set<string>();
    for (const inv of normalizedInvolvements) {
      const key = `${inv.playerId}-${inv.role}`;
      if (duplicateRole.has(key)) throw new Error("Duplicate player role in involvements");
      duplicateRole.add(key);
    }
    const ids = [...new Set(normalizedInvolvements.map((i) => i.playerId))];
    if (ids.length > 0) {
      const involvementPlayers = await db
        .select({ id: players.id, teamId: players.teamId })
        .from(players)
        .where(inArray(players.id, ids));
      if (involvementPlayers.some((p) => p.teamId !== parsed.teamId)) {
        throw new Error("Involvement player does not belong to team");
      }
    }
  }

  const goalId = await db.transaction(async (tx) => {
    const goalValues: any = {
      opponentTeamId: parsed.opponentTeamId,
      teamId: parsed.teamId,
      scorerId: primaryPlayerId,
      assistId,
      minute: parsed.minute,
      momentId: parsed.momentId,
      subMomentId: primarySequenceEntry.subMomentId,
      actionId: primarySequenceEntry.actionId,
      goalZoneId: null,
      goalCoordinates: parsed.goalCoordinates ?? null,
      videoPath: parsed.videoPath || null,
      fieldDrawing: parsed.fieldDrawing ?? null,
      assistCoordinates: parsed.assistDrawing ?? parsed.assistCoordinates ?? null,
      cornerProfile: isCorner ? parsed.cornerProfile ?? null : null,
      freekickProfile: isFreeKick ? parsed.freekickProfile ?? null : null,
      throwInProfile: isThrowIn ? parsed.throwInProfile ?? null : null,
      goalkeeperOutlet: parsed.goalkeeperOutlet ?? null,
      notes: parsed.notes || null,
      cornerTakerId,
      freekickTakerId,
      penaltyTakerId,
      crossAuthorId,
      foulSufferedById,
      previousMomentDescription
    };
    if (supportsThrowInTaker) goalValues.throwInTakerId = throwInTakerId;
    if (supportsReferencePlayer) goalValues.referencePlayerId = referencePlayerId;
    if (supportsAssistDrawing) goalValues.assistDrawing = parsed.assistDrawing ?? null;
    if (supportsTransitionDrawing) goalValues.transitionDrawing = isDefensiveTransitionMoment ? parsed.transitionDrawing ?? null : null;
    if (supportsAttackingSpace) goalValues.attackingSpaceId = isDefensiveTransitionLoss ? parsed.attackingSpaceId ?? null : null;

    const [goalRow] =
      mode === "create"
        ? await tx.insert(goals).values(goalValues).returning({ id: goals.id })
        : await tx.update(goals).set(goalValues).where(eq(goals.id, existingGoalId as number)).returning({ id: goals.id });

    const currentGoalId = goalRow.id;

    await tx.delete(goalActions).where(eq(goalActions.goalId, currentGoalId));
    if (requestedActionIds.length > 0) {
      await tx.insert(goalActions).values(requestedActionIds.map((actionId) => ({ goalId: currentGoalId, actionId })));
    }

    if (supportsGoalSubMomentActions) {
      await tx.delete(goalSubMomentActions).where(eq(goalSubMomentActions.goalId, currentGoalId));
      await tx.insert(goalSubMomentActions).values(
        orderedSequenceEntries.map((entry) => ({
          goalId: currentGoalId,
          subMomentId: entry.subMomentId,
          actionId: entry.actionId,
          sequenceOrder: entry.sequenceOrder
        }))
      );
    }

    await tx.delete(goalInvolvements).where(eq(goalInvolvements.goalId, currentGoalId));
    if (normalizedInvolvements.length > 0) {
      await tx.insert(goalInvolvements).values(
        normalizedInvolvements.map((inv) => ({
          goalId: currentGoalId,
          playerId: inv.playerId,
          role: inv.role
        }))
      );
    }

    return currentGoalId;
  });

  return goalId;
}

export async function createGoal(payload: unknown) {
  return upsertGoal("create", payload);
}

export async function updateGoal(id: number, payload: unknown) {
  return upsertGoal("update", payload, id);
}

export async function deleteGoal(goalId: number) {
  await ensureGoalsStorageSchema();
  await ensureGoalActionsTable();
  await ensureGoalSubMomentActionsTable();

  const existingGoal = await db.query.goals.findFirst({
    where: eq(goals.id, goalId),
    columns: { id: true }
  });
  if (!existingGoal) {
    throw new Error("Goal not found");
  }

  const supportsGoalSubMomentActions = await hasGoalSubMomentActionsTable();
  await db.transaction(async (tx) => {
    if (supportsGoalSubMomentActions) {
      await tx.delete(goalSubMomentActions).where(eq(goalSubMomentActions.goalId, goalId));
    }
    await tx.delete(goalActions).where(eq(goalActions.goalId, goalId));
    await tx.delete(goalInvolvements).where(eq(goalInvolvements.goalId, goalId));
    await tx.delete(goals).where(eq(goals.id, goalId));
  });

  return goalId;
}
