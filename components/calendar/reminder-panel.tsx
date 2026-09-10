"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Settings2, ChevronRight } from "lucide-react";
import { dateKey, type Publication } from "@/lib/calendar";
import { reminderPosts } from "@/lib/reminders";
import { PushSettings } from "./push-settings";

export function ReminderPanel({ posts, onOpen }: { posts: Publication[]; onOpen: (post: Publication) => void }) {
  const [now, setNow] = useState<number | null>(null);
  const [lead, setLead] = useState(30);
  const [enabled, setEnabled] = useState(false);
  const [pushActive, setPushActive] = useState(false);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("overdue");
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNow(Date.now());
      try { const raw = JSON.parse(localStorage.getItem("focusmrk.reminders.v1") || "{}"); if ([15, 30, 60].includes(raw.lead)) setLead(raw.lead); setEnabled(raw.enabled === true); } catch { /* Default preferences remain usable. */ }
    }, 0);
    const tick = () => setNow(Date.now()); const interval = window.setInterval(tick, 30_000); window.addEventListener("focus", tick);
    return () => { clearTimeout(timer); clearInterval(interval); window.removeEventListener("focus", tick); };
  }, []);
  useEffect(() => {
    if (pushActive || !enabled || now === null || !("Notification" in window) || Notification.permission !== "granted") return;
    const alerts = reminderPosts(posts, now, lead);
    let seen: Record<string, number> = {};
    try { const saved = JSON.parse(localStorage.getItem("focusmrk.reminders.sent.v1") || "{}"); if (saved && typeof saved === "object" && !Array.isArray(saved)) seen = saved; } catch { return; }
    const notifications = alerts.upcoming.map((post) => ({ key: `post:${post.id}:${post.date}:${post.time}:${lead}`, title: "Publicación próxima", body: `${post.time} · ${post.brand} · ${post.title}` }));
    if (alerts.review.length) notifications.push({ key: `review:${dateKey(new Date(now))}`, title: "Contenido pendiente de aprobación", body: `${alerts.review.length} publicaciones en revisión.` });
    for (const note of notifications) {
      if (seen[note.key]) continue;
      try {
        // Persist first: another open tab can see the deduplication key before the next tick.
        seen[note.key] = now; localStorage.setItem("focusmrk.reminders.sent.v1", JSON.stringify(Object.fromEntries(Object.entries(seen).slice(-1000))));
        new Notification(note.title, { body: note.body, tag: note.key });
      } catch { /* In-panel reminders still work when native notifications are unavailable. */ }
    }
  }, [enabled, now, lead, posts, pushActive]);
  async function configure(nextEnabled: boolean, nextLead = lead) {
    if (nextEnabled) {
      if (!("Notification" in window)) { setMessage("Este navegador no admite notificaciones. Los avisos del panel siguen disponibles."); return; }
      try { if (await Notification.requestPermission() !== "granted") { setMessage("Permiso no concedido. Puedes seguir consultando los avisos del panel."); return; } } catch { setMessage("No se pudieron activar notificaciones en este dispositivo."); return; }
    }
    setEnabled(nextEnabled); setLead(nextLead);
    try { localStorage.setItem("focusmrk.reminders.v1", JSON.stringify({ enabled: nextEnabled, lead: nextLead })); setMessage(nextEnabled ? "Notificaciones activadas mientras la aplicación esté abierta." : "Notificaciones desactivadas."); } catch { setMessage("La preferencia se aplicó solo para esta sesión."); }
  }
  const alerts = now === null ? { upcoming: [], review: [], overdue: [] } : reminderPosts(posts, now, lead);
  const groups = [{ key: "overdue", label: "Atrasadas", items: alerts.overdue }, { key: "upcoming", label: "Próximas", items: alerts.upcoming }, { key: "review", label: "En revisión", items: alerts.review }];
  const total = new Set(groups.flatMap(group => group.items.map(post => post.id))).size;
  const selected = groups.find(group => group.key === category && group.items.length) || groups.find(group => group.items.length) || groups[0];
  return <details className="reminder-panel reminder-center"><summary><Bell size={15} /><strong>Recordatorios</strong><span>{now === null ? "Cargando…" : total ? `${total} publicaciones pendientes` : "Sin pendientes ahora"}</span>{alerts.overdue.length > 0 && <b className="reminder-urgent">{alerts.overdue.length} atrasadas</b>}</summary>
    {now !== null && !total && <div className="reminder-empty"><CheckCircle2 size={25} /><div><strong>Todo al día</strong><p>No hay publicaciones próximas, en revisión ni atrasadas en las últimas 24 horas.</p></div></div>}
    {total > 0 && <div className="reminder-content"><div className="reminder-tabs" role="group" aria-label="Tipo de recordatorio">{groups.map(group => <button type="button" key={group.key} disabled={!group.items.length} aria-pressed={selected.key === group.key} onClick={() => { setCategory(group.key); setShowAll(false); }}>{group.label}<b>{group.items.length}</b></button>)}</div><ul className="reminder-items">{(showAll ? selected.items : selected.items.slice(0, 5)).map(post => <li key={post.id}><button type="button" onClick={() => onOpen(post)}><span className="reminder-time">{post.time}<small>{post.date.split("-").reverse().join("/")}</small></span><span className="reminder-post"><strong>{post.title}</strong><small>{post.brand} · {post.networks.join(", ")}</small></span><ChevronRight size={16} /></button></li>)}</ul>{selected.items.length > 5 && <button className="reminder-more" type="button" onClick={() => setShowAll(!showAll)}>{showAll ? "Mostrar menos" : `Ver las ${selected.items.length} publicaciones`}</button>}</div>}
    <details className="reminder-settings"><summary><Settings2 size={14} />Configurar avisos<span>{enabled ? "Activados" : "Desactivados"} · {lead} min</span></summary>
    <PushSettings onActive={setPushActive} /><details><summary>Avisos con la página abierta</summary><div className="template-actions"><label>Avisar con<select value={lead} onChange={(e) => void configure(enabled, Number(e.target.value))}><option value={15}>15 minutos</option><option value={30}>30 minutos</option><option value={60}>1 hora</option></select></label><button type="button" className="secondary-button" onClick={() => void configure(!enabled)}>{enabled ? "Desactivar notificaciones" : "Activar notificaciones del navegador"}</button></div>
    <p>Los avisos funcionan con la aplicación abierta. Las atrasadas corresponden a las últimas 24 horas; marca como Publicado para retirarlas. La revisión pendiente se recuerda una vez al día. Al activar push, estos avisos locales se suspenden en este dispositivo.</p></details>
    </details>
    {message && <p role="status">{message}</p>}
  </details>;
}
