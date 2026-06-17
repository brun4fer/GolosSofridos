import { db } from "../db/client";
import { championships, players, seasons, teams } from "../schema/schema";
import { and, eq, asc } from "drizzle-orm";
import { ensurePlayerProfileColumns, ensureTeamMetadataColumns } from "./schema-maintenance";

export async function listChampionships() {
  return db
    .select({
      id: championships.id,
      name: championships.name,
      seasonId: championships.seasonId
    })
    .from(championships)
    .orderBy(asc(championships.name));
}

export async function listTeams(championshipId?: number, seasonId?: number) {
  await ensureTeamMetadataColumns();

  const base = db
    .select({
      id: teams.id,
      name: teams.name,
      championshipId: teams.championshipId,
      championshipName: championships.name,
      seasonId: championships.seasonId,
      seasonName: seasons.name,
      emblemPath: teams.emblemPath,
      radiographyPdfUrl: teams.radiographyPdfUrl,
      videoReportUrl: teams.videoReportUrl,
      stadium: teams.stadium,
      coach: teams.coach,
      pitchDimensions: teams.pitchDimensions,
      pitchRating: teams.pitchRating
    })
    .from(teams)
    .innerJoin(championships, eq(teams.championshipId, championships.id))
    .innerJoin(seasons, eq(championships.seasonId, seasons.id));

  const filters = [];
  if (championshipId) filters.push(eq(teams.championshipId, championshipId));
  if (seasonId) filters.push(eq(championships.seasonId, seasonId));

  const scoped = filters.length > 0 ? base.where(filters.length === 1 ? filters[0] : and(...filters)) : base;

  return scoped.orderBy(asc(teams.name));
}

export async function listPlayers(teamId: number) {
  await ensurePlayerProfileColumns();

  return db
    .select({
      id: players.id,
      name: players.name,
      teamId: players.teamId,
      photoPath: players.photoPath,
      primaryPosition: players.primaryPosition,
      secondaryPosition: players.secondaryPosition,
      tertiaryPosition: players.tertiaryPosition,
      dominantFoot: players.dominantFoot,
      heightCm: players.heightCm,
      weightKg: players.weightKg
    })
    .from(players)
    .where(eq(players.teamId, teamId))
    .orderBy(asc(players.name));
}
