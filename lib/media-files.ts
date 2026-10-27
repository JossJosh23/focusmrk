import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { mediaDatabase } from "./database";

// Media bytes never change under an id (uploads use ON CONFLICT DO NOTHING), so every layer below may cache forever:
// a metadata map in memory, originals and thumbnails on local disk, and the browser (see app/api/media/route.ts).
const CACHE_DIR = process.env.MEDIA_CACHE_DIR || join(tmpdir(), "focusmrk-media");
// Larger files (long videos) are streamed from PostgreSQL in ranges instead of being cached whole.
export const CACHEABLE_BYTES = 25 * 1024 * 1024;
export const RANGE_CHUNK_BYTES = 2 * 1024 * 1024;
const THUMB_WIDTH = 480;
const THUMB_HEIGHT = 600;

type Meta = { type: string; size: number };
const metadata = new Map<string, Meta>();
const pending = new Map<string, Promise<Buffer | null>>();
// bytea arrives as hex text by default (2 bytes per byte); base64 is a third smaller and decodes losslessly.
// (pg's binary result mode decodes values as UTF-8 strings and corrupts files, so it must not be used.)
const decode = (value: string) => Buffer.from(value, "base64");
// Bump CACHE_VERSION whenever cached bytes could have been written wrongly, so old files are never read again.
export const CACHE_VERSION = "v2";
const safeId = (id: string) => /^[\w-]{1,200}$/.test(id) ? `${CACHE_VERSION}-${id}` : null;

export async function mediaMeta(id: string): Promise<Meta | null> {
  const known = metadata.get(id);
  if (known) return known;
  const db = await mediaDatabase();
  const { rows } = await db.query("SELECT type, octet_length(data) AS size FROM focus_media WHERE id = $1", [id]);
  if (!rows.length) return null;
  const meta = { type: rows[0].type as string, size: Number(rows[0].size) };
  metadata.set(id, meta);
  return meta;
}

async function cached(name: string) {
  try { return await readFile(join(CACHE_DIR, name)); } catch { return null; }
}
async function store(name: string, data: Buffer) {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    const temporary = join(CACHE_DIR, `${name}.${process.pid}.${Date.now()}.tmp`);
    await writeFile(temporary, data);
    await rename(temporary, join(CACHE_DIR, name));
  } catch { /* The cache is an optimisation; serving still works without it. */ }
}
// Concurrent requests for the same file share one PostgreSQL read.
function once(key: string, load: () => Promise<Buffer | null>) {
  const running = pending.get(key);
  if (running) return running;
  const promise = load().finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}

export function mediaOriginal(id: string): Promise<Buffer | null> {
  const name = safeId(id);
  if (!name) return Promise.resolve(null);
  return once(`original:${name}`, async () => {
    const hit = await cached(name);
    if (hit) return hit;
    const db = await mediaDatabase();
    const { rows } = await db.query("SELECT encode(data, 'base64') AS data FROM focus_media WHERE id = $1", [id]);
    if (!rows.length) return null;
    const data = decode(rows[0].data);
    if (data.length <= CACHEABLE_BYTES) await store(name, data);
    return data;
  });
}

export async function mediaRange(id: string, start: number, length: number): Promise<Buffer | null> {
  const db = await mediaDatabase();
  const { rows } = await db.query("SELECT encode(substring(data FROM $2 FOR $3), 'base64') AS part FROM focus_media WHERE id = $1", [id, start + 1, length]);
  return rows.length ? decode(rows[0].part) : null;
}

export function mediaThumbnail(id: string): Promise<Buffer | null> {
  const name = safeId(id);
  if (!name) return Promise.resolve(null);
  return once(`thumb:${name}`, async () => {
    const hit = await cached(`${name}.thumb.webp`);
    if (hit) return hit;
    const original = await mediaOriginal(id);
    if (!original) return null;
    const thumb = await sharp(original, { animated: false }).rotate().resize({ width: THUMB_WIDTH, height: THUMB_HEIGHT, fit: "inside", withoutEnlargement: true }).webp({ quality: 72 }).toBuffer();
    await store(`${name}.thumb.webp`, thumb);
    return thumb;
  });
}

// A file never changes under its id (uploads use ON CONFLICT DO NOTHING), so browsers may cache it indefinitely.
/** Serves a file (or its WebP thumbnail) with immutable caching, ETag and byte ranges. Callers authorize first. */
export async function serveMedia(id: string, request: Request, thumbnail: boolean) {
  const etag = `"${CACHE_VERSION}-${id}${thumbnail ? "-thumb" : ""}"`;
  const headers = { "Cache-Control": "private, max-age=31536000, immutable", ETag: etag, "Accept-Ranges": "bytes", "X-Content-Type-Options": "nosniff" };
  if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
  const meta = await mediaMeta(id);
  if (!meta) return new Response("Archivo no encontrado", { status: 404 });
  if (thumbnail && meta.type.startsWith("image/")) {
    const thumb = await mediaThumbnail(id);
    if (!thumb) return new Response("Archivo no encontrado", { status: 404 });
    return new Response(new Uint8Array(thumb), { headers: { ...headers, "Content-Type": "image/webp", "Content-Length": String(thumb.length) } });
  }
  const total = meta.size;
  const range = request.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  const whole = !range || (!range[1] && !range[2]);
  if (whole && total > CACHEABLE_BYTES) return new Response("Solicita este archivo por rangos.", { status: 416, headers: { ...headers, "Content-Range": `bytes */${total}` } });
  const original = total <= CACHEABLE_BYTES ? await mediaOriginal(id) : null;
  if (whole) {
    if (!original) return new Response("Archivo no encontrado", { status: 404 });
    return new Response(new Uint8Array(original), { headers: { ...headers, "Content-Type": meta.type, "Content-Length": String(total) } });
  }
  const start = range[1] ? Number(range[1]) : Math.max(0, total - Number(range[2]));
  let end = range[1] && range[2] ? Math.min(Number(range[2]), total - 1) : total - 1;
  if (start >= total || start > end) return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${total}` } });
  // Cached files answer any range at once; large ones read a bounded chunk so a pool connection is never held for long.
  if (!original) end = Math.min(end, start + RANGE_CHUNK_BYTES - 1);
  const part = original ? original.subarray(start, end + 1) : await mediaRange(id, start, end - start + 1);
  if (!part) return new Response("Archivo no encontrado", { status: 404 });
  return new Response(new Uint8Array(part), { status: 206, headers: { ...headers, "Content-Type": meta.type, "Content-Length": String(end - start + 1), "Content-Range": `bytes ${start}-${end}/${total}` } });
}
