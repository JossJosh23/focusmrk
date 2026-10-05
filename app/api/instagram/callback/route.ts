import { authorize, digest, sessionId, settings, instagramDb, withConnection, tokenRequest, seal, snapshot, InstagramError, safeInstagramMessage } from "@/lib/instagram";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams, state = params.get("state") || "", code = params.get("code") || "";
  const diagnostic = { instagram_callback_received: true, code_present: !!code, state_present: !!state, state_valid: false, redirect_uri: process.env.INSTAGRAM_REDIRECT_URI?.trim() || "", token_exchange_status: null as number | null, stage: "state_format", instagram_error_type: "", instagram_error_message: "" };
  try {
    if (!/^[a-f0-9]{64}$/.test(state)) throw new Error("State de Instagram ausente o con formato inválido.");
    diagnostic.stage = "session";
    const session = sessionId(request);
    diagnostic.stage = "state_lookup";
    const { rows } = await (await instagramDb()).query("SELECT company FROM focus_instagram_states WHERE id=$1 AND session=$2 AND expires>now()", [digest(state), session]);
    if (!rows.length) throw new Error("State de Instagram vencido, utilizado o no asociado a esta sesión.");
    diagnostic.state_valid = true;
    diagnostic.stage = "authorization";
    const company = rows[0].company, denied = await authorize(request, company);
    if (denied) { diagnostic.instagram_error_type = "authorization_denied"; diagnostic.instagram_error_message = `La sesión no autoriza esta empresa (HTTP ${denied.status}).`; return denied; }
    diagnostic.stage = "settings";
    const back = new URL("/", settings().origin);
    back.search = new URLSearchParams({ module: "integrations", company, instagram: params.has("error") ? "cancelled" : "connected" }).toString();
    await withConnection(company, async client => {
      diagnostic.stage = "state_consume";
      const consumed = await client.query("DELETE FROM focus_instagram_states WHERE id=$1 AND session=$2 AND company=$3 AND expires>now() RETURNING company", [digest(state), session, company]);
      if (!consumed.rows.length) { diagnostic.state_valid = false; throw new Error("State de Instagram vencido o utilizado durante el callback."); }
      if (!params.has("error")) {
        diagnostic.stage = "code_validation";
        if (!code || code.length > 4096) throw new Error("Code de Instagram ausente o con longitud inválida.");
        diagnostic.stage = "code_token_exchange";
        const tokens = await tokenRequest(code, (stage, status) => {
          diagnostic.stage = stage;
          if (stage.endsWith("token_exchange")) {
            diagnostic.token_exchange_status = status;
            if (status !== null) console.info("[instagram_oauth_exchange]", JSON.stringify({ stage, token_exchange_status: status }));
          } else if (stage === "profile_request" && status !== null) console.info("[instagram_profile]", JSON.stringify({ stage, http_status: status }));
          if (stage === "code_token_exchange" && status !== null && status >= 200 && status < 300) diagnostic.stage = "short_token_validation";
        });
        diagnostic.stage = "snapshot";
        const data = await snapshot(tokens);
        diagnostic.stage = "save_connection";
        await client.query("INSERT INTO focus_instagram_connections(company,tokens,external_id,permissions,expires_at,snapshot) VALUES($1,$2,$3,$4::jsonb,$5,$6::jsonb) ON CONFLICT(company) DO UPDATE SET tokens=$2,external_id=$3,permissions=$4::jsonb,expires_at=$5,snapshot=$6::jsonb,connected_at=now(),status='connected',updated_at=now()", [company, seal(tokens, company), tokens.user_id, JSON.stringify(tokens.permissions), new Date(tokens.expires), JSON.stringify(data)]);
      } else { diagnostic.instagram_error_type = safeInstagramMessage(params.get("error"), [code, state]); diagnostic.instagram_error_message = safeInstagramMessage(params.get("error_description") || "Autorización cancelada en Instagram.", [code, state]); }
    });
    diagnostic.stage = params.has("error") ? "cancelled" : "connected";
    return new Response(null, { status: 303, headers: { Location: back.href, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } catch (error) {
    diagnostic.instagram_error_type = error instanceof InstagramError ? error.type : error instanceof Error ? error.name : "unknown_error";
    if (error instanceof InstagramError) console.info("[instagram_provider_error]", JSON.stringify({ stage: diagnostic.stage, http_status: error.status, instagram_error_type: error.type, instagram_error_message: error.message }));
    diagnostic.instagram_error_message = error instanceof InstagramError || ["state_format", "state_lookup", "state_consume", "code_validation", "settings"].includes(diagnostic.stage)
      ? safeInstagramMessage(error instanceof Error ? error.message : "Error desconocido.", [code, state])
      : diagnostic.stage === "session" ? "No llegó la cookie de sesión de FocusMRK." : "Fallo interno en la etapa indicada; revisa el servidor.";
    const status = error instanceof InstagramError && [400, 401].includes(error.status) ? error.status : 400;
    const detail = error instanceof InstagramError ? ` ${error.status ? `Instagram HTTP ${error.status}` : "Sin respuesta HTTP de Instagram"}: ${diagnostic.instagram_error_type}: ${diagnostic.instagram_error_message}` : ` ${diagnostic.instagram_error_message}`;
    return new Response(`No se pudo conectar Instagram. Etapa: ${diagnostic.stage}.${detail} Regresa a Focus MRKT e inicia una conexión nueva.`, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } finally { console.info("[instagram_callback]", JSON.stringify(diagnostic)); }
}
