"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { allMedia, assetFromFile, getMedia, putMedia, uniqueMedia, type MediaAsset } from "@/lib/media";
import { type Publication } from "@/lib/calendar";
import { AssetPreview } from "../media-library";
import { LinkMediaPreview } from "../link-media-preview";
import { ratioFromMetadata } from "./model";

/** Where PostMedia reads library files from: the panel's library by default; the approval page passes its own token-scoped source. */
export const MediaSource = createContext<(id: string) => Promise<MediaAsset | undefined>>(getMedia);

/** One library file, or (without `mediaId`) the post's cover file or linked media. Reports the real width/height ratio when it can be measured. */
export function PostMedia({ post, mediaId = post.mediaId, thumbnail = false, onRatio }: { post: Publication; mediaId?: string; thumbnail?: boolean; onRatio?: (ratio: number | null) => void }) {
  const source = useContext(MediaSource);
  const [asset, setAsset] = useState<MediaAsset | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (!mediaId) return;
    let active = true;
    void source(mediaId).then(found => { if (active) { setAsset(found || null); setMissing(!found); } }).catch(() => { if (active) setMissing(true); });
    return () => { active = false; };
  }, [mediaId, source]);
  const link = post.imageUrl.trim() || post.referenceUrl.trim();
  if (mediaId) {
    if (missing) return <p className="cmp-media-note">El archivo no está disponible en este navegador.</p>;
    if (!asset || asset.id !== mediaId) return <p className="cmp-media-note">Cargando archivo…</p>;
    return <AssetPreview key={asset.id} asset={asset} thumbnail={thumbnail} onMetadata={value => onRatio?.(ratioFromMetadata(value))} />;
  }
  return link ? <LinkMediaPreview key={link} url={link} title={post.title} /> : null;
}

/** Saves files to the library for this brand and returns the assets to attach, in order (existing copies for duplicates). */
export async function uploadToLibrary(files: File[], brand: string): Promise<{ assets: MediaAsset[]; message: string }> {
  const scope = brand || "Mi marca";
  const incoming = files.map(file => assetFromFile(file, scope));
  const existing = (await allMedia()).filter(item => item.brand === scope);
  const { accepted } = await uniqueMedia(incoming, existing);
  await putMedia(accepted);
  // Files already in the library are reused instead of failing.
  const assets = incoming.map(item => accepted.find(asset => asset.id === item.id) || existing.find(asset => asset.name === item.name && asset.size === item.size)).filter((asset): asset is MediaAsset => !!asset);
  const reused = assets.length - accepted.length;
  if (!assets.length) return { assets, message: incoming.length ? "Ese archivo ya está en la biblioteca con otro nombre. Elígelo desde la biblioteca." : "No se subió ningún archivo." };
  const skipped = incoming.length - assets.length;
  return { assets, message: [
    accepted.length ? `${accepted.length} ${accepted.length === 1 ? "archivo subido" : "archivos subidos"} a la biblioteca.` : "",
    reused ? `${reused} ya ${reused === 1 ? "estaba" : "estaban"} en la biblioteca; se usa la copia existente.` : "",
    skipped ? `${skipped} duplicado${skipped === 1 ? "" : "s"} con otro nombre: elígelo desde la biblioteca.` : "",
  ].filter(Boolean).join(" ") };
}
