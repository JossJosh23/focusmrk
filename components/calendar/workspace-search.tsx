"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { CalendarDays, CheckCircle2, Search } from "lucide-react";
import { type Publication } from "@/lib/calendar";
import { type Task } from "@/lib/tasks";

const limit = 5;

export function WorkspaceSearch({ posts, tasks, onOpenPost, onOpenTasks, onSearchCalendar }: {
  posts: Publication[];
  tasks: Task[];
  onOpenPost: (post: Publication) => void;
  onOpenTasks: () => void;
  onSearchCalendar: (query: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [shortcut, setShortcut] = useState("Ctrl K");
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  useEffect(() => {
    // Platform is only known in the browser; render "Ctrl K" on the server to avoid a hydration mismatch.
    const timer = window.setTimeout(() => { if (/mac|iphone|ipad/i.test(navigator.userAgent)) setShortcut("⌘K"); }, 0);
    const focus = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); input.current?.focus(); input.current?.select(); setOpen(true); } };
    const outside = (event: PointerEvent) => { if (root.current && !root.current.contains(event.target as Node)) setOpen(false); };
    window.addEventListener("keydown", focus); document.addEventListener("pointerdown", outside);
    return () => { clearTimeout(timer); window.removeEventListener("keydown", focus); document.removeEventListener("pointerdown", outside); };
  }, []);
  const term = query.trim().toLocaleLowerCase("es");
  const postMatches = term ? posts.filter(post => `${post.title} ${post.copy}`.toLocaleLowerCase("es").includes(term)).slice(0, limit) : [];
  const taskMatches = term ? tasks.filter(task => !task.done && task.title.toLocaleLowerCase("es").includes(term)).slice(0, limit) : [];
  function finish(action: () => void) { action(); setOpen(false); setQuery(""); input.current?.blur(); }
  function move(event: ReactKeyboardEvent, step: number) {
    const items = Array.from(root.current?.querySelectorAll<HTMLElement>(".workspace-search-results button") || []);
    if (!items.length) return;
    event.preventDefault();
    const index = items.indexOf(document.activeElement as HTMLElement);
    (items[index + step] || (step > 0 ? items[0] : input.current))?.focus();
  }
  return <div ref={root} className="workspace-search" role="search" onKeyDown={event => {
    if (event.key === "Escape") { setOpen(false); input.current?.blur(); }
    else if (event.key === "ArrowDown") move(event, 1);
    else if (event.key === "ArrowUp") move(event, -1);
  }}>
    <label className="workspace-search-field"><Search size="var(--icon-sm)" aria-hidden="true" />
      <input ref={input} type="search" aria-label="Buscar publicaciones y tareas" aria-controls={listId} placeholder="Buscar publicaciones, tareas…" value={query}
        onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); }}
        onKeyDown={event => { if (event.key === "Enter" && term) finish(() => onSearchCalendar(query.trim())); }} />
      <kbd aria-hidden="true">{shortcut}</kbd>
    </label>
    {open && term && <div id={listId} className="workspace-search-results">
      {postMatches.length > 0 && <section><h3>Publicaciones</h3>{postMatches.map(post => <button type="button" key={post.id} onClick={() => finish(() => onOpenPost(post))}><CalendarDays size="var(--icon-sm)" aria-hidden="true" /><span><strong>{post.title || "Sin título"}</strong><small>{post.date ? post.date.split("-").reverse().join("/") : "Idea"} · {post.status}</small></span></button>)}</section>}
      {taskMatches.length > 0 && <section><h3>Tareas</h3>{taskMatches.map(task => <button type="button" key={task.id} onClick={() => finish(onOpenTasks)}><CheckCircle2 size="var(--icon-sm)" aria-hidden="true" /><span><strong>{task.title}</strong><small>{task.date.split("-").reverse().join("/")} · Mi día</small></span></button>)}</section>}
      {!postMatches.length && !taskMatches.length && <p>No encontramos publicaciones ni tareas con “{query.trim()}”.</p>}
      <button type="button" className="workspace-search-all" onClick={() => finish(() => onSearchCalendar(query.trim()))}><Search size="var(--icon-sm)" aria-hidden="true" />Buscar “{query.trim()}” en el calendario</button>
    </div>}
  </div>;
}
