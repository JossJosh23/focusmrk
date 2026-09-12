"use client";
import { useEffect, useState } from "react";
import { Bell, Check, ChevronDown, Clock3, Smartphone, Sunrise } from "lucide-react";
import { defaultNotificationSettings, notificationKinds, notificationTimes, validNotificationSettings, type NotificationKind, type NotificationSettings, type Intensity } from "@/lib/notification-settings";
import { PushSettings } from "./push-settings";

const descriptions = {
  summary: { title: "Resumen para empezar el día", text: "Tus tareas y publicaciones pendientes, juntas en un aviso." },
  today: { title: "Seguimiento durante el día", text: "Recordatorios para avanzar con tus tareas y publicaciones de hoy." },
  review: { title: "Publicaciones por revisar", text: "Un seguimiento específico del contenido en revisión." },
  overdue: { title: "Publicaciones atrasadas", text: "Un seguimiento específico de publicaciones de días anteriores." },
};
const rhythms = [
  { id: "summary", title: "Solo resumen", text: "Empieza el día con tu lista.", limit: 1, intensity: "off" },
  { id: "balanced", title: "Equilibrado", text: "Resumen y seguimiento moderado.", limit: 4, intensity: "normal" },
  { id: "focused", title: "Más seguimiento", text: "Más oportunidades para retomar pendientes.", limit: 6, intensity: "intense" },
] as const;
type Health = { last_run?: string; last_success?: string; last_error?: string; last_accepted?: string };

