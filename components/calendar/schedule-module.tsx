"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Plus, Save, Star, X } from "lucide-react";
import { comparePublications, dateKey, parseDate, weekDays, FORMATS, NETWORKS, STATUSES, type Publication } from "@/lib/calendar";
import { scheduleCounts } from "@/lib/schedule-summary";
import { defaultScheduleOptions, scheduleSelection, validSchedule, type SchedulePlan, type ScheduleOptions } from "@/lib/schedules";
import { prepareSchedule, downloadVisualSchedule, schedulePageUrl } from "@/lib/schedule-render";
import { validCompanyProfile } from "@/lib/company-profile";
import { PostThumbnail } from "./post-thumbnail";
import { useSchedules } from "./use-schedules";

const options: Record<keyof ScheduleOptions, string> = { copy: "Texto del post", objective: "Objetivo del post", production: "Notas de producción", references: "Enlaces de referencia", footer: "Firma y contacto", images: "Imágenes" };
function newPlan(today: string, posts: Publication[]): SchedulePlan {
  const start = `${today.slice(0, 7)}-01`, end = dateKey(new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0, 12));
  return { id: "", title: "Cronograma de contenido", start, end, campaign: "", objective: "", dates: [], selectedIds: posts.filter(p => p.date >= start && p.date <= end).map(p => p.id), options: { ...defaultScheduleOptions } };
}
export function ScheduleModule({ posts, today, company, server, onCreate, onEdit }: { posts: Publication[]; today: string; company: string; server: boolean; onCreate: () => void; onEdit: (post: Publication) => void }) {
  const store = useSchedules(company, server, newPlan(today, posts)); const { plan, setPlan } = store;
  const [busy, setBusy] = useState(""); const lock = useRef(false); const [message, setMessage] = useState(""); const [logo, setLogo] = useState("");
  const [search, setSearch] = useState(""); const [format, setFormat] = useState(""); const [network, setNetwork] = useState(""); const [status, setStatus] = useState("");
  const [paidOnly, setPaidOnly] = useState(false); const [importantOnly, setImportantOnly] = useState(false);
  const [preview, setPreview] = useState<{ pages: string[]; warnings: string[]; fingerprint: string } | null>(null); const [page, setPage] = useState(0);
  const disabled = !!busy || store.saving || !store.ready;
  const valid = validSchedule({ ...plan, id: plan.id || "new" });
  const period = posts.filter(p => p.date >= plan.start && p.date <= plan.end).sort(comparePublications);
  const selected = scheduleSelection(posts, plan).sort(comparePublications);
  const visible = period.filter(p => (!format || p.format === format) && (!network || p.networks.some(n => n === network)) && (!status || p.status === status) && (!paidOnly || p.paid) && (!importantOnly || p.important) && `${p.title} ${p.copy}`.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es")));
  const fingerprint = JSON.stringify({ plan, selected, logo, company });
  const missing = selected.filter(p => (plan.options.copy && !p.copy.trim()) || (plan.options.images && !p.mediaId && !p.imageUrl));
  const unavailable = plan.selectedIds.filter(id => !period.some(p => p.id === id)).length;
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
  function preset(value: string) {
    const anchor = parseDate(today);
    if (value === "week") { const days = weekDays(anchor); range(dateKey(days[0]), dateKey(days[6])); }
    else { const offset = value === "next" ? 1 : 0; range(dateKey(new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1, 12)), dateKey(new Date(anchor.getFullYear(), anchor.getMonth() + offset + 1, 0, 12))); }
  }
  function selectVisible(checked: boolean) {
    const ids = new Set(visible.map(p => p.id)); field("selectedIds", checked ? Array.from(new Set([...plan.selectedIds, ...ids])) : plan.selectedIds.filter(id => !ids.has(id)));
  }
  async function generate(action: "preview" | "PDF" | "PowerPoint") {
    if (!valid || !selected.length || disabled || lock.current) return;
    lock.current = true; setBusy(action === "preview" ? "Preparando vista previa" : `Generando ${action}`); setMessage("");
    try {
      const result = preview?.fingerprint === fingerprint ? preview : { ...await prepareSchedule(selected, plan, company, logo), fingerprint };
      setPreview(result); setPage(0);
      if (action !== "preview") { await downloadVisualSchedule(result.pages, action, plan.title); setMessage(`${action} generado con el diseño de la vista previa.`); }
    } catch { setMessage("No se pudo preparar la entrega. Revisa los recursos e inténtalo de nuevo."); }
    finally { lock.current = false; setBusy(""); }
  }
  if (!company) return <section className="surface"><h1>Cronogramas</h1><p>Selecciona una empresa para preparar y guardar sus cronogramas.</p></section>;
  return <section className="schedule-module schedule-studio">
    <div className="page-heading"><div><span className="eyebrow">PLANIFICA Y PRESENTA · {company}</span><h1>Cronogramas<span>.</span></h1><p>Guarda tu planificación y prepara una entrega visual.</p></div><button className="secondary-button" disabled={disabled} onClick={onCreate}><Plus size="var(--icon-md)" />Crear publicación</button></div>
    <fieldset className="schedule-saved-bar" disabled={disabled}><label>Cronogramas guardados<select value={plan.id} onChange={e => { if (store.open(store.saved.find(p => p.id === e.target.value) || newPlan(today, posts))) { setPreview(null); setMessage(""); } }}><option value="">Nuevo cronograma</option>{store.saved.map(p => <option key={p.id} value={p.id}>{p.title} · {p.start} — {p.end}</option>)}</select></label><button className="primary-button" disabled={!valid} onClick={() => void store.save()}><Save size="var(--icon-sm)" />Guardar cronograma</button>{plan.id && <button className="secondary-button" disabled={!valid} onClick={() => void store.save(true)}>Guardar como copia</button>}<small>{store.dirty ? "Cambios sin guardar" : plan.id ? "Guardado" : "Nuevo"}</small></fieldset>
    <p role="status">{store.message}</p>
    <div className="schedule-workspace"><div className="schedule-main">
      <fieldset className="schedule-config" disabled={disabled}><legend className="schedule-section-heading"><span>1</span>Configura tu cronograma</legend>
        <div className="schedule-presets">{[["week", "Esta semana"], ["month", "Este mes"], ["next", "Próximo mes"]].map(([v, label]) => <button type="button" key={v} onClick={() => preset(v)}>{label}</button>)}</div>
        <label>Desde<input type="date" min="0100-01-01" max="9999-12-31" value={plan.start} onChange={e => range(e.target.value, plan.end)} /></label><label>Hasta<input type="date" min="0100-01-01" max="9999-12-31" value={plan.end} onChange={e => range(plan.start, e.target.value)} /></label>
        <p className="schedule-validation">Al cambiar el periodo se seleccionan sus publicaciones. Los filtros solo cambian la lista visible.</p>
        <label className="schedule-title">Título del documento<input maxLength={120} value={plan.title} onChange={e => field("title", e.target.value)} /></label>
        <label className="schedule-title">Campaña (opcional)<input maxLength={120} value={plan.campaign} onChange={e => field("campaign", e.target.value)} placeholder="Ej. Plato del mes" /></label>
        <label className="schedule-title">Objetivo del cronograma (opcional)<textarea rows={2} maxLength={1000} value={plan.objective} onChange={e => field("objective", e.target.value)} /></label>
        <div className="schedule-dates"><strong>Fechas importantes</strong>{plan.dates.map((d, index) => <div className="schedule-date-row" key={index}><label>Fecha<input type="date" min="0100-01-01" max="9999-12-31" value={d.date} onChange={e => field("dates", plan.dates.map((v, i) => i === index ? { ...v, date: e.target.value } : v))} /></label><label>Motivo<input maxLength={160} value={d.label} onChange={e => field("dates", plan.dates.map((v, i) => i === index ? { ...v, label: e.target.value } : v))} /></label><button type="button" className="icon-button" aria-label={`Quitar fecha ${index + 1}`} onClick={() => field("dates", plan.dates.filter((_, i) => i !== index))}><X size="var(--icon-sm)" /></button></div>)}<button type="button" className="secondary-button" disabled={plan.dates.length >= 30} onClick={() => field("dates", [...plan.dates, { date: plan.start, label: "" }])}><Plus size="var(--icon-sm)" />Añadir fecha</button></div>
        {!valid && <p className="schedule-validation" role="alert">Completa el título, un periodo válido y el motivo de cada fecha importante.</p>}
      </fieldset>
      <div className="schedule-list"><h2 className="schedule-section-heading"><span>2</span>Selecciona el contenido</h2>
        <fieldset className="schedule-filters" disabled={disabled}><label>Buscar<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Título o texto…" /></label><label>Formato<select value={format} onChange={e => setFormat(e.target.value)}><option value="">Todos</option>{FORMATS.map(f => <option key={f}>{f}</option>)}</select></label><label>Red<select value={network} onChange={e => setNetwork(e.target.value)}><option value="">Todas</option>{NETWORKS.map(n => <option key={n}>{n}</option>)}</select></label><label>Estado<select value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label><label className="schedule-checkbox"><input type="checkbox" checked={paidOnly} onChange={e => setPaidOnly(e.target.checked)} />Con pauta</label><label className="schedule-checkbox"><input type="checkbox" checked={importantOnly} onChange={e => setImportantOnly(e.target.checked)} />Importantes</label></fieldset>
        <div className="schedule-selection-bar"><label className="schedule-select-all"><input type="checkbox" disabled={disabled || !visible.length} ref={node => { if (node) node.indeterminate = visible.some(p => plan.selectedIds.includes(p.id)) && !visible.every(p => plan.selectedIds.includes(p.id)); }} checked={!!visible.length && visible.every(p => plan.selectedIds.includes(p.id))} onChange={e => selectVisible(e.target.checked)} />Seleccionar visibles ({visible.length})</label><button type="button" disabled={disabled} onClick={() => field("selectedIds", period.filter(p => p.status === "Aprobado").map(p => p.id))}>Seleccionar aprobadas del periodo</button></div>
        {visible.map(post => <div className={`schedule-item ${plan.selectedIds.includes(post.id) ? "" : "is-excluded"}`} key={post.id}><input type="checkbox" aria-label={`Incluir ${post.title}`} disabled={disabled} checked={plan.selectedIds.includes(post.id)} onChange={e => field("selectedIds", e.target.checked ? [...plan.selectedIds, post.id] : plan.selectedIds.filter(id => id !== post.id))} /><div><small>{post.date} · {post.time}</small><strong>{post.important && <Star size="var(--icon-sm)" aria-label="Importante" fill="currentColor" />} {post.title}</strong><span>{post.networks.join(" · ")} · {post.format}</span><div className="schedule-post-tags"><span data-status={post.status}>{post.status}</span>{post.paid && <b>Con pauta</b>}{!post.copy.trim() && <span>Sin texto</span>}{!post.mediaId && !post.imageUrl && <span>Sin recurso visual</span>}</div></div><PostThumbnail key={post.mediaId || post.imageUrl} mediaId={post.mediaId} imageUrl={post.imageUrl} title={post.title} /><button className="secondary-button" disabled={disabled} onClick={() => onEdit(post)}>Editar</button></div>)}
        {!visible.length && <p className="schedule-help">No hay publicaciones para esta búsqueda o periodo.</p>}
      </div>
    </div><aside className="schedule-export-card" aria-label="Resumen de la entrega"><span className="eyebrow">TU ENTREGA</span><h2>{plan.title || "Cronograma"}</h2><p>{plan.start} — {plan.end}</p><div className="schedule-export-count"><strong>{selected.length}</strong><span>publicaciones seleccionadas</span></div><div className="schedule-format-summary"><dl>{scheduleCounts(selected).map(v => <div key={v.label}><dt>{v.label}</dt><dd>{v.count}</dd></div>)}</dl></div><p className="schedule-help">{selected.filter(p => p.status === "Aprobado").length} aprobadas. La pauta se cuenta también dentro de su formato.</p>
      <fieldset className="schedule-export-options" disabled={disabled}><legend>Incluir en la entrega</legend>{Object.entries(options).map(([key, label]) => <label className="schedule-checkbox" key={key}><input type="checkbox" checked={plan.options[key as keyof ScheduleOptions]} onChange={e => field("options", { ...plan.options, [key]: e.target.checked })} />{label}</label>)}</fieldset>
      {missing.length > 0 && <p className="schedule-help">{missing.length} publicaciones sin texto o imagen. Puedes exportarlas y completarlas después.</p>}{unavailable > 0 && <p role="status">{unavailable} publicaciones guardadas ya no están disponibles en este periodo; no se exportarán.</p>}
      <button className="primary-button" disabled={disabled || !valid || !selected.length} onClick={() => void generate("preview")}>Vista previa</button><button className="secondary-button" disabled={disabled || !valid || !selected.length} onClick={() => void generate("PDF")}>Descargar PDF</button><button className="secondary-button" disabled={disabled || !valid || !selected.length} onClick={() => void generate("PowerPoint")}>Descargar PowerPoint</button><small>PowerPoint conserva el diseño como imágenes por diapositiva. Edita el contenido aquí antes de exportar.</small><p className="schedule-export-message" role="status">{busy ? `${busy}…` : message}</p>
    </aside></div>
    {preview && <section className="schedule-preview" aria-label="Vista previa de la entrega"><div className="schedule-preview-toolbar"><h2>Vista previa de la entrega</h2><button className="secondary-button" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</button><span>{page + 1} / {preview.pages.length}</span><button className="secondary-button" disabled={page >= preview.pages.length - 1} onClick={() => setPage(p => p + 1)}>Siguiente</button></div>{preview.fingerprint !== fingerprint && <p role="status">Hay cambios. Actualiza la vista previa; al descargar se generará la versión actual.</p>}<Image unoptimized src={schedulePageUrl(preview.pages[page])} alt={`Página ${page + 1} del cronograma`} width={1600} height={1000} />{preview.warnings.length > 0 && <details><summary>Recursos pendientes ({preview.warnings.length})</summary><ul>{preview.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></details>}</section>}
  </section>;
}
