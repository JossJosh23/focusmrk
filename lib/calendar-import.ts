import JSZip from "jszip";
import { FORMATS, NETWORKS, STATUSES, isPublication, validDate, validReferenceUrl, type Publication } from "./calendar";

/** Columns of the import template, in order. `key` is the Publication field (or a pseudo-field); `required` columns must exist. */
export const IMPORT_COLUMNS = [
  { key: "date", header: "Fecha", hint: "AAAA-MM-DD o DD/MM/AAAA. Vacía = idea sin fecha", example: "2026-11-02" },
  { key: "time", header: "Hora", hint: "HH:MM en 24 h (vacía = 09:00)", example: "18:30" },
  { key: "title", header: "Título", hint: "Obligatorio, hasta 160 caracteres", example: "Reel encebollado del domingo", required: true },
  { key: "format", header: "Formato", hint: FORMATS.join(", "), example: "Reel" },
  { key: "networks", header: "Redes", hint: "Instagram, TikTok, Facebook; varias con + o coma (Instagram + TikTok)", example: "Instagram + TikTok" },
  { key: "status", header: "Estado", hint: `${STATUSES.join(", ")} (vacío = Borrador)`, example: "Borrador" },
  { key: "paid", header: "Pauta", hint: "Sí o No (vacío = No)", example: "No" },
  { key: "important", header: "Importante", hint: "Sí o No (vacío = No)", example: "Sí" },
  { key: "objective", header: "Objetivo", hint: "Texto libre", example: "Aumentar visitas al local el fin de semana" },
  { key: "production", header: "Producción", hint: "Texto libre", example: "Grabar el servido del plato en cocina" },
  { key: "copy", header: "Copy", hint: "Texto de la publicación", example: "¡El domingo se come encebollado! 🐟" },
  { key: "footer", header: "Firma", hint: "Hashtags o pie del copy", example: "#Manabiche #Manta" },
  { key: "referenceUrl", header: "Referencia", hint: "Enlace https de referencia visual", example: "" },
  { key: "imageUrl", header: "Enlace imagen o video", hint: "Enlace https al archivo", example: "" },
  { key: "brand", header: "Empresa", hint: "Vacía = la empresa elegida al importar", example: "" },
] as const;
type ColumnKey = (typeof IMPORT_COLUMNS)[number]["key"];
export const IMPORT_MAX_ROWS = 1000;

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[*:]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
const ALIASES: Record<string, ColumnKey> = {
  fecha: "date", dia: "date", hora: "time", titulo: "title", tema: "title", formato: "format", tipo: "format", redes: "networks", red: "networks", "redes sociales": "networks",
  estado: "status", pauta: "paid", "con pauta": "paid", importante: "important", prioridad: "important", objetivo: "objective", produccion: "production",
  copy: "copy", texto: "copy", "texto de publicacion": "copy", firma: "footer", pie: "footer", hashtags: "footer", referencia: "referenceUrl", "referencia visual": "referenceUrl",
  "enlace imagen o video": "imageUrl", "enlace de imagen o video": "imageUrl", imagen: "imageUrl", video: "imageUrl", empresa: "brand", marca: "brand",
};

/** Cell values as read from the file: text, or a number when a spreadsheet stored one (Excel dates and times). */
export type Cell = string | number;

/** CSV with "," or ";" (Excel in Spanish uses ";"), quoted fields and line breaks inside quotes. */
export function parseCsv(text: string): Cell[][] {
  const source = text.replace(/^﻿/, "");
  const firstLine = source.slice(0, source.search(/\r?\n|$/));
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field === "") quoted = true;
    else if (char === delimiter) { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") { if (char === "\r" && source[i + 1] === "\n") i++; row.push(field); rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Text of a CSV file: UTF-8, or Windows-1252 when Excel saved it without UTF-8 (accents would come out as �). */
export function decodeCsv(bytes: ArrayBuffer): string {
  const utf8 = new TextDecoder("utf-8").decode(bytes);
  return utf8.includes("�") ? new TextDecoder("windows-1252").decode(bytes) : utf8;
}

const xmlText = (value: string) => value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16))).replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec))).replace(/&amp;/g, "&");
const runs = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(match => xmlText(match[1])).join("");
const columnIndex = (ref: string) => [...ref.replace(/\d+/g, "")].reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;

