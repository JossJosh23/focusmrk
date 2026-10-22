"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Bell, CheckCircle2, Settings } from "lucide-react";
import { type Publication } from "@/lib/calendar";
import { publicationTime, reminderPosts } from "@/lib/reminders";
import { SocialPlatformIcon } from "./content-card";

type Category = "overdue" | "upcoming" | "review";
const readKey = "focusmrk.notifications-read.v1";
const tags: Record<Category, string> = { overdue: "Atrasada", upcoming: "Próxima", review: "En revisión" };

// A rescheduled publication notifies again, so the read marker includes its date and time.
function notificationKey(post: Publication) { return `${post.id}@${post.date}T${post.time}`; }

function pending(count: number) { return `${count} ${count === 1 ? "publicación pendiente" : "publicaciones pendientes"}`; }

function relativeTime(post: Publication, now: number) {
  const time = publicationTime(post);
  const minutes = Math.round((time - now) / 60_000);
  if (Math.abs(minutes) < 1) return "Ahora";
  if (Math.abs(minutes) < 60) return minutes < 0 ? `hace ${-minutes} min` : `en ${minutes} min`;
  if (minutes < 0 && minutes > -24 * 60) return `hace ${Math.round(-minutes / 60)} h`;
  const day = new Date(now); day.setHours(0, 0, 0, 0);
  const offset = Math.floor((time - day.getTime()) / 86_400_000);
  if (offset === 0) return `Hoy ${post.time}`;
  if (offset === 1) return `Mañana ${post.time}`;
  return `${post.date.split("-").reverse().slice(0, 2).join("/")} ${post.time}`;
}

export function ReminderPanel({ posts, onOpen, onConfigure, onViewAll }: { posts: Publication[]; onOpen: (post: Publication) => void; onConfigure: () => void; onViewAll: (category: Category) => void }) {
  const [now, setNow] = useState<number | null>(null);
  const lead = 30;
  const panelId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [read, setRead] = useState<string[]>([]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNow(Date.now());
      try { const stored = JSON.parse(localStorage.getItem(readKey) || "[]"); if (Array.isArray(stored)) setRead(stored.filter(item => typeof item === "string")); } catch { /* Without storage every notification simply stays unread. */ }
    }, 0);
    const tick = () => setNow(Date.now()); const interval = window.setInterval(tick, 30_000); window.addEventListener("focus", tick);
    return () => { clearTimeout(timer); clearInterval(interval); window.removeEventListener("focus", tick); };
  }, []);
  const alerts = now === null ? { upcoming: [], review: [], overdue: [] } : reminderPosts(posts, now, lead);
  const groups: { key: Category; label: string; items: Publication[] }[] = [{ key: "overdue", label: "Atrasadas", items: alerts.overdue }, { key: "upcoming", label: "Próximas", items: alerts.upcoming }, { key: "review", label: "En revisión", items: alerts.review }];
  const all = groups.flatMap(group => group.items);
  const total = new Set(all.map(post => post.id)).size;
  const unread = new Set(all.filter(post => !read.includes(notificationKey(post))).map(post => post.id)).size;
  const overdueUnread = alerts.overdue.some(post => !read.includes(notificationKey(post)));
  const selected = groups.find(group => group.key === category) || groups.find(group => group.items.length) || groups[0];
  function markRead(items: Publication[]) {
    // Only markers for current notifications are kept, so storage does not grow over time.
    const current = new Set(all.map(notificationKey));
    const next = Array.from(new Set([...read, ...items.map(notificationKey)])).filter(key => current.has(key));
    setRead(next);
    try { localStorage.setItem(readKey, JSON.stringify(next)); } catch { /* Read state is a per-browser convenience. */ }
  }
  function close(action: () => void) { panel.current?.hidePopover(); action(); }
  return <div className="reminder-bell-container">
    <button type="button" className="reminder-bell" popoverTarget={panelId} aria-label={now === null ? "Notificaciones: cargando" : unread ? `Notificaciones: ${unread} sin leer` : "Notificaciones: sin pendientes nuevos"} title="Notificaciones">
      <Bell size="var(--shell-nav-icon)" aria-hidden="true" />
      {unread > 0 && <span className={`reminder-badge${overdueUnread ? " is-overdue" : ""}`} aria-hidden="true">{unread > 99 ? "99+" : unread}</span>}
    </button>
    <div ref={panel} id={panelId} popover="auto" className="notif-panel" role="region" aria-labelledby={panelId + "-title"}>
      <div className="notif-heading">
        <div><strong id={panelId + "-title"}>Notificaciones</strong><p>{now === null ? "Cargando…" : total ? pending(total) : "Sin pendientes"}</p></div>
        <div className="notif-heading-actions">
          {unread > 0 && <button type="button" className="notif-link" onClick={() => markRead(all)}>Marcar todo como leído</button>}
          <button type="button" className="notif-icon-button" aria-label="Configurar notificaciones" title="Configurar notificaciones" onClick={() => close(onConfigure)}><Settings size="var(--shell-nav-icon)" aria-hidden="true" /></button>
        </div>
      </div>
      {now !== null && !total ? <div className="notif-empty"><CheckCircle2 size="var(--icon-lg)" aria-hidden="true" /><strong>Todo al día</strong><p>No tienes publicaciones pendientes.</p></div> : <>
        <div className="notif-tabs" role="tablist" aria-label="Tipo de notificación">{groups.map(group => <button type="button" role="tab" key={group.key} id={`${panelId}-${group.key}`} aria-selected={selected.key === group.key} aria-controls={panelId + "-list"} onClick={() => setCategory(group.key)}>{group.label}<span className={group.items.length ? "notif-count" : "notif-count is-empty"}>{group.items.length}</span></button>)}</div>
        <div id={panelId + "-list"} className="notif-list" role="tabpanel" aria-labelledby={`${panelId}-${selected.key}`}>
          {selected.items.length ? <ul>{selected.items.map(post => {
            const isRead = read.includes(notificationKey(post));
            const network = post.networks[0];
            return <li key={post.id}><button type="button" className={isRead ? "notif-item" : "notif-item is-unread"} aria-label={`${isRead ? "" : "Sin leer: "}${post.title || "Sin título"}, ${tags[selected.key]}, ${now === null ? "" : relativeTime(post, now)}`} onClick={() => { markRead([post]); close(() => onOpen(post)); }}>
              <span className="notif-network">{network ? <SocialPlatformIcon platform={network} size="var(--shell-nav-icon)" /> : <Bell size="var(--shell-nav-icon)" aria-hidden="true" />}</span>
              <span className="notif-body"><strong>{post.title || "Sin título"}</strong><small>{[post.brand, post.networks.join(", ")].filter(Boolean).join(" · ")}</small></span>
              <span className="notif-meta"><small>{now === null ? "" : relativeTime(post, now)}</small><span className={`notif-tag is-${selected.key}`}>{tags[selected.key]}</span></span>
            </button></li>;
          })}</ul> : <p className="notif-tab-empty">No hay publicaciones {selected.key === "overdue" ? "atrasadas" : selected.key === "upcoming" ? "próximas" : "en revisión"}.</p>}
        </div>
        <button type="button" className="notif-footer" onClick={() => close(() => onViewAll(selected.key))}>Ver todas</button>
      </>}
    </div>
  </div>;
}
