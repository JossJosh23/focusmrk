"use client";
import { useEffect, useRef, useState } from "react";

type Snapshot = { capturedAt: string; user: { display_name: string; follower_count?: number; video_count?: number }; hasMore: boolean; videos: { id: string; title: string; view_count?: number; like_count?: number; comment_count?: number; share_count?: number }[] };
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
  return <section className="report-panel"><h2>Conexión con TikTok</h2><p>Autoriza la cuenta de {company} para consultar su perfil y los últimos 20 videos públicos.</p>
    {!server ? <p>Disponible al usar FocusMRK con la base de datos del servidor.</p> : <>
      <p>{!status ? "Consultando conexión…" : status.connected ? "Cuenta conectada" : status.configured ? "Lista para conectar" : "Faltan las variables de TikTok en el servidor."}</p>
      <div className="tiktok-actions"><button type="button" className="primary-button" disabled={busy || !status?.configured} onClick={() => void action("connect")}>{status?.connected ? "Volver a conectar TikTok" : "Conectar TikTok"}</button>
      {status?.connected && <><button type="button" className="secondary-button" disabled={busy || !status.configured} onClick={() => void action("sync")}>Actualizar métricas</button><button type="button" className="secondary-button" disabled={busy} onClick={() => void action("disconnect")}>Desconectar</button></>}</div>
      {status?.snapshot && <><h3>{status.snapshot.user.display_name}</h3><p>Consulta: {new Date(status.snapshot.capturedAt).toLocaleString("es-EC")}</p><p>Seguidores: {count(status.snapshot.user.follower_count)} · Videos de la cuenta: {count(status.snapshot.user.video_count)}</p><p>Estos valores son acumulados al momento de consultar; no representan los resultados de un mes. Alcance y guardados no están disponibles en esta conexión.</p>
      {status.snapshot.hasMore && <p>Se muestran los 20 videos más recientes; existen más videos en la cuenta.</p>}
      {status.snapshot.videos.length === 0 && <p>No hay videos públicos disponibles.</p>}
      <ul>{status.snapshot.videos.map(v => <li key={v.id}><strong>{v.title || "Video sin título"}</strong><p>{count(v.view_count)} visualizaciones · {count(v.like_count)} me gusta · {count(v.comment_count)} comentarios · {count(v.share_count)} compartidos</p></li>)}</ul></>}
    </>}<p role="status">{busy ? "Procesando…" : message}</p>
  </section>;
}
