export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { and, eq, inArray, max, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { actions, subMoments } from "@/schema/schema";
import { requireUser } from "@/lib/auth";

const schema = z.object({
  subMomentId: z.number().int().positive(),
  name: z.string().trim().min(2),
  context: z.enum(["field", "field_goal"]).default("field")
});

export async function POST(req: Request) {
  const user = await requireUser();

  try {
    const body = schema.parse(await req.json());
    const subMoment = await db.query.subMoments.findFirst({ where: eq(subMoments.id, body.subMomentId) });
    if (!subMoment) return NextResponse.json({ error: "Phase not found" }, { status: 404 });
    const existing = await db
      .select()
      .from(actions)
      .where(and(eq(actions.workspaceId, user.workspaceId), eq(actions.subMomentId, body.subMomentId), sql`lower(${actions.name}) = lower(${body.name})`))
      .limit(1);
    if (existing[0]) {
      const [restored] = await db.update(actions).set({ isActive: true, context: body.context }).where(eq(actions.id, existing[0].id)).returning();
      return NextResponse.json(restored);
    }
    const [last] = await db.select({ value: max(actions.sortOrder) }).from(actions).where(and(eq(actions.workspaceId, user.workspaceId), eq(actions.subMomentId, body.subMomentId)));
    const [created] = await db.insert(actions).values({ workspaceId: user.workspaceId, subMomentId: body.subMomentId, name: body.name, context: body.context, sortOrder: Number(last?.value ?? 0) + 1 }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const status = error instanceof ZodError ? 400 : 500;
    return NextResponse.json({ error: error instanceof ZodError ? error.flatten() : (error as Error).message }, { status });
  }
}

const reorderSchema = z.object({ subMomentId: z.number().int().positive(), orderedIds: z.array(z.number().int().positive()).min(1) });

export async function PATCH(req: Request) {
  const user = await requireUser();

  try {
    const body = reorderSchema.parse(await req.json());
    const rows = await db.select({ id: actions.id, subMomentId: actions.subMomentId }).from(actions).where(and(eq(actions.workspaceId, user.workspaceId), inArray(actions.id, body.orderedIds)));
    if (rows.length !== body.orderedIds.length || rows.some((row) => row.subMomentId !== body.subMomentId)) {
      return NextResponse.json({ error: "All actions must belong to this phase" }, { status: 400 });
    }
    await db.transaction(async (tx) => {
      for (const [index, id] of body.orderedIds.entries()) {
        await tx.update(actions).set({ sortOrder: index + 1 }).where(and(eq(actions.id, id), eq(actions.workspaceId, user.workspaceId)));
      }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof ZodError ? 400 : 500;
    return NextResponse.json({ error: error instanceof ZodError ? error.flatten() : (error as Error).message }, { status });
  }
}
