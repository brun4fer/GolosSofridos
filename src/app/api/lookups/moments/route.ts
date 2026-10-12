export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { requireUser } from "@/lib/auth";

export async function GET() {
  await requireUser();
  const rows = await db.query.moments.findMany({
    columns: { id: true, name: true },
    orderBy: (fields, { asc }) => [asc(fields.name)]
  });
  return NextResponse.json(rows);
}

export async function POST() {
  await requireUser();
  return NextResponse.json({ error: "Moments are fixed and cannot be added." }, { status: 405 });
}
