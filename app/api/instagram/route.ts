import { randomBytes } from "node:crypto";
import { authorize, digest, sessionId, settings, scopes, insightsScope, instagramDb, withConnection, unseal, seal, refresh, snapshot } from "@/lib/instagram";
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
function safeError(error: unknown) {
  return error instanceof Error && /^(Instagram |La autorización de Instagram |Autoriza instagram_business_basic|Configura en Dokploy:|Revisa INSTAGRAM_)/.test(error.message) ? error.message : "No se pudo completar la conexión de Instagram. Revisa la configuración o vuelve a conectar.";
}
export async function GET(request: Request) {
  const company = new URL(request.url).searchParams.get("company") || "";
  const denied = await authorize(request, company); if (denied) return denied;
  try {
    let configured = true, message = ""; try { settings(); } catch (error) { configured = false; message = safeError(error); }
    const { rows } = await (await instagramDb()).query("SELECT external_id,expires_at,connected_at,status,snapshot FROM focus_instagram_connections WHERE company=$1", [company]);
    const row = rows[0], expired = row && new Date(row.expires_at).getTime() <= Date.now();
    return json({ configured, connected: !!row && !expired && row.status === "connected", status: !row ? "disconnected" : expired ? "expired" : row.status, externalId: row?.external_id || null, expiresAt: row?.expires_at || null, connectedAt: row?.connected_at || null, snapshot: row?.snapshot || null, message: expired ? "La autorización de Instagram venció. Vuelve a conectar." : message });
  } catch { return json({ error: "No se pudo cargar la conexión de Instagram." }, 503); }
}
export async function POST(request: Request) {
  const company = new URL(request.url).searchParams.get("company") || "";
  const denied = await authorize(request, company); if (denied) return denied;
  try {
    const { action } = await request.json();
    if (action === "connect") {
      const config = settings(), state = randomBytes(32).toString("hex"), session = sessionId(request), db = await instagramDb();
      await db.query("DELETE FROM focus_instagram_states WHERE expires<now() OR (session=$1 AND company=$2)", [session, company]);
      await db.query("INSERT INTO focus_instagram_states VALUES($1,$2,$3,now()+interval '10 minutes')", [digest(state), session, company]);
      const url = new URL("https://www.instagram.com/oauth/authorize");
      const requestedScopes = new URL(request.url).searchParams.get("reports") === "1" ? [...scopes, insightsScope] : scopes;
      url.search = new URLSearchParams({ client_id: config.id, redirect_uri: config.redirect, scope: requestedScopes.join(","), response_type: "code", state, enable_fb_login: "0", force_authentication: "1" }).toString();
      return json({ url: url.href });
    }
    if (action === "disconnect" || action === "sync") return await withConnection(company, async client => {
      if (action === "disconnect") {
        await client.query("BEGIN");
        try { await client.query("DELETE FROM focus_instagram_connections WHERE company=$1", [company]); await client.query("DELETE FROM focus_instagram_states WHERE company=$1", [company]); await client.query("COMMIT"); }
        catch (error) { await client.query("ROLLBACK"); throw error; }
        return json({ configured: true, connected: false, status: "disconnected", snapshot: null, message: "Conexión de Instagram eliminada de esta empresa. Puedes retirar también la autorización en Instagram." });
      }
      const { rows } = await client.query("SELECT tokens FROM focus_instagram_connections WHERE company=$1", [company]);
      if (!rows.length) return json({ error: "Conecta primero Instagram." }, 409);
      const tokens = await refresh(unseal(rows[0].tokens, company));
      // Persist renewal before profile lookup so a transient lookup failure cannot lose it.
      await client.query("UPDATE focus_instagram_connections SET tokens=$2,expires_at=$3,updated_at=now() WHERE company=$1", [company, seal(tokens, company), new Date(tokens.expires)]);
      const data = await snapshot(tokens);
      await client.query("UPDATE focus_instagram_connections SET snapshot=$2::jsonb,status='connected',updated_at=now() WHERE company=$1", [company, JSON.stringify(data)]);
      return json({ configured: true, connected: true, status: "connected", externalId: tokens.user_id, expiresAt: new Date(tokens.expires).toISOString(), snapshot: data });
    });
    return json({ error: "Acción no válida." }, 400);
  } catch (error) { return json({ error: safeError(error) }, 502); }
}
