import { authorize, digest, sessionId, settings, metaDb, withConnection, tokenRequest, seal, MetaError, safeMetaMessage } from "@/lib/meta";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams, state = params.get("state") || "", code = params.get("code") || "";
  const diagnostic = {
    meta_callback_received: true, code_present: !!code, state_present: !!state, state_valid: false,
    redirect_uri: "", token_exchange_status: null as number | null, http_status: null as number | null,
    stage: "state_format", raw_pages_count: null as number | null, usable_pages_count: null as number | null,
    meta_error_type: "", meta_error_code: null as number | null, meta_error_subcode: null as number | null, meta_error_message: "",
  };
  try {
    if (!/^[a-f0-9]{64}$/.test(state)) throw new MetaError("State de Facebook ausente o con formato inválido.", 0, "state_invalid");
    diagnostic.stage = "session";
    const session = sessionId(request);
    diagnostic.stage = "state_lookup";
    const { rows } = await (await metaDb()).query("SELECT company FROM focus_meta_states WHERE id=$1 AND session=$2 AND expires>now()", [digest(state), session]);
    if (!rows.length) throw new MetaError("State de Facebook vencido, utilizado o no asociado a esta sesión.", 0, "state_expired_or_session_mismatch");
    diagnostic.state_valid = true;
    diagnostic.stage = "authorization";
    const company = rows[0].company, denied = await authorize(request, company);
    if (denied) { diagnostic.meta_error_type = "authorization_denied"; diagnostic.meta_error_message = `La sesión no autoriza esta empresa (HTTP ${denied.status}).`; return denied; }
    diagnostic.stage = "settings";
    const config = settings();
    diagnostic.redirect_uri = config.redirect;
    const back = new URL("/", config.origin);
    back.search = new URLSearchParams({ module: "integrations", company, meta: params.has("error") ? "cancelled" : "connected" }).toString();
    await withConnection(company, async client => {
      diagnostic.stage = "state_consume";
      // Consume under the same lock as disconnect; never restore a removed grant.
      const consumed = await client.query("DELETE FROM focus_meta_states WHERE id=$1 AND session=$2 AND company=$3 AND expires>now() RETURNING company", [digest(state), session, company]);
      if (!consumed.rows.length) { diagnostic.state_valid = false; throw new MetaError("State de Facebook vencido o utilizado durante el callback.", 0, "state_already_consumed"); }
      if (params.has("error")) {
        diagnostic.meta_error_type = safeMetaMessage(params.get("error"), [code, state]);
        diagnostic.meta_error_message = safeMetaMessage(params.get("error_description") || "Autorización cancelada en Facebook.", [code, state]);
        return;
      }
      diagnostic.stage = "code_validation";
      if (!code || code.length > 4096) throw new MetaError("Code de Facebook ausente o con longitud inválida.", 0, "code_missing");
      const tokens = await tokenRequest(code, (stage, status, counts) => {
        diagnostic.stage = stage;
        diagnostic.http_status = status;
        if (counts) Object.assign(diagnostic, counts);
        if (stage.endsWith("token_exchange")) {
          diagnostic.token_exchange_status = status;
          if (status !== null) console.info("[meta_oauth_exchange]", JSON.stringify({ stage, token_exchange_status: status }));
        }
      });
      diagnostic.stage = "pages_validation";
      if (!tokens.pages.length) throw new MetaError("Facebook no devolvió ninguna Página autorizada en /me/accounts. Revisa el acceso de tu usuario a la Página y los permisos de la aplicación.", 200, "no_pages");
      diagnostic.stage = "connection_save";
      const previous = await client.query("SELECT snapshot,external_id FROM focus_meta_connections WHERE company=$1", [company]);
      const priorPage = previous.rows[0]?.snapshot?.selectedPage || previous.rows[0]?.external_id;
      const selectedPage = typeof priorPage === "string" && tokens.pages.some(page => page.id === priorPage) ? priorPage : tokens.pages.length === 1 ? tokens.pages[0].id : null;
      // Keep only a selection still authorized by the new grant and rebuild its
      // public snapshot. Never carry forward old tokens or stale metric counts.
      const snapshot = { capturedAt: new Date().toISOString(), selectedPage, accounts: tokens.pages.map(page => ({ facebook: { id: page.id, name: page.name } })) };
      await client.query("INSERT INTO focus_meta_connections(company,tokens,permissions,expires_at,connected_at,status,external_id,snapshot) VALUES($1,$2,$3::jsonb,$4,now(),'connected',$5,$6::jsonb) ON CONFLICT(company) DO UPDATE SET tokens=$2,permissions=$3::jsonb,expires_at=$4,connected_at=now(),status='connected',external_id=$5,snapshot=$6::jsonb,updated_at=now()", [company, seal(tokens, company), JSON.stringify(tokens.permissions), tokens.expires === null ? null : new Date(tokens.expires), selectedPage, JSON.stringify(snapshot)]);
    });
    diagnostic.stage = params.has("error") ? "cancelled" : "connected";
    return new Response(null, { status: 303, headers: { Location: back.href, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } catch (error) {
    diagnostic.meta_error_type = error instanceof MetaError ? safeMetaMessage(error.type, [code, state]) : diagnostic.stage === "session" ? "session_missing" : "internal_error";
    if (error instanceof MetaError) { diagnostic.meta_error_code = error.code; diagnostic.meta_error_subcode = error.subcode; diagnostic.http_status = error.status || null; }
    diagnostic.meta_error_message = error instanceof MetaError || diagnostic.stage === "settings"
      ? safeMetaMessage(error instanceof Error ? error.message : "Error desconocido.", [code, state])
      : diagnostic.stage === "session" ? "No llegó la cookie de sesión de FocusMRK. Inicia sesión y conecta Facebook desde esa misma sesión." : "Fallo interno en la etapa indicada; revisa el servidor.";
    const status = ["state_format", "session", "state_lookup", "state_consume", "code_validation"].includes(diagnostic.stage) ? 400
      : error instanceof MetaError && ["no_pages", "missing_permissions"].includes(error.type) ? 403
      : error instanceof MetaError && error.status >= 400 && error.status <= 599 ? error.status : 502;
    const detail = error instanceof MetaError ? `${error.status ? `Meta HTTP ${error.status}` : "Sin respuesta HTTP de Meta"}: ${diagnostic.meta_error_type}${error.code !== null ? ` (código ${error.code}${error.subcode !== null ? `, subcódigo ${error.subcode}` : ""})` : ""}: ${diagnostic.meta_error_message}` : diagnostic.meta_error_message;
    return new Response(`No se pudo conectar Facebook. Etapa: ${diagnostic.stage}. ${detail} Regresa a Focus y comienza una conexión nueva.`, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } finally { console.info("[meta_callback]", JSON.stringify(diagnostic)); }
}
