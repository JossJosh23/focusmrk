import { database } from "@/lib/database";
import { CACHE_VERSION, CACHEABLE_BYTES, RANGE_CHUNK_BYTES, mediaMeta, mediaOriginal, mediaRange, mediaThumbnail } from "@/lib/media-files";
import { panelAccess, marketingAccount } from "@/lib/account-access";
import { MAX_MEDIA_BYTES, MEDIA_TYPES } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A file never changes under its id (uploads use ON CONFLICT DO NOTHING), so browsers may cache it indefinitely.
async function mediaFile(id: string, request: Request, thumbnail: boolean) {
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
export async function GET(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  try {
    const db = await database();
    const id = new URL(request.url).searchParams.get("id");
    if (id && new URL(request.url).searchParams.get("metadata") === "1") {
      const { rows } = await db.query('SELECT id, name, brand, type, size, created_at AS "createdAt" FROM focus_media WHERE id = $1', [id]);
      return Response.json(rows[0] ?? null, { headers: { "Cache-Control": "no-store" } });
    }
    if (id) return await mediaFile(id, request, new URL(request.url).searchParams.get("thumb") === "1");
    const { rows } = await db.query('SELECT id, name, brand, type, size, created_at AS "createdAt" FROM focus_media ORDER BY created_at DESC');
    const account = await marketingAccount(request);
    return Response.json(account ? rows.filter(row => account.companies.includes(row.brand)) : rows, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "No se pudo cargar la biblioteca del servidor." }, { status: 503 }); }
}
export async function POST(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  if (Number(request.headers.get("content-length")) > MAX_MEDIA_BYTES + 65536) return new Response("Archivo demasiado grande", { status: 413 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    const id = String(form.get("id") || "");
    const brand = String(form.get("brand") || "").trim();
    if (!(file instanceof File) || !file.size || file.size > MAX_MEDIA_BYTES || !MEDIA_TYPES.includes(file.type) || !id || id.length > 200 || !brand || brand.length > 80 || file.name.length > 500) return Response.json({ error: "Archivo no válido. Máximo 100 MB por archivo." }, { status: 400 });
    const db = await database();
    const data = Buffer.from(await file.arrayBuffer());
    const account = await marketingAccount(request);
    if (account && !account.companies.includes(brand)) return Response.json({ error: "Empresa no asignada." }, { status: 403 });
    if (account && (await db.query("SELECT id FROM focus_media WHERE id = $1", [id])).rows.length) return Response.json({ error: "El identificador del archivo ya existe." }, { status: 409 });
    const migrated = (await db.query("SELECT to_regclass('public.focus_migrations') AS name")).rows[0].name;
    if (migrated && (await db.query("SELECT id FROM focus_migrations WHERE id = '20260916_manabiche_manager_v1'")).rows.length) {
      await db.query("INSERT INTO focus_media (id, name, brand, type, size, created_at, data, company_id) VALUES ($1, $2, $3, $4, $5, now(), $6, (SELECT id FROM focus_organizations WHERE name = $3)) ON CONFLICT (id) DO NOTHING", [id, file.name, brand, file.type, file.size, data]);
    } else {
      await db.query("INSERT INTO focus_media (id, name, brand, type, size, created_at, data) VALUES ($1, $2, $3, $4, $5, now(), $6) ON CONFLICT (id) DO NOTHING", [id, file.name, brand, file.type, file.size, data]);
    }
    return Response.json({ ok: true });
  } catch { return Response.json({ error: "No se pudo guardar el archivo en PostgreSQL." }, { status: 503 }); }
}
export async function DELETE(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  const id = new URL(request.url).searchParams.get("id");
  try {
    const db = await database(); const client = await db.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query("SELECT posts FROM focus_panel WHERE id = 1 FOR UPDATE");
      if (rows[0].posts.some((p: { mediaId: string }) => p.mediaId === id)) { await client.query("ROLLBACK"); return Response.json({ error: "El archivo está asociado a una publicación." }, { status: 409 }); }
      await client.query("DELETE FROM focus_media WHERE id = $1", [id]);
      await client.query("COMMIT"); return Response.json({ ok: true });
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  } catch { return Response.json({ error: "No se pudo eliminar el archivo." }, { status: 503 }); }
}
export async function PATCH(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Solicitud no válida." }, { status: 400 }); }
  if (!body || typeof body.id !== "string" || !body.id || body.id.length > 200 || typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 500 || /[\\/\x00-\x1f]/.test(body.name)) return Response.json({ error: "Nombre de archivo no válido." }, { status: 400 });
  try {
    const db = await database();
    const { rows } = await db.query("UPDATE focus_media SET name = $1 WHERE id = $2 RETURNING id", [body.name.trim(), body.id]);
    if (!rows.length) return Response.json({ error: "Archivo no encontrado." }, { status: 404 });
    return Response.json({ ok: true });
  } catch { return Response.json({ error: "No se pudo renombrar el archivo." }, { status: 503 }); }
}
