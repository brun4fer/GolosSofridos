import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { actions, championships, moments, seasons, subMoments, teams } from "../schema/schema";
import { getWorkspaceId } from "@/lib/auth";

export async function getLookups(options: { includeInactive?: boolean } = {}) {
  const workspaceId = await getWorkspaceId();
  const [momentRows, subMomentRows, actionRows, championshipRows, teamRows, seasonRows] = await Promise.all([
    db.select().from(moments).orderBy(asc(moments.id)),
    db.select().from(subMoments).orderBy(asc(subMoments.id)),
    db
      .select()
      .from(actions)
      .where(
        options.includeInactive
          ? eq(actions.workspaceId, workspaceId)
          : and(eq(actions.workspaceId, workspaceId), eq(actions.isActive, true))
      )
      .orderBy(asc(actions.subMomentId), asc(actions.sortOrder), asc(actions.id)),
    db.select().from(championships).where(eq(championships.workspaceId, workspaceId)).orderBy(asc(championships.name)),
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
      .where(eq(teams.workspaceId, workspaceId))
      .orderBy(asc(teams.name)),
    db.select().from(seasons).where(eq(seasons.workspaceId, workspaceId)).orderBy(asc(seasons.name))
  ]);

  return {
    moments: momentRows,
    subMoments: subMomentRows,
    actions: actionRows,
    championships: championshipRows,
    teams: teamRows,
    seasons: seasonRows
  };
}
