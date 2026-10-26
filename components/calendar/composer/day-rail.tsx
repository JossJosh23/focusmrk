"use client";

import { type ReactNode } from "react";
import { ImageIcon, PanelLeftClose, Plus } from "lucide-react";
import { parseDate, type Publication } from "@/lib/calendar";
import { PostThumbnail } from "../post-thumbnail";

const railDate = new Intl.DateTimeFormat("es-EC", { weekday: "short", day: "numeric", month: "short" });
export const dayHeading = (date: string) => railDate.format(parseDate(date)).replace(/\./g, "").replace(",", "").toLocaleUpperCase("es");

/** Same-day, same-brand publications. The draft being created (no id yet) shows as an unsaved entry. */
export function DayList({ posts, draft, disabled, readOnly, onSelect, onAdd }: {
  posts: Publication[]; draft: Publication; disabled: boolean; readOnly: boolean;
  onSelect: (post: Publication) => void; onAdd: () => void;
}) {
  return <div className="cmp-day-list">
    <ul>
      {!draft.id && <li><span className="cmp-day-item is-active" aria-current="true"><time>{draft.time}</time><span className="cmp-day-thumb"><ImageIcon size="var(--icon-sm)" aria-hidden="true" /></span><span className="cmp-day-title">{draft.title.trim() || "Nueva publicación"}<small>Sin guardar</small></span></span></li>}
      {posts.map(post => {
        const active = post.id === draft.id;
        return <li key={post.id}><button type="button" className={`cmp-day-item${active ? " is-active" : ""}`} aria-current={active ? "true" : undefined} disabled={disabled} data-status={post.status}
          onClick={() => { if (!active) onSelect(post); }}>
          <time>{post.time}</time>
          <span className="cmp-day-thumb">{post.mediaId || post.imageUrl ? <PostThumbnail key={post.mediaId || post.imageUrl} mediaId={post.mediaId} imageUrl={post.imageUrl} title={post.title} /> : <ImageIcon size="var(--icon-sm)" aria-hidden="true" />}</span>
          <span className="cmp-day-title">{post.title}<small>{post.status}</small></span>
          <span className="cal-dot" aria-hidden="true" />
        </button></li>;
      })}
    </ul>
    {!readOnly && <button type="button" className="cmp-day-add" disabled={disabled} onClick={onAdd}><Plus size="var(--icon-sm)" aria-hidden="true" />Añadir otra</button>}
  </div>;
}

/** Left rail (≥1280px): the day's publications and, below them, the publication checklist. Collapsible; the header offers the same list as a dropdown on narrower screens. */
export function DayRail(props: Parameters<typeof DayList>[0] & { date: string; onCollapse: () => void; children?: ReactNode }) {
  const { date, onCollapse, children, ...list } = props;
  return <aside className="cmp-rail" aria-label="Publicaciones del día">
    <div className="cmp-rail-head">
      <div><span className="cmp-label">Publicaciones del día</span><strong>{dayHeading(date)}</strong></div>
      <button type="button" className="cmp-icon-button" aria-label="Ocultar publicaciones del día" title="Ocultar" onClick={onCollapse}><PanelLeftClose size="var(--icon-sm)" aria-hidden="true" /></button>
    </div>
    <DayList {...list} />
    {children}
  </aside>;
}
