"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CalendarRange, Check, ChevronLeft, ChevronRight, Download, ImageOff, Eye, FileText, Pencil, Plus, Presentation, Save, Search, Star, X } from "lucide-react";
import { comparePublications, dateKey, parseDate, weekDays, FORMATS, NETWORKS, STATUSES, type Publication } from "@/lib/calendar";
import { scheduleCounts } from "@/lib/schedule-summary";
import { defaultScheduleOptions, scheduleSelection, validSchedule, type SchedulePlan, type ScheduleOptions } from "@/lib/schedules";
import { prepareSchedule, downloadVisualSchedule, schedulePageUrl } from "@/lib/schedule-render";
import { validCompanyProfile } from "@/lib/company-profile";
import { NetworkIcons } from "./content-card";
import { PostThumbnail } from "./post-thumbnail";
import { useSchedules } from "./use-schedules";

const options: Record<keyof ScheduleOptions, string> = { copy: "Texto del post", objective: "Objetivo del post", production: "Notas de producción", references: "Enlaces de referencia", footer: "Firma y contacto", images: "Imágenes" };
const PRESETS = [["week", "Esta semana"], ["month", "Este mes"], ["next", "Próximo mes"]] as const;
type Preset = (typeof PRESETS)[number][0];
type Preview = { pages: string[]; warnings: string[]; fingerprint: string };

const dayMonth = new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "short" });
const dayMonthYear = new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "short", year: "numeric" });
const weekday = new Intl.DateTimeFormat("es-EC", { weekday: "short" });
const clean = (value: string) => value.replace(/\./g, "");
/** "1 – 31 oct 2026", "29 sept – 5 oct 2026" or across years with both years. */
function rangeLabel(start: string, end: string) {
  const a = parseDate(start), b = parseDate(end);
  if (a.getFullYear() !== b.getFullYear()) return clean(`${dayMonthYear.format(a)} – ${dayMonthYear.format(b)}`);
  if (a.getMonth() === b.getMonth()) return clean(`${a.getDate()} – ${dayMonthYear.format(b)}`);
  return clean(`${dayMonth.format(a)} – ${dayMonthYear.format(b)}`);
}
const daysBetween = (start: string, end: string) => Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / 86400000) + 1;

function newPlan(today: string, posts: Publication[]): SchedulePlan {
  const start = `${today.slice(0, 7)}-01`, end = dateKey(new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0, 12));
  return { id: "", title: "Cronograma de contenido", start, end, campaign: "", objective: "", dates: [], selectedIds: posts.filter(p => p.date >= start && p.date <= end).map(p => p.id), options: { ...defaultScheduleOptions } };
}
function presetRange(value: Preset, today: string): [string, string] {
  const anchor = parseDate(today);
  if (value === "week") { const days = weekDays(anchor); return [dateKey(days[0]), dateKey(days[6])]; }
  const offset = value === "next" ? 1 : 0;
  return [dateKey(new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1, 12)), dateKey(new Date(anchor.getFullYear(), anchor.getMonth() + offset + 1, 0, 12))];
}

