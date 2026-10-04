import { randomBytes } from "node:crypto";
import { authorize, digest, sessionId, settings, scopes, metaDb, withConnection, unseal, snapshot } from "@/lib/meta";
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: Request) {
  const company = new URL(request.url).searchParams.get("company") || "";
  const denied = await authorize(request, company); if (denied) return denied;
  try {
    let configured = true, message = ""; try { settings(); } catch (error) { configured = false; message = error instanceof Error ? error.message : "Revisa las variables de Meta."; }
    const { rows } = await (await metaDb()).query("SELECT snapshot FROM focus_meta_connections WHERE company=$1", [company]);
    return json({ configured, connected: !!rows.length, snapshot: rows[0]?.snapshot || null, message });
  } catch { return json({ error: "No se pudo cargar la conexión de Meta." }, 503); }
}
export async function POST(request: Request) {
  const company = new URL(request.url).searchParams.get("company") || "";
  const denied = await authorize(request, company); if (denied) return denied;
  try {
    const { action, pageId } = await request.json();
    if (action === "connect") {
      const config = settings(), state = randomBytes(32).toString("hex"), db = await metaDb(), session = sessionId(request);
      await db.query("DELETE FROM focus_meta_states WHERE expires<now() OR (session=$1 AND company=$2)", [session, company]);
      await db.query("INSERT INTO focus_meta_states VALUES($1,$2,$3,now()+interval '10 minutes')", [digest(state), session, company]);
      const url = new URL(`https://www.facebook.com/${config.version}/dialog/oauth`);
      url.search = new URLSearchParams({ client_id: config.id, redirect_uri: config.redirect, state, scope: scopes.join(","), response_type: "code", auth_type: "rerequest" }).toString();
      return json({ url: url.href });
    }
    if (action === "sync" || action === "select" || action === "disconnect") return await withConnection(company, async client => {
      if (action === "disconnect") {
        await client.query("BEGIN");
        try { await client.query("DELETE FROM focus_meta_connections WHERE company=$1", [company]); await client.query("DELETE FROM focus_meta_states WHERE company=$1", [company]); await client.query("COMMIT"); }
        catch (error) { await client.query("ROLLBACK"); throw error; }
        return json({ configured: true, connected: false, snapshot: null, message: "Conexión local eliminada. Puedes revocar el acceso a Focus desde las integraciones comerciales de Facebook." });
      }
      const { rows } = await client.query("SELECT tokens FROM focus_meta_connections WHERE company=$1", [company]);
      if (!rows.length) return json({ error: "Conecta primero Meta." }, 409);
      const tokens = unseal(rows[0].tokens, company);
      const data = await snapshot(tokens);
      if (action === "select" && (typeof pageId !== "string" || !data.accounts.some(a => a.facebook.id === pageId))) return json({ error: "Selecciona una página autorizada." }, 400);
      // Preserve the selected page when refreshing this company's authorized accounts.
      const previous = await client.query("SELECT snapshot FROM focus_meta_connections WHERE company=$1", [company]);
      const selectedPage = action === "select" ? pageId : previous.rows[0]?.snapshot?.selectedPage || (data.accounts.length === 1 ? data.accounts[0].facebook.id : null);
      const result = { ...data, selectedPage };
      await client.query("UPDATE focus_meta_connections SET snapshot=$2::jsonb,updated_at=now() WHERE company=$1", [company, JSON.stringify(result)]);
      return json({ configured: true, connected: true, snapshot: result });
    });
    return json({ error: "Acción no válida." }, 400);
  } catch (error) { return json({ error: error instanceof Error && /^(Meta |Autoriza |La autorización|Configura |Revisa |No se pudo completar la lista)/.test(error.message) ? error.message : "No se pudo completar la conexión de Meta. Revisa la configuración y vuelve a conectar." }, 502); }
}
