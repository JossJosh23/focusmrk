"use client";
import { useEffect, useState } from "react";
async function save(sub: PushSubscription, action: string) {
  const r = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json", "X-FocusMRK-Request": "1" }, body: JSON.stringify({ subscription: sub.toJSON(), action }) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "No se pudo conectar con el servidor.");
}
export function PushSettings({ onActive }: { onActive: (value: boolean) => void }) {
  const [reg, setReg] = useState<ServiceWorkerRegistration | null>(null);
  const [key, setKey] = useState("");
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Comprobando avisos…");
  useEffect(() => {
    let mounted = true;
    async function init() {
      if (!window.isSecureContext || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        if (mounted) setMessage("En iPhone: Safari → Compartir → Añadir a pantalla de inicio. Entra desde ese icono con iOS 16.4 o posterior."); return;
      }
      try {
        const response = await fetch("/api/push", { cache: "no-store" });
        if (!response.ok) throw new Error("No se pudo comprobar la configuración push.");
        const config = await response.json();
        if (!config.configured) { if (mounted) setMessage("Falta configurar las claves push en Dokploy."); return; }
        await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        const subscribed = !!sub && Notification.permission === "granted";
        if (subscribed) await save(sub, "subscribe");
        if (mounted) { setReg(registration); setKey(config.publicKey); setActive(subscribed); onActive(subscribed); setMessage(""); }
      } catch (e) { if (mounted) setMessage(e instanceof Error ? e.message : "No se pudo preparar el dispositivo."); }
    }
    void init(); return () => { mounted = false; };
  }, [onActive]);
  async function toggle() {
    if (!reg || busy) return; setBusy(true); setMessage("");
    try {
      if (active) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) { await save(sub, "disable"); await sub.unsubscribe(); }
        setActive(false); onActive(false); setMessage("Avisos desactivados en este dispositivo.");
      } else {
        // Must be called directly from the user's click on iOS.
        if (await Notification.requestPermission() !== "granted") throw new Error("Permite las notificaciones en los ajustes del dispositivo.");
        const bytes = Uint8Array.from(atob(key.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - key.length % 4) % 4)), c => c.charCodeAt(0));
        const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
        await save(sub, "subscribe"); setActive(true); onActive(true); setMessage("Dispositivo registrado. Activa la tarea programada en Dokploy para recibir avisos automáticos.");
      }
    } catch (e) { setMessage(e instanceof Error ? e.message : "No se pudo cambiar la suscripción."); } finally { setBusy(false); }
  }
  async function test() {
    if (!reg || busy) return; setBusy(true);
    try { const sub = await reg.pushManager.getSubscription(); if (!sub) throw new Error("Activa de nuevo los avisos."); await save(sub, "test"); setMessage("Prueba enviada. Comprueba las notificaciones del dispositivo."); }
    catch (e) { setMessage(e instanceof Error ? e.message : "No se pudo enviar."); } finally { setBusy(false); }
  }
  return <section className="push-settings"><strong>Avisos al celular</strong><p>Recibe los avisos configurados en este módulo, aunque cierres FocusMRK.</p><div className="template-actions"><button type="button" className="primary-button" disabled={!reg || busy} onClick={() => void toggle()}>{busy ? "Procesando…" : active ? "Desactivar en este dispositivo" : "Activar en este dispositivo"}</button>{active && <button type="button" className="secondary-button" disabled={busy} onClick={() => void test()}>Enviar prueba</button>}</div>{message && <p role="status">{message}</p>}</section>;
}
