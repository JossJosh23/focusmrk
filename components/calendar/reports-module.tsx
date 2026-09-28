"use client";
import Image from "next/image";
import { TikTokConnection } from "./tiktok-connection";
import { useEffect, useRef, useState } from "react";
import { NETWORKS, emptyPublication, type Publication } from "@/lib/calendar";
import { REPORT_METRICS, emptyMetrics, newReport, validReport, metricLabel, metricChange, followerGrowth, type MetricKey, type Report } from "@/lib/reports";
import { buildReportPages, type TikTokReportSnapshot } from "@/lib/report-visual";
import { loadDeliveryVisuals, downloadVisualSchedule, schedulePageUrl } from "@/lib/schedule-render";
import { validCompanyProfile } from "@/lib/company-profile";
import { useReports } from "./use-reports";

export function ReportsModule({ company, server, posts, today }: { company: string; server: boolean; posts: Publication[]; today: string }) {
  const store = useReports(company, server, newReport(today)); const { plan: report, setPlan: setReport } = store;
  const [active, setActive] = useState<typeof NETWORKS[number]>("Instagram");
  const [busy, setBusy] = useState(""); const lock = useRef(false); const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<{ pages: string[]; warnings: string[]; fingerprint: string } | null>(null); const [page, setPage] = useState(0);
  const disabled = !store.ready || store.saving || !!busy;
  const valid = validReport({ ...report, id: report.id || "new" });
  const currentNetwork = report.networks.find(n => n.network === active) || report.networks[0];
  const fingerprint = JSON.stringify(report);
  const candidates = posts.filter(p => p.date >= report.start && p.date <= report.end && p.networks.includes(currentNetwork.network));
  useEffect(() => {
    const prevent = (event: Event) => { if (lock.current) event.preventDefault(); };
    window.addEventListener("focusmrk-before-navigation", prevent); window.addEventListener("beforeunload", prevent);
    return () => { window.removeEventListener("focusmrk-before-navigation", prevent); window.removeEventListener("beforeunload", prevent); };
  }, []);
  function field<K extends keyof Report>(key: K, value: Report[K]) { setReport(r => ({ ...r, [key]: value })); }
  function metric(period: "current" | "previous", key: MetricKey, value: string) {
    const number = value === "" ? null : Number(value);
    field("networks", report.networks.map(n => n.network === currentNetwork.network ? { ...n, [period]: { ...n[period], [key]: number } } : n));
  }
  function highlight(id: string) {
    const post = posts.find(p => p.id === id); if (!post || report.highlights.length >= 20) return;
    field("highlights", [...report.highlights, { id: crypto.randomUUID(), title: post.title, network: currentNetwork.network, url: "", imageUrl: post.imageUrl, mediaId: post.mediaId, note: "" }]);
  }
  async function generate(download: boolean) {
    if (disabled || !valid || lock.current) return;
    lock.current = true; setBusy(download ? "Generando PDF" : "Preparando vista previa"); setMessage("");
    try {
      let logo = ""; const warnings: string[] = [];
      try {
        let data;
        if (server) { const response = await fetch(`/api/company-profile?company=${encodeURIComponent(company)}`, { cache: "no-store" }); if (!response.ok) throw new Error(); data = await response.json(); }
        else data = JSON.parse(localStorage.getItem(`focusmrk.company-profile.${company}`) || "null");
        if (validCompanyProfile(data?.profile)) logo = data.profile.logo;
      } catch { warnings.push("No se pudo cargar el logo. Se mostrará el nombre de la empresa."); }
      const highlightPosts = report.highlights.map(h => ({ ...emptyPublication(report.start), id: h.id, title: h.title, imageUrl: h.imageUrl, mediaId: h.mediaId }));
      const visuals = await loadDeliveryVisuals(highlightPosts, true, logo);
      let tiktok: TikTokReportSnapshot | undefined;
      if (server && report.networks.some(n => n.network === "TikTok")) {
        const response = await fetch('/api/tiktok?company=' + encodeURIComponent(company), { cache: "no-store" });
        if (!response.ok) throw new Error("tiktok-report-load");
        const connection = await response.json();
        if (connection.snapshot) tiktok = connection.snapshot;
        else warnings.push("TikTok: actualiza las metricas de la cuenta conectada antes de exportar para incluirlas en el PDF.");
      }
      const pages = buildReportPages(report, company, visuals, tiktok);
      setPreview({ pages, warnings: [...warnings, ...visuals.warnings], fingerprint }); setPage(0);
      if (download) { await downloadVisualSchedule(pages, "PDF", report.title); setMessage("PDF generado con los datos actuales del reporte."); }
    } catch { setMessage("No se pudo generar el reporte. Inténtalo nuevamente."); }
    finally { lock.current = false; setBusy(""); }
  }
  if (!company) return <section className="surface"><h1>Reportes</h1><p>Selecciona una empresa para preparar sus reportes de redes sociales.</p></section>;
  return <section className="reports-module">
    <div className="page-heading"><div><span className="eyebrow">RESULTADOS · {company}</span><h1>Reportes<span>.</span></h1><p>Métricas manuales por red, comparación y conclusiones para tu cliente.</p></div></div>
    <fieldset className="schedule-saved-bar" disabled={disabled}><label>Reportes guardados<select value={report.id} onChange={e => { if (store.open(store.saved.find(r => r.id === e.target.value) || newReport(today))) { setPreview(null); setMessage(""); } }}><option value="">Nuevo reporte</option>{store.saved.map(r => <option value={r.id} key={r.id}>{r.title} · {r.start} — {r.end}</option>)}</select></label><button type="button" className="primary-button" disabled={!valid} onClick={() => void store.save()}>Guardar reporte</button>{report.id && <button type="button" className="secondary-button" disabled={!valid} onClick={() => void store.save(true)}>Guardar como copia</button>}<button type="button" className="secondary-button" onClick={() => { if (store.open(newReport(today))) setPreview(null); }}>Nuevo reporte</button><small>{!store.ready ? "Cargando…" : store.dirty ? "Cambios sin guardar" : report.id ? "Guardado" : "Nuevo"}</small></fieldset>
    <p role="status">{store.saving ? "Guardando…" : store.message}</p>
    <fieldset className="schedule-config report-config" disabled={disabled}><legend>1. Periodo y redes</legend><label className="schedule-title">Título<input maxLength={120} value={report.title} onChange={e => field("title", e.target.value)} /></label><label>Desde<input type="date" min="0100-01-01" max="9999-12-31" value={report.start} onChange={e => field("start", e.target.value)} /></label><label>Hasta<input type="date" min="0100-01-01" max="9999-12-31" value={report.end} onChange={e => field("end", e.target.value)} /></label><label>Periodo anterior: desde<input type="date" min="0100-01-01" max="9999-12-31" value={report.previousStart} onChange={e => field("previousStart", e.target.value)} /></label><label>Periodo anterior: hasta<input type="date" min="0100-01-01" max="9999-12-31" value={report.previousEnd} onChange={e => field("previousEnd", e.target.value)} /></label>
    <label className="schedule-title">Cargar comparación desde un reporte guardado<select value="" onChange={e => { const previous = store.saved.find(r => r.id === e.target.value); if (previous) setReport(r => ({ ...r, previousStart: previous.start, previousEnd: previous.end, networks: r.networks.map(n => ({ ...n, previous: previous.networks.find(p => p.network === n.network)?.current || emptyMetrics() })) })); }}><option value="">Selecciona un reporte anterior</option>{store.saved.filter(r => r.end < report.start).map(r => <option value={r.id} key={r.id}>{r.title} · {r.start} — {r.end}</option>)}</select></label>
    <div className="report-network-selection">{NETWORKS.map(network => <label className="schedule-checkbox" key={network}><input type="checkbox" checked={report.networks.some(n => n.network === network)} disabled={report.networks.length === 1 && report.networks[0].network === network} onChange={e => { if (e.target.checked) field("networks", [...report.networks, { network, current: emptyMetrics(), previous: emptyMetrics() }]); else if (window.confirm(`¿Quitar ${network} y sus métricas y destacados de este reporte?`)) setReport(r => ({ ...r, networks: r.networks.filter(n => n.network !== network), highlights: r.highlights.filter(h => h.network !== network) })); }} />{network}</label>)}</div></fieldset>
    <TikTokConnection key={company} company={company} server={server} /><section className="report-panel"><h2>2. Resultados por red</h2><div className="segmented-control" role="group" aria-label="Red del reporte">{report.networks.map(n => <button type="button" key={n.network} aria-pressed={currentNetwork.network === n.network} onClick={() => setActive(n.network)}>{n.network}</button>)}</div><p>Transcribe las estadísticas de la plataforma. Deja vacío lo que no tengas; escribe 0 solo si el resultado fue cero. El alcance se conserva separado por red.</p>
    <div className="report-metric-cards">{(["reach", "views", "interactions"] as const).map(key => <div key={key}><span>{REPORT_METRICS[key]}</span><strong>{metricLabel(currentNetwork.current[key])}</strong><small>{metricChange(currentNetwork.current[key], currentNetwork.previous[key])}</small></div>)}<div><span>Crecimiento de seguidores</span><strong>{metricLabel(followerGrowth(currentNetwork.current))}</strong><small>Seguidores al cierre menos seguidores al inicio</small></div></div>
    <fieldset className="report-metrics" disabled={disabled}><legend>Métricas de {currentNetwork.network}</legend><div className="report-metrics-heading"><span>Métrica</span><span>Actual</span><span>Anterior</span><span>Variación</span></div>{(Object.keys(REPORT_METRICS) as MetricKey[]).map(key => <div className="report-metric-row" key={key}><span>{REPORT_METRICS[key]}</span>{(["current", "previous"] as const).map(period => <input key={period} type="number" min="0" step="1" max={Number.MAX_SAFE_INTEGER} aria-label={`${REPORT_METRICS[key]} ${period === "current" ? "actual" : "anterior"} ${currentNetwork.network}`} placeholder="Sin datos" value={currentNetwork[period][key] ?? ""} onChange={e => metric(period, key, e.target.value)} />)}<small>{metricChange(currentNetwork.current[key], currentNetwork.previous[key])}</small></div>)}</fieldset><p className="schedule-help">Interacciones es el total informado por la red. No se calcula sumando los desgloses. Con una base anterior de cero no se calcula un porcentaje.</p></section>
    <fieldset className="report-panel" disabled={disabled}><legend>3. Publicaciones destacadas</legend><p>Elige las publicaciones que deseas destacar y explica sus resultados. La selección es manual.</p><label>Desde el calendario ({currentNetwork.network})<select value="" disabled={report.highlights.length >= 20} onChange={e => highlight(e.target.value)}><option value="">Seleccionar publicación del periodo</option>{candidates.map(p => <option key={p.id} value={p.id}>{p.date} · {p.title}</option>)}</select></label><button type="button" className="secondary-button" disabled={report.highlights.length >= 20} onClick={() => field("highlights", [...report.highlights, { id: crypto.randomUUID(), title: "Publicación destacada", network: currentNetwork.network, url: "", imageUrl: "", mediaId: "", note: "" }])}>Añadir publicación externa</button>
    {report.highlights.map((h, index) => <div className="report-highlight" key={h.id}><strong>{h.network}</strong>{([['title', 'Título'], ['url', 'Enlace a la publicación'], ['imageUrl', 'Enlace directo a imagen']] as const).map(([key, label]) => <label key={key}>{label}<input type={key === "title" ? "text" : "url"} maxLength={key === "title" ? 160 : 2000} value={h[key]} onChange={e => field("highlights", report.highlights.map((item, i) => i === index ? { ...item, [key]: e.target.value, ...(key === "imageUrl" ? { mediaId: "" } : {}) } : item))} /></label>)}<label>Resultados y motivo para destacarla<textarea rows={3} maxLength={1500} value={h.note} onChange={e => field("highlights", report.highlights.map((item, i) => i === index ? { ...item, note: e.target.value } : item))} placeholder="Ej. Alcance: 2.500 · 120 interacciones. Explica qué funcionó." /></label>{h.mediaId && <small>Imagen o video de la biblioteca vinculado.</small>}<button type="button" className="secondary-button" onClick={() => field("highlights", report.highlights.filter(item => item.id !== h.id))}>Quitar destacado</button></div>)}</fieldset>
    <fieldset className="report-panel" disabled={disabled}><legend>4. Conclusiones y próximos pasos</legend><label>Qué funcionó y qué mejorar<textarea rows={4} maxLength={5000} value={report.conclusions} onChange={e => field("conclusions", e.target.value)} /></label><label>Acciones para el siguiente periodo<textarea rows={4} maxLength={5000} value={report.nextSteps} onChange={e => field("nextSteps", e.target.value)} /></label></fieldset>
    {!valid && <p role="alert">Revisa el título, los enlaces, las métricas enteras no negativas y las fechas. El periodo anterior debe terminar antes del actual.</p>}
    <div className="schedule-preview-toolbar"><button type="button" className="primary-button" disabled={disabled || !valid} onClick={() => void generate(false)}>Vista previa</button><button type="button" className="secondary-button" disabled={disabled || !valid} onClick={() => void generate(true)}>Descargar PDF</button><span role="status">{busy || message}</span></div>
    {preview && <section className="schedule-preview" aria-label="Vista previa del reporte"><div className="schedule-preview-toolbar"><h2>Vista previa del reporte</h2><button type="button" className="secondary-button" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</button><span>{page + 1} / {preview.pages.length}</span><button type="button" className="secondary-button" disabled={page >= preview.pages.length - 1} onClick={() => setPage(p => p + 1)}>Siguiente</button></div>{preview.fingerprint !== fingerprint && <p>Hay cambios pendientes de reflejar en la vista previa. Al descargar se usará la versión actual.</p>}<Image unoptimized src={schedulePageUrl(preview.pages[page])} alt={`Página ${page + 1} del reporte`} width={1600} height={1000} />{preview.warnings.length > 0 && <details><summary>Recursos pendientes ({preview.warnings.length})</summary><ul>{preview.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></details>}</section>}
  </section>;
}
