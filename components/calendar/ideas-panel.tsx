import { useState, type DragEvent } from "react";
import { Lightbulb, Plus, X } from "lucide-react";
import { emptyPublication, type Publication } from "@/lib/calendar";
import { FormatTag, NetworkIcons } from "./content-card";
import { POST_DRAG_TYPE } from "./calendar-views";

/** Side column of undated publications (ideas). Drag an idea onto a day to schedule it; drop a post here to unschedule it. */
export function IdeasPanel({ ideas, ready, onOpen, onCreate, onMove, onClose }: {
  ideas: Publication[]; ready: boolean;
  onOpen: (post: Publication) => void; onCreate: (post: Publication) => void;
  onMove: (id: string, date: string) => void; onClose: () => void;
}) {
  const [dropping, setDropping] = useState(false);
  const [draggingId, setDraggingId] = useState("");
  return <aside className={`cal-ideas${dropping ? " is-drop-target" : ""}`} aria-labelledby="cal-ideas-title"
    onDragOver={(event: DragEvent) => { if (!ready || draggingId || !event.dataTransfer.types.includes(POST_DRAG_TYPE)) return; event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropping(true); }}
    onDragLeave={(event: DragEvent) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropping(false); }}
    onDrop={(event: DragEvent) => { event.preventDefault(); setDropping(false); const id = event.dataTransfer.getData(POST_DRAG_TYPE); if (ready && id && !draggingId) onMove(id, ""); }}>
    <div className="cal-ideas-heading">
      <h3 id="cal-ideas-title"><Lightbulb size="var(--icon-sm)" aria-hidden="true" />Ideas<b>{ideas.length}</b></h3>
      <button type="button" className="cal-icon-button" disabled={!ready} aria-label="Nueva idea" title="Nueva idea" onClick={() => onCreate(emptyPublication(""))}><Plus size="var(--cal-icon)" aria-hidden="true" /></button>
      <button type="button" className="cal-icon-button" aria-label="Ocultar ideas" title="Ocultar ideas" onClick={onClose}><X size="var(--cal-icon)" aria-hidden="true" /></button>
    </div>
    {ideas.length ? <ul className="cal-ideas-list">{ideas.map(idea => <li key={idea.id} className={`cal-idea-shell${draggingId === idea.id ? " is-dragging" : ""}`} data-status={idea.status} data-format={idea.format}>
      <button type="button" className="cal-idea" draggable={ready} aria-label={`${idea.title}, ${idea.format}, idea sin fecha, ${idea.status}`}
        onDragStart={(event: DragEvent) => { event.dataTransfer.setData(POST_DRAG_TYPE, idea.id); event.dataTransfer.effectAllowed = "move"; setDraggingId(idea.id); }}
        onDragEnd={() => setDraggingId("")} onClick={() => onOpen(idea)}>
        <strong>{idea.title}</strong>
        <span className="cal-idea-meta"><FormatTag format={idea.format} label /><NetworkIcons networks={idea.networks} /><span className="cal-dot" aria-hidden="true" />{idea.status}</span>
      </button>
    </li>)}</ul>
      : <p className="cal-ideas-empty">Guarda aquí lo que aún no tiene fecha. Crea una idea o arrastra una publicación para quitarle la fecha.</p>}
    {ideas.length > 0 && <p className="cal-ideas-hint">Arrastra una idea a un día para programarla.</p>}
  </aside>;
}
