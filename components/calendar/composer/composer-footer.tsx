"use client";

import { ChevronDown, Copy, Link2, MoreHorizontal, Trash2 } from "lucide-react";
import { type Publication } from "@/lib/calendar";
import { Popover } from "./ui";

export type PrimaryAction = "save" | "publish" | "schedule";

/** Fixed footer: overflow menu, cancel, save draft and the split primary action. */
export function ComposerFooter({ draft, busy, readOnly, blocking, message, onDuplicate, onCopyLink, onDelete, onCancel, onSaveDraft, onPrimary }: {
  draft: Publication; busy: boolean; readOnly: boolean; blocking: string | null; message: { text: string; tone: "error" | "info" } | null;
  onDuplicate: () => void; onCopyLink: () => void; onDelete: () => void; onCancel: () => void;
  onSaveDraft: () => void; onPrimary: (action: PrimaryAction) => void;
}) {
  const published = draft.status === "Publicado";
  const mainAction: PrimaryAction = published ? "save" : "schedule";
  const mainLabel = busy ? "Guardando…" : readOnly ? "Solo lectura" : published ? "Guardar cambios" : "Programar";
  const blocked = !!blocking || readOnly;
  return <footer className="cmp-footer">
    <div className="cmp-footer-start">
      {draft.id && !readOnly && <Popover label="Más acciones" trigger={({ open, toggle, triggerRef, panelId }) =>
        <button ref={triggerRef} type="button" className="cmp-icon-button" aria-label="Más acciones" title="Más acciones" aria-expanded={open} aria-controls={panelId} disabled={busy} onClick={toggle}><MoreHorizontal size="var(--icon-md)" aria-hidden="true" /></button>}>
        {close => <ul className="cmp-menu is-up">
          <li><button type="button" onClick={() => { close(); onDuplicate(); }}><Copy size="var(--icon-sm)" aria-hidden="true" />Duplicar</button></li>
          <li><button type="button" onClick={() => { close(); onCopyLink(); }}><Link2 size="var(--icon-sm)" aria-hidden="true" />Copiar enlace</button></li>
          <li><button type="button" className="is-danger" onClick={() => { close(); onDelete(); }}><Trash2 size="var(--icon-sm)" aria-hidden="true" />Eliminar</button></li>
        </ul>}
      </Popover>}
      {message && <p className={message.tone === "error" ? "cmp-error" : "cmp-help"} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p>}
    </div>
    <div className="cmp-footer-end">
      <button type="button" className="cmp-button is-ghost" disabled={busy} onClick={onCancel}>Cancelar</button>
      {draft.status === "Borrador" && !readOnly && <button type="button" className="cmp-button is-secondary" disabled={busy} aria-disabled={blocked || undefined} title={blocking || undefined} onClick={() => { if (!blocked) onSaveDraft(); }}>Guardar borrador</button>}
      <div className="cmp-split">
        <button type="button" className="cmp-button is-primary" disabled={busy} aria-disabled={blocked || undefined} aria-describedby={blocking ? "cmp-blocking" : undefined} title={blocking ? `No se puede guardar: ${blocking}` : `${mainLabel} (Ctrl+Enter)`} onClick={() => { if (!blocked) onPrimary(mainAction); }}>{mainLabel}</button>
        {!readOnly && <Popover align="end" label="Otras formas de guardar" trigger={({ open, toggle, triggerRef, panelId }) =>
          <button ref={triggerRef} type="button" className="cmp-button is-primary is-split-toggle" aria-label="Otras formas de guardar" aria-expanded={open} aria-controls={panelId} disabled={busy} onClick={toggle}><ChevronDown size="var(--icon-sm)" aria-hidden="true" /></button>}>
          {close => <ul className="cmp-menu is-up">
            <li><button type="button" aria-disabled={blocked || undefined} onClick={() => { if (blocked) return; close(); onPrimary("save"); }}>Guardar cambios<small>Mantiene el estado «{draft.status}»</small></button></li>
            <li><button type="button" aria-disabled={blocked || undefined} onClick={() => { if (blocked) return; close(); onPrimary("publish"); }}>Marcar como publicada<small>Úsalo cuando ya la publicaste en la red</small></button></li>
            <li><button type="button" aria-disabled={blocked || undefined} onClick={() => { if (blocked) return; close(); onPrimary("schedule"); }}>Programar<small>Pasa a «Aprobado» con la fecha elegida</small></button></li>
          </ul>}
        </Popover>}
      </div>
      {blocking && <span id="cmp-blocking" className="cmp-sr">No se puede guardar: {blocking}</span>}
    </div>
  </footer>;
}
