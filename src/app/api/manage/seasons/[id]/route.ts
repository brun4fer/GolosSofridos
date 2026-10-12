export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth";
import { deleteSeason, updateSeason } from "@/server/admin";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await requireUser();

  try {
    const body = await req.json();
    const updated = await updateSeason(Number(params.id), body);
    return NextResponse.json(updated);
  } catch (error) {
    const status = error instanceof ZodError ? 400 : 500;
    const message = error instanceof ZodError ? error.flatten() : (error as Error).message;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await requireUser();
  await deleteSeason(Number(params.id));
  return NextResponse.json({ ok: true });
}
