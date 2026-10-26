"use client";

import { AlertTriangle, Check, CircleAlert } from "lucide-react";
import { type CheckItem, type FieldTarget } from "./model";

/** "Checklist de publicación": progress ring plus clickable checks that jump to the affected field. */
export function ReadinessChecklist({ items, onGo, id = "cmp-checklist-title", className = "" }: { items: CheckItem[]; onGo: (target: FieldTarget) => void; id?: string; className?: string }) {
  const done = items.filter(item => item.state === "ok").length;
  const circumference = 2 * Math.PI * 15;
  const blocking = items.some(item => item.state === "error");
  return <section className={`cmp-checklist ${className}`.trim()} aria-labelledby={id}>
    <div className="cmp-checklist-head">
      <svg className={`cmp-ring${blocking ? " is-blocked" : done === items.length ? " is-done" : ""}`} viewBox="0 0 36 36" role="img" aria-label={`${done} de ${items.length} comprobaciones completas`}>
        <circle cx="18" cy="18" r="15" className="cmp-ring-track" />
        <circle cx="18" cy="18" r="15" className="cmp-ring-value" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - done / Math.max(items.length, 1))} />
      </svg>
      <div><h3 id={id}>Checklist de publicación</h3><p>{done}/{items.length} {blocking ? "· hay errores que impiden guardar" : done === items.length ? "· todo listo" : "· revisa los avisos"}</p></div>
    </div>
    <ul>
      {items.map(item => <li key={item.id} className={`is-${item.state}`}>
        {item.target && item.state !== "ok"
          ? <button type="button" onClick={() => onGo(item.target!)}>{item.state === "error" ? <CircleAlert size="var(--icon-sm)" aria-hidden="true" /> : <AlertTriangle size="var(--icon-sm)" aria-hidden="true" />}<span>{item.label}</span><span className="cmp-sr">{item.state === "error" ? " (error, ir al campo)" : " (aviso, ir al campo)"}</span></button>
          : <span className="cmp-check-row"><Check size="var(--icon-sm)" aria-hidden="true" />{item.label}</span>}
      </li>)}
    </ul>
  </section>;
}
