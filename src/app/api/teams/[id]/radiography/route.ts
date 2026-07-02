export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getRadiography, type RadiographyBpdCategory } from "@/server/radiography";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const teamId = Number(params.id);
  if (Number.isNaN(teamId)) return NextResponse.json({ error: "Invalid team id" }, { status: 400 });
  try {
    const url = new URL(_.url);
    const rawMomentId = url.searchParams.get("momentId");
    let momentId: number | undefined;
    if (rawMomentId !== null && rawMomentId.trim() !== "") {
      const parsedMomentId = Number(rawMomentId);
      if (Number.isNaN(parsedMomentId)) {
        return NextResponse.json({ error: "Invalid moment id" }, { status: 400 });
      }
      momentId = parsedMomentId;
    }
    const rawBpdCategory = url.searchParams.get("bpdCategory");
    const validBpdCategories: RadiographyBpdCategory[] = [
      "corners",
      "free_kicks",
      "direct_free_kicks",
      "throw_ins"
    ];
    let bpdCategory: RadiographyBpdCategory | undefined;
    if (rawBpdCategory !== null && rawBpdCategory.trim() !== "") {
      if (!validBpdCategories.includes(rawBpdCategory as RadiographyBpdCategory)) {
        return NextResponse.json({ error: "Invalid bpd category" }, { status: 400 });
      }
      bpdCategory = rawBpdCategory as RadiographyBpdCategory;
    }
    const data = await getRadiography(teamId, { momentId, bpdCategory });
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

