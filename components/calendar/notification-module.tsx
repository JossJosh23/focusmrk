"use client";
import { useEffect, useState } from "react";
import { Bell, Sunrise, Flame, ClipboardCheck, Clock3, Smartphone } from "lucide-react";
import { defaultNotificationSettings, notificationKinds, notificationTimes, validNotificationSettings, type NotificationSettings, type Intensity } from "@/lib/notification-settings";
import { PushSettings } from "./push-settings";

const descriptions = {
  summary: { title: "Resumen de la mañana", text: "Tu contenido para hoy, revisiones y publicaciones atrasadas, en un solo aviso.", icon: Sunrise },
  today: { title: "Pendientes de hoy", text: "Seguimiento del contenido con fecha de hoy que aún no has marcado como publicado.", icon: Flame },
  review: { title: "Contenido por revisar", text: "Publicaciones en revisión de hoy o de días anteriores.", icon: ClipboardCheck },
  overdue: { title: "Publicaciones atrasadas", text: "Contenido de días anteriores que todavía no figura como publicado.", icon: Clock3 },
};
export function NotificationModule({ databaseEnabled, timezone }: { databaseEnabled: boolean; timezone: string }) {
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [active, setActive] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    if (databaseEnabled) fetch("/api/notifications", { cache: "no-store", signal: controller.signal }).then(async r => {
      const data = await r.json(); if (!r.ok || !validNotificationSettings(data.settings)) throw new Error(data.error || "Configuración no válida.");
      setSettings(data.settings); setLoaded(true); setMessage("");
    }).catch(e => { if (!controller.signal.aborted) setMessage(e instanceof Error ? e.message : "No se pudo conectar."); });
    return () => controller.abort();
  }, [databaseEnabled, retry]);
  async function save() {
    if (!validNotificationSettings(settings)) { setMessage("Todos los horarios deben quedar dentro de tu horario permitido."); return; }
    setBusy(true); setMessage("");
    try {
      const r = await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json", "x-focusmrk-request": "1" }, body: JSON.stringify(settings) });
      const data = await r.json(); if (!r.ok) throw new Error(data.error);
      setDirty(false); setMessage("Configuración guardada. Se aplicará a los próximos avisos.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "No se pudo guardar."); } finally { setBusy(false); }
  }
  return <div className="page-content notification-module"><div className="page-heading"><div><span className="eyebrow">TU DÍA, BAJO CONTROL</span><h1>Notificaciones<span>.</span></h1><p>Decide qué quieres recordar y cuánto seguimiento necesitas.</p></div><span className="notification-device"><Smartphone size={16} />{active ? "Dispositivo activado" : "Configura tu dispositivo"}</span></div>
    <div className="notification-explainer"><Bell size={22} /><div><strong>La intensidad se adapta a tu ritmo</strong><p>Suave: un aviso. Normal: hasta dos, cada 4 horas. Intensa: hasta cuatro, cada 2 horas. Cada tipo solo avisa mientras tenga pendientes.</p><small>En iPhone, la intensidad cambia la frecuencia; no el volumen ni la permanencia del aviso. Dynamic Island requiere una app iOS.</small></div></div>
    {!databaseEnabled && <p className="form-error">Conecta la aplicación a PostgreSQL para guardar preferencias y recibir avisos con la app cerrada.</p>}
    {databaseEnabled && !loaded && message && <button className="secondary-button" onClick={() => setRetry(retry + 1)}>Reintentar conexión</button>}
    <fieldset disabled={!loaded || busy} className="notification-fieldset"><div className="notification-hours"><div><strong>Horario permitido</strong><p>Fuera de estas horas no se envían avisos. Zona: {timezone}.</p></div><label>Desde<input type="time" value={settings.start} onChange={e => { setSettings({ ...settings, start: e.target.value }); setDirty(true); }} /></label><label>Hasta<input type="time" value={settings.end} onChange={e => { setSettings({ ...settings, end: e.target.value }); setDirty(true); }} /></label></div>
    <div className="notification-cards">{notificationKinds.map(kind => {
      const item = descriptions[kind]; const Icon = item.icon; const rule = settings.rules[kind];
      const times = notificationTimes(rule.intensity, rule.time, settings.end);
      return <section className="notification-card" key={kind}><div className="notification-card-heading"><span className="notification-kind-icon"><Icon size={21} /></span><div><h2>{item.title}</h2><p>{item.text}</p></div></div><label className="notification-intensity-label" htmlFor={`intensity-${kind}`}>Intensidad</label><select id={`intensity-${kind}`} value={rule.intensity} onChange={e => { setSettings({ ...settings, rules: { ...settings.rules, [kind]: { ...rule, intensity: e.target.value as Intensity } } }); setDirty(true); }}>{[["off", "Desactivada"], ["gentle", "Suave · 1 aviso"], ["normal", "Normal · hasta 2 avisos"], ["intense", "Intensa · hasta 4 avisos"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><label className="notification-time">Primer aviso<input type="time" value={rule.time} onChange={e => { setSettings({ ...settings, rules: { ...settings.rules, [kind]: { ...rule, time: e.target.value } } }); setDirty(true); }} /></label><p className="notification-schedule">{times.length ? `Horarios: ${times.join(" · ")}` : "No se enviarán avisos de este tipo."}</p></section>;
    })}</div><div className="notification-save"><span>{dirty ? "Tienes cambios sin guardar" : "Preferencias para todos tus dispositivos"}</span><button className="primary-button" disabled={!dirty || busy} onClick={() => void save()}>{busy ? "Guardando…" : "Guardar configuración"}</button></div></fieldset>
    {message && <p role="status" className="notification-message">{message}</p>}
    <section className="notification-connect"><h2>Conectar mi iPhone</h2><p>Abre FocusMRK desde el icono de tu pantalla de inicio y activa los avisos en este dispositivo.</p><PushSettings onActive={setActive} /></section>
    <p className="notification-footnote">Los pendientes se calculan con las fechas y estados de tus publicaciones. Marca el contenido como Publicado para retirarlo del seguimiento. Los envíos automáticos requieren la tarea programada del servidor.</p>
  </div>;
}
