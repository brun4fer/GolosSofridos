export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listTeams } from "@/server/catalog";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const championshipParam = searchParams.get("championshipId");
  const seasonParam = searchParams.get("seasonId");
  const parsedChamp = championshipParam ? Number(championshipParam) : undefined;
  const parsedSeason = seasonParam ? Number(seasonParam) : undefined;
  const championshipId = parsedChamp !== undefined && !Number.isNaN(parsedChamp) ? parsedChamp : undefined;
  const seasonId = parsedSeason !== undefined && !Number.isNaN(parsedSeason) ? parsedSeason : undefined;

  const teams = await listTeams(championshipId, seasonId);
  return NextResponse.json(teams);
}
