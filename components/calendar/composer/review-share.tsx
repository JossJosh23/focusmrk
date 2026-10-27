"use client";

import { useEffect, useState } from "react";
import { Check, CheckCircle2, Copy, ExternalLink, LoaderCircle, MessageSquareWarning, RefreshCw, Send } from "lucide-react";
import type { Publication } from "@/lib/calendar";
import type { PostReview } from "@/lib/post-reviews";
import { Popover } from "./ui";

const stamp = new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const headers = { "Content-Type": "application/json", "X-FocusMRK-Request": "1" };
export const reviewUrl = (token: string) => new URL(`/aprobar/${token}`, window.location.origin).toString();

/** Status a reviewer's decision moves the post to; a post already marked as published keeps that status. */
export function statusAfterReview(decision: PostReview["decision"], current: Publication["status"]): Publication["status"] {
  if (!decision || current === "Publicado") return current;
  return decision === "approved" ? "Aprobado" : "En revisión";
}

/** One-line summary of a decision for notices. */
export function reviewNotice(review: PostReview) {
  return review.decision === "approved" ? `${review.reviewer} aprobó la publicación.` : `${review.reviewer} pidió cambios${review.comment ? `: “${review.comment}”` : "."}`;
}

/** Footer button: a private link that shows only the preview, so a supervisor can approve or ask for changes. */
export function ReviewShare({ draft, server, disabled, review, onShared }: {
  draft: Publication; server: boolean; disabled: boolean;
  /** Latest decision known to the calendar, for the button's badge. */
  review?: PostReview;
  /** Called after a link is created or copied (moves a draft to «En revisión»). */
  onShared: () => void;
}) {
  const state = review?.decision;
  return <Popover label="Enviar a aprobación" align="start" className="cmp-review-popover" trigger={({ open, toggle, triggerRef, panelId }) =>
    <button ref={triggerRef} type="button" className={`cmp-button is-secondary cmp-review-trigger${state ? ` is-${state}` : ""}`} aria-expanded={open} aria-controls={panelId} disabled={disabled} onClick={toggle}>
      {state === "approved" ? <CheckCircle2 size="var(--icon-sm)" aria-hidden="true" /> : state === "changes" ? <MessageSquareWarning size="var(--icon-sm)" aria-hidden="true" /> : <Send size="var(--icon-sm)" aria-hidden="true" />}
      {state === "approved" ? "Aprobada" : state === "changes" ? "Cambios pedidos" : "Enviar a aprobación"}
    </button>}>
    {() => <ReviewPanel draft={draft} server={server} onShared={onShared} />}
  </Popover>;
}

function ReviewPanel({ draft, server, onShared }: { draft: Publication; server: boolean; onShared: () => void }) {
  const [review, setReview] = useState<PostReview | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const usable = server && !!draft.id;

  useEffect(() => {
    if (!usable) return;
    const controller = new AbortController();
    fetch(`/api/post-reviews?postId=${encodeURIComponent(draft.id)}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error); setReview((body as PostReview[])[0] || null); })
      .catch(reason => { if (!controller.signal.aborted) { setReview(null); setError(reason instanceof Error && reason.message ? reason.message : "No se pudo cargar el enlace."); } });
    return () => controller.abort();
  }, [usable, draft.id]);
  useEffect(() => { if (!copied) return; const timer = window.setTimeout(() => setCopied(false), 2000); return () => window.clearTimeout(timer); }, [copied]);

  async function create(regenerate = false) {
    setBusy(true); setError(""); setConfirmReset(false);
    try {
      const response = await fetch("/api/post-reviews", { method: "POST", headers, body: JSON.stringify({ postId: draft.id, regenerate }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "No se pudo crear el enlace.");
      setReview(body);
      await copy(body.token);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo crear el enlace."); }
    finally { setBusy(false); }
  }
  async function copy(token: string) {
    try { await navigator.clipboard.writeText(reviewUrl(token)); setCopied(true); } catch { setError("No se pudo copiar automáticamente: selecciona el enlace y cópialo."); }
    onShared();
  }
  async function revoke() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/post-reviews?postId=${encodeURIComponent(draft.id)}`, { method: "DELETE", headers });
      if (!response.ok) throw new Error((await response.json()).error || "No se pudo desactivar el enlace.");
      setReview(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo desactivar el enlace."); }
    finally { setBusy(false); }
  }

  return <div className="cmp-review">
    <strong className="cmp-review-title">Aprobación por enlace</strong>
    {!server ? <p className="cmp-help">Necesita el modo servidor (PostgreSQL) para que otra persona pueda abrir el enlace.</p>
      : !draft.id ? <p className="cmp-help">Guarda la publicación para crear su enlace de aprobación.</p>
      : review === undefined ? <p className="cmp-help"><LoaderCircle className="cmp-spin" size="var(--icon-sm)" aria-hidden="true" />Cargando…</p>
      : !review ? <>
        <p className="cmp-help">Crea un enlace privado para que tu supervisor vea <b>solo la vista previa</b> y la apruebe o pida cambios, sin entrar al panel.</p>
        <button type="button" className="cmp-button is-primary" disabled={busy} onClick={() => void create()}>{busy ? "Creando…" : "Crear y copiar enlace"}</button>
      </> : <>
        <div className="cmp-review-link">
          <input className="cmp-input" readOnly value={reviewUrl(review.token)} aria-label="Enlace de aprobación" onFocus={event => event.currentTarget.select()} />
          <button type="button" className={`cmp-button is-primary${copied ? " is-copied" : ""}`} onClick={() => void copy(review.token)}>{copied ? <Check size="var(--icon-sm)" aria-hidden="true" /> : <Copy size="var(--icon-sm)" aria-hidden="true" />}{copied ? "Copiado" : "Copiar"}</button>
        </div>
        {review.decision ? <div className={`cmp-review-state is-${review.decision}`}>
          {review.decision === "approved" ? <CheckCircle2 size="var(--icon-sm)" aria-hidden="true" /> : <MessageSquareWarning size="var(--icon-sm)" aria-hidden="true" />}
          <div><b>{review.decision === "approved" ? "Aprobada" : "Pidió cambios"}</b> · {review.reviewer}{review.decidedAt ? ` · ${stamp.format(new Date(review.decidedAt))}` : ""}{review.comment && <q>{review.comment}</q>}</div>
        </div> : <p className="cmp-help">Aún sin respuesta. El estado se actualiza solo cuando respondan.</p>}
        <div className="cmp-review-actions">
          <a className="cmp-link" href={reviewUrl(review.token)} target="_blank" rel="noopener noreferrer"><ExternalLink size="var(--icon-sm)" aria-hidden="true" />Ver como revisor</a>
          {confirmReset ? <span className="cmp-review-confirm">¿El enlace anterior dejará de funcionar? <button type="button" className="cmp-link" disabled={busy} onClick={() => void create(true)}>Sí, generar nuevo</button> <button type="button" className="cmp-link" onClick={() => setConfirmReset(false)}>No</button></span>
            : <button type="button" className="cmp-link" disabled={busy} onClick={() => setConfirmReset(true)}><RefreshCw size="var(--icon-sm)" aria-hidden="true" />Nuevo enlace</button>}
          <button type="button" className="cmp-link is-danger" disabled={busy} onClick={() => void revoke()}>Desactivar</button>
        </div>
      </>}
    {error && <p className="cmp-error" role="alert">{error}</p>}
  </div>;
}
