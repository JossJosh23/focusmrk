"use client";

import { useEffect, useRef, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { emptyPublication, FORMATS, NETWORKS, STATUSES, validReferenceUrl, type Publication } from "@/lib/calendar";

import { TemplatePicker } from "./template-picker";
import { VisualPreview } from "./visual-preview";
import type { ContentTemplate } from "@/lib/templates";
import { SocialPlatformIcon } from "./content-card";

type Props = {
  initial: Publication;
  posts: Publication[];
  onClose: () => void;
  onSave: (post: Publication) => Promise<boolean>;
  templates: ContentTemplate[];
  onTemplatesChange: (templates: ContentTemplate[]) => Promise<boolean>;
  readOnly?: boolean;
  persistenceError?: string;
  onDelete: (id: string) => Promise<boolean>;
};

export function PostEditor({ initial, posts, onClose, onSave, onDelete, templates, onTemplatesChange, readOnly = false, persistenceError = "" }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
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
    <dialog ref={dialog} className="editor-dialog" aria-labelledby="editor-title" onCancel={(event) => { event.preventDefault(); close(); }}>
      <div className="editor-heading">
        <div><span className="eyebrow">PLANIFICACIÓN DE CONTENIDO</span><h2 id="editor-title">{draft.id ? "Editar publicación" : "Nueva publicación"}</h2></div>
        <button type="button" className="icon-button" aria-label="Cerrar editor" onClick={close}><X size={20} /></button>
      </div>
      {posts.length > 0 && <div className="day-posts"><p>Publicaciones del día · {posts.length}</p><div className="day-post-list">
        {posts.map((post) => <button type="button" className={draft.id === post.id ? "selected" : ""} key={post.id} onClick={() => select(post)}>{post.time} · {post.title}</button>)}
        {!readOnly && <button disabled={busy} type="button" onClick={() => select(emptyPublication(initial.date))}><Plus size={14} /> Añadir otra</button>}
      </div></div>}
      <form onSubmit={async (event) => {
        event.preventDefault();
        if (busy || readOnly) return;
        if (!validReferenceUrl(draft.imageUrl.trim())) { setError("Usa un enlace http o https para la imagen."); return; }
        if (!draft.title.trim()) { setError("Escribe un título para la publicación."); return; }
        if (!draft.networks.length) { setError("Selecciona al menos una red social."); return; }
        if (!validReferenceUrl(draft.referenceUrl.trim())) { setError("Usa un enlace http o https válido para la referencia visual."); return; }
        setBusy(true);
        try {
          if (await onSave({ ...draft, title: draft.title.trim(), referenceUrl: draft.referenceUrl.trim(), imageUrl: draft.imageUrl.trim() })) onClose();
          else setError("No se pudo guardar. Revisa el aviso del calendario; tus cambios siguen aquí.");
        } catch { setError("No se pudo guardar. Tus cambios siguen aquí."); }
        finally { setBusy(false); }
      }}>
        <fieldset className="editor-fields" disabled={busy || readOnly}>
          <TemplatePicker templates={templates} copy={draft.copy} footer={draft.footer} onApply={(copy, footer) => setDraft((current) => ({ ...current, copy, footer }))} onChange={onTemplatesChange} disabled={busy || readOnly} />
          <label>Título de la publicación <span>*</span><input autoFocus required maxLength={160} value={draft.title} onChange={(event) => field("title", event.target.value)} placeholder="Ej. Presentamos nuestra nueva colección" /></label>
          <div className="form-row"><label>Fecha <span>*</span><input type="date" required min="0100-01-01" max="9999-12-31" value={draft.date} onChange={(event) => field("date", event.target.value)} /></label><label>Hora prevista <span>*</span><input type="time" required value={draft.time} onChange={(event) => field("time", event.target.value)} /></label></div>
          <fieldset><legend>Redes sociales <span>*</span></legend><div className="network-options">{NETWORKS.map((network) => <label key={network} className={`network-option ${draft.networks.includes(network) ? "checked" : ""}`}><input type="checkbox" checked={draft.networks.includes(network)} onChange={(event) => field("networks", event.target.checked ? [...draft.networks, network] : draft.networks.filter((item) => item !== network))} /><SocialPlatformIcon platform={network} />{network}</label>)}</div></fieldset>
          <div className="form-row"><label>Formato<select value={draft.format} onChange={(event) => field("format", event.target.value as Publication["format"])}>{FORMATS.map((format) => <option key={format}>{format}</option>)}</select></label><label>Estado<select value={draft.status} onChange={(event) => field("status", event.target.value as Publication["status"])}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label></div>
          <label className="paid-toggle"><input type="checkbox" checked={draft.paid} onChange={(event) => field("paid", event.target.checked)} /><span>Publicación pautada<small>Se promocionará con inversión publicitaria.</small></span></label>
          <label>Copy / texto de la publicación<textarea rows={5} value={draft.copy} onChange={(event) => field("copy", event.target.value)} placeholder="Cuenta la historia, añade una llamada a la acción y tus hashtags…" /></label>
          <label>Footer / información de contacto<textarea rows={3} value={draft.footer} onChange={(event) => field("footer", event.target.value)} placeholder={"Dirección: Av. Principal 123\nWhatsApp: +593…\nSucursales: Centro · Norte"} /><small>Direcciones, teléfono y sucursales que acompañarán el copy.</small></label>
          <label>Referencia visual<input type="url" value={draft.referenceUrl} onChange={(event) => field("referenceUrl", event.target.value)} placeholder="https://drive.google.com/…" /><small>Enlace a una imagen, miniatura, Drive o Canva. Comprueba que quienes revisan tengan acceso. Borra el enlace para quitar la referencia.</small></label>
          {draft.referenceUrl.trim() && validReferenceUrl(draft.referenceUrl.trim()) && <a className="reference-link" href={draft.referenceUrl.trim()} target="_blank" rel="noopener noreferrer">Abrir referencia visual ↗</a>}
          <label>Imagen para vista previa<input type="url" value={draft.imageUrl} onChange={(event) => field("imageUrl", event.target.value)} placeholder="https://ejemplo.com/imagen.jpg" /><small>Enlace público directo a una imagen. Para páginas de Drive o Canva, conserva el enlace de referencia y añade aquí la URL de la imagen exportada.</small></label>
          <VisualPreview imageUrl={draft.imageUrl} copy={draft.copy} footer={draft.footer} title={draft.title} />
          {error && <p role="alert" className="form-error">{error}</p>}
          {persistenceError && <p role="alert" className="form-error">{persistenceError}</p>}
        </fieldset>
        <div className="editor-actions">{draft.id && !readOnly && <button disabled={busy} type="button" className="danger-button" onClick={async () => { if (window.confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.")) { setBusy(true); try { if (await onDelete(draft.id)) onClose(); else setError("No se pudo eliminar la publicación. Revisa el aviso del calendario."); } catch { setError("No se pudo eliminar."); } finally { setBusy(false); } } }}><Trash2 size={16} />Eliminar</button>}<div className="action-spacer" /><button type="button" className="secondary-button" onClick={close}>Cancelar</button><button type="submit" disabled={busy || readOnly} className="primary-button">{busy ? "Guardando…" : readOnly ? "Solo lectura" : "Guardar publicación"}</button></div>
      </form>
    </dialog>
  );
}
