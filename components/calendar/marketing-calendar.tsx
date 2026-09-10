"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Search, Megaphone, Layers, CheckCircle2, ArrowUpRight, List, X } from "lucide-react";
import { comparePublications, dateKey, emptyPublication, isPublication, NETWORKS, parseDate, readPublications, type Publication } from "@/lib/calendar";
import { CalendarViews } from "./calendar-views";
import { SocialPlatformIcon } from "./content-card";
import { PostEditor } from "./post-editor";

const STORAGE_KEY = "focusmrk.publications.v1";
const monthLabel = new Intl.DateTimeFormat("es", { month: "long", year: "numeric" });


export function MarketingCalendar() {
  const [today, setToday] = useState("");
  const [month, setMonth] = useState<Date | null>(null);
  const [posts, setPosts] = useState<Publication[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ text: string } | null>(null);
  const [view, setView] = useState<"month" | "agenda">("month");
  const [network, setNetwork] = useState("Todas");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Publication | null>(null);
  const stored = useRef<string | null>(null);

  useEffect(() => {
    function tick() { setToday(dateKey(new Date())); }
    const timer = window.setTimeout(() => {
      if (window.matchMedia("(max-width: 640px)").matches) setView("agenda");
      const now = new Date(); setToday(dateKey(now)); setMonth(new Date(now.getFullYear(), now.getMonth(), 1, 12));
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setPosts(readPublications(raw)); stored.current = raw; setReady(true);
      } catch { setError("No se pudo leer el calendario guardado. Comprueba el almacenamiento del navegador. No se sobrescribirán tus datos."); }
    }, 0);
    const interval = window.setInterval(tick, 30_000);
    window.addEventListener("focus", tick);
    return () => { clearTimeout(timer); clearInterval(interval); window.removeEventListener("focus", tick); };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function persist(next: Publication[]): boolean {
    if (!ready) return false;
    try {
      if (localStorage.getItem(STORAGE_KEY) !== stored.current) {
        setError("El calendario cambió en otra pestaña. Copia tus cambios pendientes y recarga la página para ver la última versión antes de guardar."); return false;
      }
      const raw = JSON.stringify(next);
      localStorage.setItem(STORAGE_KEY, raw);
      stored.current = raw; setPosts(next); setError(""); return true;
    } catch { setError("No se pudo guardar en este navegador. Comprueba que el almacenamiento esté permitido y tenga espacio disponible."); return false; }
  }

  function save(draft: Publication) {
    const post = { ...draft, id: draft.id || crypto.randomUUID() };
    if (!isPublication(post)) { setError("Revisa los campos: título, fecha, hora y al menos una red social son obligatorios."); return false; }
    const next = draft.id ? posts.map((item) => item.id === draft.id ? post : item) : [...posts, post];
    if (!persist(next)) return false;
    const date = parseDate(post.date); setMonth(new Date(date.getFullYear(), date.getMonth(), 1, 12));
    setNetwork("Todas"); setQuery(""); setNotice({ text: "Publicación guardada" }); return true;
  }

  function goToday() { const now = new Date(); setToday(dateKey(now)); setMonth(new Date(now.getFullYear(), now.getMonth(), 1, 12)); }
  function moveMonth(direction: number) { if (month) setMonth(new Date(month.getFullYear(), month.getMonth() + direction, 1, 12)); }
  const prefix = month ? dateKey(month).slice(0, 7) : "";
  const monthly = posts.filter((post) => post.date.startsWith(`${prefix}-`));
  const visible = monthly.filter((post) => (network === "Todas" || post.networks.some((item) => item === network)) && `${post.title} ${post.copy} ${post.footer}`.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"))).sort(comparePublications);

  return <div className="workspace">
    <aside className="sidebar"><Link className="brand" href="/" aria-label="FocusMRK inicio"><span className="brand-symbol">f.</span>focus<span>mrk</span></Link><span className="workspace-label">ESPACIO DE TRABAJO</span><div className="brand-workspace"><span className="brand-avatar">M</span><div>Mi marca<small>Plan de contenido</small></div></div><span className="workspace-label">ORGANIZACIÓN</span><div className="nav-active"><CalendarDays size={18} />Calendario<span className="nav-dot" /></div><div className="sidebar-note"><span className="note-icon"><Layers size={20} /></span><h3>Buenas ideas.<br />Contenido con intención.</h3><p>Dale a cada publicación un lugar en tu calendario.</p></div><div className="sidebar-bottom"><span className="local-dot" />Espacio local<small>Guardado en este navegador</small></div></aside>
    <main className="main-content"><header className="topbar"><span>Mi marca <span className="breadcrumb">/</span> <strong>Calendario de contenido</strong></span><span className="profile-avatar">M</span></header>
      <div className="page-content"><div className="page-heading"><div><span className="eyebrow">PLANIFICA. CREA. CONECTA.</span><h1>Tu contenido, en orden<span>.</span></h1><p>Un espacio para convertir tus ideas en las próximas publicaciones de tu marca.</p></div><button className="primary-button" disabled={!ready} onClick={() => setEditing(emptyPublication(today))}><Plus size={18} />Nueva publicación</button></div>
      <div className="stats-grid"><div className="stat"><span className="stat-icon purple"><CalendarDays size={20} /></span><div><span>Publicaciones del mes</span><strong>{monthly.length}<small>contenidos planificados</small></strong></div></div><div className="stat"><span className="stat-icon amber"><Layers size={20} /></span><div><span>En preparación</span><strong>{monthly.filter((post) => (post.status === "Borrador" || post.status === "En revisión")).length}<small>borradores y en revisión</small></strong></div></div><div className="stat"><span className="stat-icon green"><CheckCircle2 size={20} /></span><div><span>Listas para publicar</span><strong>{monthly.filter((post) => post.status === "Aprobado").length}<small>con contenido aprobado</small></strong></div></div><div className="stat"><span className="stat-icon rose"><Megaphone size={20} /></span><div><span>Con pauta</span><strong>{monthly.filter((post) => post.paid).length}<small>con inversión prevista</small></strong></div></div></div>
      {error && <div role="alert" className="error-banner">{error}</div>}
      <section className="calendar-panel" aria-label={view === "month" ? "Calendario mensual" : "Agenda del mes"}><div className="calendar-toolbar"><div className="month-navigation"><h2 aria-live="polite">{month ? monthLabel.formatToParts(month).filter((part) => part.type === "month" || part.type === "year").map((part) => part.value).join(" ") : "Cargando calendario…"}</h2><div className="month-arrows"><button className="icon-button" aria-label="Mes anterior" disabled={!month || prefix === "0100-01"} onClick={() => moveMonth(-1)}><ChevronLeft size={18} /></button><button className="icon-button" aria-label="Mes siguiente" disabled={!month || prefix === "9999-12"} onClick={() => moveMonth(1)}><ChevronRight size={18} /></button></div><button className="today-button" onClick={goToday}>Hoy</button></div><div className="calendar-filters"><label className="search-field"><Search size={16} /><input aria-label="Buscar publicaciones" placeholder="Buscar publicación…" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div></div>
        <div className="view-toolbar"><div className="segmented-control" role="group" aria-label="Vista del calendario">{([['month', 'Mes'], ['agenda', 'Agenda']] as const).map(([value, label]) => <button key={value} aria-pressed={view === value} onClick={() => setView(value)}>{value === "month" ? <CalendarDays size={15} /> : <List size={15} />}{label}</button>)}</div><div className="filter-buttons" role="group" aria-label="Filtrar por red social">{(["Todas", ...NETWORKS] as const).map((item) => <button key={item} aria-label={item === "Todas" ? "Todas las redes" : item} aria-pressed={network === item} onClick={() => setNetwork(item)}>{item === "Todas" ? "Todas" : <SocialPlatformIcon platform={item} active={network === item} size={17} />}</button>)}</div></div>
        {ready && visible.length === 0 && <p className="empty-month-note" role="status">{monthly.length ? "No hay publicaciones que coincidan con los filtros." : "No hay publicaciones este mes."}</p>}
        <CalendarViews view={view} month={month} today={today} posts={visible} ready={ready} onEdit={setEditing} />
        <div className="calendar-footer"><div className="legend"><span className="local-dot" />Tu planificación, en un solo lugar</div><span>{visible.length} publicaciones {network !== "Todas" || query ? "en el filtro" : "este mes"}</span></div>
      </section>
      <div className="calendar-tip"><span><ArrowUpRight size={17} /><strong>Tu próxima idea empieza en un día.</strong> Haz clic en una fecha para crear contenido o en una publicación para editarla.</span><small>Hora local del dispositivo · Publicación manual</small></div>

      </div>
    </main>
    <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">{notice && <div className="toast"><CheckCircle2 size={19} /><span>{notice.text}</span><button className="icon-button" aria-label="Cerrar notificación" onClick={() => setNotice(null)}><X size={15} /></button></div>}</div>
    {editing && <PostEditor initial={editing} posts={posts.filter((post) => post.date === editing.date).sort((a, b) => a.time.localeCompare(b.time))} onClose={() => setEditing(null)} onSave={save} onDelete={(id) => { if (!persist(posts.filter((post) => post.id !== id))) return false; setNotice({ text: "Publicación eliminada" }); return true; }} />}
  </div>;
}
