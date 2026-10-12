import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { actions, championships, goals, players, seasons, teams } from "@/schema";
import { getWorkspaceId } from "@/lib/auth";

export async function requireOwnedSeason(id: number) {
  const workspaceId = await getWorkspaceId();
  const rows = await db.select().from(seasons).where(and(eq(seasons.id, id), eq(seasons.workspaceId, workspaceId))).limit(1);
  if (!rows[0]) throw new Error("Season not found");
  return rows[0];
}

export async function requireOwnedChampionship(id: number) {
  const workspaceId = await getWorkspaceId();
  const rows = await db
    .select()
    .from(championships)
    .where(and(eq(championships.id, id), eq(championships.workspaceId, workspaceId)))
    .limit(1);
  if (!rows[0]) throw new Error("Competition not found");
  return rows[0];
}

export async function requireOwnedTeam(id: number) {
  const workspaceId = await getWorkspaceId();
  const rows = await db.select().from(teams).where(and(eq(teams.id, id), eq(teams.workspaceId, workspaceId))).limit(1);
  if (!rows[0]) throw new Error("Team not found");
  return rows[0];
}

export async function requireOwnedPlayer(id: number) {
  const workspaceId = await getWorkspaceId();
  const rows = await db
    .select({ id: players.id, teamId: players.teamId, workspaceId: teams.workspaceId })
    .from(players)
    .innerJoin(teams, eq(players.teamId, teams.id))
    .where(and(eq(players.id, id), eq(teams.workspaceId, workspaceId)))
    .limit(1);
  if (!rows[0]) throw new Error("Player not found");
  return rows[0];
}

export async function requireOwnedGoal(id: number) {
  const workspaceId = await getWorkspaceId();
  const rows = await db
    .select({ id: goals.id, teamId: goals.teamId, workspaceId: teams.workspaceId })
    .from(goals)
    .innerJoin(teams, eq(goals.teamId, teams.id))
    .where(and(eq(goals.id, id), eq(teams.workspaceId, workspaceId)))
    .limit(1);
  if (!rows[0]) throw new Error("Goal not found");
  return rows[0];
}

export async function requireOwnedAction(id: number) {
  const workspaceId = await getWorkspaceId();
  const rows = await db
    .select()
    .from(actions)
    .where(and(eq(actions.id, id), eq(actions.workspaceId, workspaceId)))
    .limit(1);
  if (!rows[0]) throw new Error("Action not found");
  return rows[0];
}
