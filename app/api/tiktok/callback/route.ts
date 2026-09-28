import { TikTokError, authorize, digest, seal, sessionId, settings, tiktokDb, tokenRequest, withConnection } from "@/lib/tiktok";

export async function GET(request: Request) {
  let stage = "state";
  try {
    const params = new URL(request.url).searchParams, state = params.get("state") || "";
    if (!/^[a-f0-9]{64}$/.test(state)) return new Response("Autorización no válida. Inicia la conexión desde FocusMRK.", { status: 400 });
    stage = "database";
    const db = await tiktokDb();
    const { rows } = await db.query("DELETE FROM focus_tiktok_states WHERE id=$1 AND session=$2 AND expires>now() RETURNING company", [digest(state), sessionId(request)]);
    if (!rows.length) return new Response("La autorización venció o ya se utilizó. Vuelve a conectar desde FocusMRK.", { status: 400 });
    const company = rows[0].company;
    const denied = await authorize(request, company); if (denied) return denied;
    stage = "configuration";
    const config = settings(), back = new URL("/", config.origin);
    back.searchParams.set("module", "company"); back.searchParams.set("company", company); back.searchParams.set("tiktok", params.has("error") ? "cancelled" : "connected");
    if (!params.has("error")) {
      const code = params.get("code"); if (!code || code.length > 4096) return new Response("Código de autorización no válido.", { status: 400 });
      stage = "database_lock";
      await withConnection(company, async client => {
        stage = "token_exchange";
        const tokens = await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: config.redirect });
        stage = "save_connection";
        await client.query("BEGIN");
        try {
          await client.query("INSERT INTO focus_tiktok_connections(company,tokens) VALUES($1,$2) ON CONFLICT(company) DO UPDATE SET tokens=$2,snapshot=NULL,updated_at=now()", [company, seal(tokens, company)]);
          await client.query("DELETE FROM focus_tiktok_snapshots WHERE company=$1", [company]);
          await client.query("COMMIT");
        } catch (error) { await client.query("ROLLBACK"); throw error; }
      });
    }
    return Response.redirect(back, 303);
  } catch (error) {
    const code = error instanceof TikTokError ? error.code : stage;
    const explanations: Record<string, string> = {
      state: "No se pudo validar la sesi?n. Inicia sesi?n en FocusMRK y conecta de nuevo.",
      database: "No se pudo validar la autorizaci?n en la base de datos. Revisa PostgreSQL en Dokploy.",
      configuration: "Revisa las variables de TikTok en Dokploy y la Redirect URI HTTPS.",
      database_lock: "No se pudo preparar la conexi?n en PostgreSQL. Revisa los permisos de la base de datos.",
      save_connection: "La autorizaci?n se recibi? pero no se pudo guardar. Revisa la base de datos y la configuraci?n de cifrado del servidor.",
    };
    // Only controlled codes/stages are logged. Never log callback URLs, codes, tokens or provider bodies.
    console.error("TikTok callback:", code, "stage:", stage);
    const message = error instanceof TikTokError ? error.message : explanations[stage] || "No se pudo completar la conexi?n con TikTok.";
    return new Response(message + "\n\nReferencia: " + code + "\nRegresa a FocusMRK y pulsa Conectar TikTok; no recargues este callback.", { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  }
}
