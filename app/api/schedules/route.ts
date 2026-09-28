import { database } from "@/lib/database";
import { marketingAccount, panelAccess } from "@/lib/account-access";
import { readSchedules } from "@/lib/schedules";

export const runtime = "nodejs";
async function store() {
  const db = await database();
  await db.query("CREATE TABLE IF NOT EXISTS focus_schedules (company TEXT PRIMARY KEY, plans JSONB NOT NULL, version INTEGER NOT NULL DEFAULT 1)");
  return db;
}
async function allowed(request: Request, company: unknown) {
  if (typeof company !== "string" || !company.trim() || company.length > 80) return false;
  const account = await marketingAccount(request);
  return !account || account.companies.includes(company);
}
export async function GET(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  try {
    const company = new URL(request.url).searchParams.get("company");
    if (!await allowed(request, company)) return Response.json({ error: "Selecciona una empresa autorizada." }, { status: 403 });
    const { rows } = await (await store()).query("SELECT plans, version FROM focus_schedules WHERE company = $1", [company]);
    return Response.json(rows[0] || { plans: [], version: 0 }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "No se pudieron cargar los cronogramas." }, { status: 503 }); }
}
export async function PUT(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 5_000_000) return Response.json({ error: "Los cronogramas superan el límite de tamaño." }, { status: 413 });
    body = JSON.parse(raw); body.plans = readSchedules(body.plans);
    if (!Number.isSafeInteger(body.version) || body.version < 0) throw new Error();
  } catch { return Response.json({ error: "Cronogramas no válidos." }, { status: 400 }); }
  try {
    if (!await allowed(request, body.company)) return Response.json({ error: "Empresa no autorizada." }, { status: 403 });
    const db = await store();
    const { rows } = body.version === 0
      ? await db.query("INSERT INTO focus_schedules(company, plans) VALUES ($1, $2::jsonb) ON CONFLICT DO NOTHING RETURNING version", [body.company, JSON.stringify(body.plans)])
      : await db.query("UPDATE focus_schedules SET plans = $2::jsonb, version = version + 1 WHERE company = $1 AND version = $3 RETURNING version", [body.company, JSON.stringify(body.plans), body.version]);
    if (!rows.length) return Response.json({ error: "Los cronogramas cambiaron en otra sesión. Conserva tus cambios y recarga antes de guardar." }, { status: 409 });
    return Response.json(rows[0]);
  } catch { return Response.json({ error: "No se pudo guardar el cronograma." }, { status: 503 }); }
}
