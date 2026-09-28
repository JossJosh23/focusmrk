"use client";
import "@/app/tiktok.css";
import { useEffect, useRef, useState } from "react";

type Snapshot = { capturedAt: string; user: { display_name: string; follower_count?: number; video_count?: number }; hasMore: boolean; videos: { id: string; title: string; create_time?: number; share_url?: string; view_count?: number; like_count?: number; comment_count?: number; share_count?: number }[] };
type Status = { configured: boolean; connected: boolean; snapshot: Snapshot | null; message?: string };
const count = (n?: number) => typeof n !== "number" ? "Sin datos" : n.toLocaleString("es");
export function TikTokConnection({ company, server }: { company: string; server: boolean }) {
  const [status, setStatus] = useState<Status | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const lock = useRef(false);
  useEffect(() => {
    if (!server) return;
    const controller = new AbortController();
    fetch(`/api/tiktok?company=${encodeURIComponent(company)}`, { signal: controller.signal, cache: "no-store" }).then(async r => { if (!r.ok) throw new Error("No se pudo consultar la conexión."); return r.json(); }).then(setStatus).catch(() => { if (!controller.signal.aborted) setMessage("No se pudo consultar la conexión. Recarga para reintentar."); });
    return () => controller.abort();
  }, [company, server]);
  async function action(action: string) {
    if (lock.current) return;
    if (action === "connect" && !window.dispatchEvent(new Event("focusmrk-before-navigation", { cancelable: true }))) return;
    if (action === "disconnect" && !confirm("¿Desconectar TikTok y eliminar los registros de métricas de esta conexión? Los reportes guardados se conservarán.")) return;
    lock.current = true; setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/tiktok?company=${encodeURIComponent(company)}`, { method: "POST", headers: { "Content-Type": "application/json", "X-FocusMRK-Request": "1" }, body: JSON.stringify({ action }) });
      if (!response.ok) { const text = await response.text(); try { throw new Error(JSON.parse(text).error); } catch { throw new Error("No se pudo completar la operación. Revisa tu sesión, la configuración y los permisos de TikTok."); } }
      const data = await response.json();
      if (data.url) { window.location.assign(data.url); return; }
      setStatus(data); setMessage(data.message || "Métricas actualizadas.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo conectar TikTok."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section className="report-panel tiktok-panel"><div className="tiktok-heading"><div><span className="eyebrow">REDES CONECTADAS</span><h2>TikTok</h2><p>{company} · Rendimiento del contenido</p></div><span className="tiktok-badge">{status?.connected ? "Cuenta conectada" : "Sin conexión"}</span></div>
    {!server ? <p>Disponible al usar FocusMRK con la base de datos del servidor.</p> : <>
      <p className="tiktok-setup">{!status ? "Consultando conexión…" : status.connected ? "" : status.configured ? "Lista para conectar" : "Faltan las variables de TikTok en el servidor."}</p>
      <div className="tiktok-actions"><button type="button" className={status?.connected ? "secondary-button" : "primary-button"} disabled={busy || !status?.configured} onClick={() => void action("connect")}>{status?.connected ? "Volver a conectar TikTok" : "Conectar TikTok"}</button>
      {status?.connected && <><button type="button" className="primary-button" disabled={busy || !status.configured} onClick={() => void action("sync")}>Actualizar métricas</button><button type="button" className="secondary-button" disabled={busy} onClick={() => void action("disconnect")}>Desconectar</button></>}</div>
      {status?.snapshot && <>
        <div className="tiktok-account"><h3>{status.snapshot.user.display_name}</h3><p>Última consulta: {new Date(status.snapshot.capturedAt).toLocaleString("es-EC")}</p></div>
        <div className="tiktok-metrics">
          <div><span>Seguidores</span><strong>{count(status.snapshot.user.follower_count)}</strong><small>Total de la cuenta</small></div>
          <div><span>Videos publicados</span><strong>{count(status.snapshot.user.video_count)}</strong><small>Total de la cuenta</small></div>
          <div><span>Videos consultados</span><strong>{status.snapshot.videos.length}</strong><small>Hasta 20 publicaciones recientes</small></div>
        </div>
        <p className="tiktok-notice">Métricas acumuladas a la fecha de consulta. No equivalen a resultados mensuales. Alcance y guardados no disponibles.</p>
        <div className="tiktok-heading"><h3>Videos recientes</h3><span>{status.snapshot.videos.length} resultados{status.snapshot.hasMore ? " · Hay más videos en la cuenta" : ""}</span></div>
        {status.snapshot.videos.length === 0 ? <p>No hay videos públicos disponibles.</p> : <div className="tiktok-table-scroll" role="region" aria-label="Métricas de videos de TikTok" tabIndex={0}><table className="tiktok-table"><caption>Contadores acumulados por video</caption><thead><tr><th scope="col">Publicación</th><th scope="col">Fecha</th><th scope="col">Visualizaciones</th><th scope="col">Me gusta</th><th scope="col">Comentarios</th><th scope="col">Compartidos</th><th scope="col">Enlace</th></tr></thead><tbody>{status.snapshot.videos.map(v => {
          let link = ""; try { const url = new URL(v.share_url || ""); if (url.protocol === "https:" && (url.hostname === "tiktok.com" || url.hostname.endsWith(".tiktok.com"))) link = url.href; } catch { /* Older snapshots may have no URL. */ }
          return <tr key={v.id}><td><details><summary>{v.title ? v.title.slice(0, 95) + (v.title.length > 95 ? "…" : "") : "Video sin título"}</summary><p>{v.title || "Sin descripción disponible."}</p></details></td><td>{v.create_time ? new Date(v.create_time * 1000).toLocaleDateString("es-EC") : "Sin fecha"}</td><td>{count(v.view_count)}</td><td>{count(v.like_count)}</td><td>{count(v.comment_count)}</td><td>{count(v.share_count)}</td><td>{link ? <a href={link} target="_blank" rel="noopener noreferrer" aria-label={"Abrir video: " + (v.title || v.id)}>Ver video ↗</a> : "No disponible"}</td></tr>;
        })}</tbody></table></div>}
      </>}
    </>}<p role="status">{busy ? "Procesando…" : message}</p>
  </section>;
}