export function ScheduleModule({ posts, today, company, server, onCreate, onEdit }: { posts: Publication[]; today: string; company: string; server: boolean; onCreate: () => void; onEdit: (post: Publication) => void }) {
  const store = useSchedules(company, server, newPlan(today, posts)); const { plan, setPlan } = store;
  const [busy, setBusy] = useState(""); const lock = useRef(false); const [message, setMessage] = useState(""); const [logo, setLogo] = useState("");
  const [search, setSearch] = useState(""); const [format, setFormat] = useState(""); const [network, setNetwork] = useState(""); const [status, setStatus] = useState("");
  const [paidOnly, setPaidOnly] = useState(false); const [importantOnly, setImportantOnly] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null); const [previewOpen, setPreviewOpen] = useState(false); const [page, setPage] = useState(0);
  const disabled = !!busy || store.saving || !store.ready;
  const valid = validSchedule({ ...plan, id: plan.id || "new" });
  const selectedSet = useMemo(() => new Set(plan.selectedIds), [plan.selectedIds]);
  const period = useMemo(() => posts.filter(p => p.date >= plan.start && p.date <= plan.end).sort(comparePublications), [posts, plan.start, plan.end]);
  const selected = useMemo(() => scheduleSelection(posts, plan).sort(comparePublications), [posts, plan]);
  const needle = search.trim().toLocaleLowerCase("es");
  const visible = period.filter(p => (!format || p.format === format) && (!network || p.networks.some(n => n === network)) && (!status || p.status === status) && (!paidOnly || p.paid) && (!importantOnly || p.important) && `${p.title} ${p.copy}`.toLocaleLowerCase("es").includes(needle));
  const filtered = Boolean(needle || format || network || status || paidOnly || importantOnly);
  // Weeks start on the calendar's first weekday so the list reads like the calendar.
  const weeks = visible.reduce<{ key: string; posts: Publication[] }[]>((list, post) => {
    const key = dateKey(weekDays(parseDate(post.date))[0]);
    if (list.at(-1)?.key === key) list.at(-1)!.posts.push(post); else list.push({ key, posts: [post] });
    return list;
  }, []);
  const fingerprint = JSON.stringify({ plan, selected, logo, company });
  const missing = selected.filter(p => (plan.options.copy && !p.copy.trim()) || (plan.options.images && !p.mediaId && !p.imageUrl));
  const periodIds = new Set(period.map(p => p.id));
  const unavailable = plan.selectedIds.filter(id => !periodIds.has(id)).length;
  const approved = selected.filter(p => p.status === "Aprobado" || p.status === "Publicado").length;
  const activePreset = PRESETS.find(([value]) => { const [start, end] = presetRange(value, today); return start === plan.start && end === plan.end; })?.[0];
  const allVisible = !!visible.length && visible.every(p => selectedSet.has(p.id));
  const someVisible = visible.some(p => selectedSet.has(p.id));
  const saveState = store.saving ? { tone: "busy", label: "Guardando…" } : store.dirty ? { tone: "dirty", label: "Cambios sin guardar" } : plan.id ? { tone: "saved", label: "Guardado" } : { tone: "new", label: "Sin guardar" };
  const canExport = !disabled && valid && selected.length > 0;

  useEffect(() => {
    let active = true;
    async function load() {
      if (!company) return;
      try {
        let data;
        if (server) { const r = await fetch(`/api/company-profile?company=${encodeURIComponent(company)}`, { cache: "no-store" }); if (!r.ok) throw new Error(); data = await r.json(); }
        else data = JSON.parse(localStorage.getItem(`focusmrk.company-profile.${company}`) || "null");
        if (active && validCompanyProfile(data?.profile)) setLogo(data.profile.logo);
      } catch { if (active) setMessage("No se pudo cargar el logo; se usará el nombre de la empresa."); }
    }
    void load(); return () => { active = false; };
  }, [company, server]);
  useEffect(() => {
    const prevent = (e: Event) => { if (lock.current) e.preventDefault(); };
    window.addEventListener("focusmrk-before-navigation", prevent); window.addEventListener("beforeunload", prevent);
    return () => { window.removeEventListener("focusmrk-before-navigation", prevent); window.removeEventListener("beforeunload", prevent); };
  }, []);
  function field<K extends keyof SchedulePlan>(name: K, value: SchedulePlan[K]) { setPlan(p => ({ ...p, [name]: value })); }
  function range(start: string, end: string) { setPlan(p => ({ ...p, start, end, selectedIds: posts.filter(p => p.date >= start && p.date <= end).map(p => p.id) })); }
  function selectVisible(checked: boolean) {
    const ids = new Set(visible.map(p => p.id)); field("selectedIds", checked ? Array.from(new Set([...plan.selectedIds, ...ids])) : plan.selectedIds.filter(id => !ids.has(id)));
  }
  function toggle(post: Publication, checked: boolean) { field("selectedIds", checked ? [...plan.selectedIds, post.id] : plan.selectedIds.filter(id => id !== post.id)); }
  function clearFilters() { setSearch(""); setFormat(""); setNetwork(""); setStatus(""); setPaidOnly(false); setImportantOnly(false); }
  async function generate(action: "preview" | "PDF" | "PowerPoint") {
    if (!canExport || lock.current) return;
    lock.current = true; setBusy(action === "preview" ? "Preparando vista previa" : `Generando ${action}`); setMessage("");
    try {
      const result = preview?.fingerprint === fingerprint ? preview : { ...await prepareSchedule(selected, plan, company, logo), fingerprint };
      setPreview(result);
      if (action === "preview") { setPage(0); setPreviewOpen(true); }
      else { await downloadVisualSchedule(result.pages, action, plan.title); setMessage(`${action} generado con el diseño de la vista previa.`); }
    } catch { setMessage("No se pudo preparar la entrega. Revisa los recursos e inténtalo de nuevo."); }
    finally { lock.current = false; setBusy(""); }
  }

  if (!company) return <section className="surface"><h1>Cronogramas</h1><p>Selecciona una empresa para preparar y guardar sus cronogramas.</p></section>;
  return <section className="sch">
    <header className="sch-header">
      <div><span className="eyebrow">PLANIFICA Y PRESENTA · {company}</span><h1>Cronogramas<span>.</span></h1><p>Elige el periodo, selecciona el contenido y descarga una entrega lista para presentar.</p></div>
      <button type="button" className="secondary-button" disabled={disabled} onClick={onCreate}><Plus size="var(--icon-md)" aria-hidden="true" />Crear publicación</button>
    </header>

    <fieldset className="sch-toolbar" disabled={disabled}>
      <label className="sch-switcher"><span className="sr-only">Cronograma abierto</span><CalendarRange size="var(--icon-md)" aria-hidden="true" />
        <select value={plan.id} onChange={e => { if (store.open(store.saved.find(p => p.id === e.target.value) || newPlan(today, posts))) { setPreview(null); setMessage(""); } }}>
          <option value="">Nuevo cronograma</option>
          {store.saved.map(p => <option key={p.id} value={p.id}>{p.title} · {rangeLabel(p.start, p.end)}</option>)}
        </select>
      </label>
      <span className={`sch-save-state is-${saveState.tone}`} role="status"><i aria-hidden="true" />{saveState.label}</span>
      {plan.id && <button type="button" className="secondary-button" disabled={!valid} onClick={() => void store.save(true)}>Guardar como copia</button>}
      <button type="button" className="primary-button" disabled={!valid || (!store.dirty && !!plan.id)} onClick={() => void store.save()}><Save size="var(--icon-sm)" aria-hidden="true" />{plan.id ? "Guardar cambios" : "Guardar cronograma"}</button>
    </fieldset>
    {store.message && <p className="sch-notice" role="status">{store.message}</p>}

    <div className="sch-layout">
      <div className="sch-main">
        <fieldset className="sch-card" disabled={disabled}>
          <div className="sch-card-head"><span className="sch-step">1</span><div><h2>Periodo y detalles</h2><p>{rangeLabel(plan.start, plan.end)} · {daysBetween(plan.start, plan.end)} días · {period.length} publicaciones</p></div></div>
          <div className="sch-presets" role="group" aria-label="Periodos rápidos">{PRESETS.map(([value, label]) => <button type="button" key={value} aria-pressed={activePreset === value} onClick={() => range(...presetRange(value, today))}>{label}</button>)}</div>
          <div className="sch-grid">
            <label className="sch-field">Desde<input type="date" min="0100-01-01" max="9999-12-31" value={plan.start} onChange={e => range(e.target.value, plan.end)} /></label>
            <label className="sch-field">Hasta<input type="date" min="0100-01-01" max="9999-12-31" value={plan.end} onChange={e => range(plan.start, e.target.value)} /></label>
            <p className="sch-hint">Al cambiar el periodo se seleccionan todas sus publicaciones. Los filtros de abajo solo cambian la lista visible.</p>
            <label className="sch-field">Título del documento<input maxLength={120} value={plan.title} onChange={e => field("title", e.target.value)} /></label>
            <label className="sch-field"><span>Campaña <small>opcional</small></span><input maxLength={120} value={plan.campaign} onChange={e => field("campaign", e.target.value)} placeholder="Ej. Plato del mes" /></label>
            <label className="sch-field is-wide"><span>Objetivo del cronograma <small>opcional</small></span><textarea rows={2} maxLength={1000} value={plan.objective} onChange={e => field("objective", e.target.value)} placeholder="Qué queremos lograr con este contenido" /></label>
          </div>
          <div className="sch-dates">
            <div className="sch-dates-head"><h3>Fechas importantes</h3><button type="button" className="sch-link-button" disabled={plan.dates.length >= 30} onClick={() => field("dates", [...plan.dates, { date: plan.start, label: "" }])}><Plus size="var(--icon-sm)" aria-hidden="true" />Añadir fecha</button></div>
            {plan.dates.length === 0 && <p className="sch-hint">Feriados, lanzamientos o eventos que deban destacarse en la entrega.</p>}
            {plan.dates.map((d, index) => <div className="sch-date-row" key={index}>
              <label><span className="sr-only">Fecha {index + 1}</span><input type="date" min="0100-01-01" max="9999-12-31" value={d.date} onChange={e => field("dates", plan.dates.map((v, i) => i === index ? { ...v, date: e.target.value } : v))} /></label>
              <label><span className="sr-only">Motivo {index + 1}</span><input maxLength={160} value={d.label} placeholder="Motivo (ej. Día de la madre)" aria-invalid={!d.label.trim() || undefined} onChange={e => field("dates", plan.dates.map((v, i) => i === index ? { ...v, label: e.target.value } : v))} /></label>
              <button type="button" className="icon-button" aria-label={`Quitar fecha ${index + 1}`} onClick={() => field("dates", plan.dates.filter((_, i) => i !== index))}><X size="var(--icon-sm)" /></button>
            </div>)}
          </div>
          {!valid && <p className="sch-alert" role="alert"><AlertTriangle size="var(--icon-sm)" aria-hidden="true" />Completa el título, un periodo válido y el motivo de cada fecha importante.</p>}
        </fieldset>

        <section className="sch-card" aria-labelledby="sch-content-title">
          <div className="sch-card-head"><span className="sch-step">2</span><div><h2 id="sch-content-title">Contenido</h2><p><b>{selected.length}</b> de {period.length} publicaciones del periodo en la entrega</p></div></div>
          <fieldset className="sch-filters" disabled={disabled}>
            <label className="sch-search"><Search size="var(--icon-sm)" aria-hidden="true" /><span className="sr-only">Buscar</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por título o texto…" /></label>
            <label className="sch-select"><span className="sr-only">Formato</span><select value={format} onChange={e => setFormat(e.target.value)}><option value="">Formato</option>{FORMATS.map(f => <option key={f}>{f}</option>)}</select></label>
            <label className="sch-select"><span className="sr-only">Red</span><select value={network} onChange={e => setNetwork(e.target.value)}><option value="">Red</option>{NETWORKS.map(n => <option key={n}>{n}</option>)}</select></label>
            <label className="sch-select"><span className="sr-only">Estado</span><select value={status} onChange={e => setStatus(e.target.value)}><option value="">Estado</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label>
            <button type="button" className="sch-chip" aria-pressed={paidOnly} onClick={() => setPaidOnly(!paidOnly)}>Con pauta</button>
            <button type="button" className="sch-chip" aria-pressed={importantOnly} onClick={() => setImportantOnly(!importantOnly)}><Star size="var(--icon-sm)" aria-hidden="true" />Importantes</button>
          </fieldset>
          <div className="sch-selection">
            <label className="sch-check-all"><input type="checkbox" disabled={disabled || !visible.length} ref={node => { if (node) node.indeterminate = someVisible && !allVisible; }} checked={allVisible} onChange={e => selectVisible(e.target.checked)} />{filtered ? `Seleccionar visibles (${visible.length})` : `Seleccionar todas (${visible.length})`}</label>
            {filtered && <button type="button" className="sch-link-button" onClick={clearFilters}>Limpiar filtros</button>}
            <span className="sch-selection-actions">
              <button type="button" className="sch-link-button" disabled={disabled || !period.length} title="Reemplaza la selección por las aprobadas y publicadas del periodo" onClick={() => field("selectedIds", period.filter(p => p.status === "Aprobado" || p.status === "Publicado").map(p => p.id))}>Solo aprobadas y publicadas</button>
              <button type="button" className="sch-link-button" disabled={disabled || !plan.selectedIds.length} onClick={() => field("selectedIds", [])}>Quitar todas</button>
            </span>
          </div>

          {weeks.map(week => {
            const days = weekDays(parseDate(week.key));
            const included = week.posts.filter(p => selectedSet.has(p.id)).length;
            return <div className="sch-week" key={week.key}>
              <h3 className="sch-week-title">Semana del {rangeLabel(dateKey(days[0]), dateKey(days[6]))}<span>{included} de {week.posts.length}</span></h3>
              <ul className="sch-list">{week.posts.map(post => {
                const day = parseDate(post.date), on = selectedSet.has(post.id);
                return <li className={`sch-item${on ? "" : " is-excluded"}`} key={post.id}>
                  <input type="checkbox" id={`sch-${post.id}`} aria-label={`Incluir ${post.title}`} disabled={disabled} checked={on} onChange={e => toggle(post, e.target.checked)} />
                  <label className="sch-item-date" htmlFor={`sch-${post.id}`}><small>{clean(weekday.format(day))}</small><b>{day.getDate()}</b><small>{post.time}</small></label>
                  <span className="sch-item-thumb">{post.mediaId || post.imageUrl ? <PostThumbnail key={post.mediaId || post.imageUrl} mediaId={post.mediaId} imageUrl={post.imageUrl} title={post.title} /> : <ImageOff size="var(--icon-sm)" aria-label="Sin imagen" />}</span>
                  <label className="sch-item-body" htmlFor={`sch-${post.id}`}>
                    <strong>{post.important && <Star size="var(--icon-sm)" className="sch-star" aria-label="Importante" fill="currentColor" />}{post.title}</strong>
                    <span className="sch-item-meta"><NetworkIcons networks={post.networks} max={3} size="var(--icon-sm)" />{post.networks.join(" · ")} · {post.format}</span>
                  </label>
                  <span className="sch-item-tags">
                    <span className="sch-status" data-status={post.status}>{post.status}</span>
                    {post.paid && <span className="sch-tag is-paid">Pauta</span>}
                    {!post.copy.trim() && <span className="sch-tag is-warn">Sin texto</span>}
                    {!post.mediaId && !post.imageUrl && <span className="sch-tag is-warn">Sin imagen</span>}
                  </span>
                  <button type="button" className="icon-button sch-edit" aria-label={`Editar ${post.title}`} title="Editar" disabled={disabled} onClick={() => onEdit(post)}><Pencil size="var(--icon-sm)" /></button>
                </li>;
              })}</ul>
            </div>;
          })}
          {!visible.length && <div className="sch-empty"><CalendarRange size="var(--icon-lg)" aria-hidden="true" /><strong>{period.length ? "Ninguna publicación coincide con los filtros" : "No hay publicaciones en este periodo"}</strong><p>{period.length ? "Prueba otra búsqueda o limpia los filtros." : "Cambia el periodo o crea una publicación para este rango."}</p>{period.length ? <button type="button" className="secondary-button" onClick={clearFilters}>Limpiar filtros</button> : <button type="button" className="secondary-button" disabled={disabled} onClick={onCreate}><Plus size="var(--icon-sm)" aria-hidden="true" />Crear publicación</button>}</div>}
        </section>
      </div>

      <aside className="sch-summary" aria-label="Resumen de la entrega">
        <span className="eyebrow">TU ENTREGA</span>
        <h2>{plan.title.trim() || "Cronograma"}</h2>
        <p className="sch-summary-period"><CalendarRange size="var(--icon-sm)" aria-hidden="true" />{rangeLabel(plan.start, plan.end)}{plan.campaign.trim() && <span>{plan.campaign.trim()}</span>}</p>
        <div className="sch-summary-count">
          <strong>{selected.length}</strong><span>publicaciones<br />de {period.length} en el periodo</span>
          <i className="sch-progress" aria-hidden="true"><i style={{ width: `${period.length ? Math.round(selected.length / period.length * 100) : 0}%` }} /></i>
        </div>
        <dl className="sch-stats">{scheduleCounts(selected).map(v => <div key={v.label}><dt>{v.label}</dt><dd>{v.count}</dd></div>)}</dl>
        <ul className="sch-readiness">
          <li className={approved === selected.length && selected.length ? "is-ok" : ""}><Check size="var(--icon-sm)" aria-hidden="true" />{approved} aprobadas o publicadas</li>
          {missing.length > 0 && <li className="is-warn"><AlertTriangle size="var(--icon-sm)" aria-hidden="true" />{missing.length} sin texto o imagen; puedes completarlas después</li>}
          {unavailable > 0 && <li className="is-warn"><AlertTriangle size="var(--icon-sm)" aria-hidden="true" />{unavailable} guardadas fuera de este periodo; no se exportarán</li>}
        </ul>
        <fieldset className="sch-include" disabled={disabled}><legend>Incluir en la entrega</legend>
          {Object.entries(options).map(([key, label]) => <label key={key}><input type="checkbox" checked={plan.options[key as keyof ScheduleOptions]} onChange={e => field("options", { ...plan.options, [key]: e.target.checked })} />{label}</label>)}
        </fieldset>
        <div className="sch-actions">
          <button type="button" className="primary-button" disabled={!canExport} onClick={() => void generate("preview")}><Eye size="var(--icon-sm)" aria-hidden="true" />{busy === "Preparando vista previa" ? "Preparando…" : "Vista previa"}</button>
          <div>
            <button type="button" className="secondary-button" disabled={!canExport} onClick={() => void generate("PDF")}><FileText size="var(--icon-sm)" aria-hidden="true" />PDF</button>
            <button type="button" className="secondary-button" disabled={!canExport} onClick={() => void generate("PowerPoint")}><Presentation size="var(--icon-sm)" aria-hidden="true" />PowerPoint</button>
          </div>
        </div>
        <p className="sch-export-message" role="status">{busy ? `${busy}…` : message}</p>
        <small className="sch-hint">PowerPoint conserva el diseño como una imagen por diapositiva. Edita el contenido aquí antes de exportar.</small>
      </aside>
    </div>

    {preview && previewOpen && <PreviewDialog preview={preview} page={page} stale={preview.fingerprint !== fingerprint} busy={!!busy} onPage={setPage} onClose={() => setPreviewOpen(false)}
      onRefresh={() => void generate("preview")} onDownload={action => void generate(action)} />}
  </section>;
}

