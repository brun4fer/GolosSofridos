export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { listChampionships } from "@/server/catalog";

export async function GET() {
  await requireUser();
  const championships = await listChampionships();
  return NextResponse.json(championships);
}

