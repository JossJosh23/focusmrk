"use client";

import { useState } from "react";
import { FileText, Presentation, Plus } from "lucide-react";
import { comparePublications, validDate, type Publication } from "@/lib/calendar";

export function ScheduleModule({ posts, today, onCreate, onEdit }: { posts: Publication[]; today: string; onCreate: () => void; onEdit: (post: Publication) => void }) {
  const [title, setTitle] = useState("Cronograma de contenido");
  const [start, setStart] = useState(`${today.slice(0, 7)}-01`);
  const [end, setEnd] = useState(`${today.slice(0, 7)}-${new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate()}`);
  const [brand, setBrand] = useState("");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const valid = validDate(start) && validDate(end) && start <= end;
  const visible = posts.filter(p => valid && p.date >= start && p.date <= end && (!brand || p.brand === brand)).sort(comparePublications);
  const selected = visible.filter(p => !excluded.includes(p.id));
  async function download(format: "PDF" | "PowerPoint") {
    if (busy || !selected.length || !title.trim()) return;
    setBusy(format); setMessage("");
    try {
      if (format === "PDF") { const { exportCalendarPdf } = await import("@/lib/calendar-pdf"); await exportCalendarPdf(selected, `${start} a ${end}`, title.trim()); }
      else { const { exportSchedulePowerPoint } = await import("@/lib/schedule-export"); await exportSchedulePowerPoint(selected, title.trim(), `${start} a ${end}`); }
      setMessage(`${format} generado. Revisa las descargas del navegador.`);
    } catch { setMessage("No se pudo generar el archivo. Vuelve a intentarlo."); }
    finally { setBusy(""); }
  }
  return <section className="schedule-module">
    <div className="page-heading"><div><span className="eyebrow">PLANIFICA Y PRESENTA</span><h1>Cronogramas<span>.</span></h1><p>Prepara una selección de contenido para presentar a tu cliente.</p></div><button className="primary-button" onClick={onCreate}><Plus size={17} />Crear publicación</button></div>
    <fieldset className="schedule-config" disabled={!!busy}><label className="schedule-title">Título del documento<input maxLength={120} value={title} onChange={e => setTitle(e.target.value)} /></label><label>Desde<input type="date" value={start} onChange={e => setStart(e.target.value)} /></label><label>Hasta<input type="date" value={end} onChange={e => setEnd(e.target.value)} /></label><label>Marca<select value={brand} onChange={e => setBrand(e.target.value)}><option value="">Todas las marcas</option>{Array.from(new Set(posts.map(p => p.brand))).sort().map(b => <option key={b}>{b}</option>)}</select></label></fieldset>
    {!valid && <p role="alert">Selecciona un rango de fechas válido.</p>}
    <div className="schedule-downloads"><strong>{selected.length} publicaciones seleccionadas</strong><button className="secondary-button" disabled={!!busy || !selected.length || !title.trim()} onClick={() => void download("PDF")}><FileText size={17} />Descargar PDF</button><button className="primary-button" disabled={!!busy || !selected.length || !title.trim()} onClick={() => void download("PowerPoint")}><Presentation size={17} />Descargar PowerPoint</button></div>
    <p className="schedule-help">Incluye fechas, redes, objetivo, copy, producción, footer y enlaces. Los archivos multimedia permanecen en la biblioteca.</p>
    <div className="schedule-list"><label className="schedule-select-all"><input type="checkbox" disabled={!visible.length || !!busy} checked={!!visible.length && selected.length === visible.length} onChange={e => setExcluded(e.target.checked ? [] : visible.map(p => p.id))} />Seleccionar todas</label>{visible.map(p => <div className="schedule-item" key={p.id}><input type="checkbox" aria-label={`Incluir ${p.title}`} disabled={!!busy} checked={!excluded.includes(p.id)} onChange={e => setExcluded(current => e.target.checked ? current.filter(id => id !== p.id) : [...current, p.id])} /><div><small>{p.date} · {p.time} · {p.brand}</small><strong>{p.title}</strong><span>{p.networks.join(" · ")} · {p.format} · {p.status}</span></div><button className="secondary-button" onClick={() => onEdit(p)}>Editar</button></div>)}{!visible.length && <p>No hay publicaciones en este rango. Cambia las fechas o crea una publicación.</p>}</div>
    <p role="status">{busy ? `Generando ${busy}…` : message}</p>
  </section>;
}
