"use client";

import { useState } from "react";
import { FileText, Presentation, Plus, CalendarDays, CheckCircle2 } from "lucide-react";
import { comparePublications, dateKey, parseDate, weekDays, validDate, type Publication } from "@/lib/calendar";

export function ScheduleModule({ posts, today, onCreate, onEdit }: { posts: Publication[]; today: string; onCreate: () => void; onEdit: (post: Publication) => void }) {
  const [title, setTitle] = useState("Cronograma de contenido");
  const [start, setStart] = useState(`${today.slice(0, 7)}-01`);
  const [end, setEnd] = useState(`${today.slice(0, 7)}-${new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate()}`);
  const [preset, setPreset] = useState("month");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const valid = validDate(start) && validDate(end) && start <= end;
  const visible = posts.filter(p => valid && p.date >= start && p.date <= end).sort(comparePublications);
  const selected = visible.filter(p => !excluded.includes(p.id));
  function chooseRange(value: string) {
    const anchor = validDate(today) ? parseDate(today) : new Date();
    let first: Date; let last: Date;
    if (value === "week") { const days = weekDays(anchor); first = days[0]; last = days[6]; }
    else { const offset = value === "next" ? 1 : 0; first = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1, 12); last = new Date(anchor.getFullYear(), anchor.getMonth() + offset + 1, 0, 12); }
    setStart(dateKey(first)); setEnd(dateKey(last)); setPreset(value); setMessage("");
  }
  const displayDate = (value: string) => validDate(value) ? parseDate(value).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" }) : "--";
  async function download(format: "PDF" | "PowerPoint") {
    if (busy || !valid || !selected.length || !title.trim()) return;
    setBusy(format); setMessage("");
    try {
      if (format === "PDF") { const { exportCalendarPdf } = await import("@/lib/calendar-pdf"); await exportCalendarPdf(selected, `${start} a ${end}`, title.trim()); }
      else { const { exportSchedulePowerPoint } = await import("@/lib/schedule-export"); await exportSchedulePowerPoint(selected, title.trim(), `${start} a ${end}`); }
      setMessage(`${format} generado. Revisa las descargas del navegador.`);
    } catch { setMessage("No se pudo generar el archivo. Vuelve a intentarlo."); }
    finally { setBusy(""); }
  }
  return <section className="schedule-module schedule-studio">
    <div className="page-heading"><div><span className="eyebrow">PLANIFICA Y PRESENTA</span><h1>Cronogramas<span>.</span></h1><p>Elige el periodo, revisa tus publicaciones y prepara tu entrega.</p></div><button type="button" className="primary-button" disabled={!!busy} onClick={onCreate}><Plus size={17} />Crear publicación</button></div>
    <div className="schedule-workspace"><div className="schedule-main">
      <fieldset className="schedule-config" disabled={!!busy}><legend className="schedule-section-heading"><span>1</span>Configura tu cronograma</legend>
        <label className="schedule-title">Título del documento<input maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder="Ej. Plan de contenido de septiembre" /></label>
        <div className="schedule-presets" role="group" aria-label="Rangos de fechas">{[["week", "Esta semana"], ["month", "Este mes"], ["next", "Próximo mes"]].map(([value, label]) => <button type="button" key={value} aria-pressed={preset === value} onClick={() => chooseRange(value)}>{label}</button>)}</div>
        <label>Desde<input type="date" min="0100-01-01" max="9999-12-31" value={start} onChange={event => { setStart(event.target.value); setPreset(""); }} /></label><label>Hasta<input type="date" min="0100-01-01" max="9999-12-31" value={end} onChange={event => { setEnd(event.target.value); setPreset(""); }} /></label>
        {!valid && <p className="schedule-validation" role="alert">La fecha final debe ser igual o posterior a la inicial. Completa ambas fechas.</p>}
      </fieldset>
      <div className="schedule-list"><div className="schedule-list-heading"><h2 className="schedule-section-heading"><span>2</span>Selecciona el contenido</h2><span>{selected.length} de {visible.length}</span></div>
        {visible.length > 0 && <div className="schedule-selection-bar"><label className="schedule-select-all"><input type="checkbox" disabled={!!busy} ref={node => { if (node) node.indeterminate = selected.length > 0 && selected.length < visible.length; }} checked={selected.length === visible.length} onChange={event => setExcluded(event.target.checked ? [] : visible.map(post => post.id))} />Seleccionar todas</label><button type="button" disabled={!!busy} onClick={() => setExcluded(visible.filter(post => post.status !== "Aprobado").map(post => post.id))}>Solo aprobadas</button></div>}
        {visible.map(post => <div className={`schedule-item ${excluded.includes(post.id) ? "is-excluded" : ""}`} key={post.id}><input type="checkbox" aria-label={`Incluir ${post.title}`} disabled={!!busy} checked={!excluded.includes(post.id)} onChange={event => setExcluded(current => event.target.checked ? current.filter(id => id !== post.id) : [...current, post.id])} /><div><small>{displayDate(post.date)} ? {post.time}</small><strong>{post.title}</strong><span>{post.networks.join(" ? ")} ? {post.format}</span><div className="schedule-post-tags"><span data-status={post.status}>{post.status}</span>{post.paid && <b>Con pauta</b>}</div></div><button type="button" className="secondary-button" disabled={!!busy} onClick={() => onEdit(post)}>Editar</button></div>)}
        {valid && !visible.length && <div className="schedule-empty"><CalendarDays size={34} /><h3>Este periodo está listo para tus ideas</h3><p>Prueba otro rango o crea una publicación para comenzar tu cronograma.</p><button type="button" className="secondary-button" onClick={onCreate}><Plus size={16} />Crear publicación</button></div>}
      </div>
    </div><aside className="schedule-export-card" aria-label="Resumen de la entrega"><span className="eyebrow">TU ENTREGA</span><h2>{title.trim() || "Ponle un título a tu cronograma"}</h2><p className="schedule-export-period"><CalendarDays size={16} />{valid ? displayDate(start) + " - " + displayDate(end) : "Selecciona un periodo"}</p><div className="schedule-export-count"><strong>{selected.length}</strong><span>publicaciones seleccionadas</span></div><div className="schedule-export-summary"><span><CheckCircle2 size={15} />{selected.filter(post => post.status === "Aprobado").length} aprobadas</span><span>{selected.filter(post => post.paid).length} con pauta</span></div><p className="schedule-help">Incluye fechas, redes, textos, notas de producción y enlaces. Las imágenes y videos permanecen en la biblioteca.</p><button type="button" className="primary-button" disabled={!!busy || !selected.length || !title.trim() || !valid} onClick={() => void download("PDF")}><FileText size={17} />{busy === "PDF" ? "Generando PDF..." : "Descargar PDF"}</button><button type="button" className="secondary-button" disabled={!!busy || !selected.length || !title.trim() || !valid} onClick={() => void download("PowerPoint")}><Presentation size={17} />{busy === "PowerPoint" ? "Generando PowerPoint..." : "Descargar PowerPoint"}</button>{!selected.length && <small>Selecciona publicaciones para habilitar la descarga.</small>}{!title.trim() && <small role="alert">Escribe un título para tu documento.</small>}<p className="schedule-export-message" role="status">{busy ? `Generando ${busy}...` : message}</p></aside></div>
  </section>;
}
