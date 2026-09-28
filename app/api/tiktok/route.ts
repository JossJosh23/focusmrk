import { randomBytes } from "node:crypto";
import { authorize, digest, scopes, seal, sessionId, settings, snapshot, tiktokDb, tokenRequest, unseal, withConnection } from "@/lib/tiktok";

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: Request) {
  const company = new URL(request.url).searchParams.get("company") || "";
  const denied = await authorize(request, company); if (denied) return denied;
  try {
    let configured = true; try { settings(); } catch { configured = false; }
    const { rows } = await (await tiktokDb()).query("SELECT snapshot FROM focus_tiktok_connections WHERE company=$1", [company]);
    return json({ configured, connected: !!rows.length, snapshot: rows[0]?.snapshot || null });
  } catch { return json({ error: "No se pudo cargar la conexión." }, 503); }
}
export async function POST(request: Request) {
  const company = new URL(request.url).searchParams.get("company") || "";
  const denied = await authorize(request, company); if (denied) return denied;
  try {
    const { action } = await request.json();
    if (action === "connect") {
      const config = settings(), state = randomBytes(32).toString("hex"), session = sessionId(request), db = await tiktokDb();
      await db.query("DELETE FROM focus_tiktok_states WHERE expires < now() OR (session=$1 AND company=$2)", [session, company]);
      await db.query("INSERT INTO focus_tiktok_states(id,session,company,expires) VALUES($1,$2,$3,now()+interval '10 minutes')", [digest(state), session, company]);
      const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
      url.search = new URLSearchParams({ client_key: config.key, response_type: "code", scope: scopes.join(","), redirect_uri: config.redirect, state, disable_auto_auth: "1" }).toString();
      return json({ url: url.toString() });
    }
    if (action === "sync") return await withConnection(company, async client => {
      const { rows } = await client.query("SELECT tokens FROM focus_tiktok_connections WHERE company=$1", [company]);
      if (!rows.length) return json({ error: "Conecta primero la cuenta." }, 409);
      let tokens = unseal(rows[0].tokens, company);
      if (tokens.refreshExpires <= Date.now()) return json({ error: "La autorización venció. Vuelve a conectar TikTok." }, 409);
      if (tokens.expires < Date.now() + 60000) {
        const fresh = await tokenRequest({ grant_type: "refresh_token", refresh_token: tokens.refresh_token });
        if (fresh.open_id !== tokens.open_id) throw new Error("La identidad de TikTok cambió. Vuelve a conectar.");
        tokens = fresh;
        await client.query("UPDATE focus_tiktok_connections SET tokens=$2 WHERE company=$1", [company, seal(tokens, company)]);
      }
      const data = await snapshot(tokens.access_token);
      await client.query("UPDATE focus_tiktok_connections SET snapshot=$2::jsonb,updated_at=now() WHERE company=$1", [company, JSON.stringify(data)]);
      await client.query("INSERT INTO focus_tiktok_snapshots(company,snapshot) VALUES($1,$2::jsonb)", [company, JSON.stringify(data)]);
      return json({ configured: true, connected: true, snapshot: data });
    });
    if (action === "disconnect") return await withConnection(company, async client => {
      const { rows } = await client.query("SELECT tokens FROM focus_tiktok_connections WHERE company=$1", [company]);
      let revoked = !rows.length;
      if (rows.length) {
        try {
          const tokens = unseal(rows[0].tokens, company), config = settings();
          const response = await fetch("https://open.tiktokapis.com/v2/oauth/revoke/", { method: "POST", body: new URLSearchParams({ client_key: config.key, client_secret: config.secret, token: tokens.access_token }), signal: AbortSignal.timeout(15000) });
          const data = await response.json(); revoked = response.ok && !data.error;
        } catch { /* Local deletion is still possible if the provider is unavailable. */ }
      }
      await client.query("BEGIN");
      try {
        await client.query("DELETE FROM focus_tiktok_connections WHERE company=$1", [company]);
        await client.query("DELETE FROM focus_tiktok_snapshots WHERE company=$1", [company]);
        await client.query("DELETE FROM focus_tiktok_states WHERE company=$1", [company]);
        await client.query("COMMIT");
      } catch (error) { await client.query("ROLLBACK"); throw error; }
      return json({ configured: true, connected: false, snapshot: null, message: revoked ? "Cuenta desconectada y métricas de conexión eliminadas." : "Datos locales eliminados. Revoca también el acceso a FocusMRK desde TikTok; no pudimos confirmar la revocación." });
    });
    return json({ error: "Acción no válida." }, 400);
  } catch { return json({ error: "No se pudo completar la operación. Revisa la configuración o vuelve a conectar TikTok y autoriza los tres permisos." }, 502); }
}
