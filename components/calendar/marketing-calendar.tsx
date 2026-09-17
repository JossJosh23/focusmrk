"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, CalendarDays, ChevronLeft, ChevronRight, Plus, Search, SlidersHorizontal, ArrowUpRight, List, X } from "lucide-react";
import { comparePublications, dateKey, weekDays, emptyPublication, isPublication, NETWORKS, STATUSES, validDate, parseDate, readPublications, type Publication } from "@/lib/calendar";
import { MediaLibrary } from "./media-library";
import { configureMediaServer } from "@/lib/media";
import { MyDay } from "./my-day";
import { useTasks } from "./use-tasks";
import { NotificationModule } from "./notification-module";
import { ScheduleModule } from "./schedule-module";
import { PersonalTools } from "./personal-tools";
import { LogoutButton } from "../logout-button";
import { ReminderPanel } from "./reminder-panel";
import { CalendarViews } from "./calendar-views";
import { SocialPlatformIcon } from "./content-card";
import { readTemplates, type ContentTemplate } from "@/lib/templates";
import { CompanyModule } from "./company-module";
import { CompanySelector } from "./company-selector";
import { PostEditor } from "./post-editor";

import { ModuleNavigation, type WorkspaceModule } from "./module-navigation";

const STORAGE_KEY = "focusmrk.publications.v1";
const monthLabel = new Intl.DateTimeFormat("es", { month: "long", year: "numeric" });


