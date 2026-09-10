import { database } from "@/lib/database";
import { panelAccess } from "@/lib/panel-auth";
import { MAX_MEDIA_BYTES, MEDIA_TYPES } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const denied = panelAccess(request); if (denied) return denied;
  try {
    const db = await database();
    const id = new URL(request.url).searchParams.get("id");
    if (id && new URL(request.url).searchParams.get("metadata") === "1") {
      const { rows } = await db.query('SELECT id, name, brand, type, size, created_at AS "createdAt" FROM focus_media WHERE id = $1', [id]);
      return Response.json(rows[0] ?? null, { headers: { "Cache-Control": "no-store" } });
    }
    if (id) {
      const { rows } = await db.query("SELECT type, data FROM focus_media WHERE id = $1", [id]);
      if (!rows.length) return new Response("Archivo no encontrado", { status: 404 });
      return new Response(new Uint8Array(rows[0].data), { headers: { "Content-Type": rows[0].type, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
    }
    const { rows } = await db.query('SELECT id, name, brand, type, size, created_at AS "createdAt" FROM focus_media ORDER BY created_at DESC');
    return Response.json(rows, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "No se pudo cargar la biblioteca del servidor." }, { status: 503 }); }
}
export async function POST(request: Request) {
  const denied = panelAccess(request); if (denied) return denied;
  if (Number(request.headers.get("content-length")) > MAX_MEDIA_BYTES + 65536) return new Response("Archivo demasiado grande", { status: 413 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    const id = String(form.get("id") || "");
    const brand = String(form.get("brand") || "").trim();
    if (!(file instanceof File) || !file.size || file.size > MAX_MEDIA_BYTES || !MEDIA_TYPES.includes(file.type) || !id || id.length > 200 || !brand || brand.length > 80 || file.name.length > 500) return Response.json({ error: "Archivo no válido. Máximo 100 MB por archivo." }, { status: 400 });
    const db = await database();
    const data = Buffer.from(await file.arrayBuffer());
    await db.query("INSERT INTO focus_media (id, name, brand, type, size, created_at, data) VALUES ($1, $2, $3, $4, $5, now(), $6) ON CONFLICT (id) DO NOTHING", [id, file.name, brand, file.type, file.size, data]);
    return Response.json({ ok: true });
  } catch { return Response.json({ error: "No se pudo guardar el archivo en PostgreSQL." }, { status: 503 }); }
}
export async function DELETE(request: Request) {
  const denied = panelAccess(request); if (denied) return denied;
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
