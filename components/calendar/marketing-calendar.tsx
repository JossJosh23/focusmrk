"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { PanelLeftClose, PanelLeftOpen, CheckCircle2, ChevronLeft, ChevronRight, Plus, Search, SlidersHorizontal, X, Info, Megaphone, Star } from "lucide-react";
import { isOverdue, FORMAT_FILTERS, matchesFormat, type FormatFilter, comparePublications, dateKey, weekDays, emptyPublication, isPublication, NETWORKS, STATUSES, validDate, parseDate, readPublications, postMediaIds, type Publication } from "@/lib/calendar";
import { MediaLibrary } from "./media-library";
import { configureMediaServer } from "@/lib/media";
import { MyDay } from "./my-day";
import { useTasks } from "./use-tasks";
import { NotificationModule } from "./notification-module";
import { ContentReportsDashboard } from "../content-reports/dashboard";
import { ScheduleModule } from "./schedule-module";
import { PersonalTools } from "./personal-tools";
import { UserProfileMenu } from "../user-profile-menu";
import { ReminderPanel } from "./reminder-panel";
import { CalendarViews } from "./calendar-views";
import { NetworkIcons } from "./content-card";
import { PostDrawer } from "./post-drawer";
import { readTemplates, type ContentTemplate } from "@/lib/templates";
import { CompanyModule } from "./company-module";
import { CompanySelector } from "./company-selector";
import { PostComposer } from "./composer/post-composer";
import { reviewNotice, statusAfterReview } from "./composer/review-share";
import type { PostReview } from "@/lib/post-reviews";

import { ModuleNavigation, moduleLabel, type WorkspaceModule } from "./module-navigation";
import { ConnectedNetworks } from "./connected-networks";
import { WorkspaceSearch } from "./workspace-search";

const STORAGE_KEY = "focusmrk.publications.v1";
const monthLabel = new Intl.DateTimeFormat("es-EC", { month: "long", year: "numeric" });
const weekLabel = new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "short" });
async function workspaceResponse(response: Response) {
  const data = await response.json().catch(() => {
    throw new Error(`El servidor devolvió una respuesta vacía o inválida al calendario (HTTP ${response.status}). Recarga la página; si persiste, revisa los logs del servidor.`);
  });
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error(`Respuesta inválida del calendario (HTTP ${response.status}).`);
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : `No se pudo completar la operación del calendario (HTTP ${response.status}).`);
  return data;
}