function PreviewDialog({ preview, page, stale, busy, onPage, onClose, onRefresh, onDownload }: { preview: Preview; page: number; stale: boolean; busy: boolean; onPage: (page: number) => void; onClose: () => void; onRefresh: () => void; onDownload: (action: "PDF" | "PowerPoint") => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const last = preview.pages.length - 1;
  useEffect(() => { if (!dialog.current?.open) dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="sch-preview" aria-label="Vista previa de la entrega" onCancel={e => { e.preventDefault(); onClose(); }}
    onKeyDown={e => { if (e.key === "ArrowLeft" && page > 0) onPage(page - 1); if (e.key === "ArrowRight" && page < last) onPage(page + 1); }}>
    <header><div><strong>Vista previa de la entrega</strong><small>Página {page + 1} de {preview.pages.length}</small></div><button type="button" className="icon-button" aria-label="Cerrar vista previa" onClick={onClose}><X size="var(--icon-md)" /></button></header>
    {stale && <p className="sch-alert sch-preview-stale" role="status"><AlertTriangle size="var(--icon-sm)" aria-hidden="true" />Hiciste cambios después de generar esta vista previa.<button type="button" className="sch-link-button" disabled={busy} onClick={onRefresh}>Actualizar</button></p>}
    <div className="sch-preview-stage">
      <Image unoptimized src={schedulePageUrl(preview.pages[page])} alt={`Página ${page + 1} del cronograma`} width={1600} height={1000} />
      {page > 0 && <button type="button" className="sch-preview-nav is-prev" aria-label="Página anterior" onClick={() => onPage(page - 1)}><ChevronLeft size="var(--icon-lg)" /></button>}
      {page < last && <button type="button" className="sch-preview-nav is-next" aria-label="Página siguiente" onClick={() => onPage(page + 1)}><ChevronRight size="var(--icon-lg)" /></button>}
    </div>
    {preview.pages.length > 1 && <div className="sch-preview-strip" role="group" aria-label="Páginas">{preview.pages.map((item, index) => <button type="button" key={index} aria-label={`Ir a la página ${index + 1}`} aria-current={index === page || undefined} onClick={() => onPage(index)}><Image unoptimized src={schedulePageUrl(item)} alt="" width={160} height={100} /></button>)}</div>}
    <footer>
      {preview.warnings.length > 0 ? <details><summary><AlertTriangle size="var(--icon-sm)" aria-hidden="true" />Recursos pendientes ({preview.warnings.length})</summary><ul>{preview.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></details> : <span />}
      <span className="sch-preview-actions">
        <button type="button" className="secondary-button" disabled={busy} onClick={() => onDownload("PowerPoint")}><Download size="var(--icon-sm)" aria-hidden="true" />PowerPoint</button>
        <button type="button" className="primary-button" disabled={busy} onClick={() => onDownload("PDF")}><Download size="var(--icon-sm)" aria-hidden="true" />Descargar PDF</button>
      </span>
    </footer>
  </dialog>;
}
