"use client";

import { useState } from "react";
import { Check, ChevronDown, PanelLeftOpen, Search, Star, X } from "lucide-react";
import { STATUSES, type Publication } from "@/lib/calendar";
import { DayList } from "./day-rail";
import { Popover } from "./ui";

export type SaveState = { kind: "new" | "dirty" | "saving" | "saved" | "error"; label: string };

/** Fixed header: brand chip, inline title, importance, status pill, save state and close. */
export function ComposerHeader({ draft, companies, companyError, disabled, readOnly, saveState, dayPosts, railOpen, onRailOpen, onSelectDay, onAddDay, onChange, onClose }: {
  draft: Publication; companies: string[]; companyError: string; disabled: boolean; readOnly: boolean; saveState: SaveState;
  dayPosts: Publication[]; railOpen: boolean; onRailOpen: () => void;
  onSelectDay: (post: Publication) => void; onAddDay: () => void;
  onChange: (patch: Partial<Publication>) => void; onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const locked = disabled || readOnly;
  const matches = companies.filter(company => company.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es")));
  const count = dayPosts.length + (draft.id ? 0 : 1);
  return <header className="cmp-header">
    <div className="cmp-header-main">
      <Popover label="Cambiar empresa" trigger={({ open, toggle, triggerRef, panelId }) =>
        <button ref={triggerRef} type="button" className="cmp-brand-chip" aria-expanded={open} aria-controls={panelId} aria-label={`Empresa: ${draft.brand || "sin empresa"}. Cambiar empresa`} disabled={locked} onClick={() => { setQuery(""); toggle(); }}>
          <span className="cmp-brand-avatar" aria-hidden="true">{(draft.brand.trim()[0] || "?").toLocaleUpperCase("es")}</span>
          <span className="cmp-brand-name">{draft.brand || "Elige empresa"}</span>
          <ChevronDown size="var(--icon-sm)" aria-hidden="true" />
        </button>}>
        {close => <div className="cmp-company-picker">
          <label className="cmp-search"><Search size="var(--icon-sm)" aria-hidden="true" /><input type="search" aria-label="Buscar empresa" placeholder="Buscar empresa…" value={query} onChange={event => setQuery(event.target.value)} /></label>
          <ul>{matches.map(company => <li key={company}><button type="button" aria-pressed={company === draft.brand} onClick={() => { onChange({ brand: company }); close(); }}><span className="cmp-brand-avatar is-small" aria-hidden="true">{company[0].toLocaleUpperCase("es")}</span>{company}{company === draft.brand && <Check size="var(--icon-sm)" aria-hidden="true" />}</button></li>)}</ul>
          {!matches.length && <p className="cmp-empty-note">No hay empresas con ese nombre.</p>}
          {companyError && <p className="cmp-error" role="alert">{companyError}</p>}
          <p className="cmp-help">La publicación se guardará en esta empresa.</p>
        </div>}
      </Popover>
      <span className="cmp-header-slash" aria-hidden="true">/</span>
      <input id="cmp-title" className="cmp-title-input" aria-label="Tema o título" required maxLength={160} placeholder="Sin título" disabled={locked} value={draft.title} onChange={event => onChange({ title: event.target.value })} />
      <button type="button" className={`cmp-icon-button cmp-star${draft.important ? " is-on" : ""}`} aria-pressed={!!draft.important} disabled={locked}
        aria-label={draft.important ? "Quitar marca de importante" : "Marcar como importante"} title={draft.important ? "Importante" : "Marcar como importante"} onClick={() => onChange({ important: !draft.important })}>
        <Star size="var(--icon-md)" fill={draft.important ? "currentColor" : "none"} aria-hidden="true" />
      </button>
      <Popover className="cmp-day-dropdown" label="Publicaciones del día" trigger={({ open, toggle, triggerRef, panelId }) =>
        <button ref={triggerRef} type="button" className="cmp-day-trigger" aria-expanded={open} aria-controls={panelId} onClick={toggle}>{count} {!draft.date ? (count === 1 ? "idea" : "ideas") : `${count === 1 ? "publicación" : "publicaciones"} este día`}<ChevronDown size="var(--icon-sm)" aria-hidden="true" /></button>}>
        {close => <DayList posts={dayPosts} draft={draft} disabled={disabled} readOnly={readOnly} onSelect={post => { close(); onSelectDay(post); }} onAdd={() => { close(); onAddDay(); }} />}
      </Popover>
      {!railOpen && <button type="button" className="cmp-icon-button cmp-rail-open" aria-label="Mostrar publicaciones del día" title="Publicaciones del día" onClick={onRailOpen}><PanelLeftOpen size="var(--icon-sm)" aria-hidden="true" /></button>}
    </div>
    <div className="cmp-header-side">
      <Popover align="end" label="Estado de la publicación" trigger={({ open, toggle, triggerRef, panelId }) =>
        <button ref={triggerRef} type="button" className="cmp-status-pill" data-status={draft.status} aria-expanded={open} aria-controls={panelId} aria-label={`Estado: ${draft.status}. Cambiar estado`} disabled={locked} onClick={toggle}>
          <span className="cal-dot" aria-hidden="true" />{draft.status}<ChevronDown size="var(--icon-sm)" aria-hidden="true" />
        </button>}>
        {close => <ul className="cmp-menu">{STATUSES.map(status => <li key={status}><button type="button" data-status={status} aria-pressed={draft.status === status} onClick={() => { onChange({ status }); close(); }}><span className="cal-dot" aria-hidden="true" />{status}{draft.status === status && <Check size="var(--icon-sm)" aria-hidden="true" />}</button></li>)}</ul>}
      </Popover>
      <span className={`cmp-save-state is-${saveState.kind}`} role="status" aria-live="polite">{saveState.label}</span>
      <button type="button" className="cmp-icon-button" aria-label="Cerrar editor" title="Cerrar (Esc)" disabled={disabled} onClick={onClose}><X size="var(--icon-md)" aria-hidden="true" /></button>
    </div>
  </header>;
}
