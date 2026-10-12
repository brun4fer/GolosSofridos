export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getLookups } from "@/server/lookups";

export async function GET(request: Request) {
  await requireUser();

  const includeInactive = new URL(request.url).searchParams.get("includeInactive") === "1";
  const data = await getLookups({ includeInactive });
  return NextResponse.json(data);
}

