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
