"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Bell, CheckCircle2, ChevronRight, X } from "lucide-react";
import { type Publication } from "@/lib/calendar";
import { reminderPosts } from "@/lib/reminders";

export function ReminderPanel({ posts, onOpen, onConfigure }: { posts: Publication[]; onOpen: (post: Publication) => void; onConfigure: () => void }) {
  const [now, setNow] = useState<number | null>(null);
  const lead = 30;
  const panelId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState("overdue");
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNow(Date.now());
    }, 0);
    const tick = () => setNow(Date.now()); const interval = window.setInterval(tick, 30_000); window.addEventListener("focus", tick);
    return () => { clearTimeout(timer); clearInterval(interval); window.removeEventListener("focus", tick); };
  }, []);
  const alerts = now === null ? { upcoming: [], review: [], overdue: [] } : reminderPosts(posts, now, lead);
  const groups = [{ key: "overdue", label: "Atrasadas", items: alerts.overdue }, { key: "upcoming", label: "Próximas", items: alerts.upcoming }, { key: "review", label: "En revisión", items: alerts.review }];
  const total = new Set(groups.flatMap(group => group.items.map(post => post.id))).size;
  const selected = groups.find(group => group.key === category && group.items.length) || groups.find(group => group.items.length) || groups[0];
  return <div className="reminder-bell-container">
    <button type="button" className="reminder-bell" popoverTarget={panelId} aria-label={now === null ? "Recordatorios: cargando" : total ? `Recordatorios: ${total} publicaciones pendientes` : "Recordatorios: sin pendientes"} title="Recordatorios">
      <Bell size="var(--icon-md)" aria-hidden="true" />
      {total > 0 && <span className="reminder-badge" aria-hidden="true">{total > 99 ? "99+" : total}</span>}
    </button>
    <div ref={panel} id={panelId} popover="auto" className="reminder-panel reminder-center reminder-popover" role="region" aria-labelledby={panelId + "-title"}>
      <div className="reminder-popover-heading"><div><strong id={panelId + "-title"}>Recordatorios</strong><p>{now === null ? "Cargando?" : total ? total + " publicaciones pendientes" : "Sin pendientes ahora"}</p></div><button type="button" className="icon-button" popoverTarget={panelId} popoverTargetAction="hide" aria-label="Cerrar recordatorios"><X size="var(--icon-md)" /></button></div>
    {now !== null && !total && <div className="reminder-empty"><CheckCircle2 size="var(--icon-lg)" /><div><strong>Todo al día</strong><p>No hay publicaciones próximas, en revisión ni atrasadas en las últimas 24 horas.</p></div></div>}
    {total > 0 && <div className="reminder-content"><div className="reminder-tabs" role="group" aria-label="Tipo de recordatorio">{groups.map(group => <button type="button" key={group.key} disabled={!group.items.length} aria-pressed={selected.key === group.key} onClick={() => { setCategory(group.key); setShowAll(false); }}>{group.label}<b>{group.items.length}</b></button>)}</div><ul className="reminder-items">{(showAll ? selected.items : selected.items.slice(0, 5)).map(post => <li key={post.id}><button type="button" onClick={() => { panel.current?.hidePopover(); onOpen(post); }}><span className="reminder-time">{post.time}<small>{post.date.split("-").reverse().join("/")}</small></span><span className="reminder-post"><strong>{post.title}</strong><small>{post.brand} · {post.networks.join(", ")}</small></span><ChevronRight size="var(--icon-sm)" /></button></li>)}</ul>{selected.items.length > 5 && <button className="reminder-more" type="button" onClick={() => setShowAll(!showAll)}>{showAll ? "Mostrar menos" : `Ver las ${selected.items.length} publicaciones`}</button>}</div>}
    <button type="button" className="secondary-button" onClick={() => { panel.current?.hidePopover(); onConfigure(); }}>Configurar notificaciones</button>
    </div>
  </div>;
}
