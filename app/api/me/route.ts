import { database } from "@/lib/database";
import { panelAccess } from "@/lib/panel-auth";
export async function GET(request: Request) {
  const denied = panelAccess(request); if (denied) return denied;
  if (!process.env.DATABASE_URL) return Response.json({ account: null });
  try {
    const db = await database();
    const exists = await db.query("SELECT to_regclass('public.focus_memberships') AS name");
    if (!exists.rows[0].name) return Response.json({ account: null }, { headers: { "Cache-Control": "no-store" } });
    const { rows } = await db.query("SELECT u.id, u.login, u.display_name, m.role, o.id AS company_id, o.name AS company FROM focus_users u JOIN focus_memberships m ON m.user_id = u.id JOIN focus_organizations o ON o.id = m.company_id WHERE u.login = $1 AND u.auth_provider = 'panel_env'", [process.env.PANEL_USER]);
    return Response.json({ account: rows[0] || null }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "No se pudo cargar la cuenta." }, { status: 503 }); }
}
