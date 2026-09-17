import { database } from "@/lib/database";
import { panelAccess, marketingAccount } from "@/lib/account-access";

async function companiesDb() {
  const db = await database();
  await db.query("CREATE TABLE IF NOT EXISTS focus_companies (name TEXT PRIMARY KEY)");
  return db;
}
export async function GET(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  const account = await marketingAccount(request);
  if (account) return Response.json(account.companies, { headers: { "Cache-Control": "no-store" } });
  try { const db = await companiesDb(); const { rows } = await db.query("SELECT name FROM focus_companies ORDER BY name"); return Response.json(rows.map(row => row.name), { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "No se pudieron cargar las empresas." }, { status: 503 }); }
}
export async function POST(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  let body; try { body = await request.json(); } catch { return Response.json({ error: "Solicitud no válida." }, { status: 400 }); }
  if (typeof body?.name !== "string" || !body.name.trim() || body.name.trim().length > 80) return Response.json({ error: "Escribe un nombre de hasta 80 caracteres." }, { status: 400 });
  try { const db = await companiesDb(); await db.query("INSERT INTO focus_companies (name) VALUES ($1) ON CONFLICT DO NOTHING", [body.name.trim()]); return Response.json({ ok: true }); }
  catch { return Response.json({ error: "No se pudo guardar la empresa." }, { status: 503 }); }
}
