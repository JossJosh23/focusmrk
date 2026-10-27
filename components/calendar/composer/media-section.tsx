"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { ChevronLeft, ChevronRight, Eye, ImagePlus, Link2, Plus, RefreshCw, Trash2, Upload, X } from "lucide-react";
import { MEDIA_TYPES } from "@/lib/media";
import { MAX_CAROUSEL, postMediaIds, type Publication } from "@/lib/calendar";
import { PostMedia, uploadToLibrary } from "./media";
import { allowsMany, withMedia } from "./model";

/** MEDIOS card: the post's library files in carousel order (drag or arrows to reorder), or a single linked medium (imageUrl). */
export function MediaSection({ post, disabled, onChange, onOpenLibrary, onRatio }: {
  post: Publication; disabled: boolean;
  onChange: (patch: Partial<Publication>) => void;
  onOpenLibrary: () => void;
  onRatio: (ratio: number | null) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [viewing, setViewing] = useState<number | null>(null);
  const [moving, setMoving] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const ids = postMediaIds(post);
  const link = !ids.length && post.imageUrl.trim();
  const many = allowsMany(post.format);
  const canAdd = many && ids.length < MAX_CAROUSEL;
  function set(next: string[]) {
    onChange(withMedia(post, next));
    if (next[0] !== ids[0]) onRatio(null);
  }
  function move(from: number, to: number) {
    if (to < 0 || to >= ids.length || from === to) return;
    const next = [...ids];
    next.splice(to, 0, ...next.splice(from, 1));
    set(next);
  }
  async function upload(files: File[]) {
    if (!files.length || busy || disabled) return;
    setBusy(true); setMessage("");
    try {
      const { assets, message: result } = await uploadToLibrary(files, post.brand);
      const added = assets.map(asset => asset.id);
      if (added.length) set(many ? [...ids, ...added] : added.slice(0, 1));
      const capped = many && ids.length + added.length > MAX_CAROUSEL;
      setMessage([result, capped ? `Un carrusel admite hasta ${MAX_CAROUSEL} archivos.` : "", !many && added.length > 1 ? "Un Reel usa un solo archivo: se usa el primero." : ""].filter(Boolean).join(" "));
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo subir el archivo."); }
    finally { setBusy(false); }
  }
  const dropHandlers = {
    onDragOver: (event: DragEvent) => { if (!disabled && event.dataTransfer.types.includes("Files")) { event.preventDefault(); setDragging(true); } },
    onDragLeave: (event: DragEvent<HTMLElement>) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); },
    onDrop: (event: DragEvent) => { if (!event.dataTransfer.types.includes("Files")) return; event.preventDefault(); setDragging(false); void upload(Array.from(event.dataTransfer.files)); },
  };
  return <section id="cmp-media" className="cmp-card" aria-labelledby="cmp-media-title" tabIndex={-1}>
    <div className="cmp-card-head">
      <h3 id="cmp-media-title" className="cmp-card-title">Medios</h3>
      {ids.length > 1 && <span className="cmp-media-count">{ids.length} / {MAX_CAROUSEL} · arrastra para ordenar</span>}
    </div>
    <input ref={input} type="file" hidden multiple={many} accept={MEDIA_TYPES.join(",")} onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ""; void upload(files); }} />
    {!ids.length && !link ? <div className={`cmp-dropzone${dragging ? " is-dragging" : ""}`} {...dropHandlers}>
      <ImagePlus size="var(--icon-xl)" aria-hidden="true" />
      <strong>{busy ? "Subiendo…" : dragging ? "Suelta para subir" : many ? "Arrastra una o varias imágenes o videos" : "Arrastra el video del Reel"}</strong>
      <span>JPG, PNG, WebP, GIF, MP4, WebM o MOV · hasta 100 MB{many ? ` · hasta ${MAX_CAROUSEL} archivos` : ""}</span>
      <div className="cmp-dropzone-actions">
        <button type="button" className="cmp-button is-secondary" disabled={disabled || busy} onClick={onOpenLibrary}>Elegir de la biblioteca</button>
        <button type="button" className="cmp-button is-ghost" disabled={disabled || busy} onClick={() => input.current?.click()}><Upload size="var(--icon-sm)" aria-hidden="true" />Subir</button>
      </div>
    </div> : link ? <div className="cmp-media-row">
      <div className="cmp-media-tile">
        <div className="cmp-media-thumb"><PostMedia post={post} thumbnail onRatio={onRatio} /></div>
        <div className="cmp-media-actions">
          <button type="button" className="cmp-icon-button is-on-media" aria-label="Ver medio" title="Ver" onClick={() => setViewing(0)}><Eye size="var(--icon-sm)" aria-hidden="true" /></button>
          <button type="button" className="cmp-icon-button is-on-media" aria-label="Quitar medio" title="Quitar" disabled={disabled} onClick={() => { onChange({ imageUrl: "" }); onRatio(null); }}><Trash2 size="var(--icon-sm)" aria-hidden="true" /></button>
        </div>
      </div>
      <div className="cmp-media-meta">
        <strong><Link2 size="var(--icon-sm)" aria-hidden="true" />Enlace externo</strong>
        <span>{post.imageUrl}</span>
        <div className="cmp-media-links">
          <button type="button" className="cmp-link" disabled={disabled} onClick={onOpenLibrary}>Elegir de la biblioteca</button>
          <button type="button" className="cmp-link" disabled={disabled || busy} onClick={() => input.current?.click()}>{busy ? "Subiendo…" : "Subir archivo"}</button>
        </div>
      </div>
    </div> : <>
      <ol className={`cmp-media-strip${dragging ? " is-dragging" : ""}`} aria-label="Archivos de la publicación" {...dropHandlers}>
        {ids.map((id, index) => <li key={id} className={`cmp-media-tile${moving === index ? " is-moving" : ""}`} draggable={!disabled && ids.length > 1}
          onDragStart={event => { setMoving(index); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(index)); }}
          onDragEnd={() => setMoving(null)}
          onDragOver={event => { if (moving !== null) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; } }}
          onDrop={event => { if (moving === null) return; event.preventDefault(); event.stopPropagation(); move(moving, index); setMoving(null); }}>
          <div className="cmp-media-thumb"><PostMedia post={post} mediaId={id} thumbnail onRatio={index === 0 ? onRatio : undefined} /></div>
          {ids.length > 1 && <span className="cmp-media-index" aria-hidden="true">{index + 1}</span>}
          <div className="cmp-media-actions">
            <button type="button" className="cmp-icon-button is-on-media" aria-label={`Ver archivo ${index + 1}`} title="Ver" onClick={() => setViewing(index)}><Eye size="var(--icon-sm)" aria-hidden="true" /></button>
            {!many && <button type="button" className="cmp-icon-button is-on-media" aria-label="Reemplazar medio" title="Reemplazar" disabled={disabled} onClick={onOpenLibrary}><RefreshCw size="var(--icon-sm)" aria-hidden="true" /></button>}
            <button type="button" className="cmp-icon-button is-on-media" aria-label={`Quitar archivo ${index + 1}`} title="Quitar" disabled={disabled} onClick={() => set(ids.filter(item => item !== id))}><Trash2 size="var(--icon-sm)" aria-hidden="true" /></button>
          </div>
          {ids.length > 1 && <div className="cmp-media-order">
            <button type="button" className="cmp-icon-button is-on-media" aria-label={`Mover archivo ${index + 1} a la izquierda`} title="Mover a la izquierda" disabled={disabled || index === 0} onClick={() => move(index, index - 1)}><ChevronLeft size="var(--icon-sm)" aria-hidden="true" /></button>
            <button type="button" className="cmp-icon-button is-on-media" aria-label={`Mover archivo ${index + 1} a la derecha`} title="Mover a la derecha" disabled={disabled || index === ids.length - 1} onClick={() => move(index, index + 1)}><ChevronRight size="var(--icon-sm)" aria-hidden="true" /></button>
          </div>}
        </li>)}
        {canAdd && <li className="cmp-media-add">
          <button type="button" disabled={disabled || busy} onClick={() => input.current?.click()}><Plus size="var(--icon-md)" aria-hidden="true" />{busy ? "Subiendo…" : "Añadir"}</button>
          <button type="button" className="cmp-link" disabled={disabled || busy} onClick={onOpenLibrary}>Biblioteca</button>
        </li>}
      </ol>
      {!many && <p className="cmp-help">Un Reel usa un solo video. Cambia a Post o Carrusel para añadir varias imágenes.</p>}
    </>}
    {message && <p className="cmp-help" role="status">{message}</p>}
    {viewing !== null && <MediaViewer post={post} ids={ids} start={viewing} onClose={() => setViewing(null)} />}
  </section>;
}

