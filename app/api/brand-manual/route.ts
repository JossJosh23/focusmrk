import { database } from "@/lib/database";
import { panelAccess } from "@/lib/account-access";
import { BRAND_MANUAL_MAX_BYTES, BRAND_MANUAL_TYPES } from "@/lib/brand-manual";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One brand manual (PDF or image) per company. The company always comes in ?company= so account-access can check it.
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
async function manuals() {
  const db = await database();
  await db.query("CREATE TABLE IF NOT EXISTS focus_brand_manuals (company TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, size INTEGER NOT NULL, data BYTEA NOT NULL, uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  return db;
}
function companyOf(request: Request) {
  const company = new URL(request.url).searchParams.get("company")?.trim() || "";
  return company && company.length <= 80 ? company : "";
}

/** ?company= → { manual: { name, type, size, uploadedAt } | null }; with &download=1 → the file itself. */
export async function GET(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  const company = companyOf(request);
  if (!company) return json({ error: "Selecciona una empresa." }, 400);
  try {
    const db = await manuals();
    if (new URL(request.url).searchParams.get("download") === "1") {
      const { rows } = await db.query("SELECT name, type, data FROM focus_brand_manuals WHERE company = $1", [company]);
      if (!rows.length) return json({ error: "Esta empresa no tiene manual de marca." }, 404);
      return new Response(rows[0].data, { headers: { "Content-Type": rows[0].type, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(rows[0].name)}`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
    }
    const { rows } = await db.query('SELECT name, type, size, uploaded_at AS "uploadedAt" FROM focus_brand_manuals WHERE company = $1', [company]);
    return json({ manual: rows[0] || null });
  } catch { return json({ error: "No se pudo cargar el manual de marca." }, 503); }
}

/** multipart { file } → replaces the company's manual. */
export async function POST(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  const company = companyOf(request);
  if (!company) return json({ error: "Selecciona una empresa." }, 400);
  if (Number(request.headers.get("content-length")) > BRAND_MANUAL_MAX_BYTES + 65536) return json({ error: "El manual supera los 25 MB." }, 413);
  try {
    const file = (await request.formData()).get("file");
    if (!(file instanceof File) || !file.size || file.size > BRAND_MANUAL_MAX_BYTES || !BRAND_MANUAL_TYPES.includes(file.type) || file.name.length > 300) return json({ error: "Sube un PDF, PNG, JPG o WebP de hasta 25 MB." }, 400);
    const db = await manuals();
    const { rows } = await db.query(`INSERT INTO focus_brand_manuals (company, name, type, size, data) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (company) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, size = EXCLUDED.size, data = EXCLUDED.data, uploaded_at = now()
      RETURNING name, type, size, uploaded_at AS "uploadedAt"`, [company, file.name, file.type, file.size, Buffer.from(await file.arrayBuffer())]);
    return json({ manual: rows[0] });
  } catch { return json({ error: "No se pudo guardar el manual de marca." }, 503); }
}

export async function DELETE(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  const company = companyOf(request);
  if (!company) return json({ error: "Selecciona una empresa." }, 400);
  try { await (await manuals()).query("DELETE FROM focus_brand_manuals WHERE company = $1", [company]); return json({ ok: true }); }
  catch { return json({ error: "No se pudo quitar el manual de marca." }, 503); }
}
