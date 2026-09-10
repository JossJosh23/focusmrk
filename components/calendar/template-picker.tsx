"use client";

import { useState } from "react";
import { templateCopy, type ContentTemplate } from "@/lib/templates";

export function TemplatePicker({ templates, copy, footer, onApply, onChange, disabled = false }: {
  templates: ContentTemplate[]; copy: string; footer: string;
  onApply: (copy: string, footer: string) => void;
  onChange: (templates: ContentTemplate[]) => Promise<boolean>;
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const template = templates.find((item) => item.id === selected);
  async function save(remove = false) {
    if (!remove && !name.trim()) { setMessage("Escribe un nombre para la plantilla."); return; }
    setBusy(true);
    try {
      const item = { id: selected || crypto.randomUUID(), name: name.trim(), hashtags: hashtags.trim(), copy, footer };
      const next = remove ? templates.filter((t) => t.id !== selected) : template ? templates.map((t) => t.id === selected ? item : t) : [...templates, item];
      if (await onChange(next)) {
        setSelected(remove ? "" : item.id);
        if (remove) { setName(""); setHashtags(""); }
        setMessage(remove ? "Plantilla eliminada." : "Plantilla guardada con el copy y los contactos actuales.");
      } else setMessage("No se pudo guardar la plantilla. Revisa el aviso del calendario.");
    } catch { setMessage("No se pudo guardar la plantilla."); }
    finally { setBusy(false); }
  }
  return <details className="template-panel">
    <summary>Plantillas de contenido <span>{templates.length}</span></summary>
    <fieldset disabled={disabled || busy}>
      <label>Plantilla<select value={selected} onChange={(e) => {
        const t = templates.find((item) => item.id === e.target.value);
        setSelected(e.target.value); setName(t?.name || ""); setHashtags(t?.hashtags || ""); setMessage("");
      }}><option value="">Crear una plantilla</option>{templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      {template && <button className="secondary-button" type="button" onClick={() => {
        if ((copy || footer) && !window.confirm("¿Reemplazar el copy y los contactos actuales por esta plantilla?")) return;
        onApply(templateCopy(template), template.footer); setMessage("Plantilla aplicada. Puedes editar el texto antes de guardar la publicación.");
      }}>Aplicar al post</button>}
      <label>Nombre de la plantilla<input maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Promoción de la semana" /></label>
      <label>Hashtags reutilizables<textarea rows={2} value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#MiMarca #Novedades" /></label>
      <small>Se guardarán el copy y los contactos actuales del formulario. Los hashtags se añaden al aplicar la plantilla; evita repetirlos en el copy.</small>
      <div className="template-actions"><button type="button" className="secondary-button" onClick={() => void save()}>{busy ? "Guardando…" : template ? "Actualizar plantilla" : "Guardar como plantilla"}</button>{template && <button type="button" className="danger-button" onClick={() => { if (window.confirm("¿Eliminar esta plantilla? Los posts existentes se conservarán.")) void save(true); }}>Eliminar plantilla</button>}</div>
      {message && <p role="status">{message}</p>}
    </fieldset>
  </details>;
}
