import { authorize, digest, sessionId, settings, instagramDb, withConnection, tokenRequest, seal, snapshot } from "@/lib/instagram";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams, state = params.get("state") || "";
    if (!/^[a-f0-9]{64}$/.test(state)) throw new Error();
    const { rows } = await (await instagramDb()).query("SELECT company FROM focus_instagram_states WHERE id=$1 AND session=$2 AND expires>now()", [digest(state), sessionId(request)]);
    if (!rows.length) throw new Error();
    const company = rows[0].company, denied = await authorize(request, company); if (denied) return denied;
    const back = new URL("/", settings().origin);
    back.search = new URLSearchParams({ module: "integrations", company, instagram: params.has("error") ? "cancelled" : "connected" }).toString();
    await withConnection(company, async client => {
      const consumed = await client.query("DELETE FROM focus_instagram_states WHERE id=$1 AND session=$2 AND company=$3 AND expires>now() RETURNING company", [digest(state), sessionId(request), company]);
      if (!consumed.rows.length) throw new Error();
      if (!params.has("error")) {
        const code = params.get("code"); if (!code || code.length > 4096) throw new Error();
        const tokens = await tokenRequest(code), data = await snapshot(tokens);
        await client.query("INSERT INTO focus_instagram_connections(company,tokens,external_id,permissions,expires_at,snapshot) VALUES($1,$2,$3,$4::jsonb,$5,$6::jsonb) ON CONFLICT(company) DO UPDATE SET tokens=$2,external_id=$3,permissions=$4::jsonb,expires_at=$5,snapshot=$6::jsonb,connected_at=now(),status='connected',updated_at=now()", [company, seal(tokens, company), tokens.user_id, JSON.stringify(tokens.permissions), new Date(tokens.expires), JSON.stringify(data)]);
      }
    });
    return new Response(null, { status: 303, headers: { Location: back.href, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } catch { return new Response("No se pudo conectar Instagram. Revisa tu sesión, las credenciales de Instagram, la URL de retorno y los permisos. Regresa a Focus MRKT e inicia una conexión nueva.", { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } }); }
}