/** First worksheet of an .xlsx file (Excel, Google Sheets, LibreOffice) as rows of cells. */
export async function parseXlsx(data: ArrayBuffer | Uint8Array): Promise<Cell[][]> {
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(data); } catch { throw new Error("El archivo no es un Excel (.xlsx) válido."); }
  const read = (path: string) => zip.file(path)?.async("string");
  const workbook = await read("xl/workbook.xml");
  if (!workbook) throw new Error("El archivo no es un Excel (.xlsx) válido.");
  const firstSheet = workbook.match(/<sheet\b[^>]*\br:id="([^"]+)"/)?.[1];
  const rels = await read("xl/_rels/workbook.xml.rels") || "";
  const target = [...rels.matchAll(/<Relationship\b[^>]*>/g)].map(match => match[0]).find(tag => tag.includes(`Id="${firstSheet}"`))?.match(/Target="([^"]+)"/)?.[1];
  const sheetPath = target ? (target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`) : "xl/worksheets/sheet1.xml";
  const sheet = await read(sheetPath);
  if (!sheet) throw new Error("No se encontró la hoja del calendario en el Excel.");
  const shared = [...(await read("xl/sharedStrings.xml") || "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map(match => runs(match[1]));
  const rows: Cell[][] = [];
  for (const rowMatch of sheet.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const index = Number(rowMatch[1].match(/\br="(\d+)"/)?.[1] || rows.length + 1) - 1;
    const row: Cell[] = [];
    for (const cell of (rowMatch[2] || "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attributes = cell[1], body = cell[2] || "";
      const ref = attributes.match(/\br="([A-Z]+\d+)"/)?.[1];
      const type = attributes.match(/\bt="(\w+)"/)?.[1];
      const raw = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      let value: Cell = "";
      if (type === "s" && raw !== undefined) value = shared[Number(raw)] ?? "";
      else if (type === "inlineStr") value = runs(body);
      else if (type === "str" || type === "e") value = raw !== undefined ? xmlText(raw) : "";
      else if (type === "b") value = raw === "1" ? "Sí" : "No";
      else if (raw !== undefined && raw !== "") value = Number(raw);
      row[ref ? columnIndex(ref) : row.length] = value;
    }
    rows[index] = Array.from(row, cell => cell ?? "");
  }
  return Array.from(rows, row => row ?? []);
}

const pad = (value: number) => String(value).padStart(2, "0");
/** Excel serial date (days since 1899-12-30) → "YYYY-MM-DD". */
function serialDate(serial: number) {
  const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86_400_000);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function readDate(cell: Cell): string | null {
  if (typeof cell === "number") return cell >= 1 && cell < 2958466 ? serialDate(cell) : null;
  const value = cell.trim();
  if (!value) return "";
  let match = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  const iso = match ? `${match[1]}-${pad(+match[2])}-${pad(+match[3])}` : (match = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/)) ? `${match[3].length === 2 ? `20${match[3]}` : match[3]}-${pad(+match[2])}-${pad(+match[1])}` : "";
  return iso && validDate(iso) ? iso : null;
}

function readTime(cell: Cell): string | null {
  if (typeof cell === "number") {
    if (cell < 0 || cell >= 1) return null;
    const minutes = Math.round(cell * 1440) % 1440;
    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  }
  // Not normalize(): it strips ":" (meant for headers like "Título:").
  const value = cell.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
  if (!value) return "09:00";
  const match = value.match(/^(\d{1,2})(?:[:h](\d{2}))?\s*(am|pm|a m|p m)?$/);
  if (!match) return null;
  let hours = Number(match[1]); const minutes = Number(match[2] || 0); const half = match[3]?.replace(" ", "");
  if (half) { if (hours < 1 || hours > 12) return null; hours = hours % 12 + (half === "pm" ? 12 : 0); }
  return hours < 24 && minutes < 60 ? `${pad(hours)}:${pad(minutes)}` : null;
}

const FORMAT_ALIASES: Record<string, Publication["format"]> = { post: "Post", "post estatico": "Post", estatico: "Post", imagen: "Post", foto: "Post", reel: "Reel", reels: "Reel", video: "Reel", carrusel: "Carrusel", carrusell: "Carrusel", carousel: "Carrusel", carrousel: "Carrusel" };
const NETWORK_ALIASES: Record<string, Publication["networks"][number]> = { instagram: "Instagram", ig: "Instagram", insta: "Instagram", tiktok: "TikTok", "tik tok": "TikTok", tt: "TikTok", facebook: "Facebook", fb: "Facebook", face: "Facebook" };
const STATUS_ALIASES: Record<string, Publication["status"]> = { borrador: "Borrador", "en revision": "En revisión", revision: "En revisión", aprobado: "Aprobado", aprobada: "Aprobado", programado: "Aprobado", programada: "Aprobado", publicado: "Publicado", publicada: "Publicado" };
const YES = ["si", "s", "x", "yes", "true", "1", "verdadero"], NO = ["no", "n", "false", "0", "falso", ""];

export type ImportRow = { line: number; title: string; post: Publication | null; errors: string[]; duplicate: boolean };
export type ImportResult = { rows: ImportRow[]; missingColumns: string[] };

/** Rows (first row = headers) → publications. Every problem is reported per row with its spreadsheet line number;
 *  rows matching an existing post (same company, date, time and title) are flagged as duplicates. */
export function readImportRows(cells: Cell[][], options: { company: string; companies?: string[] | null; existing: Publication[]; newId: () => string }): ImportResult {
  const headerIndex = cells.findIndex(row => row.some(cell => String(cell).trim()));
  if (headerIndex < 0) return { rows: [], missingColumns: ["Título"] };
  const columns = new Map<ColumnKey, number>();
  cells[headerIndex].forEach((cell, index) => { const key = ALIASES[normalize(String(cell))]; if (key && !columns.has(key)) columns.set(key, index); });
  const missingColumns = IMPORT_COLUMNS.filter(column => "required" in column && !columns.has(column.key)).map(column => column.header);
  if (missingColumns.length) return { rows: [], missingColumns };
  const seen = new Set(options.existing.map(post => `${post.brand}|${post.date}|${post.time}|${post.title.trim().toLowerCase()}`));
  const rows: ImportRow[] = [];
  cells.slice(headerIndex + 1).forEach((row, offset) => {
    const get = (key: ColumnKey): Cell => { const index = columns.get(key); return index === undefined ? "" : row[index] ?? ""; };
    const text = (key: ColumnKey) => String(get(key)).trim();
    if (!row.some(cell => String(cell).trim())) return;
    const line = headerIndex + offset + 2;
    if (rows.length >= IMPORT_MAX_ROWS) { if (rows.length === IMPORT_MAX_ROWS) rows.push({ line, title: "", post: null, errors: [`Solo se importan ${IMPORT_MAX_ROWS} filas por archivo.`], duplicate: false }); return; }
    const errors: string[] = [];
    const title = text("title");
    if (!title) errors.push("Falta el título.");
    else if (title.length > 160) errors.push("El título supera los 160 caracteres.");
    const date = readDate(get("date"));
    if (date === null) errors.push(`Fecha no válida: «${text("date")}». Usa AAAA-MM-DD o DD/MM/AAAA.`);
    const time = readTime(get("time"));
    if (time === null) errors.push(`Hora no válida: «${text("time")}». Usa HH:MM, por ejemplo 18:30.`);
    const format = text("format") ? FORMAT_ALIASES[normalize(text("format"))] : "Post";
    if (!format) errors.push(`Formato no válido: «${text("format")}». Usa ${FORMATS.join(", ")}.`);
    const networkNames = text("networks") ? text("networks").split(/\s*(?:[,;/+|]|\sy\s)\s*/).filter(Boolean) : ["Instagram"];
    const networks = [...new Set(networkNames.map(name => NETWORK_ALIASES[normalize(name)]))];
    if (networks.some(network => !network)) errors.push(`Redes no válidas: «${text("networks")}». Usa ${NETWORKS.join(", ")}.`);
    const status = text("status") ? STATUS_ALIASES[normalize(text("status"))] : "Borrador";
    if (!status) errors.push(`Estado no válido: «${text("status")}». Usa ${STATUSES.join(", ")}.`);
    else if (status === "Publicado" && !date) errors.push("Una publicación «Publicado» necesita fecha.");
    const flag = (key: ColumnKey, label: string) => { const value = normalize(text(key)); if (YES.includes(value)) return true; if (!NO.includes(value)) errors.push(`${label}: escribe Sí o No (no «${text(key)}»).`); return false; };
    const paid = flag("paid", "Pauta"), important = flag("important", "Importante");
    const referenceUrl = text("referenceUrl"), imageUrl = text("imageUrl");
    if (!validReferenceUrl(referenceUrl)) errors.push("La referencia debe ser un enlace http o https.");
    if (!validReferenceUrl(imageUrl)) errors.push("El enlace de imagen o video debe ser http o https.");
    const brand = text("brand") || options.company;
    if (!brand) errors.push("Falta la empresa: elige una antes de importar o rellena la columna Empresa.");
    else if (brand.length > 80) errors.push("El nombre de la empresa supera los 80 caracteres.");
    else if (options.companies && !options.companies.includes(brand)) errors.push(`La empresa «${brand}» no está asignada a tu cuenta.`);
    if (errors.length) { rows.push({ line, title, post: null, errors, duplicate: false }); return; }
    const post: Publication = {
      id: options.newId(), date: date!, time: time!, title, objective: text("objective"), production: text("production"),
      networks: networks as Publication["networks"], format: format!, status: status!, paid, ...(important ? { important } : {}),
      copy: text("copy"), footer: text("footer"), referenceUrl, imageUrl, mediaId: "", brand,
    };
    if (!isPublication(post)) { rows.push({ line, title, post: null, errors: ["Revisa los datos de esta fila."], duplicate: false }); return; }
    const key = `${brand}|${post.date}|${post.time}|${title.toLowerCase()}`;
    rows.push({ line, title, post, errors: [], duplicate: seen.has(key) });
    seen.add(key);
  });
  return { rows, missingColumns: [] };
}
