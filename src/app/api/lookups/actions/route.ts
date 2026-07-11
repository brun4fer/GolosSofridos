export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { actions, goalActions, goals, goalSubMomentActions } from "@/schema/schema";
import { ensureActionsContextColumn } from "@/server/schema-maintenance";

const schema = z.object({
  subMomentId: z.number().int().positive(),
  name: z.string().min(2),
  context: z.enum(["field", "field_goal"]).default("field")
});

export async function POST(req: Request) {
  try {
    await ensureActionsContextColumn();
    const body = schema.parse(await req.json());
    const existing = await db.query.actions.findFirst({
      where: (fields, { and, eq }) => and(eq(fields.subMomentId, body.subMomentId), eq(fields.name, body.name))
    });
    if (existing) return NextResponse.json(existing);
    const [created] = await db.insert(actions).values({ subMomentId: body.subMomentId, name: body.name, context: body.context }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const status = error instanceof ZodError ? 400 : 500;
    const message = error instanceof ZodError ? error.flatten() : (error as Error).message;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    const id = z.number().int().positive().parse(Number(new URL(req.url).searchParams.get("id")));
    const action = await db.query.actions.findFirst({ where: (fields, { eq }) => eq(fields.id, id) });
    if (!action) return NextResponse.json({ error: "A ação não existe." }, { status: 404 });

    const [directGoal, linkedGoal, sequencedGoal] = await Promise.all([
      db.query.goals.findFirst({ where: eq(goals.actionId, id), columns: { id: true } }),
      db.query.goalActions.findFirst({ where: eq(goalActions.actionId, id), columns: { id: true } }),
      db.query.goalSubMomentActions.findFirst({
        where: eq(goalSubMomentActions.actionId, id),
        columns: { id: true }
      })
    ]);
    if (directGoal || linkedGoal || sequencedGoal) {
      return NextResponse.json(
        { error: "Esta ação está associada a golos e não pode ser eliminada." },
        { status: 409 }
      );
    }

    await db.delete(actions).where(eq(actions.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = error instanceof ZodError ? 400 : 500;
    const message = error instanceof ZodError ? "Identificador de ação inválido." : (error as Error).message;
    return NextResponse.json({ error: message }, { status });
  }
}
