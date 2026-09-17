"use client";

import { useState } from "react";
import type { Publication } from "@/lib/calendar";
import type { ContentTemplate } from "@/lib/templates";
import { allMedia, putMedia } from "@/lib/media";
import { createBackup, downloadFile, mergeBackup, parseBackup, type Backup } from "@/lib/backup";


export function PersonalTools({ posts, templates, disabled, onImport }: {
  posts: Publication[]; templates: ContentTemplate[]; disabled: boolean;
  onImport: (posts: Publication[], templates: ContentTemplate[], expectedPosts: Publication[], expectedTemplates: ContentTemplate[]) => Promise<boolean>;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<Backup | null>(null);
  async function run(work: () => Promise<void>) {
    if (busy || disabled) return; setBusy(true); setMessage("");
    try { await work(); } catch (e) { setMessage(e instanceof Error ? e.message : "No se pudo completar la operación."); } finally { setBusy(false); }
  }
  return <details className="personal-tools"><summary>Respaldo de datos</summary>
    <fieldset disabled={busy || disabled} className="personal-actions"><button type="button" className="secondary-button" onClick={() => void run(async () => {
      const backup = await createBackup(posts, templates, await allMedia());
      downloadFile(new Blob([JSON.stringify(backup)], { type: "application/json" }), `focusmrk-respaldo-${new Date().toISOString().slice(0, 10)}.json`); setMessage("Respaldo generado con publicaciones, plantillas y archivos.");
    })}>Descargar respaldo completo</button>
    <label className="backup-upload">Importar respaldo<input type="file" accept=".json,application/json" onChange={(e) => {
      const file = e.target.files?.[0]; e.target.value = ""; setPending(null); if (!file) return;
      void run(async () => { if (file.size > 250 * 1024 * 1024) throw new Error("El respaldo supera el máximo de 250 MB."); setPending(parseBackup(await file.text())); });
    }} /></label>
    </fieldset>
    <small>El respaldo incluye todos los meses y la biblioteca completa.</small>
    {pending && <div className="import-preview"><p>Se añadirán {pending.posts.length} publicaciones, {pending.templates.length} plantillas y {pending.assets.length} archivos como copias nuevas. No se reemplaza nada; importar el mismo respaldo otra vez genera duplicados.</p><button disabled={busy || disabled} className="secondary-button" type="button" onClick={() => void run(async () => {
      const merged = mergeBackup(pending, posts, templates);
      await putMedia(merged.assets);
      if (!await onImport(merged.posts, merged.templates, posts, templates)) throw new Error("No se pudieron importar las publicaciones. Los archivos copiados permanecen en la biblioteca; tus publicaciones anteriores se conservan.");
      setPending(null); setMessage("Respaldo importado. Tus datos anteriores se conservaron.");
    })}>Confirmar importación</button><button disabled={busy} className="secondary-button" type="button" onClick={() => setPending(null)}>Cancelar</button></div>}
    {busy && <p role="status">Procesando archivos…</p>}{message && <p role="status">{message}</p>}
  </details>;
}
