export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth";
import { createTeam, listTeamsWithMeta } from "@/server/admin";

export async function GET() {
  await requireUser();
  const data = await listTeamsWithMeta();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  await requireUser();

  try {
    const json = await req.json();
    const team = await createTeam(json);
    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    const status = error instanceof ZodError ? 400 : 500;
    const message = error instanceof ZodError ? error.flatten() : (error as Error).message;
    return NextResponse.json({ error: message }, { status });
  }
}
