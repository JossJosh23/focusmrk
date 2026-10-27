"use client";

import Image from "next/image";
import { useState } from "react";
import { ExternalLink, Link2 } from "lucide-react";
import { validReferenceUrl, type Publication } from "@/lib/calendar";
import { LinkMediaPreview } from "../link-media-preview";
import { AutoTextarea } from "./ui";

function hostOf(url: string) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } }

/** Site favicon read from the referenced site itself; falls back to a link icon. */
function Favicon({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  const origin = (() => { try { return new URL(url).origin; } catch { return ""; } })();
  if (!origin || failed) return <Link2 size="var(--icon-sm)" aria-hidden="true" />;
  return <Image unoptimized src={`${origin}/favicon.ico`} width={16} height={16} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}

/** BRIEF CREATIVO tab: objective, production notes, media/reference links and the brand signature. */
export function BriefTab({ post, disabled, onChange }: { post: Publication; disabled: boolean; onChange: (patch: Partial<Publication>) => void }) {
  const imageUrl = post.imageUrl.trim();
  const referenceUrl = post.referenceUrl.trim();
  return <div className="cmp-brief">
    <section className="cmp-card" aria-labelledby="cmp-brief-title">
      <h3 id="cmp-brief-title" className="cmp-card-title">Brief creativo</h3>
      <div className="cmp-grid-2">
        <label className="cmp-field is-wide">Objetivo
          <input className="cmp-input" disabled={disabled} value={post.objective} onChange={event => onChange({ objective: event.target.value })} placeholder="Ej. Generar interacción y dar a conocer la marca" />
          <small>Qué debe lograr esta publicación.</small>
        </label>
        <label className="cmp-field is-wide">Producción o referencia
          <AutoTextarea className="cmp-input" minRows={3} maxRows={12} disabled={disabled} value={post.production} onChange={event => onChange({ production: event.target.value })} placeholder="Describe las imágenes, escenas o indicaciones para crear el contenido…" />
          <small>Indicaciones para quien diseña o graba.</small>
        </label>
        <div className="cmp-field">
          <label htmlFor="cmp-imageUrl">Enlace de imagen o video</label>
          <input id="cmp-imageUrl" className="cmp-input" type="url" disabled={disabled} aria-invalid={!validReferenceUrl(imageUrl)} value={post.imageUrl}
            onChange={event => onChange(event.target.value.trim() ? { imageUrl: event.target.value, mediaId: "", mediaIds: undefined } : { imageUrl: event.target.value })} placeholder="https://…" />
          <small>{post.mediaId && !imageUrl ? "Pegar un enlace reemplaza el archivo de la biblioteca." : "Enlace directo, de YouTube o de Google Drive."}</small>
          {imageUrl && (validReferenceUrl(imageUrl) ? <div className="cmp-link-preview"><LinkMediaPreview key={imageUrl} url={imageUrl} title={post.title} /></div> : <p className="cmp-error" role="alert">Usa un enlace http o https.</p>)}
        </div>
        <div className="cmp-field">
          <label htmlFor="cmp-referenceUrl">Enlace de referencia</label>
          <input id="cmp-referenceUrl" className="cmp-input" type="url" disabled={disabled} aria-invalid={!validReferenceUrl(referenceUrl)} value={post.referenceUrl}
            onChange={event => onChange({ referenceUrl: event.target.value })} placeholder="https://drive.google.com/…" />
          <small>Opcional: Drive, Canva u otra referencia.</small>
          {referenceUrl && (validReferenceUrl(referenceUrl)
            ? <a className="cmp-reference" href={referenceUrl} target="_blank" rel="noopener noreferrer"><Favicon key={referenceUrl} url={referenceUrl} /><span>{hostOf(referenceUrl)}</span><ExternalLink size="var(--icon-sm)" aria-hidden="true" /></a>
            : <p className="cmp-error" role="alert">Usa un enlace http o https válido.</p>)}
        </div>
        <label className="cmp-field is-wide">Firma o contacto
          <AutoTextarea id="cmp-footer" className="cmp-input" minRows={2} maxRows={8} disabled={disabled} value={post.footer} onChange={event => onChange({ footer: event.target.value })} placeholder="Datos de contacto, dirección o cierre de la marca" />
          <small>Se añade al final del texto de la publicación cuando la firma está activada.</small>
        </label>
      </div>
    </section>
  </div>;
}
