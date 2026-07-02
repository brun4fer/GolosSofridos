import { asc, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { moments, subMoments, actions, championships, teams, seasons } from "../schema/schema";
import { ensureActionsContextColumn, ensureTeamMetadataColumns } from "./schema-maintenance";

const normalizeToken = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const DEFENSIVE_ORGANIZATION_MOMENT = "organizacao defensiva";
const DEFENSIVE_ORGANIZATION_TARGET_SUB_MOMENTS = new Set(["construcao", "criacao", "finalizacao"]);
const DEFENSIVE_ORGANIZATION_LAUNCH_ACTION = "Lançamento para organização";

export async function ensureDefensiveTaxonomyNames() {
  try {
    await db.execute(sql`
      UPDATE "moments"
      SET "name" = 'Organização Defensiva'
      WHERE "name" IN ('Organização Ofensiva', 'Organizacao Ofensiva')
        AND NOT EXISTS (SELECT 1 FROM "moments" WHERE "name" = 'Organização Defensiva')
    `);
    await db.execute(sql`
      UPDATE "moments"
      SET "name" = 'Transição Defensiva'
      WHERE "name" IN ('Transição Ofensiva', 'Transicao Ofensiva')
        AND NOT EXISTS (SELECT 1 FROM "moments" WHERE "name" = 'Transição Defensiva')
    `);
    await db.execute(sql`
      UPDATE "moments"
      SET "name" = 'Bolas Paradas Defensivas'
      WHERE "name" IN ('Bolas Paradas', 'Bola Parada Ofensiva', 'Bola Parada Ofensiva (BPO)')
        AND NOT EXISTS (SELECT 1 FROM "moments" WHERE "name" = 'Bolas Paradas Defensivas')
    `);
    await db.execute(sql`
      UPDATE "sub_moments" sm
      SET "name" = 'Perda no meio campo próprio'
      WHERE sm."name" IN ('Recuperação meio campo defensivo', 'Recuperacao meio campo defensivo')
        AND NOT EXISTS (
          SELECT 1 FROM "sub_moments" sibling
          WHERE sibling."moment_id" = sm."moment_id"
            AND sibling."name" = 'Perda no meio campo próprio'
        )
    `);
    await db.execute(sql`
      UPDATE "sub_moments" sm
      SET "name" = 'Perda no meio campo adversário'
      WHERE sm."name" IN ('Recuperação meio campo ofensivo', 'Recuperacao meio campo ofensivo')
        AND NOT EXISTS (
          SELECT 1 FROM "sub_moments" sibling
          WHERE sibling."moment_id" = sm."moment_id"
            AND sibling."name" = 'Perda no meio campo adversário'
        )
    `);
  } catch {
    // Se a normalização falhar, os seeds/migrations continuam a ser a fonte principal da taxonomia.
  }
}

async function ensureDefensiveOrganizationLaunchAction(params: {
  momentsRows: Array<{ id: number; name: string }>;
  subMomentRows: Array<{ id: number; name: string; momentId: number }>;
}) {
  const defensiveOrganizationMomentIds = params.momentsRows
    .filter((moment) => normalizeToken(moment.name) === DEFENSIVE_ORGANIZATION_MOMENT)
    .map((moment) => moment.id);

  if (defensiveOrganizationMomentIds.length === 0) return;

  const targetSubMomentIds = params.subMomentRows
    .filter(
      (subMoment) =>
        defensiveOrganizationMomentIds.includes(subMoment.momentId) &&
        DEFENSIVE_ORGANIZATION_TARGET_SUB_MOMENTS.has(normalizeToken(subMoment.name))
    )
    .map((subMoment) => subMoment.id);

  if (targetSubMomentIds.length === 0) return;

  await db
    .insert(actions)
    .values(
      targetSubMomentIds.map((subMomentId) => ({
        subMomentId,
        name: DEFENSIVE_ORGANIZATION_LAUNCH_ACTION,
        context: "field" as const
      }))
    )
    .onConflictDoNothing({ target: [actions.subMomentId, actions.name] });
}

export async function getLookups() {
  await ensureActionsContextColumn();
  await ensureTeamMetadataColumns();
  await ensureDefensiveTaxonomyNames();

  const [momentsRows, subMomentRows, championshipRows, teamRows, seasonRows] = await Promise.all([
    db.select().from(moments).orderBy(asc(moments.name)),
    db.select().from(subMoments).orderBy(asc(subMoments.name)),
    db.select().from(championships).orderBy(asc(championships.name)),
    db
      .select({
        id: teams.id,
        name: teams.name,
        championshipId: teams.championshipId,
        championshipName: championships.name,
        seasonId: championships.seasonId
      })
      .from(teams)
      .innerJoin(championships, eq(teams.championshipId, championships.id))
      .orderBy(asc(teams.name)),
    db.select().from(seasons).orderBy(asc(seasons.name))
  ]);

  await ensureDefensiveOrganizationLaunchAction({ momentsRows, subMomentRows });
  const actionRows = await db.select().from(actions).orderBy(asc(actions.name));

  return {
    moments: momentsRows,
    subMoments: subMomentRows,
    actions: actionRows,
    championships: championshipRows,
    teams: teamRows,
    seasons: seasonRows
  };
}