function MediaViewer({ post, ids, start, onClose }: { post: Publication; ids: string[]; start: number; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [index, setIndex] = useState(start);
  const total = ids.length;
  useEffect(() => { dialog.current?.showModal(); dialog.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus(); }, []);
  return <dialog ref={dialog} className="cmp-viewer" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    onKeyDown={event => { if (total > 1 && event.key === "ArrowLeft") setIndex(Math.max(0, index - 1)); if (total > 1 && event.key === "ArrowRight") setIndex(Math.min(total - 1, index + 1)); }}>
    <div className="cmp-viewer-head"><strong id={titleId}>{post.title || "Medio de la publicación"}{total > 1 ? ` · ${index + 1} de ${total}` : ""}</strong><button type="button" className="cmp-icon-button" aria-label="Cerrar" data-autofocus onClick={onClose}><X size="var(--icon-md)" aria-hidden="true" /></button></div>
    <div className="cmp-viewer-body">
      <PostMedia key={ids[index] || "link"} post={post} mediaId={ids[index] || ""} />
      {total > 1 && <>
        <button type="button" className="cmp-viewer-nav is-prev" aria-label="Anterior" disabled={index === 0} onClick={() => setIndex(index - 1)}><ChevronLeft size="var(--icon-md)" aria-hidden="true" /></button>
        <button type="button" className="cmp-viewer-nav is-next" aria-label="Siguiente" disabled={index === total - 1} onClick={() => setIndex(index + 1)}><ChevronRight size="var(--icon-md)" aria-hidden="true" /></button>
      </>}
    </div>
  </dialog>;
}
