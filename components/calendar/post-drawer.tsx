"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Copy, ExternalLink, ImagePlus, Megaphone, PenLine, Star, X } from "lucide-react";
import { STATUSES, isOverdue, parseDate, type Publication } from "@/lib/calendar";
import { NetworkIcons, StatusBadge } from "./content-card";
import { CopyPromptButton } from "./composer/copy-prompt-button";
import { LinkMediaPreview } from "./link-media-preview";
import { SelectedMedia } from "./media-library";

const fullDate = new Intl.DateTimeFormat("es-EC", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** Long free text clamped to four lines, with "Ver más" only when it actually overflows. */
function LongText({ label, text }: { label: string; text: string }) {
  const body = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const element = body.current;
    if (!element) return;
    const observer = new ResizeObserver(() => { if (!element.classList.contains("is-expanded")) setOverflows(element.scrollHeight > element.clientHeight + 1); });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <section className="cal-drawer-text">
    <h3>{label}</h3>
    <p ref={body} className={expanded ? "is-expanded" : undefined}>{text}</p>
    {(overflows || expanded) && <button type="button" className="cal-drawer-more" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Ver menos" : "Ver más"}</button>}
  </section>;
}

/** Right-hand detail panel; the calendar stays visible behind it. */
export function PostDrawer({ post, server, today, disabled, onClose, onEdit, onQuickAction, onToggleImportant }: {
  post: Publication; server: boolean; today: string; disabled: boolean;
  onClose: () => void; onEdit: (post: Publication) => void;
  onQuickAction: (post: Publication, action: Publication["status"] | "duplicate") => void;
  onToggleImportant: (post: Publication) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const statusId = useId();
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    // showModal() focuses the first button (the star), which reads as pre-selected; start on the title instead.
    element?.querySelector<HTMLElement>(".cal-drawer-title h2")?.focus();
    return () => element?.close();
  }, []);
  const overdue = isOverdue(post, today);
  const date = post.date ? fullDate.format(parseDate(post.date)) : "sin fecha (idea)";
  // Same source order as the editor preview: uploaded file, then image/video link, then reference link.
  const link = post.imageUrl.trim() || post.referenceUrl.trim();
  return <dialog ref={dialog} className="cal-drawer" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="cal-drawer-inner">
      <header className="cal-drawer-header">
        <StatusBadge status={post.status} overdue={overdue} />
        <div className="cal-drawer-tools">
          <button type="button" className="cal-icon-button" disabled={disabled} aria-pressed={!!post.important} aria-label={post.important ? "Quitar marca de importante" : "Marcar como importante"} title={post.important ? "Quitar marca de importante" : "Marcar como importante"} onClick={() => onToggleImportant(post)}><Star size="var(--icon-sm)" fill={post.important ? "currentColor" : "none"} aria-hidden="true" /></button>
          <CopyPromptButton post={post} server={server} className="cal-icon-button" compact />
          <button type="button" className="cal-icon-button" disabled={disabled} aria-label="Duplicar como borrador" title="Duplicar como borrador" onClick={() => onQuickAction(post, "duplicate")}><Copy size="var(--icon-sm)" aria-hidden="true" /></button>
          <button type="button" className="cal-icon-button" aria-label="Cerrar detalle" title="Cerrar" onClick={onClose}><X size="var(--icon-md)" aria-hidden="true" /></button>
        </div>
      </header>
      <div className="cal-drawer-body">
        <div className="cal-drawer-title">
          <h2 id={titleId} tabIndex={-1}>{post.title}</h2>
          <p><time dateTime={`${post.date}T${post.time}`}>{date.charAt(0).toLocaleUpperCase("es") + date.slice(1)}{post.date && ` · ${post.time}`}</time></p>
        </div>
        {post.mediaId || link
          ? <div className="cal-drawer-media">{post.mediaId ? <SelectedMedia key={post.mediaId} id={post.mediaId} /> : <LinkMediaPreview key={link} url={link} title={post.title} />}</div>
          : <button type="button" className="cal-drawer-media is-empty" disabled={disabled} onClick={() => onEdit(post)}><ImagePlus size="var(--icon-lg)" aria-hidden="true" /><span>Añadir imagen o video</span></button>}
        <dl className="cal-drawer-facts">
          <div><dt>Redes</dt><dd className="cal-drawer-networks">{post.networks.map(network => <span key={network}><NetworkIcons networks={[network]} size="var(--cal-icon)" />{network}</span>)}</dd></div>
          <div><dt>Tipo</dt><dd>{post.format}</dd></div>
          <div><dt>Pauta</dt><dd>{post.paid ? <span className="cal-paid-badge"><Megaphone size="var(--cal-glyph)" aria-hidden="true" />Con pauta</span> : "Orgánico"}</dd></div>
          <div><dt>Empresa</dt><dd>{post.brand}</dd></div>
        </dl>
        {post.objective && <LongText label="Objetivo" text={post.objective} />}
        {post.production && <LongText label="Producción" text={post.production} />}
        {post.copy && <LongText label="Copy" text={post.copy} />}
        {post.referenceUrl && <a className="cal-drawer-link" href={post.referenceUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size="var(--icon-sm)" aria-hidden="true" />Abrir referencia visual</a>}
      </div>
      <footer className="cal-drawer-footer">
        <label className="cal-drawer-status" htmlFor={statusId} data-status={post.status}>
          <span className="cal-dot" data-status={post.status} aria-hidden="true" />
          <span className="sr-only">Estado</span>
          <select id={statusId} value={post.status} disabled={disabled} onChange={event => onQuickAction(post, event.target.value as Publication["status"])}>{STATUSES.map(status => <option key={status}>{status}</option>)}</select>
        </label>
        <button type="button" className="primary-button" disabled={disabled} onClick={() => onEdit(post)}><PenLine size="var(--icon-sm)" aria-hidden="true" />Editar publicación</button>
      </footer>
    </div>
  </dialog>;
}
