import { database } from "@/lib/database";
import { panelAccess, marketingAccount } from "@/lib/account-access";
import { readPublications } from "@/lib/calendar";
import { readTemplates } from "@/lib/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  try {
    const db = await database();
    const account = await marketingAccount(request);
    const { rows } = await db.query('SELECT version, posts, templates, to_jsonb(focus_panel)->>\'company_id\' AS "companyId" FROM focus_panel WHERE id = 1');
    if (account) {
      rows[0].role = "marketing_manager";
      rows[0].companies = account.companies;
      rows[0].posts = rows[0].posts.filter((post: { brand: string }) => account.companies.includes(post.brand));
      rows[0].templates = (await db.query("SELECT templates FROM focus_accounts WHERE id = $1", [account.id])).rows[0].templates;
      rows[0].companyId = account.companies.length === 1 && account.companies[0] === "Manabiche" ? "manabiche" : null;
    }
    return Response.json(rows[0], { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "No se pudo conectar con PostgreSQL. Revisa DATABASE_URL y el estado del servicio en Dokploy." }, { status: 503 }); }
}
export async function PUT(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
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
    const account = await marketingAccount(request);
    try {
      await client.query("BEGIN");
      const current = await client.query("SELECT version, posts, templates FROM focus_panel WHERE id = 1 FOR UPDATE");
      if (current.rows[0].version !== body.version) { await client.query("ROLLBACK"); return Response.json({ error: "El calendario cambió en otro dispositivo. Conserva tus cambios y recarga antes de guardar." }, { status: 409 }); }
      const ids = [...new Set(body.posts.map((p: { mediaId: string }) => p.mediaId).filter(Boolean))];
      if (account) {
        const hidden = current.rows[0].posts.filter((post: { brand: string }) => !account.companies.includes(post.brand));
        const hiddenIds = new Set(hidden.map((post: { id: string }) => post.id));
        if (body.posts.some((post: { id: string; brand: string }) => !account.companies.includes(post.brand) || hiddenIds.has(post.id))) {
          await client.query("ROLLBACK"); return Response.json({ error: "Solo puedes editar publicaciones de tus empresas asignadas." }, { status: 403 });
        }
        if (ids.length && (await client.query("SELECT id FROM focus_media WHERE id = ANY($1::text[]) AND brand = ANY($2::text[])", [ids, account.companies])).rowCount !== ids.length) {
          await client.query("ROLLBACK"); return Response.json({ error: "Archivo no disponible para tus empresas." }, { status: 403 });
        }
        body.posts = [...hidden, ...body.posts];
        await client.query("UPDATE focus_accounts SET templates = $1::jsonb WHERE id = $2", [JSON.stringify(body.templates), account.id]);
        body.templates = current.rows[0].templates;
      }
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
