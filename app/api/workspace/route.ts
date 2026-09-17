import { database } from "@/lib/database";
import { panelAccess } from "@/lib/panel-auth";
import { readPublications } from "@/lib/calendar";
import { readTemplates } from "@/lib/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const denied = panelAccess(request); if (denied) return denied;
  try {
    const db = await database();
    const { rows } = await db.query('SELECT version, posts, templates, to_jsonb(focus_panel)->>\'company_id\' AS "companyId" FROM focus_panel WHERE id = 1');
    return Response.json(rows[0], { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "No se pudo conectar con PostgreSQL. Revisa DATABASE_URL y el estado del servicio en Dokploy." }, { status: 503 }); }
}
export async function PUT(request: Request) {
  const denied = panelAccess(request); if (denied) return denied;
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 10_000_000) return Response.json({ error: "El calendario supera el límite de 10 MB." }, { status: 413 });
    body = JSON.parse(raw);
    body.posts = readPublications(JSON.stringify(body.posts));
    body.templates = readTemplates(JSON.stringify(body.templates));
    if (!Number.isSafeInteger(body.version) || body.version < 0) throw new Error();
  } catch { return Response.json({ error: "Datos de calendario no válidos." }, { status: 400 }); }
  try {
    const db = await database();
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const current = await client.query("SELECT version FROM focus_panel WHERE id = 1 FOR UPDATE");
      if (current.rows[0].version !== body.version) { await client.query("ROLLBACK"); return Response.json({ error: "El calendario cambió en otro dispositivo. Conserva tus cambios y recarga antes de guardar." }, { status: 409 }); }
      const ids = [...new Set(body.posts.map((p: { mediaId: string }) => p.mediaId).filter(Boolean))];
      if (ids.length) {
        const assets = await client.query("SELECT id FROM focus_media WHERE id = ANY($1::text[])", [ids]);
        if (assets.rowCount !== ids.length) { await client.query("ROLLBACK"); return Response.json({ error: "Faltan archivos de la biblioteca. Importa un respaldo completo antes de guardar." }, { status: 400 }); }
      }
      const result = await client.query("UPDATE focus_panel SET posts = $1::jsonb, templates = $2::jsonb, version = version + 1, updated_at = now() WHERE id = 1 RETURNING version", [JSON.stringify(body.posts), JSON.stringify(body.templates)]);
      await client.query("COMMIT");
      return Response.json(result.rows[0]);
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  } catch { return Response.json({ error: "No se pudo guardar en PostgreSQL. Tus cambios siguen en el editor." }, { status: 503 }); }
}
