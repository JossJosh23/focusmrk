"use client";
import { useEffect, useRef, useState } from "react";
type Account = { facebook: { id: string; name: string; followers?: number; likes?: number }; instagram: { id: string; name: string; followers?: number; posts?: number } | null };
type Status = { configured: boolean; connected: boolean; snapshot: { capturedAt: string; selectedPage: string | null; accounts: Account[] } | null; message?: string };
export function MetaConnection({ company, server }: { company: string; server: boolean }) {
  const [status, setStatus] = useState<Status | null>(null), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    if (!server) return;
    const controller = new AbortController();
    fetch(`/api/meta?company=${encodeURIComponent(company)}`, { signal: controller.signal, cache: "no-store" }).then(async response => { if (!response.ok) throw new Error(); return response.json(); }).then(setStatus).catch(() => { if (!controller.signal.aborted) setMessage("No se pudo consultar Meta. Recarga para reintentar."); });
    const result = new URLSearchParams(window.location.search).get("meta");
    if (result === "cancelled") setMessage("Autorización cancelada. Puedes volver a conectar.");
    if (result === "connected") setMessage("Meta autorizada. Pulsa Consultar cuentas para elegir la página de esta empresa.");
    return () => controller.abort();
  }, [company, server]);
  async function action(action: string, pageId?: string) {
    if (lock.current) return;
    if (action === "connect" && !window.dispatchEvent(new Event("focusmrk-before-navigation", { cancelable: true }))) return;
    if (action === "disconnect" && !confirm("¿Eliminar la conexión de Meta de esta empresa?")) return;
    lock.current = true; setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/meta?company=${encodeURIComponent(company)}`, { method: "POST", headers: { "Content-Type": "application/json", "X-FocusMRK-Request": "1" }, body: JSON.stringify({ action, pageId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo completar la operación.");
      if (data.url) { window.location.assign(data.url); return; }
      setStatus(data); setMessage(data.message || "Datos actualizados.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo conectar Meta."); }
    finally { lock.current = false; setBusy(false); }
  }
  const snapshot = status?.snapshot, account = snapshot?.accounts.find(a => a.facebook.id === snapshot.selectedPage);
  return <section className="report-panel tiktok-panel"><div className="tiktok-heading"><div><span className="eyebrow">REDES CONECTADAS</span><h2>Instagram y Facebook</h2><p>{company} · Conexión con Meta</p></div><span className="tiktok-badge">{status?.connected ? "Meta autorizada" : "Sin conexión"}</span></div>
    {!server ? <p>Disponible con la base de datos del servidor.</p> : <>
      <p>{!status ? "Consultando conexión…" : !status.configured ? status.message || "Falta configurar Meta en el servidor." : !status.connected ? "Conecta Facebook y autoriza la página de esta empresa junto con su Instagram profesional." : ""}</p>
      <div className="tiktok-actions"><button type="button" className="primary-button" disabled={busy || !status?.configured} onClick={() => void action("connect")}>{status?.connected ? "Volver a conectar Meta" : "Conectar Instagram y Facebook"}</button>{status?.connected && <><button type="button" className="secondary-button" disabled={busy || !status.configured} onClick={() => void action("sync")}>Consultar cuentas</button><button type="button" className="secondary-button" disabled={busy} onClick={() => void action("disconnect")}>Desconectar</button></>}</div>
      {snapshot && <><label>Página de esta empresa <select value={snapshot.selectedPage || ""} disabled={busy} onChange={event => void action("select", event.target.value)}><option value="" disabled>Selecciona una página</option>{snapshot.accounts.map(a => <option key={a.facebook.id} value={a.facebook.id}>{a.facebook.name}</option>)}</select></label>
        {account && <div className="company-linked-accounts"><p>Facebook: <strong>{account.facebook.name}</strong></p><p>Instagram: {account.instagram ? <strong>@{account.instagram.name}</strong> : "No hay una cuenta profesional vinculada y autorizada."}</p></div>}
      </>}
    </>}<p role="status">{busy ? "Procesando…" : message}</p>
  </section>;
}
