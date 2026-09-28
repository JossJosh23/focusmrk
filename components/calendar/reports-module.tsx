"use client";
import Image from "next/image";
import { TikTokConnection } from "./tiktok-connection";
import { useEffect, useRef, useState } from "react";
import { type Publication } from "@/lib/calendar";
import { newReport, validReport, type Report } from "@/lib/reports";
import { buildReportPages, type TikTokReportSnapshot } from "@/lib/report-visual";
import { loadDeliveryVisuals, downloadVisualSchedule, schedulePageUrl } from "@/lib/schedule-render";
import { validCompanyProfile } from "@/lib/company-profile";
import { useReports } from "./use-reports";

export function ReportsModule({ company, server, today }: { company: string; server: boolean; posts: Publication[]; today: string }) {
  const store = useReports(company, server, newReport(today)); const { plan: report, setPlan: setReport } = store;
  const [busy, setBusy] = useState(""); const lock = useRef(false); const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<{ pages: string[]; warnings: string[]; fingerprint: string } | null>(null); const [page, setPage] = useState(0);
  const disabled = !store.ready || store.saving || !!busy;
  const valid = validReport({ ...report, id: report.id || "new" });
  const fingerprint = JSON.stringify(report);
  useEffect(() => {
    const prevent = (event: Event) => { if (lock.current) event.preventDefault(); };
    window.addEventListener("focusmrk-before-navigation", prevent); window.addEventListener("beforeunload", prevent);
    return () => { window.removeEventListener("focusmrk-before-navigation", prevent); window.removeEventListener("beforeunload", prevent); };
  }, []);
  function field<K extends keyof Report>(key: K, value: Report[K]) { setReport(r => ({ ...r, [key]: value })); }
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
      if (!server) throw new Error("La consulta de redes requiere el modo servidor.");
      setBusy("Consultando TikTok...");
      const response = await fetch('/api/tiktok?company=' + encodeURIComponent(company), { method: "POST", headers: { "Content-Type": "application/json", "X-FocusMRK-Request": "1" }, body: JSON.stringify({ action: "sync" }) });
      if (!response.ok) throw new Error("No se pudo consultar TikTok. Conecta la cuenta o revisa sus permisos antes de generar el reporte.");
      const connection = await response.json();
      if (!connection.connected || !connection.snapshot) throw new Error("Conecta TikTok para generar el reporte.");
      const tiktok: TikTokReportSnapshot = connection.snapshot;
      const visuals = await loadDeliveryVisuals([], false, logo);
      const pages = buildReportPages(report, company, visuals, tiktok, true);
      setPreview({ pages, warnings: [...warnings, ...visuals.warnings], fingerprint }); setPage(0);
      if (download) { await downloadVisualSchedule(pages, "PDF", report.title); setMessage("PDF generado con los datos actuales del reporte."); }
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo generar el reporte."); }
    finally { lock.current = false; setBusy(""); }
  }
  if (!company) return <section className="surface"><h1>Reportes</h1><p>Selecciona una empresa para preparar sus reportes de redes sociales.</p></section>;
  return <section className="reports-module">
    <div className="page-heading"><div><span className="eyebrow">RESULTADOS · {company}</span><h1>Reportes<span>.</span></h1><p>Reportes con datos consultados directamente de tus redes conectadas.</p></div></div>
    <fieldset className="schedule-saved-bar" disabled={disabled}><label>Reportes guardados<select value={report.id} onChange={e => { if (store.open(store.saved.find(r => r.id === e.target.value) || newReport(today))) { setPreview(null); setMessage(""); } }}><option value="">Nuevo reporte</option>{store.saved.map(r => <option value={r.id} key={r.id}>{r.title} · {r.start} — {r.end}</option>)}</select></label><button type="button" className="primary-button" disabled={!valid} onClick={() => void store.save()}>Guardar reporte</button>{report.id && <button type="button" className="secondary-button" disabled={!valid} onClick={() => void store.save(true)}>Guardar como copia</button>}<button type="button" className="secondary-button" onClick={() => { if (store.open(newReport(today))) setPreview(null); }}>Nuevo reporte</button><small>{!store.ready ? "Cargando…" : store.dirty ? "Cambios sin guardar" : report.id ? "Guardado" : "Nuevo"}</small></fieldset>
    <p role="status">{store.saving ? "Guardando…" : store.message}</p>
    <fieldset className="schedule-config report-config" disabled={disabled}><legend>Configura tu reporte</legend><label className="schedule-title">Nombre del documento<input maxLength={120} value={report.title} onChange={e => field("title", e.target.value)} /></label><p>Al generar la vista previa o el PDF se consulta TikTok. Solo se incluyen redes conectadas: actualmente TikTok. Las cifras son acumuladas a la fecha de consulta, con hasta 20 videos recientes.</p></fieldset>
    <TikTokConnection key={company} company={company} server={server} />
    <fieldset className="report-panel" disabled={disabled}><legend>4. Conclusiones y próximos pasos</legend><label>Qué funcionó y qué mejorar<textarea rows={4} maxLength={5000} value={report.conclusions} onChange={e => field("conclusions", e.target.value)} /></label><label>Acciones para el siguiente periodo<textarea rows={4} maxLength={5000} value={report.nextSteps} onChange={e => field("nextSteps", e.target.value)} /></label></fieldset>
    {!valid && <p role="alert">Revisa el título, los enlaces, las métricas enteras no negativas y las fechas. El periodo anterior debe terminar antes del actual.</p>}
    <div className="schedule-preview-toolbar"><button type="button" className="primary-button" disabled={disabled || !valid} onClick={() => void generate(false)}>Vista previa</button><button type="button" className="secondary-button" disabled={disabled || !valid} onClick={() => void generate(true)}>Descargar PDF</button><span role="status">{busy || message}</span></div>
    {preview && <section className="schedule-preview" aria-label="Vista previa del reporte"><div className="schedule-preview-toolbar"><h2>Vista previa del reporte</h2><button type="button" className="secondary-button" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</button><span>{page + 1} / {preview.pages.length}</span><button type="button" className="secondary-button" disabled={page >= preview.pages.length - 1} onClick={() => setPage(p => p + 1)}>Siguiente</button></div>{preview.fingerprint !== fingerprint && <p>Hay cambios pendientes de reflejar en la vista previa. Al descargar se usará la versión actual.</p>}<Image unoptimized src={schedulePageUrl(preview.pages[page])} alt={`Página ${page + 1} del reporte`} width={1600} height={1000} />{preview.warnings.length > 0 && <details><summary>Recursos pendientes ({preview.warnings.length})</summary><ul>{preview.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></details>}</section>}
  </section>;
}
