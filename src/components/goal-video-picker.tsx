"use client";

import { useRef, useState } from "react";
import { Cloud, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type MediaAsset = { id: string; fileName: string; fileSize: string; durationSeconds: number };
type Props = { mediaAssetId?: string | null; legacyPath?: string; onChange: (value: { mediaAssetId: string | null; legacyPath: string }) => void };

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Pedido sem sucesso.");
  return payload as T;
}

function videoDuration(file: File) {
  return new Promise<number>((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const finish = (value: number) => { URL.revokeObjectURL(url); video.removeAttribute("src"); resolve(Number.isFinite(value) ? value : 0); };
    video.preload = "metadata";
    video.onloadedmetadata = () => finish(video.duration);
    video.onerror = () => finish(0);
    video.src = url;
  });
}

function putFile(url: string, file: File, onProgress: (value: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => event.lengthComputable && onProgress(event.loaded / event.total);
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload falhou (${xhr.status}).`));
    xhr.onerror = () => reject(new Error(`O browser bloqueou o envio para o armazenamento privado. Confirma a configuracao CORS do R2: permite a origem ${window.location.origin}, o metodo PUT e o cabecalho Content-Type.`));
    xhr.ontimeout = () => reject(new Error("O envio do video excedeu o tempo limite."));
    xhr.timeout = 10 * 60 * 1000;
    xhr.send(file);
  });
}

function formatBytes(raw: string) {
  const bytes = Number(raw);
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

export function GoalVideoPicker({ mediaAssetId, legacyPath = "", onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null); setUploading(true); setProgress(0);
    try {
      if (!file.type.startsWith("video/")) throw new Error("Seleciona um ficheiro de video.");
      const created = await requestJson<{ asset: MediaAsset; uploadUrl: string }>("/api/media/uploads", { method: "POST", body: JSON.stringify({ fileName: file.name, fileSize: file.size, durationSeconds: await videoDuration(file), mimeType: file.type, lastModified: file.lastModified }) });
      await putFile(created.uploadUrl, file, setProgress);
      const completed = await requestJson<{ asset: MediaAsset }>(`/api/media/uploads/${created.asset.id}/complete`, { method: "POST" });
      setSelectedName(completed.asset.fileName);
      onChange({ mediaAssetId: completed.asset.id, legacyPath: "" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Nao foi possivel enviar o video."); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  async function openLibrary() {
    setLibraryOpen(true); setLibraryLoading(true); setError(null);
    try { setAssets((await requestJson<{ assets: MediaAsset[] }>("/api/media-library")).assets); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Nao foi possivel abrir a biblioteca."); }
    finally { setLibraryLoading(false); }
  }

  const attached = Boolean(mediaAssetId || legacyPath);
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>{uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}{uploading ? `${Math.round(progress * 100)}%` : attached ? "Substituir video" : "Enviar video"}</Button>
      <Button type="button" variant="secondary" size="sm" disabled={uploading} onClick={() => void openLibrary()}><Cloud className="mr-1 h-4 w-4" />Biblioteca privada</Button>
      {attached && <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedName(null); onChange({ mediaAssetId: null, legacyPath: "" }); }}><X className="mr-1 h-4 w-4" />Remover</Button>}
    </div>
    {(selectedName || legacyPath) && <p className="break-all text-xs text-muted-foreground">{selectedName || legacyPath.split("/").pop()}</p>}
    <p className="text-xs text-muted-foreground">Os videos ficam privados e visiveis apenas nesta conta.</p>
    {error && <p className="text-xs text-destructive">{error}</p>}
    <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
    {libraryOpen && <div className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4" onMouseDown={() => setLibraryOpen(false)}><div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-[#0b1220]" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-border/60 p-5"><div><p className="text-xs uppercase tracking-[.2em] text-cyan-300">Biblioteca privada</p><h3 className="mt-1 text-lg font-semibold">Escolher video existente</h3></div><button type="button" onClick={() => setLibraryOpen(false)} aria-label="Fechar"><X className="h-5 w-5" /></button></div><div className="max-h-[58vh] overflow-y-auto p-4">{libraryLoading ? <div className="py-16 text-center text-sm text-muted-foreground">A carregar...</div> : assets.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">Ainda nao existem videos.</div> : <div className="space-y-2">{assets.map((asset) => <button type="button" key={asset.id} className="flex w-full justify-between rounded-xl border border-border/60 p-4 text-left hover:border-cyan-300/40" onClick={() => { setSelectedName(asset.fileName); onChange({ mediaAssetId: asset.id, legacyPath: "" }); setLibraryOpen(false); }}><span><span className="block font-semibold">{asset.fileName}</span><span className="text-xs text-muted-foreground">{formatBytes(asset.fileSize)}</span></span><Cloud className="h-4 w-4 text-cyan-300" /></button>)}</div>}</div></div></div>}
  </div>;
}
