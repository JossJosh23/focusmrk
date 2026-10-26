"use client";

import { useEffect, useState } from "react";
import { allMedia, assetFromFile, getMedia, putMedia, uniqueMedia, type MediaAsset } from "@/lib/media";
import { type Publication } from "@/lib/calendar";
import { AssetPreview } from "../media-library";
import { LinkMediaPreview } from "../link-media-preview";
import { ratioFromMetadata } from "./model";

/** The post's uploaded file or linked media. Reports the real width/height ratio when it can be measured. */
export function PostMedia({ post, thumbnail = false, onRatio }: { post: Publication; thumbnail?: boolean; onRatio?: (ratio: number | null) => void }) {
  const [asset, setAsset] = useState<MediaAsset | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (!post.mediaId) return;
    let active = true;
    void getMedia(post.mediaId).then(found => { if (active) { setAsset(found || null); setMissing(!found); } }).catch(() => { if (active) setMissing(true); });
    return () => { active = false; };
  }, [post.mediaId]);
  const link = post.imageUrl.trim() || post.referenceUrl.trim();
  if (post.mediaId) {
    if (missing) return <p className="cmp-media-note">El archivo no está disponible en este navegador.</p>;
    if (!asset || asset.id !== post.mediaId) return <p className="cmp-media-note">Cargando archivo…</p>;
    return <AssetPreview key={asset.id} asset={asset} thumbnail={thumbnail} onMetadata={value => onRatio?.(ratioFromMetadata(value))} />;
  }
  return link ? <LinkMediaPreview key={link} url={link} title={post.title} /> : null;
}

/** Saves files to the library for this brand and returns the asset to attach (an existing copy for duplicates). */
export async function uploadToLibrary(files: File[], brand: string): Promise<{ asset?: MediaAsset; message: string }> {
  const scope = brand || "Mi marca";
  const incoming = files.map(file => assetFromFile(file, scope));
  const existing = (await allMedia()).filter(item => item.brand === scope);
  const { accepted, duplicates } = await uniqueMedia(incoming, existing);
  await putMedia(accepted);
  if (accepted[0]) return { asset: accepted[0], message: accepted.length > 1 ? `${accepted.length} archivos subidos; se usa el primero.` : "Archivo subido a la biblioteca." };
  // Every file was already in the library: reuse the matching copy instead of failing.
  const twin = existing.find(item => item.name === incoming[0]?.name && item.size === incoming[0]?.size);
  if (twin) return { asset: twin, message: "Ese archivo ya estaba en la biblioteca; se usa la copia existente." };
  return { message: duplicates.length ? "Ese archivo ya está en la biblioteca con otro nombre. Elígelo desde la biblioteca." : "No se subió ningún archivo." };
}
