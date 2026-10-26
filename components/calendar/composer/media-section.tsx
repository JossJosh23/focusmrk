"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Eye, ImagePlus, Link2, RefreshCw, Trash2, Upload, X } from "lucide-react";
import { MEDIA_TYPES } from "@/lib/media";
import { type Publication } from "@/lib/calendar";
import { PostMedia, uploadToLibrary } from "./media";

/** MEDIOS card. The model holds one medium per post: an uploaded file (mediaId) or a link (imageUrl). */
export function MediaSection({ post, disabled, onChange, onOpenLibrary, onRatio }: {
  post: Publication; disabled: boolean;
  onChange: (patch: Partial<Publication>) => void;
  onOpenLibrary: () => void;
  onRatio: (ratio: number | null) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [viewing, setViewing] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const hasMedia = !!post.mediaId || !!post.imageUrl.trim();
  async function upload(files: File[]) {
    if (!files.length || busy || disabled) return;
    setBusy(true); setMessage("");
    try {
      const { asset, message: result } = await uploadToLibrary(files, post.brand);
      if (asset) onChange({ mediaId: asset.id, imageUrl: "" });
      setMessage(result);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo subir el archivo."); }
    finally { setBusy(false); }
  }
  return <section id="cmp-media" className="cmp-card" aria-labelledby="cmp-media-title" tabIndex={-1}>
    <h3 id="cmp-media-title" className="cmp-card-title">Medios</h3>
    <input ref={input} type="file" hidden accept={MEDIA_TYPES.join(",")} onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ""; void upload(files); }} />
    {!hasMedia ? <div className={`cmp-dropzone${dragging ? " is-dragging" : ""}`}
      onDragOver={event => { if (!disabled && event.dataTransfer.types.includes("Files")) { event.preventDefault(); setDragging(true); } }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
      onDrop={event => { event.preventDefault(); setDragging(false); void upload(Array.from(event.dataTransfer.files)); }}>
      <ImagePlus size="var(--icon-xl)" aria-hidden="true" />
      <strong>{busy ? "Subiendo…" : dragging ? "Suelta para subir" : "Arrastra imágenes o videos"}</strong>
      <span>JPG, PNG, WebP, GIF, MP4, WebM o MOV · hasta 100 MB</span>
      <div className="cmp-dropzone-actions">
        <button type="button" className="cmp-button is-secondary" disabled={disabled || busy} onClick={onOpenLibrary}>Elegir de la biblioteca</button>
        <button type="button" className="cmp-button is-ghost" disabled={disabled || busy} onClick={() => input.current?.click()}><Upload size="var(--icon-sm)" aria-hidden="true" />Subir</button>
      </div>
    </div> : <div className="cmp-media-row">
      <div className="cmp-media-tile">
        <div className="cmp-media-thumb"><PostMedia post={post} thumbnail onRatio={onRatio} /></div>
        <div className="cmp-media-actions">
          <button type="button" className="cmp-icon-button is-on-media" aria-label="Ver medio" title="Ver" onClick={() => setViewing(true)}><Eye size="var(--icon-sm)" aria-hidden="true" /></button>
          <button type="button" className="cmp-icon-button is-on-media" aria-label="Reemplazar medio" title="Reemplazar" disabled={disabled} onClick={onOpenLibrary}><RefreshCw size="var(--icon-sm)" aria-hidden="true" /></button>
          <button type="button" className="cmp-icon-button is-on-media" aria-label="Quitar medio" title="Quitar" disabled={disabled} onClick={() => { onChange({ mediaId: "", imageUrl: "" }); onRatio(null); }}><Trash2 size="var(--icon-sm)" aria-hidden="true" /></button>
        </div>
      </div>
      <div className="cmp-media-meta">
        <strong>{post.mediaId ? "Archivo de la biblioteca" : <><Link2 size="var(--icon-sm)" aria-hidden="true" />Enlace externo</>}</strong>
        <span>{post.mediaId ? "Se mostrará tal cual en la vista previa." : post.imageUrl}</span>
        <div className="cmp-media-links">
          <button type="button" className="cmp-link" disabled={disabled} onClick={onOpenLibrary}>Elegir otro de la biblioteca</button>
          <button type="button" className="cmp-link" disabled={disabled || busy} onClick={() => input.current?.click()}>{busy ? "Subiendo…" : "Subir otro"}</button>
        </div>
      </div>
    </div>}
    {message && <p className="cmp-help" role="status">{message}</p>}
    {viewing && <MediaViewer post={post} onClose={() => setViewing(false)} />}
  </section>;
}

function MediaViewer({ post, onClose }: { post: Publication; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => { dialog.current?.showModal(); dialog.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus(); }, []);
  return <dialog ref={dialog} className="cmp-viewer" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="cmp-viewer-head"><strong id={titleId}>{post.title || "Medio de la publicación"}</strong><button type="button" className="cmp-icon-button" aria-label="Cerrar" data-autofocus onClick={onClose}><X size="var(--icon-md)" aria-hidden="true" /></button></div>
    <div className="cmp-viewer-body"><PostMedia post={post} /></div>
  </dialog>;
}
