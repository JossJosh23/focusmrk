"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ChartColumn, Download, RefreshCw } from "lucide-react";
import { CompanySelector } from "../calendar/company-selector";
import { UserProfileMenu } from "../user-profile-menu";
import { Bars, LineChart, formatNumber as fmt } from "./charts";
import { ConnectionDiagnostics } from "./connection-diagnostics";
import { ExecutiveReportView } from "./executive-report";
import { ManualDataPanel, GoalEditor, ClassificationEditor, SourceBadge } from "./manual-data";
import type { ExecutiveReport } from "@/lib/content-reports/executive";
import { categoryLabels, objectiveLabels } from "@/lib/content-reports/hybrid";
import { blankNotes, metric, metricLabels, publicationDate, platforms, shiftDate, type ReportQuery, type SocialPublication, type ReportNotes } from "@/lib/content-reports/model";

const typeNames = { REEL:"Reels", POST:"Posts", CAROUSEL:"Carruseles", STORY:"Historias", VIDEO:"Videos", TIKTOK:"TikToks" };
function initialQuery(): ReportQuery {
  const today = new Intl.DateTimeFormat("en-CA",{timeZone:"America/Guayaquil"}).format(new Date());
  return { companyId:"",platform:"Todas",startDate:shiftDate(today,-29),endDate:today,mode:"production" };
}
async function readResponse(response: Response) { const data = await response.json().catch(()=>{throw new Error(`Respuesta inválida del servidor (HTTP ${response.status}).`);}); if(!response.ok) throw new Error(data?.error || `No se pudo cargar el informe (HTTP ${response.status}).`);return data; }
function queryString(q:ReportQuery) {return new URLSearchParams({...q}).toString();}
function Panel({title,children}:{title:string;children:React.ReactNode}) {return <section className="ci-panel"><h2>{title}</h2>{children}</section>;}
export function ContentReportsDashboard({server,publicationId: initialPublicationId, embedded = false, company = ""}:{server:boolean;publicationId?:string;embedded?:boolean;company?:string}) {
  const [openedPublication, setOpenedPublication] = useState<string | undefined>(initialPublicationId);
  const publicationId = openedPublication;
  const router = useRouter();
  const [q,setQuery]=useState<ReportQuery>(initialQuery),[mounted,setMounted]=useState(false),[report,setReport]=useState<ExecutiveReport|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(false),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[notes,setNotes]=useState<ReportNotes>(blankNotes),[dirty,setDirty]=useState(false),[sort,setSort]=useState("views");
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search),defaults=initialQuery();
    const candidate={...defaults,...Object.fromEntries(["companyId","platform","startDate","endDate","mode"].flatMap(key=>params.has(key)?[[key,params.get(key)!]]:[]))} as ReportQuery;
    if (embedded) candidate.companyId = company;
    const instagram=params.get("instagram"),insights=params.get("instagramInsights");
    const oauthMessage=instagram==="cancelled"?"Autorización de Instagram cancelada. Puedes intentarlo de nuevo.":instagram==="connected"?insights==="granted"?"Instagram autorizó las estadísticas. Pulsa Consultar redes para actualizar el informe.":insights==="not_granted"?"Instagram está conectado, pero no concedió el permiso de estadísticas. Revisa los permisos de la aplicación antes de autorizar de nuevo.":"Instagram está conectado. Pulsa Consultar redes para comprobar el acceso a estadísticas y actualizar el informe.":"";
    const timer = window.setTimeout(()=>{setQuery(candidate);setMounted(true);setLoading(!!candidate.companyId);setMessage(oauthMessage);},0);
    return ()=>clearTimeout(timer);
  },[embedded,company]);
  const query=queryString(q);
  useEffect(()=>{
    if(!mounted||!q.companyId) return;
    const controller=new AbortController();
    fetch(`/api/reports/summary?${query}`,{cache:"no-store",signal:controller.signal}).then(readResponse).then((data:ExecutiveReport)=>{if(controller.signal.aborted)return;setReport(data);setNotes(data.notes);setDirty(false);}).catch(e=>{if(!controller.signal.aborted)setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    if(!embedded) window.history.replaceState(null,"",`/dashboard/informes?${query}`);
    if (embedded) window.history.replaceState(null,"",`/?module=content&${query}`);
    return ()=>controller.abort();
  },[mounted,query,q.companyId,embedded]);
  useEffect(()=>{if(!dirty)return;const before=(event:BeforeUnloadEvent)=>{event.preventDefault();};window.addEventListener("beforeunload",before);return()=>window.removeEventListener("beforeunload",before);},[dirty]);
  useEffect(() => {
    const navigate = (event: Event) => { if (busy || (dirty && !window.confirm("Hay análisis sin guardar. ¿Descartar los cambios?"))) event.preventDefault(); };
    window.addEventListener("focusmrk-before-navigation", navigate);
    return () => window.removeEventListener("focusmrk-before-navigation", navigate);
  }, [dirty, busy]);
  function openDetail(event: React.MouseEvent, id?: string) {
    if (!embedded) return;
    event.preventDefault();
    if (!window.dispatchEvent(new Event("focusmrk-before-navigation", { cancelable: true }))) return;
    setOpenedPublication(id);
  }
  function change(next:Partial<ReportQuery>){if(dirty&&!window.confirm("Hay análisis sin guardar. ¿Descartar los cambios?"))return;setDirty(false);setMessage("");setLoading(!!(next.companyId ?? q.companyId));setError("");setReport(null);setQuery(current=>({...current,...next}));}
  function period(value:string){if(value==="custom")return;const today=initialQuery().endDate,year=Number(today.slice(0,4)),month=Number(today.slice(5,7));let start=shiftDate(today,value==="7"?-6:-29),end=today;if(value==="month")start=today.slice(0,7)+"-01";if(value==="previous"){start=new Date(Date.UTC(year,month-2,1,12)).toISOString().slice(0,10);end=shiftDate(today.slice(0,7)+"-01",-1);}change({startDate:start,endDate:end});}
  async function save(){if(busy)return;setBusy(true);setMessage("");try{if(q.mode==="demo"){setMessage("DEMO: análisis de prueba, no se guarda en producción.");setDirty(false);return;}const data=await readResponse(await fetch(`/api/reports/insights?${query}`,{method:"PUT",headers:{"Content-Type":"application/json","X-FocusMRK-Request":"1"},body:JSON.stringify(notes)}));setNotes({...notes,version:data.version});setDirty(false);setMessage("Análisis y recomendaciones guardados.");}catch(e){setMessage(e instanceof Error?e.message:"No se pudo guardar.");}finally{setBusy(false);}}
  async function sync(){
    if(busy)return;setBusy(true);setMessage("");
    try {
      const response=await fetch(`/api/reports/insights?${query}`,{method:"POST",headers:{"Content-Type":"application/json","X-FocusMRK-Request":"1"}});
      const data=await response.json().catch(()=>{throw new Error(`Respuesta inválida del servidor (HTTP ${response.status}).`);});
      const updated=await readResponse(await fetch(`/api/reports/summary?${query}`,{cache:"no-store"}));setReport(updated);
      const failed=Array.isArray(data.results)?data.results.filter((r:{status:string})=>r.status==="error").length:0;
      setMessage(response.ok?`${data.imported} publicaciones consultadas entre el período seleccionado y el anterior.${failed?` ${failed} red(es) no pudieron actualizarse; revisa el estado de consulta.`:""}`:data.error||"No se pudo actualizar.");
    }catch(e){setMessage(e instanceof Error?e.message:"No se pudo actualizar.");}finally{setBusy(false);}
  }
  async function authorizeMetrics(platform:"Instagram"|"Facebook") {
    if(busy)return;setBusy(true);setMessage("");
    try {
      const path=platform==="Instagram"?"/api/instagram/connect":"/api/meta";
      const params=new URLSearchParams({company:q.companyId,reports:"1"});
      if(platform==="Instagram")params.set("returnTo",`/dashboard/informes?${query}`);
      const data=await readResponse(await fetch(`${path}?${params}`,{method:"POST",headers:{"Content-Type":"application/json","X-FocusMRK-Request":"1"},body:JSON.stringify({action:"connect"})}));
      const url=new URL(data.url),host=platform==="Instagram"?"www.instagram.com":"www.facebook.com";
      if(url.protocol!=="https:"||url.hostname!==host)throw new Error("URL de autorización no válida.");
      window.location.assign(url.href);
    }catch(e){setMessage(e instanceof Error?e.message:"No se pudo iniciar la autorización.");setBusy(false);}
  }
  const selected=report?.publications.find(p=>p.id===publicationId);
  // Fast Refresh can retain an earlier response while the API contract gains
  // coverage fields. Wait for the current request before rendering those fields.
  const reportReady=!!report&&!!report.executive&&Array.isArray(report.networkSummaries)&&report.comparison.every(k=>!!k.currentCoverage&&!!k.previousCoverage);
  const [profile,setProfile] = useState<{name:string;logo:string}|null>(null);
  useEffect(() => {
    if (!q.companyId) return;
    const controller = new AbortController();
    fetch('/api/company-profile?company=' + encodeURIComponent(q.companyId), {signal:controller.signal}).then(r=>r.ok?r.json():null).then(data=>{if(!controller.signal.aborted)setProfile(data?.profile||null);}).catch(()=>{});
    return ()=>controller.abort();
  }, [q.companyId]);
  async function refreshReport() { const data=await readResponse(await fetch('/api/reports/summary?'+query,{cache:'no-store'}));setReport(data); }
  return <div className={embedded ? "ci-embedded" : "ci-layout"}>{!embedded && <aside className="ci-sidebar"><Link className="brand" href="/">focus<span>mrk</span></Link><Link href="/"><ArrowLeft size={18}/> Calendario</Link><Link className="nav-active" href="/dashboard/informes"><ChartColumn size={18}/> Informes de contenido</Link><Link href="/?module=integrations">Integraciones</Link></aside>}<main className="ci-main">{!embedded && <header className="ci-topbar"><Link href="/">Tu espacio de trabajo</Link><UserProfileMenu server={server} onNotifications={() => { router.push("/?module=day"); }}/></header>}<div className="ci-content">
    <div className="ci-heading"><div><span className="eyebrow">RESULTADOS QUE CUENTAN UNA HISTORIA</span><h1>{publicationId?"Detalle de publicación":"Informes de contenido"}<span>.</span></h1><p>{publicationId?"Conoce el rendimiento de cada pieza de contenido.":"Explora tus resultados, encuentra patrones y prepara el siguiente período."}</p></div><button className="secondary-button ci-no-print" disabled={!reportReady||loading} onClick={async()=>{await document.fonts.ready;window.print();}}><Download size={18}/>Exportar informe</button></div>
    <fieldset disabled={busy} className="ci-filters ci-no-print">{embedded ? <div className="ci-company-context"><span>Empresa</span><strong>{company || "Selecciona una empresa en el menú"}</strong></div> : <CompanySelector server={server} known={[]} canCreate={false} value={q.companyId} onChange={companyId=>change({companyId})}/>}<label>Red social<select value={q.platform} onChange={e=>change({platform:e.target.value as ReportQuery["platform"]})}><option>Todas</option>{platforms.map(p=><option key={p}>{p}</option>)}</select></label><label>Período<select defaultValue="30" onChange={e=>period(e.target.value)}><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option><option value="month">Mes actual</option><option value="previous">Mes anterior</option><option value="custom">Rango personalizado</option></select></label><label>Desde<input type="date" value={q.startDate} onChange={e=>change({startDate:e.target.value})}/></label><label>Hasta<input type="date" min={q.startDate} value={q.endDate} onChange={e=>change({endDate:e.target.value})}/></label><label>Fuente<select value={q.mode} onChange={e=>change({mode:e.target.value as ReportQuery["mode"]})}><option value="production">Datos reales</option><option value="demo">DEMO · Datos ficticios</option></select></label></fieldset>
    <p className={q.mode==="demo"?"ci-demo":"ci-source"}>{q.mode==="demo"?"DEMO · Todas las cifras son ficticias. No se mezclan con las cuentas conectadas.":"DATOS REALES · Solo métricas recibidas de las cuentas conectadas."} · {q.companyId || "Selecciona una empresa"} · {q.startDate} — {q.endDate}</p>
    <p role="status">{busy?"Procesando…":message}</p>
    {loading&&<p role="status">Cargando informe…</p>}{error&&<p role="alert" className="ci-error">{error}</p>}{!q.companyId&&<Panel title="Elige la empresa"><p>Selecciona un cliente y un período para comenzar. Activa DEMO para explorar todas las secciones.</p></Panel>}
    {report&&!reportReady&&!error&&<p role="status">Cargando la versión actual del informe… Si no carga, recarga la página.</p>}
    {reportReady&&report&&<><details className="ci-notes"><summary>Disponibilidad y lectura de los datos</summary>{report.warnings.map(w=><p key={w}>{w}</p>)}<p>La comparación muestra cifras acumuladas de publicaciones de dos períodos; no diferencias de actividad entre fechas de consulta. Las métricas no disponibles no se convierten en cero.</p></details>
      {publicationId?<><Link onClick={event=>openDetail(event)} href={`/dashboard/informes?${query}`} className="ci-no-print">← Volver al informe</Link>{selected?<><PublicationDetail post={selected}/><Panel title="Origen e histórico"><div className="ci-kpis">{Object.entries(selected.metricData).map(([key,datum])=><article key={key}><span>{metricLabels[key as keyof typeof metricLabels]||key}</span><strong>{fmt(datum.value)}</strong><SourceBadge datum={datum}/>{datum.manualValue!==null&&<><small>Automático: {fmt(datum.apiValue)}</small><small>Manual existente: {fmt(datum.manualValue)}</small><small>Prioridad: {datum.preference}</small></>}</article>)}</div><h3>Capturas originales de API</h3>{selected.history.length?<LineChart labels={selected.history.map(h=>h.capturedAt)} series={[{name:"Visualizaciones API",values:selected.history.map(h=>h.metrics.views)}]}/>:<p>Histórico insuficiente.</p>}<p>Actividad exacta del período: {report.executive.activityAvailable?fmt(report.executive.activity.find(row=>row.publicationId===selected.id)?.values.views):"Histórico insuficiente"}</p><p>Categoría: {selected.editorial.contentCategory?categoryLabels[selected.editorial.contentCategory]:"Sin clasificar"} · Objetivo: {selected.editorial.contentObjective?objectiveLabels[selected.editorial.contentObjective]:"Sin objetivo"}</p>{q.mode==="production"&&<ClassificationEditor publicationId={selected.id} editorial={selected.editorial} query={query} onRefresh={refreshReport} onBusy={setBusy}/>}<ManualDataPanel report={report} query={query} onRefresh={refreshReport} onBusy={setBusy}/></Panel></>:<Panel title="Publicación no encontrada"><p>No pertenece a la empresa, red o período seleccionado.</p></Panel>}</>:<>
      {q.mode==="production"&&<><div className="ci-actions ci-no-print"><button className="primary-button" disabled={busy||dirty} onClick={()=>void sync()}><RefreshCw size={18}/>{busy?"Consultando…":q.platform==="Todas"?"Consultar redes":`Consultar ${q.platform}`}</button>{(["Instagram","Facebook"] as const).filter(p=>q.platform==="Todas"||q.platform===p).map(p=><button key={p} className="secondary-button" disabled={busy||dirty} onClick={()=>void authorizeMetrics(p)}>Autorizar métricas de {p}</button>)}<Link href="/?module=integrations">Gestionar conexiones</Link></div><p className="ci-no-print">La consulta actualiza publicaciones y seguidores de las cuentas conectadas. Autoriza las métricas si la red pide permisos adicionales.</p><ConnectionDiagnostics key={q.companyId} company={q.companyId}/>{report.syncs.length>0&&<Panel title="Estado de la última consulta"><div className="ci-three">{report.syncs.map(s=><article key={s.platform}><h3>{s.platform}</h3><p>{s.status==="success"?`${s.imported} publicaciones consultadas`:"No se pudo actualizar"}</p><p>{new Date(s.capturedAt).toLocaleString("es-EC",{timeZone:"America/Guayaquil"})}</p><p>{s.startDate} — {s.endDate}</p>{s.error&&<p className="ci-error">{s.error}</p>}{s.warnings.length>0&&<details><summary>Disponibilidad de métricas</summary>{s.warnings.map(w=><p key={w}>{w}</p>)}</details>}</article>)}</div></Panel>}</>}
      <ExecutiveReportView report={report} sort={sort} onSort={setSort} onDetail={id=>{if(window.dispatchEvent(new Event("focusmrk-before-navigation",{cancelable:true})))setOpenedPublication(id);}} notes={notes} logo={profile?.logo} companyName={profile?.name} notesEditor={<div className="ci-manual-analysis ci-no-print"><h3>Editar análisis manual</h3><div className="ci-two">{[["worked","Qué funcionó"],["improve","Qué tuvo menor rendimiento"]].map(([key,label])=><label key={key}>{label}<textarea rows={4} maxLength={5000} value={notes[key as "worked"|"improve"]} onChange={event=>{setNotes({...notes,[key]:event.target.value});setDirty(true);}}/></label>)}</div><label>Recomendaciones<textarea rows={4} maxLength={5000} value={notes.recommendations} onChange={event=>{setNotes({...notes,recommendations:event.target.value});setDirty(true);}}/></label><div className="ci-actions"><button className="primary-button" disabled={!dirty||busy} onClick={()=>void save()}>{q.mode==="demo"?"Revisar análisis de prueba":"Guardar análisis"}</button><span>{dirty?"Cambios sin guardar":"Sin cambios pendientes"}</span></div></div>} manualPanel={<ManualDataPanel report={report} query={query} onRefresh={refreshReport} onBusy={setBusy}/>} goalEditor={<GoalEditor report={report} query={query} onRefresh={refreshReport} onBusy={setBusy}/>}/>
      </>}
    </>}
  </div></main></div>;
}

function PublicationDetail({post:p}:{post:SocialPublication}) {
  return <><Panel title={p.title}><div className="ci-detail"><div className="ci-media-preview">{p.mediaUrl ? ["REEL","TIKTOK","VIDEO"].includes(p.contentType) && !p.mediaUrl.endsWith(".svg") ? <video controls preload="metadata" poster={p.thumbnailUrl || undefined} src={p.mediaUrl}/> : <Image unoptimized src={p.mediaUrl} alt={p.title} width={480} height={480}/> : <p>Imagen o video no disponible</p>}</div><div><p>{p.platform} · {typeNames[p.contentType]} · {publicationDate(p.publishedAt)}</p><p>{p.caption||"Copy no disponible"}</p><p>Campaña: {p.campaignId||"No disponible"}</p>{p.permalink&&/^https:\/\//.test(p.permalink)&&<a href={p.permalink} target="_blank" rel="noopener noreferrer">Abrir publicación ↗</a>}<p>Última consulta: {p.capturedAt}</p></div></div></Panel><Panel title="Métricas originales de la API"><p>Interacciones oficiales: {fmt(p.providerMetrics?.totalInteractions??null)} · Espectadores únicos de contenido: {fmt(p.providerMetrics?.uniqueMediaViewers??null)}</p><p>Estos datos se conservan separados de las interacciones calculadas y del alcance.</p></Panel><Panel title="Métricas principales"><div className="ci-kpis">{Object.entries({reach:"Alcance",impressions:"Impresiones",views:"Visualizaciones",likes:"Likes",comments:"Comentarios",shares:"Compartidos",saves:"Guardados",clicks:"Clics",profileVisits:"Visitas al perfil",followersGained:"Seguidores generados"}).map(([key,label])=><article key={key}><span>{label}</span><strong>{fmt(metric(p,key))}</strong></article>)}<article><span>Engagement</span><strong>{fmt(metric(p,"engagement"),"%")}</strong></article></div></Panel>{["REEL","TIKTOK","VIDEO"].includes(p.contentType)&&<Panel title="Métricas de video"><div className="ci-kpis">{Object.entries({views:"Reproducciones",totalWatchTime:"Tiempo total (s)",averageWatchTime:"Tiempo promedio (s)",duration:"Duración (s)",averageWatchPercentage:"Porcentaje promedio visto",completePlays:"Reproducciones completas"}).map(([key,label])=><article key={key}><span>{label}</span><strong>{fmt(metric(p,key),key==="averageWatchPercentage"?"%":"")}</strong></article>)}</div><h3>Retención</h3><Bars rows={p.metrics.retention} percent/><LineChart labels={p.metrics.retention.map(r=>r.label)} series={[{name:"Retención (%)",values:p.metrics.retention.map(r=>r.value)}]}/></Panel>}</>;
}

