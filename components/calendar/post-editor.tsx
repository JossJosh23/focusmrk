"use client";

import { useEffect, useRef, useState } from "react";
import { X, Plus, Trash2, PenLine, Check, Copy } from "lucide-react";
import { emptyPublication, FORMATS, NETWORKS, STATUSES, validReferenceUrl, type Publication } from "@/lib/calendar";

import { MediaLibrary } from "./media-library";
import { VisualPreview } from "./visual-preview";
import { SocialPlatformIcon } from "./content-card";

type Props = {
  initial: Publication;
  usedMediaIds: string[];
  posts: Publication[];
  onClose: () => void;
  onSave: (post: Publication) => Promise<boolean>;
  readOnly?: boolean;
  persistenceError?: string;
  onDelete: (id: string) => Promise<boolean>;
};

export function PostEditor({ usedMediaIds, initial, posts, onClose, onSave, onDelete, readOnly = false, persistenceError = "" }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const library = useRef<HTMLDetailsElement>(null);
  function openLibrary() {
    setMobilePreview(false);
    if (library.current) library.current.open = true;
    requestAnimationFrame(() => {
      library.current?.scrollIntoView({ block: "center", behavior: "instant" });
      library.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus({ preventScroll: true });
    });
  }
  const dayPosts = posts.filter((post) => post.date === draft.date).sort((a, b) => a.time.localeCompare(b.time));
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    if (!dirty) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  function canLeave() { return !dirty || window.confirm("Tienes cambios sin guardar. ¿Quieres descartarlos?"); }
  function close() { if (!busy && canLeave()) onClose(); }
  function select(post: Publication) {
    if (busy) return;
    if (!canLeave()) return;
    setDraft(post); setBaseline(post); setError("");
  }
  function field<K extends keyof Publication>(key: K, value: Publication[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  return (
    <dialog ref={dialog} className={`editor-dialog schedule-editor split-editor ${mobilePreview ? "show-preview" : "show-form"}`} aria-labelledby="editor-title" onCancel={(event) => { event.preventDefault(); close(); }}>
      <div className="editor-heading">
        <div className="editor-title-group"><span className="editor-title-icon"><PenLine size={21} /></span><div><span className="eyebrow">ESTUDIO DE CONTENIDO</span><h2 id="editor-title">{draft.id ? "Editar contenido" : "Nuevo contenido"}</h2></div></div>
        <label className="editor-status" data-status={draft.status}><span>Estado</span><select aria-label="Estado de la publicación" disabled={busy || readOnly} value={draft.status} onChange={(event) => field("status", event.target.value as Publication["status"])}>{STATUSES.map(status => <option key={status}>{status}</option>)}</select></label>
        <button type="button" className="icon-button" aria-label="Cerrar editor" onClick={close}><X size={20} /></button>
      </div>
      <div className="editor-mobile-tabs"><button type="button" aria-pressed={!mobilePreview} onClick={() => setMobilePreview(false)}>Editar</button><button type="button" aria-pressed={mobilePreview} onClick={() => setMobilePreview(true)}>Vista previa</button></div>
      <details className="day-posts"><summary>Publicaciones del día · {dayPosts.length}</summary><div className="day-post-list">
        {dayPosts.map((post) => <button disabled={busy} type="button" aria-pressed={draft.id === post.id} className={draft.id === post.id ? "selected" : ""} key={post.id} onClick={() => { if (draft.id !== post.id) select(post); }}>{post.time} · {post.title}</button>)}
        {!readOnly && <button disabled={busy} type="button" onClick={() => select({ ...emptyPublication(draft.date), brand: draft.brand })}><Plus size={14} /> Añadir otra</button>}
      </div></details>
      <form onInvalidCapture={(event) => { let parent = (event.target as HTMLElement).parentElement; while (parent && parent !== event.currentTarget) { if (parent instanceof HTMLDetailsElement) parent.open = true; parent = parent.parentElement; } }} onSubmit={async (event) => {
        event.preventDefault();
        if (busy || readOnly) return;
        if (!validReferenceUrl(draft.imageUrl.trim())) { setError("Usa un enlace http o https para la imagen o video."); return; }
        if (!draft.title.trim()) { setError("Escribe un título para la publicación."); return; }
        if (!draft.networks.length) { setError("Selecciona al menos una red social."); return; }
        if (!validReferenceUrl(draft.referenceUrl.trim())) { setError("Usa un enlace http o https válido para la referencia visual."); return; }
        setBusy(true);
        try {
          if (await onSave({ ...draft, title: draft.title.trim(), referenceUrl: draft.referenceUrl.trim(), imageUrl: draft.imageUrl.trim(), brand: draft.brand.trim() })) onClose();
          else setError("No se pudo guardar. Revisa el aviso del calendario; tus cambios siguen aquí.");
        } catch { setError("No se pudo guardar. Tus cambios siguen aquí."); }
        finally { setBusy(false); }
      }}>
        <fieldset className="editor-fields" disabled={busy || readOnly}>

          <label>Tema o título<input autoFocus required maxLength={160} value={draft.title} onChange={(event) => field("title", event.target.value)} placeholder="¿De qué tratará esta publicación?" /></label>
          <label>Texto de publicación<textarea className="publication-copy" rows={4} value={draft.copy} onChange={(event) => field("copy", event.target.value)} placeholder="Escribe el copy, la llamada a la acción y los hashtags…" /></label>
          <div className="form-row schedule-row compact-schedule">
            <label>Fecha tentativa<input type="date" required min="0100-01-01" max="9999-12-31" value={draft.date} onChange={(event) => field("date", event.target.value)} /></label>
            <label>Hora<input type="time" required value={draft.time} onChange={(event) => field("time", event.target.value)} /></label>
          <label>Formato<select value={draft.format} onChange={(event) => field("format", event.target.value as Publication["format"])}>{FORMATS.map(format => <option key={format}>{format}</option>)}</select></label></div>
          <fieldset><legend>Redes sociales <span>*</span></legend><div className="network-options">{NETWORKS.map((network) => <label key={network} className={`network-option ${draft.networks.includes(network) ? "checked" : ""}`}><input type="checkbox" checked={draft.networks.includes(network)} onChange={(event) => field("networks", event.target.checked ? [...draft.networks, network] : draft.networks.filter((item) => item !== network))} /><SocialPlatformIcon platform={network} />{network}</label>)}</div></fieldset>
          <label className={`paid-toggle paid-toggle-prominent ${draft.paid ? "is-paid" : ""}`}><input type="checkbox" checked={draft.paid} onChange={(event) => field("paid", event.target.checked)} /><span>Promocionar con pauta<small>Marca este post para publicidad pagada.</small></span></label>
          <details ref={library} className="editor-disclosure"><summary>Imagen o video <small>{draft.mediaId ? "Archivo seleccionado" : "Seleccionar de la biblioteca"}</small></summary><MediaLibrary posts={posts} pickerOnly usedIds={usedMediaIds} selectedId={draft.mediaId} onSelect={(asset) => { setDraft((current) => ({ ...current, mediaId: asset.id })); if (library.current) library.current.open = false; }} /></details>
          <label>Enlace de imagen o video<input type="url" value={draft.imageUrl} onChange={(event) => setDraft(current => ({ ...current, imageUrl: event.target.value, mediaId: event.target.value.trim() ? "" : current.mediaId }))} placeholder="https://..." /><small>Pega un enlace directo, de YouTube o de Google Drive para verlo a la derecha.</small></label>
          {draft.mediaId && <button type="button" className="secondary-button" onClick={() => field("mediaId", "")}>Quitar archivo del post</button>}
          {draft.id && <button type="button" className="secondary-button duplicate-post" onClick={() => {
            const copy = { ...draft, id: "", title: `${draft.title.slice(0, 152)} (copia)` };
            setDraft(copy); setError("");
            requestAnimationFrame(() => dialog.current?.querySelector<HTMLInputElement>('input[type="date"]')?.focus());
          }}><Copy size={16} />Duplicar y elegir fecha</button>}
          <details className="editor-disclosure editor-advanced"><summary>Opciones adicionales <small>Notas y enlaces</small></summary><div className="optional-fields">
          <label>Objetivo<input value={draft.objective} onChange={(event) => field("objective", event.target.value)} placeholder="Ej. Generar interacción y dar a conocer la marca" /></label>
          <label>Producción o referencia<textarea rows={3} value={draft.production} onChange={(event) => field("production", event.target.value)} placeholder="Describe las imágenes, escenas o indicaciones para crear el contenido…" /></label>
          <label>Firma o contacto<textarea rows={3} value={draft.footer} onChange={(event) => field("footer", event.target.value)} placeholder="Datos de contacto, dirección o cierre de la marca" /><small>Se añade al final del texto de la publicación.</small></label>

          <label>Enlace de referencia<input type="url" value={draft.referenceUrl} onChange={(event) => field("referenceUrl", event.target.value)} placeholder="https://drive.google.com/…" /><small>Opcional: Drive, Canva u otra referencia.</small></label>
          {draft.referenceUrl.trim() && validReferenceUrl(draft.referenceUrl.trim()) && <a className="reference-link" href={draft.referenceUrl.trim()} target="_blank" rel="noopener noreferrer">Abrir referencia visual ↗</a>}

          </div></details>
          {error && <p role="alert" className="form-error">{error}</p>}
          {persistenceError && <p role="alert" className="form-error">{persistenceError}</p>}
        </fieldset>
        <div className="editor-actions">{draft.id && !readOnly && <button disabled={busy} type="button" className="danger-button" onClick={async () => { if (window.confirm("¿Eliminar esta publicación? Podrás deshacerlo desde el aviso del calendario.")) { setBusy(true); try { if (await onDelete(draft.id)) onClose(); else setError("No se pudo eliminar la publicación. Revisa el aviso del calendario."); } catch { setError("No se pudo eliminar."); } finally { setBusy(false); } } }}><Trash2 size={16} />Eliminar</button>}<div className="action-spacer" /><button type="button" className="secondary-button" onClick={close}>Cancelar</button><button type="submit" disabled={busy || readOnly} className="primary-button"><Check size={16} aria-hidden="true" />{busy ? "Guardando…" : readOnly ? "Solo lectura" : "Guardar publicación"}</button></div>
      </form>
      <VisualPreview post={draft} onChooseMedia={openLibrary} disabled={busy || readOnly} />
    </dialog>
  );
}