export function NotificationModule({ databaseEnabled, timezone }: { databaseEnabled: boolean; timezone: string }) {
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [saved, setSaved] = useState<NotificationSettings | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [active, setActive] = useState(false);
  const [retry, setRetry] = useState(0);
  const [checkedAt, setCheckedAt] = useState(0);
  const [health, setHealth] = useState<Health | null>(null);
  const dirty = saved !== null && JSON.stringify(settings) !== JSON.stringify(saved);
  const formatTime = (time?: string) => time ? new Intl.DateTimeFormat("es", { timeZone: timezone, dateStyle: "short", timeStyle: "short" }).format(new Date(time)) : "Sin registros";
  useEffect(() => {
    const controller = new AbortController();
    if (databaseEnabled) fetch("/api/notifications", { cache: "no-store", signal: controller.signal }).then(async r => {
      const data = await r.json();
      if (!r.ok || !validNotificationSettings(data.settings)) throw new Error(data.error || "No se pudo leer la configuración.");
      if (controller.signal.aborted) return;
      setSettings(data.settings); setSaved(data.settings); setHealth(data.health); setCheckedAt(Date.now()); setLoaded(true); setError("");
    }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "No se pudo conectar."); });
    return () => controller.abort();
  }, [databaseEnabled, retry]);
  function change(next: NotificationSettings) { setSettings(next); setMessage(""); setError(""); }
  function ruleChange(kind: NotificationKind, patch: Partial<NotificationSettings["rules"][NotificationKind]>) {
    change({ ...settings, rules: { ...settings.rules, [kind]: { ...settings.rules[kind], ...patch } } });
  }
  const invalidTimes = notificationKinds.filter(k => settings.rules[k].intensity !== "off" && (settings.rules[k].time < settings.start || settings.rules[k].time >= settings.end || !settings.rules[k].time));
  const invalidWindow = !settings.start || !settings.end || settings.start >= settings.end;
  const invalidLimit = !Number.isInteger(settings.dailyLimit ?? 4) || (settings.dailyLimit ?? 4) < 1 || (settings.dailyLimit ?? 4) > 12;
  async function save() {
    // Disabled rules have no delivery time; keep their stored value within the allowed window.
    const next = structuredClone(settings);
    notificationKinds.forEach(k => { if (next.rules[k].intensity === "off") next.rules[k].time = next.start; });
    if (!validNotificationSettings(next)) { setError("Revisa los campos señalados antes de guardar."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const r = await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json", "x-focusmrk-request": "1" }, body: JSON.stringify(next) });
      const data = await r.json(); if (!r.ok) throw new Error(data.error || "No se pudo guardar.");
      setSettings(next); setSaved(next); setMessage("Listo. Tus preferencias están guardadas.");
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar."); } finally { setBusy(false); }
  }
  const selectedRhythm = rhythms.find(r => settings.rules.summary.intensity === "gentle" && settings.rules.today.intensity === r.intensity && settings.rules.review.intensity === "off" && settings.rules.overdue.intensity === "off" && (settings.dailyLimit ?? 4) === r.limit);
  const timeline = notificationKinds.flatMap(kind => notificationTimes(settings.rules[kind].intensity, settings.rules[kind].time, settings.end).filter(time => time >= settings.start).map(time => ({ time, label: descriptions[kind].title })));
  if (settings.rules.today.intensity !== "off") notificationTimes("intense", settings.rules.today.time, settings.end).filter(time => time >= settings.start).forEach(time => timeline.push({ time, label: "Tareas prioritarias, si quedan pendientes" }));
  const slots = [...new Set(timeline.map(item => item.time))].sort();
  const stale = loaded && (!health?.last_run || checkedAt - Date.parse(health.last_run) > 300000);
  function ruleCard(kind: NotificationKind) {
    const rule = settings.rules[kind]; const enabled = rule.intensity !== "off";
    return <section className="notify-rule" key={kind} data-enabled={enabled}><div className="notify-rule-head"><div><h3>{descriptions[kind].title}</h3><p>{descriptions[kind].text}</p></div><button className="notify-switch" type="button" role="switch" aria-checked={enabled} aria-label={descriptions[kind].title} onClick={() => ruleChange(kind, { intensity: enabled ? "off" : "gentle", time: rule.time >= settings.start && rule.time < settings.end ? rule.time : settings.start })}><span /></button></div>
      {enabled && <><div className="notify-rule-fields"><label>{kind === "summary" ? "Hora del resumen" : "Empezar a las"}<input type="time" value={rule.time} aria-invalid={invalidTimes.includes(kind)} onChange={e => ruleChange(kind, { time: e.target.value })} /></label><label>{kind === "today" ? "Avisos de publicaciones" : "Frecuencia"}<select value={rule.intensity} onChange={e => ruleChange(kind, { intensity: e.target.value as Intensity })}><option value="gentle">Una vez al día</option><option value="normal">Hasta 2 veces · cada 4 h</option><option value="intense">Hasta 4 veces · cada 2 h</option></select></label></div>{invalidTimes.includes(kind) && <p className="notify-field-error">Elige una hora entre {settings.start} y {settings.end} (sin incluir la hora final).</p>}{kind === "today" && <p className="notify-rule-note">Las tareas de Mi día siguen su propia prioridad: normales solo en el resumen, importantes hasta 2 seguimientos y prioritarias hasta 4. Apagar esta opción detiene sus seguimientos.</p>}</>}
    </section>;
  }
  return <div className="page-content notification-module notify-redesign"><div className="page-heading"><div><span className="eyebrow">A TU RITMO</span><h1>Notificaciones<span>.</span></h1><p>Un plan claro para recordar lo importante.</p></div><span className="notification-device"><Smartphone size={16} />{active ? "iPhone o dispositivo conectado" : "Dispositivo por conectar"}</span></div>
    {!databaseEnabled && <p className="notification-message">La configuración estará disponible al conectar el servidor. Mientras tanto, puedes organizar tus tareas en Mi día.</p>}
    {databaseEnabled && !loaded && !error && <p role="status">Cargando tus preferencias…</p>}
    <details className="notify-device"><summary><span className="notify-step">1</span><span><strong>Conecta este dispositivo</strong><small>{active ? "Activado. Puedes enviar una prueba aquí." : "Activa los avisos para recibirlos con la app cerrada."}</small></span><ChevronDown size={18} /></summary><div className="notify-device-body"><p>En iPhone, abre FocusMRK desde el icono de la pantalla de inicio.</p><PushSettings onActive={setActive} /></div></details>
    <fieldset disabled={!loaded || busy} className="notification-fieldset"><div className="notify-layout"><div className="notify-main"><section className="notify-section"><div className="notify-section-heading"><span className="notify-step">2</span><div><h2>Elige tu ritmo</h2><p>Empieza con una opción. Luego puedes ajustarla.</p></div></div><div className="notify-presets" role="group" aria-label="Ritmo de notificaciones">{rhythms.map(r => <button type="button" key={r.id} aria-pressed={selectedRhythm?.id === r.id} onClick={() => change({ ...settings, dailyLimit: r.limit, rules: { ...settings.rules, summary: { ...settings.rules.summary, intensity: "gentle" }, today: { ...settings.rules.today, intensity: r.intensity }, review: { ...settings.rules.review, intensity: "off" }, overdue: { ...settings.rules.overdue, intensity: "off" } } })}><span>{r.title}{selectedRhythm?.id === r.id && <Check size={15} />}</span><small>{r.text}</small><b>Máximo {r.limit} {r.limit === 1 ? "aviso" : "avisos"} al día</b></button>)}</div><p className="notify-hint">{selectedRhythm ? "Cada opción incluye el resumen y desactiva los avisos extra de revisión y atrasadas." : "Configuración personalizada: conservamos tus preferencias actuales."}</p></section>
    <section className="notify-section"><div className="notify-section-heading"><Clock3 size={20} /><div><h2>Tu horario de avisos</h2><p>Fuera de este intervalo no enviamos recordatorios.</p></div></div><div className="notify-window"><label>Desde<input type="time" value={settings.start} aria-invalid={invalidWindow} onChange={e => change({ ...settings, start: e.target.value })} /></label><span aria-hidden="true">—</span><label>Hasta<input type="time" value={settings.end} aria-invalid={invalidWindow} onChange={e => change({ ...settings, end: e.target.value })} /></label><label>Máximo diario<input type="number" min={1} max={12} value={settings.dailyLimit ?? 4} aria-invalid={invalidLimit} onChange={e => change({ ...settings, dailyLimit: Number(e.target.value) })} /></label></div>{invalidWindow && <p className="notify-field-error">La hora final debe ser posterior a la inicial.</p>}{invalidLimit && <p className="notify-field-error">El máximo debe estar entre 1 y 12 avisos.</p>}<p className="notify-hint">Zona horaria: {timezone}. El máximo incluye todos los tipos de aviso por dispositivo.</p></section>
    <details className="notify-custom"><summary><span><strong>Personalizar cada aviso</strong><small>Horarios, frecuencia y avisos adicionales</small></span><ChevronDown size={18} /></summary><div>{notificationKinds.map(ruleCard)}</div></details>
    {invalidTimes.length > 0 && <p role="alert" className="notify-field-error">Abre “Personalizar cada aviso” y ajusta: {invalidTimes.map(k => descriptions[k].title).join(", ")}. Sus horas están fuera de tu horario permitido.</p>}
    </div><aside className="notify-preview"><div className="notify-section-heading"><span className="notify-step">3</span><div><h2>Así se vería tu día</h2><p>{dirty ? "Vista previa de tus cambios" : "Según tus preferencias"}</p></div></div><div className="notify-preview-limit"><Bell size={18} /><strong>Hasta {settings.dailyLimit ?? 4} avisos</strong><span>al día, solo si hay pendientes</span></div>{!invalidWindow && !invalidTimes.length ? <ol className="notify-timeline">{slots.map(time => <li key={time}><time>{time}</time><div>{[...new Set(timeline.filter(item => item.time === time).map(item => item.label))].map(label => <span key={label}>{label}</span>)}</div></li>)}</ol> : <p className="notify-hint">Revisa tus horarios para ver la planificación.</p>}{!slots.length && !invalidWindow && <p className="notify-hint">No tienes avisos programados.</p>}<p className="notify-hint">Horarios posibles, no envíos garantizados. Agrupamos coincidencias, dejamos al menos una hora entre mensajes y detenemos los avisos al llegar a tu máximo.</p><div className="notify-preview-tip"><Sunrise size={18} /><p>Al tocar un aviso irás a <strong>Mi día</strong> para completar o posponer tus tareas.</p></div></aside></div>
    <div className="notify-savebar"><div><strong>{dirty ? "Cambios sin guardar" : loaded ? "Preferencias guardadas" : "Conecta el servidor para configurar"}</strong><span>Se aplican a todos tus dispositivos.</span></div><div>{dirty && <button type="button" className="secondary-button" onClick={() => { if (saved) change(saved); }}>Descartar</button>}<button type="button" className="primary-button" disabled={!dirty || busy || invalidWindow || invalidLimit || invalidTimes.length > 0} onClick={() => void save()}>{busy ? "Guardando…" : "Guardar cambios"}</button></div></div></fieldset>
    {error && <p role="alert" className="form-error">{error}{!loaded && databaseEnabled && <button className="secondary-button" onClick={() => setRetry(retry + 1)}>Reintentar</button>}</p>}{message && <p role="status" className="notification-message">{message}</p>}
    <details className="notify-diagnostics"><summary><span><strong>Estado y ayuda</strong><small>{health?.last_error ? "Hay un error de envío que revisar" : stale ? "No se detectó actividad reciente del servidor" : "Conexión, envíos y funcionamiento en iPhone"}</small></span><ChevronDown size={18} /></summary><div><p>Última ejecución: {formatTime(health?.last_run)}.</p><p>Última ejecución sin errores: {formatTime(health?.last_success)}.</p><p>Último envío aceptado: {formatTime(health?.last_accepted)}.</p>{health?.last_error && <p className="form-error">{health.last_error}</p>}{stale && <p>Revisa que la tarea automática esté programada en el servidor.</p>}<p>La frecuencia cambia cuántos avisos recibes, no su volumen. El iPhone controla el sonido y su visibilidad. Un envío aceptado no confirma que lo hayas leído.</p><button type="button" className="secondary-button" disabled={!databaseEnabled || dirty || busy} onClick={() => setRetry(retry + 1)}>Actualizar estado</button></div></details>
  </div>;
}
