import { authorize, digest, sessionId, settings, metaDb, withConnection, tokenRequest, seal } from "@/lib/meta";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams, state = params.get("state") || "";
    if (!/^[a-f0-9]{64}$/.test(state)) throw new Error();
    const { rows } = await (await metaDb()).query("DELETE FROM focus_meta_states WHERE id=$1 AND session=$2 AND expires>now() RETURNING company", [digest(state), sessionId(request)]);
    if (!rows.length) throw new Error();
    const company = rows[0].company, denied = await authorize(request, company); if (denied) return denied;
    const back = new URL("/", settings().origin);
    back.search = new URLSearchParams({ module: "company", company, meta: params.has("error") ? "cancelled" : "connected" }).toString();
    if (!params.has("error")) {
      const code = params.get("code"); if (!code || code.length > 4096) throw new Error();
      await withConnection(company, async client => {
        const tokens = await tokenRequest(code);
        if (!tokens.pages.length) throw new Error();
        await client.query("INSERT INTO focus_meta_connections(company,tokens) VALUES($1,$2) ON CONFLICT(company) DO UPDATE SET tokens=$2,snapshot=NULL,updated_at=now()", [company, seal(tokens, company)]);
      });
    }
    return Response.redirect(back, 303);
  } catch { return new Response("No se pudo conectar Meta. Revisa la sesión, las credenciales, la URL de retorno y los permisos. Debes autorizar al menos una página. Regresa a Focus y vuelve a conectar.", { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } }); }
}