export function MarketingCalendar({ databaseEnabled = false, notificationTimezone = "America/Guayaquil" }: { databaseEnabled?: boolean; notificationTimezone?: string }) {
  const taskStore = useTasks(databaseEnabled);
  const serverVersion = useRef(0);
  const saving = useRef(false);
  const snapshot = useRef({ posts: [] as Publication[], templates: [] as ContentTemplate[] });
  const [module, setModuleState] = useState<WorkspaceModule>("calendar");
  const setModule = useCallback((value: typeof module) => { if (!window.dispatchEvent(new Event("focusmrk-before-navigation", { cancelable: true }))) return; setModuleState(value); }, []);
  const [today, setToday] = useState("");
  const [month, setMonth] = useState<Date | null>(null);
  const [company, setCompany] = useState("");
  const [assignedCompanies, setAssignedCompanies] = useState<string[] | null>(null);
  const [posts, setPosts] = useState<Publication[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ text: string; undo?: { before: Publication; after?: Publication } } | null>(null);
  const [undoBusy, setUndoBusy] = useState(false);
  const [view, setView] = useState<"month" | "week" | "agenda">("month");
  const [network, setNetwork] = useState("Todas");
  const [status, setStatus] = useState("Todos");
  const [paidOnly, setPaidOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const templateStored = useRef<string | null>(null);
  const [templatesReady, setTemplatesReady] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Publication | null>(null);
  const stored = useRef<string | null>(null);
  const writable = ready && templatesReady;
  const companyPosts = company ? posts.filter(post => post.brand === company) : posts;
  function openPost(post: Publication) { setEditing(post.id ? post : { ...post, brand: company || assignedCompanies?.[0] || post.brand }); }
  function changeCompany(value: string) { if (value !== company && !window.dispatchEvent(new Event("focusmrk-before-navigation", { cancelable: true }))) return; setCompany(value); setStatus("Todos"); setPaidOnly(false); setNetwork("Todas"); setQuery(""); }
  const companyPicker = <CompanySelector server={databaseEnabled} canCreate={!assignedCompanies && (!databaseEnabled || ready)} known={Array.from(new Set(posts.map(post => post.brand)))} value={company} onChange={changeCompany} />;

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const openDay = (event: MessageEvent) => { if (event.data?.type === "focusmrk-open-day") setModule("day"); };
    navigator.serviceWorker.addEventListener("message", openDay);
    return () => navigator.serviceWorker.removeEventListener("message", openDay);
  }, [setModule]);

  useEffect(() => {
    if (!ready || !today || !("setAppBadge" in navigator)) return;
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: notificationTimezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const day = ["year", "month", "day"].map(type => parts.find(part => part.type === type)?.value).join("-");
    if (!taskStore.ready) return;
    const count = posts.filter(post => post.status !== "Publicado" && post.date <= day).length + taskStore.tasks.filter(task => !task.done && task.date <= day).length;
    void navigator.setAppBadge(count).catch(() => {});
  }, [posts, ready, today, notificationTimezone, taskStore.tasks, taskStore.ready]);

  useEffect(() => {
    const controller = new AbortController();
    function tick() { setToday(dateKey(new Date())); }
    const timer = window.setTimeout(async () => {
      configureMediaServer(databaseEnabled);
      const requested = new URLSearchParams(window.location.search).get("module");
      if (requested === "notifications" || requested === "day") setModule(requested);
      if (window.matchMedia("(max-width: 640px)").matches) setView("agenda");
      const now = new Date(); setToday(dateKey(now)); setMonth(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12));
      try {
        if (databaseEnabled) {
          const response = await fetch("/api/workspace", { cache: "no-store", signal: controller.signal });
          const data = await response.json();
          if (controller.signal.aborted) return;
          if (!response.ok) throw new Error(data.error || "No se pudo conectar a PostgreSQL.");
          const loadedPosts = readPublications(JSON.stringify(data.posts));
          const loadedTemplates = readTemplates(JSON.stringify(data.templates));
          snapshot.current = { posts: loadedPosts, templates: loadedTemplates };
          setPosts(loadedPosts); setTemplates(loadedTemplates);
          if (data.role === "marketing_manager") { setAssignedCompanies(data.companies); setCompany(data.companies[0] || ""); }
          if (data.companyId === "manabiche") setCompany("Manabiche");
          serverVersion.current = data.version; setReady(true); setTemplatesReady(true); return;
        }
        const raw = localStorage.getItem(STORAGE_KEY);
        const loadedPosts = readPublications(raw);
        const templateRaw = localStorage.getItem("focusmrk.templates.v1");
        const loadedTemplates = readTemplates(templateRaw);
        snapshot.current = { posts: loadedPosts, templates: loadedTemplates };
        setPosts(loadedPosts); stored.current = raw;
        setTemplates(loadedTemplates); templateStored.current = templateRaw; setTemplatesReady(true); setReady(true);
      } catch (error) { if (controller.signal.aborted) return; setError(databaseEnabled ? (error instanceof Error ? error.message : "No se pudo conectar con PostgreSQL.") : "No se pudo leer el calendario guardado. Comprueba el almacenamiento del navegador. No se sobrescribirán tus datos."); }
    }, 0);
    const interval = window.setInterval(tick, 30_000);
    window.addEventListener("focus", tick);
    return () => { controller.abort(); clearTimeout(timer); clearInterval(interval); window.removeEventListener("focus", tick); };
  }, [databaseEnabled, setModule]);

  useEffect(() => {
    if (!notice || notice.undo) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function persist(next: Publication[]): Promise<boolean> {
    if (!writable || saving.current) return false;
    if (posts !== snapshot.current.posts) { setError("El calendario cambió. Vuelve a intentar la operación."); return false; }
    if (databaseEnabled) return persistServer(next, templates);
    try {
      if (localStorage.getItem(STORAGE_KEY) !== stored.current) {
        setError("El calendario cambió en otra pestaña. Copia tus cambios pendientes y recarga la página para ver la última versión antes de guardar."); return false;
      }
      const raw = JSON.stringify(next);
      localStorage.setItem(STORAGE_KEY, raw);
      snapshot.current = { ...snapshot.current, posts: next };
      stored.current = raw; setPosts(next); setError(""); return true;
    } catch { setError("No se pudo guardar en este navegador. Comprueba que el almacenamiento esté permitido y tenga espacio disponible."); return false; }
  }

  async function persistServer(nextPosts: Publication[], nextTemplates: ContentTemplate[]): Promise<boolean> {
    if (saving.current) return false;
    saving.current = true;
    try {
      const response = await fetch("/api/workspace", { method: "PUT", headers: { "Content-Type": "application/json", "X-FocusMRK-Request": "1" }, body: JSON.stringify({ version: serverVersion.current, posts: nextPosts, templates: nextTemplates }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar en PostgreSQL.");
      snapshot.current = { posts: nextPosts, templates: nextTemplates };
      serverVersion.current = data.version; setPosts(nextPosts); setTemplates(nextTemplates); setError(""); return true;
    } catch (error) { setError(error instanceof Error ? error.message : "No se pudo guardar en el servidor."); return false; }
    finally { saving.current = false; }
  }

  async function save(draft: Publication) {
    const post = { ...draft, id: draft.id || crypto.randomUUID() };
    if (!isPublication(post)) { setError("Revisa los campos: título, fecha, hora y al menos una red social son obligatorios."); return false; }
    const next = draft.id ? posts.map((item) => item.id === draft.id ? post : item) : [...posts, post];
    if (!await persist(next)) return false;
    const date = parseDate(post.date); setMonth(date);
    if (company && company !== post.brand) setCompany(post.brand);
    setNetwork("Todas"); setStatus("Todos"); setPaidOnly(false); setQuery(""); setNotice({ text: "Publicación guardada" }); return true;
  }

  async function importData(nextPosts: Publication[], nextTemplates: ContentTemplate[], expectedPosts: Publication[], expectedTemplates: ContentTemplate[]) {
    if (!ready || !templatesReady || editing || saving.current) return false;
    if (expectedPosts !== snapshot.current.posts || expectedTemplates !== snapshot.current.templates) {
      setError("El calendario cambió durante la importación. Vuelve a intentarlo para conservar los cambios recientes."); return false;
    }
    if (databaseEnabled) return persistServer(nextPosts, nextTemplates);
    const beforePosts = stored.current; const beforeTemplates = templateStored.current;
    try {
      const postRaw = JSON.stringify(nextPosts); const templateRaw = JSON.stringify(nextTemplates);
      readPublications(postRaw); readTemplates(templateRaw);
      if (JSON.stringify(readPublications(beforePosts)) !== JSON.stringify(expectedPosts) || JSON.stringify(readTemplates(beforeTemplates)) !== JSON.stringify(expectedTemplates)) throw new Error("El calendario cambió durante la importación. Vuelve a intentarlo para conservar los cambios recientes.");
      if (localStorage.getItem(STORAGE_KEY) !== beforePosts || localStorage.getItem("focusmrk.templates.v1") !== beforeTemplates) throw new Error("Los datos cambiaron en otra pestaña. Recarga antes de importar.");
      try { localStorage.setItem(STORAGE_KEY, postRaw); localStorage.setItem("focusmrk.templates.v1", templateRaw); }
      catch (error) {
        if (beforePosts === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, beforePosts);
        if (beforeTemplates === null) localStorage.removeItem("focusmrk.templates.v1"); else localStorage.setItem("focusmrk.templates.v1", beforeTemplates);
        throw error;
      }
      snapshot.current = { posts: nextPosts, templates: nextTemplates };
      stored.current = postRaw; templateStored.current = templateRaw; setPosts(nextPosts); setTemplates(nextTemplates); setError(""); return true;
    } catch (error) { setError(error instanceof Error ? error.message : "No se pudo importar el respaldo."); return false; }
  }

  async function movePost(id: string, date: string) {
    const post = posts.find((item) => item.id === id);
    if (!post || !validDate(date) || post.date === date) return;
    const after = { ...post, date };
    if (await persist(posts.map((item) => item.id === id ? after : item))) setNotice({ text: `Publicación reprogramada al ${date}`, undo: { before: post, after } });
  }

  async function undoLastAction() {
    const action = notice?.undo;
    if (!action || undoBusy || editing) return;
    const current = posts.find(post => post.id === action.before.id);
    if (action.after ? JSON.stringify(current) !== JSON.stringify(action.after) : !!current) {
      setNotice({ text: "La publicación cambió después. No se puede deshacer esta acción." }); return;
    }
    setUndoBusy(true);
    try {
      const next = action.after ? posts.map(post => post.id === action.before.id ? action.before : post) : [...posts, action.before];
      if (await persist(next)) setNotice({ text: "Acción deshecha" });
    } finally { setUndoBusy(false); }
  }

  function goToday() { const now = new Date(); setToday(dateKey(now)); setMonth(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)); }
  function moveMonth(direction: number) { if (!month) return; const next = view === "week" ? new Date(month.getFullYear(), month.getMonth(), month.getDate() + direction * 7, 12) : new Date(month.getFullYear(), month.getMonth() + direction, 1, 12); if (next.getFullYear() >= 100 && next.getFullYear() <= 9999) setMonth(next); }
  const prefix = month ? dateKey(month).slice(0, 7) : "";
  const monthly = companyPosts.filter((post) => post.date.startsWith(`${prefix}-`));
  const week = month ? weekDays(month) : [];
  const period = view === "week" && week.length ? companyPosts.filter(post => post.date >= dateKey(week[0]) && post.date <= dateKey(week[6])) : monthly;
  const activeFilters = Number(status !== "Todos") + Number(network !== "Todas") + Number(paidOnly);
  function clearFilters() { setStatus("Todos"); setNetwork("Todas"); setPaidOnly(false); setQuery(""); }
  const visible = period.filter(post => (status === "Todos" || (status === "preparing" ? post.status === "Borrador" || post.status === "En revisi\u00f3n" : post.status === status)) && (!paidOnly || post.paid) && (network === "Todas" || post.networks.includes(network as typeof NETWORKS[number])) && `${post.title} ${post.copy} ${post.footer}`.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"))).sort(comparePublications);
  const periodLabel = view === "week" && week.length ? week.map(day => day.toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })).filter((_, index) => index === 0 || index === 6).join(" - ") : month ? monthLabel.format(month) : "Cargando calendario...";


  return <div className="workspace">
    <aside className="sidebar"><Link className="brand" href="/" aria-label="FocusMRK inicio"><span className="brand-symbol">f.</span>focus<span>mrk</span></Link>{companyPicker}<ModuleNavigation active={module} onChange={setModule} /><p className="sidebar-caption">Planifica tu contenido.<br />La publicación en redes es manual.</p></aside>
    <main className="main-content">
      <header className="workspace-topbar"><div className="workspace-context"><strong>Tu espacio de trabajo</strong><span>{company || "Planificación de contenido"}</span></div><div className="mobile-company-selector">{companyPicker}</div><ReminderPanel posts={companyPosts} onOpen={setEditing} onConfigure={() => setModule("notifications")} />{databaseEnabled && <LogoutButton />}</header>
      <ModuleNavigation active={module} onChange={setModule} mobile />
      {error && <div role="alert" className="error-banner">{error}</div>}
      <div className="page-content calendar-page" hidden={module !== "calendar"}><div className="page-heading"><div><span className="eyebrow">PLANIFICACIÓN</span><h1>Calendario de contenido<span>.</span></h1><p>Organiza tus ideas y prepara lo que vas a publicar.</p></div><button className="primary-button" disabled={!writable} onClick={() => openPost(emptyPublication(today))}><Plus size="var(--icon-md)" />Nueva publicación</button></div>
      <p className="calendar-filter-hint">Filtra el periodo con estos indicadores.</p>
      <div className="stats-grid interactive-stats" role="group" aria-label="Filtros rápidos del periodo">
        <button type="button" className="stat" aria-controls="calendar-results" aria-pressed={!activeFilters && !query} onClick={clearFilters}><span>Publicaciones {view === "week" ? "de la semana" : "del mes"}</span><strong>{period.length}</strong><ArrowUpRight className="stat-affordance" size="var(--icon-sm)" aria-hidden="true" /></button>
        <button type="button" className="stat" aria-controls="calendar-results" aria-pressed={status === "preparing"} onClick={() => setStatus(status === "preparing" ? "Todos" : "preparing")}><span>En preparación</span><strong>{period.filter(post => post.status === "Borrador" || post.status === "En revisión").length}</strong><ArrowUpRight className="stat-affordance" size="var(--icon-sm)" aria-hidden="true" /></button>
        <button type="button" className="stat" aria-controls="calendar-results" aria-pressed={status === "Aprobado"} onClick={() => setStatus(status === "Aprobado" ? "Todos" : "Aprobado")}><span>Listas para publicar</span><strong>{period.filter(post => post.status === "Aprobado").length}</strong><ArrowUpRight className="stat-affordance" size="var(--icon-sm)" aria-hidden="true" /></button>
        <button type="button" className="stat" aria-controls="calendar-results" aria-pressed={paidOnly} onClick={() => setPaidOnly(!paidOnly)}><span>Con pauta</span><strong>{period.filter(post => post.paid).length}</strong><ArrowUpRight className="stat-affordance" size="var(--icon-sm)" aria-hidden="true" /></button>
      </div>
      <section className="calendar-panel" aria-label="Calendario de publicaciones">
        <div className="calendar-controls simplified-controls">
          <div className="calendar-navigation-row"><div className="month-navigation"><h2 aria-live="polite">{periodLabel}</h2><div className="month-arrows"><button type="button" className="icon-button" aria-label={view === "week" ? "Semana anterior" : "Mes anterior"} disabled={!month || prefix === "0100-01"} onClick={() => moveMonth(-1)}><ChevronLeft size="var(--icon-md)" /></button><button type="button" className="icon-button" aria-label={view === "week" ? "Semana siguiente" : "Mes siguiente"} disabled={!month || prefix === "9999-12"} onClick={() => moveMonth(1)}><ChevronRight size="var(--icon-md)" /></button></div><button type="button" className="today-button" onClick={goToday}>Hoy</button></div>
          <div className="segmented-control" role="group" aria-label="Vista del calendario">{([['month', 'Mes'], ['week', 'Semana'], ['agenda', 'Agenda']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={view === value} onClick={() => setView(value)}>{value === "agenda" ? <List size="var(--icon-sm)" /> : <CalendarDays size="var(--icon-sm)" />}{label}</button>)}</div></div>
          <div className="calendar-search-row"><label className="search-field"><Search size="var(--icon-sm)" /><input aria-label="Buscar publicaciones" placeholder="Buscar publicación..." value={query} onChange={event => setQuery(event.target.value)} /></label><button type="button" className="secondary-button calendar-filter-toggle" aria-expanded={filtersOpen} aria-controls="calendar-filter-panel" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size="var(--icon-sm)" />Filtros{activeFilters > 0 && <b>{activeFilters}</b>}</button>{(activeFilters > 0 || query) && <button type="button" className="calendar-clear-filters" onClick={clearFilters}>Limpiar filtros</button>}</div>
          <div id="calendar-filter-panel" className="calendar-filter-panel" hidden={!filtersOpen}><label className="status-filter">Estado<select aria-label="Filtrar por estado" value={status} onChange={event => setStatus(event.target.value)}><option value="Todos">Todos los estados</option><option value="preparing">En preparación</option>{STATUSES.map(item => <option key={item}>{item}</option>)}</select></label><div className="filter-buttons" role="group" aria-label="Filtrar por red social">{(["Todas", ...NETWORKS] as const).map(item => <button type="button" key={item} aria-label={item === "Todas" ? "Todas las redes" : item} aria-pressed={network === item} onClick={() => setNetwork(item)}>{item === "Todas" ? "Todas" : <><SocialPlatformIcon platform={item} active={network === item} size="var(--icon-md)" />{item}</>}</button>)}</div><label className="calendar-paid-filter"><input type="checkbox" checked={paidOnly} onChange={event => setPaidOnly(event.target.checked)} />Solo con pauta</label></div>
        </div>
        {ready && visible.length === 0 && <div className="calendar-empty-state">
          <p role="status">{activeFilters || query ? "No hay publicaciones que coincidan con los filtros." : view === "week" ? "Todavía no hay publicaciones esta semana." : "Todavía no hay publicaciones este mes."}</p>
          <button type="button" className="secondary-button" disabled={!writable} onClick={activeFilters || query ? clearFilters : () => openPost(emptyPublication(prefix === today.slice(0, 7) ? today : month ? dateKey(month) : today))}>{activeFilters || query ? "Mostrar todas las publicaciones" : "Crear la primera publicación"}</button>
        </div>}
        <CalendarViews view={view} month={month} today={today} posts={visible} ready={writable} onEdit={openPost} onMove={(id, date) => void movePost(id, date)} />
        <div className="calendar-footer"><div className="legend"><span className="local-dot" />Tu planificación, en un solo lugar</div><span>{visible.length} publicaciones {activeFilters || query ? "en el filtro" : view === "week" ? "esta semana" : "este mes"}</span></div>
      </section>
      <div className="calendar-tip"><span><ArrowUpRight size="var(--icon-md)" /><strong>Tu próxima idea empieza en un día.</strong> Arrastra un post a otro día. En móvil o con teclado, abre el post y cambia su fecha.</span><small>Hora local del dispositivo · Publicación manual</small></div>

      </div>
      {module === "library" && <div className="page-content"><div className="page-heading"><div><span className="eyebrow">TUS RECURSOS, EN UN SOLO LUGAR</span><h1>Biblioteca multimedia<span>.</span></h1><p>Organiza tus imágenes y videos y conviértelos en publicaciones.</p></div><button className="secondary-button" onClick={() => setModule("calendar")}><CalendarDays size="var(--icon-sm)" />Volver al calendario</button></div><MediaLibrary key={company} company={company} posts={posts} onOpenPost={setEditing} standalone usedIds={posts.map((post) => post.mediaId)} onSelect={ready ? (asset) => setEditing({ ...emptyPublication(today), brand: company || asset.brand, mediaId: asset.id }) : undefined} /></div>}
      {module === "schedule" && ready && <div className="page-content"><ScheduleModule key={company} posts={companyPosts} today={today} onCreate={() => openPost(emptyPublication(today))} onEdit={setEditing} /><PersonalTools posts={posts} templates={templates} disabled={!ready || !templatesReady || !!editing} onImport={importData} /></div>}
      {module === "day" && <MyDay store={taskStore} posts={companyPosts} timezone={notificationTimezone} server={databaseEnabled} onOpenPost={setEditing} onSettings={() => setModule("notifications")} />}
      {module === "company" && <div className="page-content"><CompanyModule company={company} known={Array.from(new Set(posts.map(post => post.brand)))} server={databaseEnabled} onChange={changeCompany} /></div>}
      {module === "notifications" && assignedCompanies && <section className="surface"><h2>Notificaciones</h2><p>La configuración de notificaciones automáticas está disponible para el administrador. Puedes consultar tus recordatorios en la campana del calendario.</p></section>}{module === "notifications" && !assignedCompanies && <NotificationModule databaseEnabled={databaseEnabled} timezone={notificationTimezone} />}
    </main>
    <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">{notice && <div className="toast"><CheckCircle2 size="var(--icon-md)" /><span>{notice.text}</span>{notice.undo && <button type="button" className="secondary-button" disabled={undoBusy || !!editing} onClick={() => void undoLastAction()}>{undoBusy ? "Deshaciendo…" : "Deshacer"}</button>}<button className="icon-button" aria-label="Cerrar notificación" onClick={() => setNotice(null)}><X size="var(--icon-sm)" /></button></div>}</div>
    {editing && <PostEditor server={databaseEnabled} usedMediaIds={posts.map((post) => post.mediaId)} persistenceError={error} readOnly={false} initial={editing} posts={posts} onClose={() => setEditing(null)} onSave={save} onDelete={async (id) => { const before = posts.find(post => post.id === id); if (!before) return false; if (!await persist(posts.filter((post) => post.id !== id))) return false; setNotice({ text: "Publicación eliminada", undo: { before } }); return true; }} />}
  </div>;
}
