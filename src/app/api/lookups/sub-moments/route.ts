export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
export async function POST() {
  await requireUser();
  return NextResponse.json({ error: "Sub-moments are fixed and cannot be added." }, { status: 405 });
}
