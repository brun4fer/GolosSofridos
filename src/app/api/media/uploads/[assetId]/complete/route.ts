export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { completeMediaAsset, getMediaAsset, serializeMediaAsset } from "@/lib/media-library";
import { headMediaObject } from "@/lib/media-r2";
import { ensureMediaWorkspace } from "@/lib/media-workspace";

export async function POST(_: Request, { params }: { params: { assetId: string } }) {
  const user = await requireUser();

  try {
    const { mediaWorkspace } = await ensureMediaWorkspace(user);
    const asset = await getMediaAsset(mediaWorkspace.id, params.assetId);
    if (!asset) return NextResponse.json({ error: "Video nao encontrado nesta conta." }, { status: 404 });
    const object = await headMediaObject(asset.storageKey);
    if (object.contentLength !== Number(asset.fileSize)) return NextResponse.json({ error: "O tamanho enviado nao corresponde ao ficheiro selecionado." }, { status: 409 });
    const completed = await completeMediaAsset(mediaWorkspace.id, asset.id, object.etag);
    return NextResponse.json({ asset: serializeMediaAsset(completed!) });
  } catch (error) {
    console.error("[media-upload-complete]", error);
    return NextResponse.json({ error: "Nao foi possivel concluir o upload." }, { status: 500 });
  }
}
