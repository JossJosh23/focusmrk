import Image from "next/image";
import { Clock, Megaphone, Play, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { dateKey, emptyPublication, isOverdue, monthDays, weekDays, parseDate, type Publication } from "@/lib/calendar";
import { resolveLinkPreview } from "@/lib/link-preview";
import { getMedia, type MediaAsset } from "@/lib/media";
import { FormatTag, NetworkIcons, PostActions, StatusBadge, postLabel } from "./content-card";
import { AssetPreview } from "./media-library";

const dayLabel = new Intl.DateTimeFormat("es-EC", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortDay = new Intl.DateTimeFormat("es-EC", { weekday: "short", day: "numeric", month: "short" });
const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
/** Shared with the ideas column, so ideas and posts drag between it and the days. */
export const POST_DRAG_TYPE = "application/x-focusmrk-post";
const hintKey = "focusmrk.calendar-drag-hint.v1";
const maxChips = 3;

type QuickAction = (post: Publication, action: Publication["status"] | "duplicate") => void;
type Shared = { today: string; ready: boolean; busy: boolean; onOpen: (post: Publication) => void; onQuickAction: QuickAction; onToggleImportant: (post: Publication) => void };
type Hover = { post: Publication; top: number; left: number; above: boolean } | null;

/** Static preview of the post's file for the hover tooltip: uploaded asset first, then an image/video link.
 * Embeds (YouTube, Drive…) are skipped; loading an iframe on every hover is too heavy. */
function TooltipMedia({ post }: { post: Publication }) {
  const [asset, setAsset] = useState<MediaAsset | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!post.mediaId) return;
    let active = true;
    void getMedia(post.mediaId).then(found => { if (active) { setAsset(found || null); setFailed(!found); } }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [post.mediaId]);
  const linked = post.mediaId ? null : resolveLinkPreview(post.imageUrl.trim() || post.referenceUrl.trim());
  if (failed || (!post.mediaId && (!linked || linked.kind === "embed"))) return null;
  const video = asset ? asset.type.startsWith("video/") : linked?.kind === "video";
  return <div className="cal-tooltip-media">
    {post.mediaId
      ? asset ? <AssetPreview asset={asset} thumbnail /> : <span>Cargando…</span>
      : linked?.kind === "video" ? <video src={linked.src} muted playsInline preload="metadata" onError={() => setFailed(true)} />
        : linked && <Image unoptimized src={linked.src} width={264} height={148} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />}
    {video && <span className="cal-tooltip-play" aria-hidden="true"><Play size="var(--cal-icon)" fill="currentColor" /></span>}
  </div>;
}

function capitalize(value: string) { return value.charAt(0).toLocaleUpperCase("es") + value.slice(1); }

/** "mié 21 oct" → "Mié 21 oct", without the trailing dots some locales add. */
function dayHeading(date: string) { return capitalize(shortDay.format(parseDate(date)).replace(/\./g, "").replace(",", "")); }

/** One-line month chip: status bar, networks, time and title. */
function PostChip({ post, today, ready, busy, onOpen, onQuickAction, onToggleImportant, dragging, onDragState, onHover }: Shared & { post: Publication;
  dragging: boolean; onDragState: (id: string) => void; onHover: (hover: Hover) => void;
}) {
  const overdue = isOverdue(post, today);
  // Anchored to the chip edge; the tooltip opens upward near the bottom so a late-loading preview never covers the chip.
  const hover = (target: HTMLElement) => { const rect = target.getBoundingClientRect(); const above = rect.bottom + 300 > window.innerHeight; onHover({ post, above, top: above ? rect.top - 6 : rect.bottom + 6, left: Math.min(rect.left, window.innerWidth - 280) }); };
  return <div className={`cal-chip-shell${dragging ? " is-dragging" : ""}${post.important ? " is-important" : ""}`} data-status={post.status} data-format={post.format} data-overdue={overdue || undefined}>
    <button type="button" className="cal-chip" draggable={ready} aria-label={postLabel(post, overdue)}
      onDragStart={(event: DragEvent) => { event.dataTransfer.setData(POST_DRAG_TYPE, post.id); event.dataTransfer.effectAllowed = "move"; onHover(null); onDragState(post.id); }}
      onDragEnd={() => onDragState("")} onClick={() => { onHover(null); onOpen(post); }}
      onMouseEnter={event => hover(event.currentTarget)} onMouseLeave={() => onHover(null)} onFocus={event => hover(event.currentTarget)} onBlur={() => onHover(null)}>
      <FormatTag format={post.format} />
      <NetworkIcons networks={post.networks} />
      {overdue && <Clock className="cal-chip-overdue" size="var(--cal-glyph)" aria-hidden="true" />}
      <time dateTime={`${post.date}T${post.time}`}>{post.time}</time>
      <span className="cal-chip-title">{post.title}</span>
      {post.paid && <Megaphone className="cal-chip-paid" size="var(--cal-glyph)" aria-hidden="true" />}
    </button>
    <PostActions post={post} disabled={!ready || busy} onQuickAction={onQuickAction} onToggleImportant={onToggleImportant} />
  </div>;
}

/** Fuller card for the week view: two-line title, format and status badge. */
function WeekCard({ post, today, ready, busy, onOpen, onQuickAction, onToggleImportant, dragging, onDragState }: Shared & { post: Publication; dragging: boolean; onDragState: (id: string) => void }) {
  const overdue = isOverdue(post, today);
  return <div className={`cal-card-shell${dragging ? " is-dragging" : ""}${post.important ? " is-important" : ""}`} data-status={post.status} data-format={post.format} data-overdue={overdue || undefined}>
    <button type="button" className="cal-card" draggable={ready} aria-label={postLabel(post, overdue)}
      onDragStart={(event: DragEvent) => { event.dataTransfer.setData(POST_DRAG_TYPE, post.id); event.dataTransfer.effectAllowed = "move"; onDragState(post.id); }}
      onDragEnd={() => onDragState("")} onClick={() => onOpen(post)}>
      <span className="cal-card-meta"><NetworkIcons networks={post.networks} /><time dateTime={`${post.date}T${post.time}`}>{post.time}</time>{post.paid && <span className="cal-paid-badge">Pauta</span>}</span>
      <strong>{post.title}</strong>
      <span className="cal-card-footer"><FormatTag format={post.format} label /><StatusBadge status={post.status} overdue={overdue} /></span>
    </button>
    <PostActions post={post} disabled={!ready || busy} onQuickAction={onQuickAction} onToggleImportant={onToggleImportant} />
  </div>;
}

/** Agenda and mobile-day row: time, network, title, format and status. */
function AgendaRow({ post, today, ready, busy, onOpen, onQuickAction, onToggleImportant }: Shared & { post: Publication }) {
  const overdue = isOverdue(post, today);
  return <li className={`cal-row-shell${post.important ? " is-important" : ""}`} data-status={post.status} data-format={post.format} data-overdue={overdue || undefined}>
    <button type="button" className="cal-row" aria-label={postLabel(post, overdue)} onClick={() => onOpen(post)}>
      <time dateTime={`${post.date}T${post.time}`}>{post.time}</time>
      <NetworkIcons networks={post.networks} max={1} size="var(--cal-icon)" />
      <strong>{post.title}</strong>
      <span className="cal-row-format"><FormatTag format={post.format} label />{post.paid ? " · Pauta" : ""}</span>
      <StatusBadge status={post.status} overdue={overdue} />
    </button>
    <PostActions post={post} disabled={!ready || busy} onQuickAction={onQuickAction} onToggleImportant={onToggleImportant} />
  </li>;
}

export function CalendarViews({ view, month, today, posts, ready, onOpen, onCreate, onMove, onToggleImportant, importantBusy, onQuickAction }: {
  view: "month" | "week" | "agenda"; month: Date | null; today: string;
  posts: Publication[]; ready: boolean;
  onOpen: (post: Publication) => void; onCreate: (post: Publication) => void;
  onQuickAction: QuickAction;
  onMove: (id: string, date: string) => void;
  onToggleImportant: (post: Publication) => void; importantBusy: boolean;
}) {
  const [dropDay, setDropDay] = useState("");
  const [draggingId, setDraggingId] = useState("");
  const [focusDay, setFocusDay] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [dayPopover, setDayPopover] = useState<{ key: string; top: number; left: number } | null>(null);
  const [hover, setHover] = useState<Hover>(null);
  const [hint, setHint] = useState(false);
  const [capacity, setCapacity] = useState(maxChips);
  const grid = useRef<HTMLDivElement>(null);
  const popover = useRef<HTMLDivElement>(null);
  const shared: Shared = { today, ready, busy: importantBusy, onOpen: post => { setDayPopover(null); onOpen(post); }, onQuickAction, onToggleImportant };
  const postsByDate = useMemo(() => {
    const grouped = new Map<string, Publication[]>();
    for (const post of posts) {
      const daily = grouped.get(post.date) || [];
      daily.push(post);
      grouped.set(post.date, daily);
    }
    return grouped;
  }, [posts]);
  const days = month ? (view === "week" ? weekDays(month) : monthDays(month)) : [];
  const keys = days.map(dateKey);
  const rovingDay = keys.includes(focusDay) ? focusDay : keys.includes(today) ? today : keys.find(key => month && parseDate(key).getMonth() === month.getMonth()) || keys[0];
  useEffect(() => {
    // The drag tip is shown once per browser; it is marked as seen as soon as it appears.
    const timer = window.setTimeout(() => { try { if (!localStorage.getItem(hintKey)) { setHint(true); localStorage.setItem(hintKey, "1"); } } catch { /* Without storage the tip is simply skipped. */ } }, 0);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    // Month rows stretch to the viewport, so the number of one-line chips per day follows the measured cell height.
    const element = grid.current;
    if (view !== "month" || !element) return;
    const measure = () => {
      const cell = element.querySelector<HTMLElement>(".cal-day");
      const heading = cell?.querySelector<HTMLElement>(".cal-day-heading");
      if (!cell || !heading) return;
      const style = getComputedStyle(cell);
      const chip = parseFloat(style.getPropertyValue("--cal-chip-height")) || 24;
      const gap = parseFloat(style.rowGap) || 0;
      const free = cell.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - heading.offsetHeight - gap;
      setCapacity(Math.max(1, Math.min(maxChips, Math.floor((free + gap) / (chip + gap)))));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [view, month]);
  useEffect(() => {
    if (!dayPopover) return;
    const outside = (event: PointerEvent) => { if (popover.current && !popover.current.contains(event.target as Node)) setDayPopover(null); };
    const close = () => setDayPopover(null);
    document.addEventListener("pointerdown", outside); window.addEventListener("resize", close);
    return () => { document.removeEventListener("pointerdown", outside); window.removeEventListener("resize", close); };
  }, [dayPopover]);

  function focusKey(key: string) { setFocusDay(key); grid.current?.querySelector<HTMLButtonElement>(`[data-day-button="${key}"]`)?.focus(); }
  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    const current = (event.target as HTMLElement).dataset.dayButton;
    if (!current) return;
    const index = keys.indexOf(current);
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    const target = step !== undefined ? index + step : event.key === "Home" ? index - index % 7 : event.key === "End" ? index - index % 7 + 6 : -1;
    if (target < 0 || target >= keys.length || (step === undefined && !["Home", "End"].includes(event.key))) return;
    event.preventDefault(); focusKey(keys[target]);
  }
  function openDay(key: string, cell: HTMLElement) {
    setFocusDay(key);
    if (window.matchMedia("(max-width: 767px)").matches) { setSelectedDay(current => current === key ? "" : key); return; }
    const rect = cell.getBoundingClientRect();
    setDayPopover({ key, top: Math.min(rect.top, window.innerHeight - 320), left: Math.min(rect.left, window.innerWidth - 300) });
  }
  function dragState(id: string) { setDraggingId(id); if (!id) setDropDay(""); }
  function closePopover() { const key = dayPopover?.key; setDayPopover(null); if (key) focusKey(key); }
  function dropHandlers(key: string, enabled: boolean) {
    return {
      onDragOver: (event: DragEvent) => { if (!ready || !enabled || !event.dataTransfer.types.includes(POST_DRAG_TYPE)) return; event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropDay(key); },
      onDragLeave: (event: DragEvent) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropDay(""); },
      onDrop: (event: DragEvent) => { event.preventDefault(); setDropDay(""); setDraggingId(""); setDayPopover(null); const id = event.dataTransfer.getData(POST_DRAG_TYPE); if (ready && enabled && id) onMove(id, key); },
    };
  }

  if (view === "agenda") {
    const dates = Array.from(postsByDate.keys()).sort();
    return <div id="calendar-results" className="cal-agenda">
      {dates.map(date => <section key={date} aria-labelledby={`agenda-${date}`}>
        <h3 id={`agenda-${date}`} className="cal-agenda-day"><span>{dayHeading(date)}{date === today && <b> · Hoy</b>}</span><button type="button" className="cal-icon-button" disabled={!ready} aria-label={`Nueva publicación para el ${dayLabel.format(parseDate(date))}`} onClick={() => onCreate(emptyPublication(date))}><Plus size="var(--cal-icon)" aria-hidden="true" /></button></h3>
        <ul>{(postsByDate.get(date) || []).map(post => <AgendaRow key={post.id} post={post} {...shared} />)}</ul>
      </section>)}
    </div>;
  }

  const popoverPosts = dayPopover ? postsByDate.get(dayPopover.key) || [] : [];
  const selectedPosts = postsByDate.get(selectedDay) || [];
  return <>
    {hint && <div className="cal-hint" role="status"><span>Consejo: arrastra una publicación a otro día para cambiar su fecha.</span><button type="button" onClick={() => setHint(false)}>Entendido</button></div>}
    <div id="calendar-results" ref={grid} className={`cal-grid ${view === "week" ? "is-week" : "is-month"}`} role="grid" aria-label={view === "week" ? "Calendario semanal" : "Calendario mensual"} onKeyDown={navigate}>
      <div className="cal-weekdays" role="row">{weekdays.map(day => <div key={day} role="columnheader">{day}</div>)}</div>
      {Array.from({ length: Math.ceil(days.length / 7) }, (_, row) => <div className="cal-week" role="row" key={row}>{days.slice(row * 7, row * 7 + 7).map(date => {
        const key = dateKey(date);
        const inMonth = view === "week" || (!!month && date.getMonth() === month.getMonth());
        const daily = postsByDate.get(key) || [];
        const shown = view === "week" ? daily : daily.slice(0, capacity);
        const label = `${capitalize(dayLabel.format(date))}${daily.length ? `, ${daily.length} ${daily.length === 1 ? "publicación" : "publicaciones"}` : ""}`;
        return <div key={key} role="gridcell" data-date={key} {...dropHandlers(key, inMonth)}
          className={`cal-day${inMonth ? "" : " is-outside"}${key === today ? " is-today" : ""}${date.getDay() % 6 === 0 ? " is-weekend" : ""}${dropDay === key ? " is-drop-target" : ""}${selectedDay === key ? " is-selected" : ""}`}>
          <div className="cal-day-heading">
            <button type="button" className="cal-day-number" data-day-button={key} tabIndex={key === rovingDay ? 0 : -1} aria-label={label} aria-current={key === today ? "date" : undefined} aria-haspopup="dialog" onClick={event => openDay(key, event.currentTarget.closest<HTMLElement>(".cal-day")!)}>{date.getDate()}</button>
            {view !== "week" && daily.length > capacity && <button type="button" className="cal-day-more" aria-haspopup="dialog" aria-label={`Ver ${daily.length - capacity} publicaciones más del ${dayLabel.format(date)}`} onClick={event => openDay(key, event.currentTarget.closest<HTMLElement>(".cal-day")!)}>+{daily.length - capacity} más</button>}
            {inMonth && <button type="button" className="cal-day-add" disabled={!ready} aria-label={`Nueva publicación para el ${dayLabel.format(date)}`} onClick={() => onCreate(emptyPublication(key))}><Plus size="var(--cal-icon)" aria-hidden="true" /></button>}
          </div>
          <div className="cal-day-posts">{shown.map(post => view === "week"
            ? <WeekCard key={post.id} post={post} {...shared} dragging={draggingId === post.id} onDragState={dragState} />
            : <PostChip key={post.id} post={post} {...shared} dragging={draggingId === post.id} onDragState={dragState} onHover={setHover} />)}</div>
          {daily.length > 0 && <span className="cal-day-dots" aria-hidden="true">{daily.slice(0, 4).map(post => <span key={post.id} className="cal-dot" data-status={post.status} data-overdue={isOverdue(post, today) || undefined} />)}</span>}
        </div>;
      })}</div>)}
    </div>
    {selectedDay && view === "month" && <section className="cal-mobile-day" aria-label={`Publicaciones del ${dayLabel.format(parseDate(selectedDay))}`}>
      <h3 className="cal-agenda-day"><span>{dayHeading(selectedDay)}{selectedDay === today && <b> · Hoy</b>}</span><button type="button" className="cal-icon-button" disabled={!ready} aria-label={`Nueva publicación para el ${dayLabel.format(parseDate(selectedDay))}`} onClick={() => onCreate(emptyPublication(selectedDay))}><Plus size="var(--cal-icon)" aria-hidden="true" /></button></h3>
      {selectedPosts.length ? <ul>{selectedPosts.map(post => <AgendaRow key={post.id} post={post} {...shared} />)}</ul> : <p>No hay publicaciones este día.</p>}
    </section>}
    {dayPopover && <div ref={popover} className={`cal-day-popover${draggingId ? " is-passive" : ""}`} role="dialog" aria-label={`Publicaciones del ${dayLabel.format(parseDate(dayPopover.key))}`} style={{ top: dayPopover.top, left: dayPopover.left }} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); closePopover(); } }}>
      <div className="cal-day-popover-heading"><strong>{dayHeading(dayPopover.key)}</strong><button type="button" className="cal-icon-button" autoFocus aria-label="Cerrar" onClick={closePopover}><X size="var(--cal-icon)" aria-hidden="true" /></button></div>
      {popoverPosts.length ? popoverPosts.map(post => <PostChip key={post.id} post={post} {...shared} dragging={draggingId === post.id} onDragState={dragState} onHover={() => undefined} />) : <p>No hay publicaciones este día.</p>}
      <button type="button" className="cal-popover-create" disabled={!ready} onClick={() => { setDayPopover(null); onCreate(emptyPublication(dayPopover.key)); }}><Plus size="var(--cal-icon)" aria-hidden="true" />Nueva publicación</button>
    </div>}
    {hover && !draggingId && <div className={`cal-tooltip${hover.above ? " is-above" : ""}`} role="tooltip" style={{ top: hover.top, left: hover.left }}>
      <TooltipMedia key={hover.post.id} post={hover.post} />
      <strong>{hover.post.title}</strong>
      <span><FormatTag format={hover.post.format} label /> · {hover.post.networks.join(", ")}</span>
      <span><StatusBadge status={hover.post.status} overdue={isOverdue(hover.post, today)} />{hover.post.paid ? " · Con pauta" : ""}</span>
    </div>}
  </>;
}
