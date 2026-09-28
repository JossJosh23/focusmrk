import { authorize, digest, seal, sessionId, settings, tiktokDb, tokenRequest, withConnection } from "@/lib/tiktok";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams, state = params.get("state") || "";
    if (!/^[a-f0-9]{64}$/.test(state)) return new Response("Autorización no válida. Inicia la conexión desde FocusMRK.", { status: 400 });
    const db = await tiktokDb();
    const { rows } = await db.query("DELETE FROM focus_tiktok_states WHERE id=$1 AND session=$2 AND expires>now() RETURNING company", [digest(state), sessionId(request)]);
    if (!rows.length) return new Response("La autorización venció o ya se utilizó. Vuelve a conectar desde FocusMRK.", { status: 400 });
    const company = rows[0].company;
    const denied = await authorize(request, company); if (denied) return denied;
    const config = settings(), back = new URL("/", config.origin);
    back.searchParams.set("module", "company"); back.searchParams.set("company", company); back.searchParams.set("tiktok", params.has("error") ? "cancelled" : "connected");
    if (!params.has("error")) {
      const code = params.get("code"); if (!code || code.length > 4096) return new Response("Código de autorización no válido.", { status: 400 });
      await withConnection(company, async client => {
        const tokens = await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: config.redirect });
        await client.query("BEGIN");
        try {
          await client.query("INSERT INTO focus_tiktok_connections(company,tokens) VALUES($1,$2) ON CONFLICT(company) DO UPDATE SET tokens=$2,snapshot=NULL,updated_at=now()", [company, seal(tokens, company)]);
          await client.query("DELETE FROM focus_tiktok_snapshots WHERE company=$1", [company]);
          await client.query("COMMIT");
        } catch (error) { await client.query("ROLLBACK"); throw error; }
      });
    }
    return Response.redirect(back, 303);
  } catch { return new Response("No se pudo conectar TikTok. Regresa a FocusMRK y reintenta con tu cuenta de pruebas y todos los permisos habilitados.", { status: 400, headers: { "Cache-Control": "no-store" } }); }
}
