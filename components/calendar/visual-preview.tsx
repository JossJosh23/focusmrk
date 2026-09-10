"use client";

import { SelectedMedia } from "./media-library";
import Image from "next/image";
import { useState } from "react";
import { validReferenceUrl } from "@/lib/calendar";

export function VisualPreview({ mediaId = "", imageUrl, copy, footer, title }: { mediaId?: string; imageUrl: string; copy: string; footer: string; title: string }) {
  const [failedUrl, setFailedUrl] = useState("");
  const url = imageUrl.trim();
  const valid = url && validReferenceUrl(url);
  return <section className="visual-preview" aria-label="Vista previa de la publicación">
    <span className="eyebrow">VISTA PREVIA</span>
    <div className={valid || mediaId ? "visual-preview-grid" : ""}>
      {mediaId && <SelectedMedia key={mediaId} id={mediaId} />}
      {!mediaId && valid && (failedUrl === url ? <p className="preview-fallback">No se pudo cargar la imagen. Usa un enlace público directo a una imagen.</p> : <Image unoptimized src={url} width={480} height={480} alt={title || "Imagen de la publicación"} referrerPolicy="no-referrer" onError={() => setFailedUrl(url)} />)}
      <p className="preview-copy">{[copy, footer].filter(Boolean).join("\n\n") || "El texto de tu publicación aparecerá aquí."}</p>
    </div>
  </section>;
}
