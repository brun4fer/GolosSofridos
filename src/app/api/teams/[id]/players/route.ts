export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { listPlayers } from "@/server/catalog";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await requireUser();

  const teamId = Number(params.id);
  if (!Number.isFinite(teamId) || teamId <= 0) {
    return NextResponse.json({ error: "Invalid team id" }, { status: 400 });
  }
  const players = await listPlayers(teamId);
  return NextResponse.json(players);
}
