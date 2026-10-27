"use client";

import { CalendarDays, Check, ChevronDown, Copy, Lightbulb } from "lucide-react";
import { FORMATS, NETWORKS, parseDate, type Publication } from "@/lib/calendar";
import { MiniCalendar, NetworkBadge, Popover, Segmented } from "./ui";

const SUGGESTED_TIMES = ["09:00", "12:00", "15:00", "18:00", "20:00"];
const FORMAT_LABELS: Record<Publication["format"], string> = { Post: "Post", Reel: "Reel", Carrusel: "Carrusel" };
const shortDate = new Intl.DateTimeFormat("es-EC", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export function scheduleLabel(post: Publication) {
  if (!post.date) return "Sin fecha (idea)";
  return `${shortDate.format(parseDate(post.date)).replace(/\./g, "").replace(",", "")} · ${post.time}`;
}

/** PROGRAMACIÓN card: date + time, format, networks and "duplicate on another date". */
export function ScheduleSection({ post, disabled, today, onChange, onDuplicate }: {
  post: Publication; disabled: boolean; today: string;
  onChange: (patch: Partial<Publication>) => void;
  onDuplicate?: (date: string) => void;
}) {
  return <section id="cmp-schedule" className="cmp-card" aria-labelledby="cmp-schedule-title">
    <h3 id="cmp-schedule-title" className="cmp-card-title">Programación</h3>
    <div className="cmp-schedule-row">
      <Popover label="Fecha y hora" className="cmp-date-popover" trigger={({ open, toggle, triggerRef, panelId }) =>
        <button ref={triggerRef} id="cmp-date" type="button" className="cmp-field-button" aria-expanded={open} aria-controls={panelId} aria-label={`Fecha y hora: ${scheduleLabel(post)}`} disabled={disabled} onClick={toggle}>
          <CalendarDays size="var(--icon-sm)" aria-hidden="true" /><span>{scheduleLabel(post)}</span><ChevronDown size="var(--icon-sm)" aria-hidden="true" />
        </button>}>
        {close => <div className="cmp-datetime">
          <MiniCalendar value={post.date} today={today} onSelect={date => onChange({ date })} />
          <div className="cmp-times">
            <span className="cmp-label">Horas sugeridas</span>
            <div className="cmp-chip-row">{SUGGESTED_TIMES.map(time => <button type="button" key={time} className="cmp-chip" aria-pressed={post.time === time} onClick={() => onChange({ time })}>{time}</button>)}</div>
            <label className="cmp-label">Otra hora<input className="cmp-input" type="time" required value={post.time} onChange={event => event.target.value && onChange({ time: event.target.value })} /></label>
            <button type="button" className="cmp-button is-primary" onClick={close}>Listo</button>
            {post.date && post.status !== "Publicado" && <button type="button" className="cmp-link" onClick={() => { onChange({ date: "" }); close(); }}><Lightbulb size="var(--icon-sm)" aria-hidden="true" />Quitar fecha (pasar a ideas)</button>}
          </div>
        </div>}
      </Popover>
      <Segmented<Publication["format"]> label="Formato" value={post.format} disabled={disabled} onChange={format => onChange({ format })} options={FORMATS.map(format => ({ value: format, label: FORMAT_LABELS[format] }))} />
    </div>
    <div className="cmp-networks-field">
      <span className="cmp-label" id="cmp-networks-label">Redes sociales <b aria-hidden="true">*</b></span>
      <div id="cmp-networks" className="cmp-chip-row" role="group" aria-labelledby="cmp-networks-label" aria-describedby={post.networks.length ? undefined : "cmp-networks-error"}>
        {NETWORKS.map(network => {
          const on = post.networks.includes(network);
          return <button type="button" key={network} className={`cmp-network-chip is-${network.toLowerCase()}`} aria-pressed={on} disabled={disabled}
            onClick={() => onChange({ networks: on ? post.networks.filter(item => item !== network) : [...post.networks, network] })}>
            <NetworkBadge network={network} muted={!on} />{network}
            <span className="cmp-network-check" aria-hidden="true">{on && <Check />}</span>
          </button>;
        })}
      </div>
      {!post.networks.length && <p id="cmp-networks-error" className="cmp-error" role="alert">Elige al menos una red social.</p>}
    </div>
    {onDuplicate && <Popover label="Duplicar en otra fecha" trigger={({ open, toggle, triggerRef, panelId }) =>
      <button ref={triggerRef} type="button" className="cmp-link" aria-expanded={open} aria-controls={panelId} disabled={disabled} onClick={toggle}><Copy size="var(--icon-sm)" aria-hidden="true" />Duplicar en otra fecha</button>}>
      {close => <div className="cmp-duplicate"><p className="cmp-help">Se crea una copia en borrador con esa fecha. Revisa y guarda.</p><MiniCalendar value={post.date} today={today} onSelect={date => { onDuplicate(date); close(); }} /></div>}
    </Popover>}
  </section>;
}