export function MarketingCalendar({ databaseEnabled = false, notificationTimezone = "America/Guayaquil", initialModule = "day", publicationId }: { databaseEnabled?: boolean; notificationTimezone?: string; initialModule?: WorkspaceModule; publicationId?: string }) {
  const taskStore = useTasks(databaseEnabled);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const serverVersion = useRef(0);
  const saving = useRef(false);
  const snapshot = useRef({ posts: [] as Publication[], templates: [] as ContentTemplate[] });
  const [module, setModuleState] = useState<WorkspaceModule>(initialModule);
  const setModule = useCallback((value: typeof module) => { if (!window.dispatchEvent(new Event("focusmrk-before-navigation", { cancelable: true }))) return; setModuleState(value); const url = new URL(window.location.href); url.pathname = "/"; url.search = ""; url.searchParams.set("module", value); window.history.replaceState(null, "", url); }, []);
  const [today, setToday] = useState("");
  const [month, setMonth] = useState<Date | null>(null);
  const [company, setCompany] = useState("");
  const [assignedCompanies, setAssignedCompanies] = useState<string[] | null>(null);
  const [posts, setPosts] = useState<Publication[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ text: string; undo?: { before: Publication; after?: Publication } } | null>(null);
  const [undoBusy, setUndoBusy] = useState(false);
  const [importantBusy, setImportantBusy] = useState(false);
  const [view, setView] = useState<"month" | "week" | "agenda">("month");
  const [network, setNetwork] = useState("Todas");
  const [status, setStatus] = useState("Todos");
  const [importantOnly, setImportantOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [quickBusy, setQuickBusy] = useState(false);
  const [paidOnly, setPaidOnly] = useState(false);
  const [format, setFormat] = useState<FormatFilter>("Todos");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersMenu = useRef<HTMLDivElement>(null);
  const [drawerId, setDrawerId] = useState("");
  useEffect(() => {
    // Phones open on Agenda; the month grid only shows status dots there.
    const timer = window.setTimeout(() => { if (window.matchMedia("(max-width: 767px)").matches) setView("agenda"); }, 0);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!filtersOpen) return;
    const outside = (event: PointerEvent) => { if (!filtersMenu.current?.contains(event.target as Node)) setFiltersOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [filtersOpen]);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const templateStored = useRef<string | null>(null);
  const [templatesReady, setTemplatesReady] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Publication | null>(null);
  const stored = useRef<string | null>(null);
  const writable = ready && templatesReady;
  const companyPosts = company ? posts.filter(post => post.brand === company) : posts;
  function openPost(post: Publication) { setEditing(post.id ? post : { ...post, brand: company || assignedCompanies?.[0] || post.brand }); }
  function changeCompany(value: string) { if (value !== company && !window.dispatchEvent(new Event("focusmrk-before-navigation", { cancelable: true }))) return; setCompany(value); try { localStorage.setItem("focusmrk.selected-company", value); } catch {} setStatus("Todos"); setPaidOnly(false); setImportantOnly(false); setOverdueOnly(false); setFormat("Todos"); setNetwork("Todas"); setQuery(""); }
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
    // Composer "Copiar enlace": /?module=calendar&post=<id>.
    function openRequestedPost(loaded: Publication[]) {
      const id = new URLSearchParams(window.location.search).get("post");
      const target = id ? loaded.find(post => post.id === id) : undefined;
      if (target) { setModuleState("calendar"); setEditing(target); }
    }
    const timer = window.setTimeout(async () => {
      configureMediaServer(databaseEnabled);
      const requested = new URLSearchParams(window.location.search).get("module");
      // "integrations" now lives inside Empresa; OAuth callbacks and old links still send it.
      if (requested && ["day", "calendar", "library", "schedule", "content", "company", "integrations", "settings", "notifications", "reports"].includes(requested)) setModuleState(requested === "reports" ? "content" : requested === "integrations" ? "company" : requested as WorkspaceModule);
      let savedCompany: string | null = null;
      try { savedCompany = localStorage.getItem("focusmrk.selected-company"); } catch {}
      if (window.matchMedia("(max-width: 640px)").matches) setView("agenda");
      const now = new Date(); setToday(dateKey(now)); setMonth(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12));
      try {
        if (databaseEnabled) {
          const response = await fetch("/api/workspace", { cache: "no-store", signal: controller.signal });
          const data = await workspaceResponse(response);
          if (controller.signal.aborted) return;
          if (!response.ok) throw new Error(data.error || "No se pudo conectar a PostgreSQL.");
          const loadedPosts = readPublications(JSON.stringify(data.posts));
          const loadedTemplates = readTemplates(JSON.stringify(data.templates));
          snapshot.current = { posts: loadedPosts, templates: loadedTemplates };
          setPosts(loadedPosts); setTemplates(loadedTemplates);
          if (data.role === "marketing_manager") { setAssignedCompanies(data.companies); setCompany(data.companies[0] || ""); }
          if (data.companyId === "manabiche") setCompany("Manabiche");
          if (savedCompany !== null && (data.role !== "marketing_manager" || !savedCompany || data.companies.includes(savedCompany))) setCompany(savedCompany);
          const requestedCompany = new URLSearchParams(window.location.search).get("company") || ((requested === "content" || initialModule === "content") ? new URLSearchParams(window.location.search).get("companyId") : null);
          if (requestedCompany && (data.role !== "marketing_manager" || data.companies.includes(requestedCompany))) setCompany(requestedCompany);
          serverVersion.current = data.version; setReady(true); setTemplatesReady(true); openRequestedPost(loadedPosts); return;
        }
        if (savedCompany !== null) setCompany(savedCompany);
        const raw = localStorage.getItem(STORAGE_KEY);
        const loadedPosts = readPublications(raw);
        const templateRaw = localStorage.getItem("focusmrk.templates.v1");
        const loadedTemplates = readTemplates(templateRaw);
        snapshot.current = { posts: loadedPosts, templates: loadedTemplates };
        setPosts(loadedPosts); stored.current = raw;
        setTemplates(loadedTemplates); templateStored.current = templateRaw; setTemplatesReady(true); setReady(true); openRequestedPost(loadedPosts);
      } catch (error) { if (controller.signal.aborted) return; setError(databaseEnabled ? (error instanceof Error ? error.message : "No se pudo conectar con PostgreSQL.") : "No se pudo leer el calendario guardado. Comprueba el almacenamiento del navegador. No se sobrescribirán tus datos."); }
    }, 0);
    const interval = window.setInterval(tick, 30_000);
    window.addEventListener("focus", tick);
    return () => { controller.abort(); clearTimeout(timer); clearInterval(interval); window.removeEventListener("focus", tick); };
  }, [databaseEnabled, setModule, initialModule]);

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
      const data = await workspaceResponse(response);
      if (!response.ok) throw new Error(data.error || "No se pudo guardar en PostgreSQL.");
      snapshot.current = { posts: nextPosts, templates: nextTemplates };
      serverVersion.current = data.version; setPosts(nextPosts); setTemplates(nextTemplates); setError(""); return true;
    } catch (error) { setError(error instanceof Error ? error.message : "No se pudo guardar en el servidor."); return false; }
    finally { saving.current = false; }
  }

  // Approval links: decisions are read every 45 s (and on focus) and applied to the posts' status here, through the
  // normal versioned save, so a reviewer never causes an edit conflict. The post open in the editor is updated by the composer.
  const [reviews, setReviews] = useState<PostReview[]>([]);
  const applyingReviews = useRef(false);
  useEffect(() => {
    if (!databaseEnabled || !ready) return;
    let active = true;
    async function load() {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch("/api/post-reviews", { cache: "no-store" });
        if (response.ok && active) setReviews(await response.json());
      } catch { /* Retried on the next tick. */ }
    }
    void load();
    const timer = window.setInterval(load, 45_000);
    window.addEventListener("focus", load);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", load); };
  }, [databaseEnabled, ready]);
  const applyReviews = useEffectEvent(async () => {
    if (applyingReviews.current || saving.current || !writable) return;
    const pending = reviews.filter(review => review.decision && review.decidedAt && !review.appliedAt && review.postId !== editing?.id);
    if (!pending.length) return;
    applyingReviews.current = true;
    try {
      const byPost = new Map(pending.map(review => [review.postId, review]));
      const next = posts.map(post => {
        const review = byPost.get(post.id);
        const status = review ? statusAfterReview(review.decision, post.status) : post.status;
        return status === post.status ? post : { ...post, status };
      });
      const changed = next.some((post, index) => post !== posts[index]);
      if (changed && !await persist(next)) return;
      const items = pending.map(review => ({ postId: review.postId, decidedAt: review.decidedAt }));
      const response = await fetch("/api/post-reviews", { method: "PATCH", headers: { "Content-Type": "application/json", "X-FocusMRK-Request": "1" }, body: JSON.stringify({ items }) });
      if (response.ok) setReviews(current => current.map(review => byPost.get(review.postId)?.decidedAt === review.decidedAt ? { ...review, appliedAt: new Date().toISOString() } : review));
      if (changed) setNotice({ text: pending.length === 1 ? reviewNotice(pending[0]) : `Recibiste ${pending.length} respuestas de aprobación.` });
    } catch { /* Retried on the next tick. */ }
    finally { applyingReviews.current = false; }
  });
  useEffect(() => { const timer = window.setTimeout(() => void applyReviews(), 0); return () => window.clearTimeout(timer); }, [reviews, posts, editing]);

  // quiet: the composer autosave persists without the notice or resetting the calendar filters.
  async function save(draft: Publication, options: { quiet?: boolean } = {}) {
    const post = { ...draft, id: draft.id || crypto.randomUUID() };
    if (!isPublication(post)) { setError("Revisa los campos: título, fecha, hora y al menos una red social son obligatorios."); return false; }
    const next = draft.id ? posts.map((item) => item.id === draft.id ? post : item) : [...posts, post];
    if (!await persist(next)) return false;
    if (options.quiet) return true;
    const date = parseDate(post.date); setMonth(date);
    if (company && company !== post.brand) setCompany(post.brand);
    setNetwork("Todas"); setStatus("Todos"); setPaidOnly(false); setImportantOnly(false); setOverdueOnly(false); setFormat("Todos"); setQuery(""); setNotice({ text: "Publicación guardada" }); return true;
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

  async function toggleImportant(post: Publication) {
    if (!writable || saving.current || importantBusy) return;
    setImportantBusy(true);
    try {
      const current = posts.find(item => item.id === post.id);
      if (!current) return;
      const important = !current.important;
      if (await persist(posts.map(item => item.id === post.id ? { ...item, important } : item))) {
        setNotice({ text: important ? "Publicación marcada como importante" : "Marca de importante eliminada" });
      }
    } finally { setImportantBusy(false); }
  }

  async function quickAction(post: Publication, action: Publication["status"] | "duplicate") {
    if (!writable || saving.current || quickBusy) return;
    const current = posts.find(item => item.id === post.id);
    if (!current) return;
    setQuickBusy(true);
    try {
      if (action === "duplicate") {
        const copy: Publication = { ...current, id: crypto.randomUUID(), title: `${current.title.slice(0, 152)} (copia)`, status: "Borrador" };
        if (await persist([...posts, copy])) setNotice({ text: "Copia creada como borrador en la misma fecha." });
      } else if (current.status !== action) {
        const after = { ...current, status: action };
        if (await persist(posts.map(item => item.id === current.id ? after : item))) setNotice({ text: `Estado actualizado: ${action}`, undo: { before: current, after } });
      }
    } finally { setQuickBusy(false); }
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
  const activeFilters = Number(status !== "Todos") + Number(network !== "Todas") + Number(paidOnly) + Number(format !== "Todos") + Number(importantOnly) + Number(overdueOnly);
  function clearFilters() { setStatus("Todos"); setNetwork("Todas"); setPaidOnly(false); setImportantOnly(false); setOverdueOnly(false); setFormat("Todos"); setQuery(""); }
  const visible = period.filter(post => (!importantOnly || post.important) && (!overdueOnly || isOverdue(post, today)) && matchesFormat(post, format) && (status === "Todos" || (status === "preparing" ? post.status === "Borrador" || post.status === "En revisi\u00f3n" : post.status === status)) && (!paidOnly || post.paid) && (network === "Todas" || post.networks.includes(network as typeof NETWORKS[number])) && `${post.title} ${post.copy} ${post.footer}`.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"))).sort(comparePublications);
  // "octubre de 2026" → "Octubre de 2026"; weeks read "20 – 26 oct 2026".
  const periodLabel = view === "week" && week.length ? `${weekLabel.format(week[0]).replace(/\./g, "")} – ${weekLabel.format(week[6]).replace(/\./g, "")} ${week[6].getFullYear()}` : month ? monthLabel.format(month).replace(/^./, letter => letter.toLocaleUpperCase("es")) : "Cargando calendario…";
  const drawerPost = drawerId ? posts.find(post => post.id === drawerId) || null : null;


  return <div className={`workspace${sidebarCollapsed ? " workspace-sidebar-collapsed" : ""}`}>
    <aside className="sidebar"><Link className="brand" href="/" aria-label="Kromaiso, inicio"><Image unoptimized className="brand-logo" src="/brand/kromaiso-logo-dark.svg" alt="" width={156} height={28} priority /><Image unoptimized className="brand-icon" src="/brand/kromaiso-icon.svg" alt="" width={27} height={28} /></Link>{companyPicker}<ModuleNavigation active={module} onChange={setModule} collapsed={sidebarCollapsed} pending={ready && today && taskStore.ready ? companyPosts.filter(post => post.status !== "Publicado" && post.date <= today).length + taskStore.tasks.filter(task => !task.done && task.date <= today).length : 0} /><ConnectedNetworks company={company} server={databaseEnabled} refresh={module} onOpen={() => setModule("company")} /><button className="sidebar-collapse" type="button" onClick={() => setSidebarCollapsed(value => !value)} aria-expanded={!sidebarCollapsed} aria-label={sidebarCollapsed ? "Expandir menú lateral" : "Contraer menú lateral"} title={sidebarCollapsed ? "Expandir menú lateral" : "Contraer menú lateral"}>{sidebarCollapsed ? <PanelLeftOpen size="var(--shell-nav-icon)" /> : <PanelLeftClose size="var(--shell-nav-icon)" />}<span>Contraer menú</span></button></aside>
    <main className="main-content">
      <header className="workspace-topbar"><nav className="workspace-breadcrumb" aria-label="Ubicación"><ol><li>{company || "Todas las empresas"}</li><li aria-current="page">{moduleLabel(module)}</li></ol></nav><div className="mobile-company-selector">{companyPicker}</div><WorkspaceSearch posts={companyPosts} tasks={taskStore.tasks} onOpenPost={setEditing} onOpenTasks={() => setModule("day")} onSearchCalendar={value => { setQuery(value); setModule("calendar"); }} /><ReminderPanel posts={companyPosts} onOpen={setEditing} onConfigure={() => setModule("notifications")} onViewAll={category => { setOverdueOnly(category === "overdue"); setStatus(category === "review" ? "En revisión" : "Todos"); setModule("calendar"); }} /><UserProfileMenu server={databaseEnabled} onNotifications={() => setModule("notifications")} /></header>
      <ModuleNavigation active={module} onChange={setModule} mobile />
      {error && <div role="alert" className="error-banner">{error}</div>}
      <div className="page-content calendar-page cal-page" hidden={module !== "calendar"}>
        <div className="cal-header"><h1>Calendario</h1><button className="primary-button" disabled={!writable} onClick={() => openPost(emptyPublication(today))}><Plus size="var(--icon-md)" aria-hidden="true" />Nueva publicación</button></div>
        <div className="cal-quick-filters" role="group" aria-label={`Filtros rápidos ${view === "week" ? "de la semana" : "del mes"}`}>
          <button type="button" className="cal-filter-chip" aria-controls="calendar-results" aria-pressed={!activeFilters && !query} onClick={clearFilters}>Todas<b>{period.length}</b></button>
          <button type="button" className="cal-filter-chip" aria-controls="calendar-results" aria-pressed={status === "preparing"} onClick={() => setStatus(status === "preparing" ? "Todos" : "preparing")}><span className="cal-dot" data-status="En revisión" aria-hidden="true" />En preparación<b>{period.filter(post => post.status === "Borrador" || post.status === "En revisión").length}</b></button>
          <button type="button" className="cal-filter-chip" aria-controls="calendar-results" aria-pressed={status === "Publicado"} onClick={() => setStatus(status === "Publicado" ? "Todos" : "Publicado")}><span className="cal-dot" data-status="Publicado" aria-hidden="true" />Publicadas<b>{period.filter(post => post.status === "Publicado").length}</b></button>
          <button type="button" className="cal-filter-chip" aria-controls="calendar-results" aria-pressed={paidOnly} onClick={() => setPaidOnly(!paidOnly)}><Megaphone size="var(--cal-icon)" aria-hidden="true" />Con pauta<b>{period.filter(post => post.paid).length}</b></button>
        </div>
        <section className="cal-panel" aria-label="Calendario de publicaciones">
          <div className="cal-toolbar">
            <div className="cal-toolbar-start">
              <div className="cal-stepper"><button type="button" className="cal-icon-button" aria-label={view === "week" ? "Semana anterior" : "Mes anterior"} disabled={!month || prefix === "0100-01"} onClick={() => moveMonth(-1)}><ChevronLeft size="var(--icon-sm)" aria-hidden="true" /></button><button type="button" className="cal-today" onClick={goToday}>Hoy</button><button type="button" className="cal-icon-button" aria-label={view === "week" ? "Semana siguiente" : "Mes siguiente"} disabled={!month || prefix === "9999-12"} onClick={() => moveMonth(1)}><ChevronRight size="var(--icon-sm)" aria-hidden="true" /></button></div>
              <h2 aria-live="polite">{periodLabel}</h2>
              <button type="button" className="cal-info tooltip" data-tooltip="Hora local del dispositivo · La publicación en redes es manual" aria-label="Información: las horas usan la zona local del dispositivo y la publicación en redes es manual."><Info size="var(--icon-sm)" aria-hidden="true" /></button>
            </div>
            <div className="cal-toolbar-end">
              <label className="cal-search"><Search size="var(--icon-sm)" aria-hidden="true" /><input type="search" aria-label="Buscar publicaciones" placeholder="Buscar…" value={query} onChange={event => setQuery(event.target.value)} /></label>
              <div className="cal-filters" ref={filtersMenu} onKeyDown={event => { if (event.key === "Escape" && filtersOpen) { event.preventDefault(); setFiltersOpen(false); filtersMenu.current?.querySelector("button")?.focus(); } }}>
                <button type="button" className="cal-tool-button" aria-expanded={filtersOpen} aria-controls="calendar-filter-panel" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size="var(--icon-sm)" aria-hidden="true" />Filtros{activeFilters > 0 && <b aria-label={`${activeFilters} activos`}>{activeFilters}</b>}</button>
                <div id="calendar-filter-panel" className="cal-filter-popover" hidden={!filtersOpen}>
                  <label className="cal-filter-field">Estado<select value={status} onChange={event => setStatus(event.target.value)}><option value="Todos">Todos los estados</option><option value="preparing">En preparación</option>{STATUSES.map(item => <option key={item}>{item}</option>)}</select></label>
                  <div className="cal-filter-group" role="group" aria-label="Filtrar por tipo y prioridad"><span>Mostrar</span>
                    <button type="button" className="cal-filter-chip" aria-controls="calendar-results" aria-pressed={importantOnly} onClick={() => setImportantOnly(!importantOnly)}><Star size="var(--cal-icon)" aria-hidden="true" />Importantes<b>{period.filter(post => post.important).length}</b></button>
                    <button type="button" className="cal-filter-chip" aria-controls="calendar-results" aria-pressed={overdueOnly} onClick={() => setOverdueOnly(!overdueOnly)}><span className="cal-dot" data-overdue="true" aria-hidden="true" />Atrasadas<b>{period.filter(post => isOverdue(post, today)).length}</b></button>
                    {FORMAT_FILTERS.map(item => <button key={item} type="button" className="cal-filter-chip" aria-controls="calendar-results" aria-pressed={format === item} onClick={() => setFormat(format === item ? "Todos" : item)}>{item === "Post" ? "Posts" : item === "Reels" ? "Reels" : "Carruseles"}<b>{period.filter(post => matchesFormat(post, item)).length}</b></button>)}
                  </div>
                  <div className="cal-filter-group" role="group" aria-label="Filtrar por red social"><span>Red</span>{(["Todas", ...NETWORKS] as const).map(item => <button type="button" key={item} className="cal-filter-chip" aria-pressed={network === item} onClick={() => setNetwork(item)}>{item === "Todas" ? "Todas" : <><NetworkIcons networks={[item]} size="var(--cal-icon)" />{item}</>}</button>)}</div>
                  <div className="cal-legend" aria-label="Leyenda de estados"><span>Leyenda</span>{STATUSES.map(item => <span key={item}><span className="cal-dot" data-status={item} aria-hidden="true" />{item}</span>)}<span><span className="cal-dot" data-overdue="true" aria-hidden="true" />Atrasada</span></div>
                  {(activeFilters > 0 || query) && <button type="button" className="cal-clear" onClick={clearFilters}>Limpiar filtros</button>}
                </div>
              </div>
              <div className="cal-segmented" role="group" aria-label="Vista del calendario">{([["month", "Mes"], ["week", "Semana"], ["agenda", "Agenda"]] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>)}</div>
            </div>
          </div>
          {ready && visible.length === 0 && <div className="cal-empty">
            <p role="status">{activeFilters || query ? "Ninguna publicación coincide con los filtros." : view === "week" ? "No hay publicaciones esta semana." : "No hay publicaciones este mes."}</p>
            <button type="button" className="cal-clear" disabled={!writable} onClick={activeFilters || query ? clearFilters : () => openPost(emptyPublication(prefix === today.slice(0, 7) ? today : month ? dateKey(month) : today))}>{activeFilters || query ? "Limpiar filtros" : "Crear publicación"}</button>
          </div>}
          <CalendarViews onQuickAction={(post, action) => void quickAction(post, action)} importantBusy={importantBusy || quickBusy} onToggleImportant={post => void toggleImportant(post)} view={view} month={month} today={today} posts={visible} ready={writable} onOpen={post => setDrawerId(post.id)} onCreate={openPost} onMove={(id, date) => void movePost(id, date)} />
        </section>
      </div>
      {drawerPost && <PostDrawer key={drawerPost.id} post={drawerPost} today={today} disabled={!writable || importantBusy || quickBusy} onClose={() => setDrawerId("")} onEdit={post => { setDrawerId(""); openPost(post); }} onQuickAction={(post, action) => void quickAction(post, action)} onToggleImportant={post => void toggleImportant(post)} />}
      {module === "library" && <div className="page-content"><div className="page-heading"><div><span className="eyebrow">TUS RECURSOS, EN UN SOLO LUGAR</span><h1>Biblioteca multimedia<span>.</span></h1><p>Organiza tus imágenes y videos y conviértelos en publicaciones.</p></div></div><MediaLibrary key={company} company={company} posts={posts} onOpenPost={setEditing} standalone usedIds={posts.flatMap(postMediaIds)} onSelect={ready ? (asset) => setEditing({ ...emptyPublication(today), brand: company || asset.brand, mediaId: asset.id }) : undefined} /></div>}
      {module === "schedule" && ready && <div className="page-content"><ScheduleModule company={company} server={databaseEnabled} key={company} posts={companyPosts} today={today} onCreate={() => openPost(emptyPublication(today))} onEdit={setEditing} /></div>}
      {module === "content" && ready && <ContentReportsDashboard key={company} company={company} embedded publicationId={publicationId} server={databaseEnabled} />}
      {module === "settings" && <div className="page-content"><div className="page-heading"><div><h1>Respaldos</h1><p>Descarga o importa tus publicaciones y archivos multimedia.</p></div></div><PersonalTools posts={posts} templates={templates} disabled={!ready || !templatesReady || !!editing} onImport={importData} /></div>}
      {module === "day" && <MyDay store={taskStore} posts={companyPosts} timezone={notificationTimezone} server={databaseEnabled} onOpenPost={setEditing} onSettings={() => setModule("notifications")} />}
      {module === "company" && <div className="page-content"><CompanyModule company={company} known={Array.from(new Set(posts.map(post => post.brand)))} server={databaseEnabled} onChange={changeCompany} /></div>}
      {module === "notifications" && assignedCompanies && <section className="surface"><h2>Notificaciones</h2><p>La configuración de notificaciones automáticas está disponible para el administrador. Puedes consultar tus recordatorios en la campana del calendario.</p></section>}{module === "notifications" && !assignedCompanies && <NotificationModule databaseEnabled={databaseEnabled} timezone={notificationTimezone} />}
    </main>
    <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">{notice && <div className="toast"><CheckCircle2 size="var(--icon-md)" /><span>{notice.text}</span>{notice.undo && <button type="button" className="secondary-button" disabled={undoBusy || !!editing} onClick={() => void undoLastAction()}>{undoBusy ? "Deshaciendo…" : "Deshacer"}</button>}<button className="icon-button" aria-label="Cerrar notificación" onClick={() => setNotice(null)}><X size="var(--icon-sm)" /></button></div>}</div>
    {editing && <PostComposer server={databaseEnabled} reviews={reviews} usedMediaIds={posts.flatMap(postMediaIds)} persistenceError={error} readOnly={false} initial={editing} posts={posts} onClose={() => setEditing(null)} onSave={save} onDelete={async (id) => { const before = posts.find(post => post.id === id); if (!before) return false; if (!await persist(posts.filter((post) => post.id !== id))) return false; setNotice({ text: "Publicación eliminada", undo: { before } }); return true; }} />}
  </div>;
}
