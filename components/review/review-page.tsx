"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, LoaderCircle, MessageSquareWarning, ShieldCheck } from "lucide-react";
import { parseDate, type Publication } from "@/lib/calendar";
import type { MediaAsset } from "@/lib/media";
import { MediaSource } from "@/components/calendar/composer/media";
import { PostPreview, type SocialProfiles } from "@/components/calendar/composer/post-preview";
import { NetworkBadge } from "@/components/calendar/composer/ui";

type Decision = { decision: "approved" | "changes" | null; reviewer: string | null; comment: string | null; decidedAt: string | null };
type Payload = { post: Publication; assets: Omit<MediaAsset, "blob" | "remoteUrl">[]; profiles: SocialProfiles; review: Decision };

const NAME_KEY = "focusmrk.reviewer-name";
const when = new Intl.DateTimeFormat("es-EC", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const stamp = new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const noop = () => {};

/** Public approval page: the publication's preview only, plus approve / request changes. */
export function ReviewPage({ token }: { token: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<"approved" | "changes" | null>(null);
  const [formError, setFormError] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    try { const saved = localStorage.getItem(NAME_KEY); if (saved) window.setTimeout(() => setName(saved), 0); } catch { /* Name is optional to remember. */ }
    fetch(`/api/review?token=${encodeURIComponent(token)}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "No se pudo cargar la publicación."); setData(body); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "No se pudo cargar la publicación."); });
    return () => controller.abort();
  }, [token]);

  // Library files load through this link only (the reviewer has no panel session).
  const source = useCallback(async (id: string) => {
    const asset = data?.assets.find(item => item.id === id);
    return asset ? { ...asset, blob: new Blob([], { type: asset.type }), remoteUrl: `/api/review/media?token=${encodeURIComponent(token)}&id=${encodeURIComponent(id)}` } : undefined;
  }, [data, token]);

  async function decide(decision: "approved" | "changes", event?: FormEvent) {
    event?.preventDefault();
    if (busy) return;
    if (!name.trim()) { setFormError("Escribe tu nombre para registrar tu respuesta."); document.getElementById("rv-name")?.focus(); return; }
    if (decision === "changes" && !comment.trim()) { setFormError("Cuenta qué cambios necesitas."); document.getElementById("rv-comment")?.focus(); return; }
    setBusy(decision); setFormError("");
    try {
      const response = await fetch("/api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, decision, reviewer: name.trim(), comment: comment.trim() }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "No se pudo guardar tu respuesta.");
      try { localStorage.setItem(NAME_KEY, name.trim()); } catch { /* Ignore. */ }
      setData(current => current && { ...current, review: body });
      setEditing(false); setComment("");
    } catch (reason) { setFormError(reason instanceof Error ? reason.message : "No se pudo guardar tu respuesta."); }
    finally { setBusy(null); }
  }

  const header = <header className="rv-header">
    <Image unoptimized src="/brand/kromaiso-logo.svg" alt="Kromaiso" width={132} height={24} priority />
    <span><ShieldCheck size="var(--icon-sm)" aria-hidden="true" />Revisión de contenido</span>
  </header>;

  if (error) return <main className="rv-page">{header}<section className="rv-message" role="alert"><h1>No disponible</h1><p>{error}</p></section></main>;
  if (!data) return <main className="rv-page">{header}<section className="rv-message" aria-busy="true"><LoaderCircle className="rv-spinner" size="var(--icon-xl)" aria-hidden="true" /><p>Cargando publicación…</p></section></main>;

  const { post, review } = data;
  const decided = review.decision && !editing;
  return <main className="rv-page">
    {header}
    <div className="rv-layout">
      <section className="rv-preview" aria-label="Vista previa de la publicación">
        <MediaSource.Provider value={source}>
          <PostPreview post={post} disabled profiles={data.profiles} onAddMedia={noop} onRatio={noop} />
        </MediaSource.Provider>
      </section>
      <aside className="rv-panel">
        <span className={`rv-state is-${review.decision || "pending"}`}>{review.decision === "approved" ? "Aprobada" : review.decision === "changes" ? "Cambios solicitados" : "Pendiente de aprobación"}</span>
        <h1>{post.title}</h1>
        <dl className="rv-facts">
          <div><dt>Marca</dt><dd>{post.brand}</dd></div>
          <div><dt>Publicación</dt><dd>{when.format(parseDate(post.date))} · {post.time}</dd></div>
          <div><dt>Formato</dt><dd>{post.format}{post.paid ? " · con pauta" : ""}</dd></div>
          <div><dt>Redes</dt><dd className="rv-networks">{post.networks.map(network => <span key={network}><NetworkBadge network={network} size="sm" />{network}</span>)}</dd></div>
        </dl>
        {decided ? <div className={`rv-result is-${review.decision}`} role="status">
          {review.decision === "approved" ? <CheckCircle2 size="var(--icon-lg)" aria-hidden="true" /> : <MessageSquareWarning size="var(--icon-lg)" aria-hidden="true" />}
          <div>
            <strong>{review.decision === "approved" ? "Publicación aprobada" : "Cambios solicitados"}</strong>
            <p>Por {review.reviewer}{review.decidedAt ? ` · ${stamp.format(new Date(review.decidedAt))}` : ""}</p>
            {review.comment && <blockquote>{review.comment}</blockquote>}
            <button type="button" className="cmp-link" onClick={() => setEditing(true)}>Cambiar mi respuesta</button>
          </div>
        </div> : <form className="rv-form" onSubmit={event => void decide("approved", event)} noValidate>
          <p className="rv-intro">Revisa cómo se verá en cada red (pestañas sobre el teléfono) y deja tu respuesta.</p>
          <label className="cmp-label" htmlFor="rv-name">Tu nombre</label>
          <input id="rv-name" className="cmp-input" autoComplete="name" maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="Nombre y apellido" />
          <label className="cmp-label" htmlFor="rv-comment">Comentarios <small>(obligatorio si pides cambios)</small></label>
          <textarea id="rv-comment" className="cmp-input" rows={4} maxLength={2000} value={comment} onChange={event => setComment(event.target.value)} placeholder="Ej.: cambiar la segunda imagen, corregir el precio en el texto…" />
          {formError && <p className="cmp-error" role="alert">{formError}</p>}
          <div className="rv-actions">
            <button type="button" className="cmp-button is-secondary" disabled={!!busy} onClick={() => void decide("changes")}>{busy === "changes" ? "Enviando…" : "Solicitar cambios"}</button>
            <button type="submit" className="cmp-button is-primary" disabled={!!busy}><CheckCircle2 size="var(--icon-sm)" aria-hidden="true" />{busy === "approved" ? "Enviando…" : "Aprobar publicación"}</button>
          </div>
          {editing && <button type="button" className="cmp-link" onClick={() => setEditing(false)}>Cancelar</button>}
        </form>}
        <p className="rv-footnote">Este enlace es privado: solo muestra esta publicación. Quien lo comparta con otras personas les dará acceso a la misma vista.</p>
      </aside>
    </div>
  </main>;
}
