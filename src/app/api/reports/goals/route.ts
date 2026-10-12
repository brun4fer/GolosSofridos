export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { requireUser } from "@/lib/auth";
import { getGoalReports } from "@/server/reports";

const optionalNumber = z.preprocess((value) => value === null || value === "" || value === undefined ? undefined : Number(value), z.number().int().nonnegative().optional());
const schema = z.object({
  seasonId: optionalNumber, championshipId: optionalNumber, teamId: optionalNumber, opponentTeamId: optionalNumber,
  momentId: optionalNumber, subMomentId: optionalNumber, actionId: optionalNumber, involvedPlayerId: optionalNumber,
  minuteFrom: optionalNumber, minuteTo: optionalNumber,
  attackDirection: z.enum(["left_to_right", "right_to_left"]).optional(),
  hasVideo: z.preprocess((value) => value === "true" ? true : value === "false" ? false : undefined, z.boolean().optional())
});

export async function GET(request: Request) {
  await requireUser();

  try {
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    return NextResponse.json(await getGoalReports(schema.parse(params)));
  } catch (error) {
    return NextResponse.json({ error: error instanceof ZodError ? error.flatten() : (error as Error).message }, { status: error instanceof ZodError ? 400 : 500 });
  }
}
