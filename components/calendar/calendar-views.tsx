import { Plus } from "lucide-react";
import { useState } from "react";
import { dateKey, emptyPublication, monthDays, weekDays, parseDate, type Publication } from "@/lib/calendar";
import { ContentCard } from "./content-card";

const dayLabel = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export function CalendarViews({ view, month, today, posts, ready, onEdit, onMove }: {
  view: "month" | "week" | "agenda"; month: Date | null; today: string;
  posts: Publication[]; ready: boolean; onEdit: (post: Publication) => void;
  onMove: (id: string, date: string) => void;
}) {
  const [dropDay, setDropDay] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  if (view === "agenda") return <div className="agenda-list">
    {Array.from(new Set(posts.map((post) => post.date))).map((date) => <section className="agenda-day" key={date}>
      <div className="agenda-day-heading"><h3>{dayLabel.format(parseDate(date))}</h3><button disabled={!ready} className="icon-button" aria-label={`Nueva publicación para ${dayLabel.format(parseDate(date))}`} onClick={() => onEdit(emptyPublication(date))}><Plus size="var(--icon-sm)" /></button></div>
      {posts.filter((post) => post.date === date).map((post) => <ContentCard key={post.id} post={post} onEdit={onEdit} agenda />)}
    </section>)}
  </div>;

  return <div className={`calendar-scroll ${view === "week" ? "week-view" : ""}`} tabIndex={0} role="region" aria-label={view === "week" ? "Calendario semanal" : "Calendario mensual"}>
    <div className="calendar-grid">
      <div className="weekdays">{["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((day) => <div key={day}>{day}</div>)}</div>
      <div className="days-grid">{month && (view === "week" ? weekDays(month) : monthDays(month)).map((date) => {
        const key = dateKey(date);
        const inMonth = view === "week" || date.getMonth() === month.getMonth();
        const daily = posts.filter((post) => post.date === key);
        return <div key={key} data-date={key} onDragOver={(event) => {
          if (!ready || !inMonth || !event.dataTransfer.types.includes("application/x-focusmrk-post")) return;
          event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropDay(key);
        }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropDay(""); }} onDrop={(event) => {
          event.preventDefault(); setDropDay("");
          const id = event.dataTransfer.getData("application/x-focusmrk-post");
          if (ready && inMonth && posts.some((post) => post.id === id)) onMove(id, key);
        }} onDragEnd={() => setDropDay("")} className={`day-cell ${!inMonth ? "outside-month" : ""} ${key === today ? "is-today" : ""} ${dropDay === key ? "drop-target" : ""}`}>
          <div className="day-heading">
            <button disabled={!ready || !inMonth} className="day-number" aria-label={`Añadir o editar publicaciones del ${dayLabel.format(date)}`} aria-current={key === today ? "date" : undefined} onClick={() => onEdit(daily[0] || emptyPublication(key))}>{date.getDate()}</button>
            {key === today && <span className="today-label">HOY</span>}
            {inMonth && <button disabled={!ready} className="day-add" aria-label={`Nueva publicación para ${dayLabel.format(date)}`} onClick={() => onEdit(emptyPublication(key))}><Plus size="var(--icon-sm)" /></button>}
          </div>
          <div className="day-content">{(view === "week" || expanded.includes(key) ? daily : daily.slice(0, 2)).map((post) => <ContentCard key={post.id} post={post} onEdit={onEdit} draggable={ready} />)}</div>
          {view !== "week" && daily.length > 2 && <button className="day-more" type="button" aria-expanded={expanded.includes(key)} onClick={() => setExpanded(current => current.includes(key) ? current.filter(day => day !== key) : [...current, key])}>{expanded.includes(key) ? "Ver menos" : `+${daily.length - 2} más`}</button>}
          {inMonth && daily.length === 0 && <button className="empty-day" disabled={!ready} aria-label={`Crear publicación el ${dayLabel.format(date)}`} onClick={() => onEdit(emptyPublication(key))}><span>Añadir publicación</span></button>}
        </div>;
      })}</div>
    </div>
  </div>;
}
