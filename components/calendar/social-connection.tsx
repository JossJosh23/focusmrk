"use client";
import { useEffect, useRef, useState } from "react";
type Status = {
  configured: boolean; connected: boolean; status?: string; message?: string; expiresAt?: string | null;
  snapshot: { capturedAt: string; selectedPage?: string | null; accounts?: { facebook: { id: string; name: string; followers?: number; likes?: number } }[]; instagram?: { id: string; username: string } } | null;
};
export function SocialConnection({ company, server, provider }: { company: string; server: boolean; provider: "facebook" | "instagram" }) {
  const name = provider === "facebook" ? "Facebook" : "Instagram", endpoint = provider === "facebook" ? "/api/meta" : "/api/instagram";
  const [status, setStatus] = useState<Status | null>(null), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    if (!server) return;
    const controller = new AbortController();
    fetch(`${endpoint}?company=${encodeURIComponent(company)}`, { signal: controller.signal, cache: "no-store" }).then(async response => { if (!response.ok) throw new Error(); return response.json(); }).then(setStatus).catch(() => { if (!controller.signal.aborted) setMessage(`No se pudo consultar ${name}. Recarga para reintentar.`); });
    const params = new URLSearchParams(window.location.search);
    const result = params.get(provider === "facebook" ? "meta" : "instagram");
    if (params.get("company") === company && result === "cancelled") setMessage("Autorización cancelada. Puedes volver a conectar.");
    if (params.get("company") === company && result === "connected") setMessage(provider === "facebook" ? "Facebook autorizado. Pulsa Consultar páginas para seleccionar la de esta empresa." : "Instagram autorizado de forma independiente.");
    return () => controller.abort();
  }, [company, server, provider, endpoint, name]);
  async function action(action: string, pageId?: string) {
    if (lock.current) return;
    if (action === "connect" && !window.dispatchEvent(new Event("focusmrk-before-navigation", { cancelable: true }))) return;
    if (action === "disconnect" && !confirm(`¿Eliminar la conexión de ${name} de esta empresa?`)) return;
    lock.current = true; setBusy(true); setMessage("");
    try {
      const actionEndpoint = provider === "instagram" && action === "connect" ? "/api/instagram/connect" : endpoint;
      const response = await fetch(`${actionEndpoint}?company=${encodeURIComponent(company)}`, { method: "POST", headers: { "Content-Type": "application/json", "X-FocusMRK-Request": "1" }, body: JSON.stringify({ action, pageId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo completar la operación.");
      if (data.url) { window.location.assign(data.url); return; }
      setStatus(data); setMessage(data.message || "Datos actualizados.");
    } catch (error) { setMessage(error instanceof Error ? error.message : `No se pudo conectar ${name}.`); }
    finally { lock.current = false; setBusy(false); }
  }
  const saved = !!status && (status.connected || (!!status.status && status.status !== "disconnected"));
  const snapshot = status?.snapshot, account = snapshot?.accounts?.find(a => a.facebook.id === snapshot.selectedPage);
  return <section className="report-panel tiktok-panel" aria-label={`Conexión de ${name}`}>
    <div className="tiktok-heading"><div><span className="eyebrow">INTEGRACIONES</span><h2>{name}</h2><p>{company}</p></div><span className="tiktok-badge">{status?.connected ? "Conectado" : "No conectado"}</span></div>
    {!server ? <p>Disponible con la base de datos del servidor.</p> : <>
      <p>{!status ? "Consultando conexión…" : !status.configured || status.status === "expired" ? status.message : provider === "facebook" ? "Autoriza y selecciona una Página de Facebook." : "Conecta una cuenta profesional Business o Creator directamente desde Instagram. No necesita una Página de Facebook."}</p>
      <div className="tiktok-actions"><button type="button" className="primary-button" disabled={busy || !status?.configured} onClick={() => void action("connect")}>{saved ? `Reconectar ${name}` : `Conectar ${name}`}</button>{saved && <><button type="button" className="secondary-button" disabled={busy || !status?.configured || !status.connected} onClick={() => void action("sync")}>{provider === "facebook" ? "Consultar páginas" : "Actualizar cuenta"}</button><button type="button" className="secondary-button" disabled={busy} onClick={() => void action("disconnect")}>Desconectar {name}</button></>}</div>
      {provider === "facebook" && snapshot?.accounts && <><label>Página de esta empresa<select value={snapshot.selectedPage || ""} disabled={busy || !status?.configured || !status.connected} onChange={event => void action("select", event.target.value)}><option value="" disabled>Selecciona una página</option>{snapshot.accounts.map(a => <option key={a.facebook.id} value={a.facebook.id}>{a.facebook.name}</option>)}</select></label>{account && <div className="company-linked-accounts"><p>Página: <strong>{account.facebook.name}</strong></p><p>ID: {account.facebook.id}</p><p>Seguidores: {account.facebook.followers ?? "Sin datos"} · Me gusta: {account.facebook.likes ?? "Sin datos"}</p></div>}</>}
      {provider === "instagram" && snapshot?.instagram && <div className="company-linked-accounts"><p>Instagram: <strong>@{snapshot.instagram.username}</strong></p><p>ID: {snapshot.instagram.id}</p></div>}
      {status?.expiresAt && <p>Vencimiento: <time dateTime={status.expiresAt}>{new Date(status.expiresAt).toLocaleDateString("es-EC", { timeZone: "America/Guayaquil" })}</time></p>}
    </>}<p role="status">{busy ? "Procesando…" : message}</p>
  </section>;
}
