import { database } from "@/lib/database";
import { panelAccess } from "@/lib/account-access";
import { emptyCompanyProfile, validCompanyProfile } from "@/lib/company-profile";
async function dbProfiles() {
  const db = await database();
  await db.query("CREATE TABLE IF NOT EXISTS focus_company_profiles (company TEXT PRIMARY KEY, profile JSONB NOT NULL, version INTEGER NOT NULL DEFAULT 1)");
  return db;
}
export async function GET(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  const company = new URL(request.url).searchParams.get("company");
  if (!company || company.length > 80) return Response.json({ error: "Selecciona una empresa." }, { status: 400 });
  try { const db = await dbProfiles(); const { rows } = await db.query("SELECT profile, version FROM focus_company_profiles WHERE company = $1", [company]); return Response.json(rows[0] || { profile: emptyCompanyProfile(company), version: 0 }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "No se pudo cargar la empresa." }, { status: 503 }); }
}
export async function PUT(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  let body;
  try { const raw = await request.text(); if (raw.length > 750000) return Response.json({ error: "Logo demasiado grande." }, { status: 413 }); body = JSON.parse(raw); } catch { return Response.json({ error: "Datos no válidos." }, { status: 400 }); }
  if (!body || typeof body.company !== "string" || !body.company.trim() || body.company.length > 80 || !validCompanyProfile(body.profile) || !Number.isSafeInteger(body.version) || body.version < 0) return Response.json({ error: "Revisa el nombre, logo y enlaces HTTPS de cada red." }, { status: 400 });
  try { const db = await dbProfiles(); const { rows } = body.version === 0 ? await db.query("INSERT INTO focus_company_profiles (company, profile) VALUES ($1, $2::jsonb) ON CONFLICT DO NOTHING RETURNING version", [body.company, JSON.stringify(body.profile)]) : await db.query("UPDATE focus_company_profiles SET profile = $2::jsonb, version = version + 1 WHERE company = $1 AND version = $3 RETURNING version", [body.company, JSON.stringify(body.profile), body.version]);
    if (!rows.length) return Response.json({ error: "La empresa cambió en otra sesión. Recarga antes de guardar." }, { status: 409 });
    return Response.json({ version: rows[0].version });
  } catch { return Response.json({ error: "No se pudo guardar la empresa." }, { status: 503 }); }
}
