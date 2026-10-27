"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, CheckCircle2, ClipboardPaste, Copy, Download, FileSpreadsheet, Sparkles, Upload, X } from "lucide-react";
import type { Publication } from "@/lib/calendar";
import { IMPORT_COLUMNS, decodeCsv, parseCsv, parseXlsx, readImportRows, type Cell, type ImportResult } from "@/lib/calendar-import";
import { calendarTemplate } from "@/lib/calendar-template";
import { downloadFile } from "@/lib/backup";
import { FormatTag, NetworkIcons } from "./content-card";
import { brandContext, copyPending } from "./composer/copy-prompt-button";
import { calendarPrompt, pastedCsv } from "./calendar-prompt";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const shortDate = new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "short", year: "numeric" });

/** Side panel: prepare the calendar with an AI (copied instructions) or the Excel template, then upload a file or paste
 *  the AI's CSV, review every row and import the valid ones. */
export function ImportCalendar({ company, companies, posts, server, ready, onClose, onImport }: {
  company: string; companies: string[] | null; posts: Publication[]; server: boolean; ready: boolean;
  onClose: () => void; onImport: (posts: Publication[]) => Promise<boolean>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [file, setFile] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [withDuplicates, setWithDuplicates] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [pasted, setPasted] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);
  useEffect(() => { if (!promptCopied) return; const timer = window.setTimeout(() => setPromptCopied(false), 2500); return () => window.clearTimeout(timer); }, [promptCopied]);
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  const defaultCompany = company || companies?.[0] || "";

  async function review(source: string, load: () => Promise<Cell[][]>) {
    setBusy(true); setMessage(""); setResult(null); setFile(source);
    try { setResult(readImportRows(await load(), { company: defaultCompany, companies, existing: posts, newId: () => crypto.randomUUID() })); }
    catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo leer el archivo."); }
    finally { setBusy(false); }
  }
  function read(picked: File) {
    void review(picked.name, async () => {
      if (picked.size > MAX_FILE_BYTES) throw new Error("El archivo supera los 5 MB.");
      const bytes = await picked.arrayBuffer();
      return /\.csv$/i.test(picked.name) || picked.type === "text/csv" ? parseCsv(decodeCsv(bytes)) : parseXlsx(bytes);
    });
  }
  async function copyInstructions() {
    try { await copyPending(brandContext(defaultCompany, server).then(brand => calendarPrompt(defaultCompany, brand))); setPromptCopied(true); }
    catch { setMessage("No se pudieron copiar las instrucciones."); }
  }
  async function template() {
    try { downloadFile(await calendarTemplate(), "plantilla-calendario-kromaiso.xlsx"); }
    catch { setMessage("No se pudo generar la plantilla."); }
  }

  const rows = result?.rows || [];
  const invalid = rows.filter(row => !row.post);
  const duplicates = rows.filter(row => row.post && row.duplicate);
  const importable = rows.filter(row => row.post && (withDuplicates || !row.duplicate)).map(row => row.post!);
  async function confirm() {
    if (!importable.length || busy) return;
    setBusy(true); setMessage("");
    try { if (await onImport(importable)) onClose(); else setMessage("No se pudo importar. Revisa el aviso del calendario; nada se guardó."); }
    finally { setBusy(false); }
  }

  return <dialog ref={dialog} className="cal-drawer cal-import" aria-labelledby="cal-import-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="cal-drawer-inner">
      <header className="cal-drawer-header">
        <h2 id="cal-import-title"><FileSpreadsheet size="var(--icon-md)" aria-hidden="true" />Importar calendario</h2>
        <button type="button" className="cal-icon-button" aria-label="Cerrar" disabled={busy} onClick={onClose}><X size="var(--icon-md)" aria-hidden="true" /></button>
      </header>
      <div className="cal-drawer-body">
        <section className="cal-import-step" aria-labelledby="cal-import-step-1">
          <h3 id="cal-import-step-1"><span>1</span>Prepara tu calendario</h3>
          <div className="cal-import-options">
            <div className="cal-import-option">
              <strong><Sparkles size="var(--icon-sm)" aria-hidden="true" />Con una IA</strong>
              <p>Copia las instrucciones y pégalas en ChatGPT, Claude o Gemini. Ya llevan el formato exacto, la guía de marca de Empresa y las reglas. Al final escribe qué necesitas, por ejemplo «12 publicaciones para noviembre».</p>
              <button type="button" className="secondary-button" onClick={() => void copyInstructions()}>{promptCopied ? <Check size="var(--icon-sm)" aria-hidden="true" /> : <Copy size="var(--icon-sm)" aria-hidden="true" />}{promptCopied ? "Instrucciones copiadas" : "Copiar instrucciones para IA"}</button>
            </div>
            <div className="cal-import-option">
              <strong><FileSpreadsheet size="var(--icon-sm)" aria-hidden="true" />En Excel</strong>
              <p>Una publicación por fila, con listas desplegables en formato, redes, estado y pauta. Las instrucciones están en la segunda hoja.</p>
              <button type="button" className="secondary-button" onClick={() => void template()}><Download size="var(--icon-sm)" aria-hidden="true" />Descargar plantilla Excel</button>
            </div>
          </div>
        </section>
        <section className="cal-import-step" aria-labelledby="cal-import-step-2">
          <h3 id="cal-import-step-2"><span>2</span>Pega la respuesta o sube el archivo</h3>
          <label className="cal-import-paste"><span className="sr-only">Respuesta de la IA en CSV</span>
            <textarea rows={5} value={pasted} disabled={busy} placeholder="Pega aquí la respuesta de la IA (el bloque CSV). Si copias todo el mensaje, se toma solo el bloque CSV." onChange={event => setPasted(event.target.value)} /></label>
          <div className="cal-import-actions">
            <button type="button" className="secondary-button" disabled={busy || !pasted.trim()} onClick={() => void review("Texto pegado", async () => parseCsv(pastedCsv(pasted)))}><ClipboardPaste size="var(--icon-sm)" aria-hidden="true" />Revisar texto pegado</button>
            <label className="secondary-button cal-import-file"><Upload size="var(--icon-sm)" aria-hidden="true" />Subir .xlsx o .csv
              <input type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy} onChange={event => { const picked = event.target.files?.[0]; event.target.value = ""; if (picked) read(picked); }} /></label>
          </div>
          {file && <small className="cal-import-source">{busy && !result ? "Leyendo…" : `Revisando: ${file}`}</small>}
        </section>
        <details className="cal-import-format">
          <summary>Ver el formato requerido</summary>
          <p className="cal-import-note">Primera fila con estos nombres de columna; solo «Título» es obligatoria. En CSV separa con punto y coma (;) o coma.</p>
          <table><thead><tr><th scope="col">Columna</th><th scope="col">Qué escribir</th></tr></thead>
            <tbody>{IMPORT_COLUMNS.map(column => <tr key={column.key}><th scope="row">{column.header}{"required" in column && " *"}</th><td>{column.hint}</td></tr>)}</tbody></table>
        </details>
        <p className="cal-import-note">{defaultCompany ? <>Las filas sin «Empresa» se guardan en <b>{defaultCompany}</b>.</> : "Elige una empresa en el menú o rellena la columna «Empresa»."} Las imágenes y videos no se importan; añádelos después en cada publicación.</p>
        {message && <p className="cal-import-alert" role="alert"><AlertCircle size="var(--icon-sm)" aria-hidden="true" />{message}</p>}
        {result?.missingColumns.length ? <p className="cal-import-alert" role="alert"><AlertCircle size="var(--icon-sm)" aria-hidden="true" />Falta la columna {result.missingColumns.map(name => `«${name}»`).join(", ")}. Usa la plantilla sin cambiar la primera fila.</p> : null}
        {result && !result.missingColumns.length && <section className="cal-import-review" aria-label="Revisión de filas">
          <div className="cal-import-summary" role="status">
            <span className="is-ok"><CheckCircle2 size="var(--icon-sm)" aria-hidden="true" />{rows.length - invalid.length - duplicates.length} listas</span>
            {invalid.length > 0 && <span className="is-error"><AlertCircle size="var(--icon-sm)" aria-hidden="true" />{invalid.length} con errores</span>}
            {duplicates.length > 0 && <span className="is-warning"><Copy size="var(--icon-sm)" aria-hidden="true" />{duplicates.length} ya existen</span>}
          </div>
          {!rows.length && <p className="cal-import-note">El archivo no tiene filas con publicaciones.</p>}
          {invalid.length > 0 && <p className="cal-import-note">Las filas con errores no se importan. Corrígelas en el archivo y vuelve a subirlo, o importa solo las que están listas.</p>}
          {duplicates.length > 0 && <label className="cal-import-toggle"><input type="checkbox" checked={withDuplicates} onChange={event => setWithDuplicates(event.target.checked)} />Importar también las {duplicates.length} que ya existen (misma empresa, fecha, hora y título)</label>}
          <ul className="cal-import-rows">{[...invalid, ...rows.filter(row => row.post)].map(row => <li key={row.line} className={row.post ? row.duplicate ? "is-warning" : "is-ok" : "is-error"}>
            <span className="cal-import-line">Fila {row.line}</span>
            <strong>{row.title || "Sin título"}</strong>
            {row.post ? <span className="cal-import-meta"><FormatTag format={row.post.format} label /><NetworkIcons networks={row.post.networks} max={3} />{row.post.date ? `${shortDate.format(new Date(`${row.post.date}T12:00`))} · ${row.post.time}` : "Idea sin fecha"} · {row.post.status}{row.post.brand !== defaultCompany && ` · ${row.post.brand}`}{row.duplicate && " · ya existe"}</span>
              : <ul className="cal-import-errors">{row.errors.map(error => <li key={error}>{error}</li>)}</ul>}
          </li>)}</ul>
        </section>}
      </div>
      <footer className="cal-drawer-footer">
        <button type="button" className="secondary-button" disabled={busy} onClick={onClose}>Cancelar</button>
        <button type="button" className="primary-button" disabled={!ready || busy || !importable.length} onClick={() => void confirm()}>{busy && result ? "Importando…" : `Importar ${importable.length} ${importable.length === 1 ? "publicación" : "publicaciones"}`}</button>
      </footer>
    </div>
  </dialog>;
}
