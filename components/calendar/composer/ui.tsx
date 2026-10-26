"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject, type TextareaHTMLAttributes } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dateKey, parseDate } from "@/lib/calendar";

/** Anchored panel: closes on outside click or Esc (without closing the surrounding modal). */
export function Popover({ trigger, children, align = "start", label, className = "" }: {
  trigger: (props: { open: boolean; toggle: () => void; triggerRef: RefObject<HTMLButtonElement | null>; panelId: string }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  label: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();
  // Return focus to the trigger (found by aria-controls, so `close` can be handed out during render).
  const close = useCallback(() => { setOpen(false); document.querySelector<HTMLElement>(`[aria-controls="${panelId}"]`)?.focus(); }, [panelId]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (root.current && !root.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    // Focus the first control inside so keyboard users land in the panel.
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(".cmp-popover-panel input, .cmp-popover-panel button:not(:disabled)")?.focus());
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return <div ref={root} className={`cmp-popover ${className}`} onKeyDown={event => { if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); } }}>
    {trigger({ open, toggle: () => setOpen(value => !value), triggerRef, panelId })}
    {open && <div id={panelId} className={`cmp-popover-panel is-${align}`} role="dialog" aria-label={label}>{children(close)}</div>}
  </div>;
}

/** Segmented control built from pressed buttons; arrow keys move between options. */
export function Segmented<T extends string>({ options, value, onChange, label, disabled = false, size = "md" }: {
  options: { value: T; label: ReactNode; disabled?: boolean; title?: string }[];
  value: T; onChange: (value: T) => void; label: string; disabled?: boolean; size?: "sm" | "md";
}) {
  function keys(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    buttons[(index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length].focus();
  }
  return <div className={`cmp-segmented is-${size}`} role="group" aria-label={label} onKeyDown={keys}>
    {options.map(option => <button type="button" key={option.value} title={option.title} disabled={disabled || option.disabled} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}
  </div>;
}

export function Switch({ checked, onChange, label, description, disabled = false, size = "md", id }: {
  checked: boolean; onChange: (value: boolean) => void; label: ReactNode; description?: ReactNode; disabled?: boolean; size?: "md" | "lg"; id?: string;
}) {
  const descriptionId = useId();
  return <button type="button" id={id} role="switch" aria-checked={checked} aria-describedby={description ? descriptionId : undefined} disabled={disabled} className={`cmp-switch is-${size}`} onClick={() => onChange(!checked)}>
    <span className="cmp-switch-track" aria-hidden="true"><span className="cmp-switch-thumb" /></span>
    <span className="cmp-switch-text"><span>{label}</span>{description && <small id={descriptionId}>{description}</small>}</span>
  </button>;
}

/** Promise-based confirmation rendered as a nested modal dialog (its own focus trap). */
export function useConfirm() {
  const [request, setRequest] = useState<{ title: string; message: string; confirmLabel: string; danger?: boolean; resolve: (value: boolean) => void } | null>(null);
  const confirm = useCallback((options: { title: string; message: string; confirmLabel: string; danger?: boolean }) => new Promise<boolean>(resolve => setRequest({ ...options, resolve })), []);
  const element = request ? <ConfirmDialog {...request} onResult={value => { request.resolve(value); setRequest(null); }} /> : null;
  return [confirm, element] as const;
}

function ConfirmDialog({ title, message, confirmLabel, danger, onResult }: { title: string; message: string; confirmLabel: string; danger?: boolean; onResult: (value: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => { dialog.current?.showModal(); dialog.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus(); }, []);
  return <dialog ref={dialog} className="cmp-confirm" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); event.stopPropagation(); onResult(false); }}>
    <h2 id={titleId}>{title}</h2>
    <p>{message}</p>
    <div className="cmp-confirm-actions">
      <button type="button" className="cmp-button is-ghost" onClick={() => onResult(false)}>Cancelar</button>
      <button type="button" data-autofocus className={`cmp-button ${danger ? "is-danger" : "is-primary"}`} onClick={() => onResult(true)}>{confirmLabel}</button>
    </div>
  </dialog>;
}

const monthName = new Intl.DateTimeFormat("es-EC", { month: "long", year: "numeric" });
const longDay = new Intl.DateTimeFormat("es-EC", { weekday: "long", day: "numeric", month: "long" });

/** Month grid with roving focus (arrows move a day / a week). */
export function MiniCalendar({ value, onSelect, today }: { value: string; onSelect: (date: string) => void; today: string }) {
  const [cursor, setCursor] = useState(() => { const d = parseDate(value || today); return new Date(d.getFullYear(), d.getMonth(), 1, 12); });
  const [focusKey, setFocusKey] = useState(value || today);
  const grid = useRef<HTMLDivElement>(null);
  const offset = (cursor.getDay() + 6) % 7;
  const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: 42 }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i - offset + 1, 12));
  const keys = days.map(dateKey);
  const roving = keys.includes(focusKey) ? focusKey : keys[offset];
  function move(event: KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const next = parseDate(focusKey); next.setDate(next.getDate() + step);
    const key = dateKey(next);
    if (next.getMonth() !== cursor.getMonth()) setCursor(new Date(next.getFullYear(), next.getMonth(), 1, 12));
    setFocusKey(key);
    requestAnimationFrame(() => grid.current?.querySelector<HTMLButtonElement>(`[data-day="${key}"]`)?.focus());
  }
  const shift = (months: number) => setCursor(current => new Date(current.getFullYear(), current.getMonth() + months, 1, 12));
  return <div className="cmp-calendar">
    <div className="cmp-calendar-head">
      <button type="button" className="cmp-icon-button" aria-label="Mes anterior" onClick={() => shift(-1)}><ChevronLeft size="var(--icon-sm)" aria-hidden="true" /></button>
      <strong aria-live="polite">{monthName.format(cursor).replace(/^./, c => c.toLocaleUpperCase("es"))}</strong>
      <button type="button" className="cmp-icon-button" aria-label="Mes siguiente" onClick={() => shift(1)}><ChevronRight size="var(--icon-sm)" aria-hidden="true" /></button>
    </div>
    <div className="cmp-calendar-grid" role="grid" ref={grid} onKeyDown={move}>
      {["L", "M", "X", "J", "V", "S", "D"].map(day => <span key={day} className="cmp-calendar-weekday" aria-hidden="true">{day}</span>)}
      {days.slice(0, Math.ceil((offset + count) / 7) * 7).map((day, i) => {
        const key = keys[i];
        return <button type="button" key={key} data-day={key} tabIndex={key === roving ? 0 : -1}
          className={`${day.getMonth() !== cursor.getMonth() ? "is-outside" : ""}${key === today ? " is-today" : ""}`}
          aria-pressed={key === value} aria-label={longDay.format(day)} onClick={() => onSelect(key)}>{day.getDate()}</button>;
      })}
    </div>
  </div>;
}

/** Textarea that grows with its content between min and max rows (scroll only beyond max). */
export function AutoTextarea({ minRows, maxRows, value, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows: number; maxRows: number; value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const style = getComputedStyle(element);
    const line = parseFloat(style.lineHeight) || 22;
    const chrome = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    element.style.height = "auto";
    const height = Math.min(Math.max(element.scrollHeight, line * minRows + chrome), line * maxRows + chrome);
    element.style.height = `${height}px`;
    element.style.overflowY = element.scrollHeight > height + 1 ? "auto" : "hidden";
  }, [value, minRows, maxRows]);
  return <textarea ref={ref} rows={minRows} value={value} {...props} />;
}
