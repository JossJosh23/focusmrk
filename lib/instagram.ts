import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { database } from "./database";
export { authorize, digest, sessionId } from "./tiktok";

export const scopes = ["instagram_business_basic"];
export const insightsScope = "instagram_business_manage_insights";
export type Tokens = { access_token: string; user_id: string; permissions: string[]; expires: number; issued: number };
export function settings() {
  const id = process.env.INSTAGRAM_APP_ID?.trim(), secret = process.env.INSTAGRAM_APP_SECRET?.trim(), redirect = process.env.INSTAGRAM_REDIRECT_URI?.trim(), version = process.env.INSTAGRAM_GRAPH_VERSION?.trim();
  const missing = [["INSTAGRAM_APP_ID", id], ["INSTAGRAM_APP_SECRET", secret], ["INSTAGRAM_REDIRECT_URI", redirect], ["INSTAGRAM_GRAPH_VERSION", version]].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) throw new Error("Configura en Dokploy: " + missing.join(", ") + ". Guarda y vuelve a desplegar.");
  if (!id || !secret || !redirect || !version || !/^v\d+\.0$/.test(version)) throw new Error("Revisa INSTAGRAM_GRAPH_VERSION.");
  let url: URL;
  try { url = new URL(redirect); } catch { throw new Error("Revisa INSTAGRAM_REDIRECT_URI."); }
  if (url.protocol !== "https:" || url.pathname !== "/api/instagram/callback" || url.search || url.hash || url.username || url.password) throw new Error("Revisa INSTAGRAM_REDIRECT_URI: debe usar HTTPS y /api/instagram/callback.");
  return { id, secret, redirect, version, origin: url.origin };
}
const key = () => createHash("sha256").update(`focusmrk-instagram:${process.env.INSTAGRAM_TOKEN_KEY || settings().secret}`).digest();
export function seal(value: Tokens, company: string) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(`instagram:${company}`));
  const bytes = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString("base64");
}
export function unseal(value: string, company: string): Tokens {
  const bytes = Buffer.from(value, "base64"), cipher = createDecipheriv("aes-256-gcm", key(), bytes.subarray(0, 12));
  cipher.setAAD(Buffer.from(`instagram:${company}`)); cipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString());
}
export async function instagramDb() {
  const db = await database();
  await db.query("CREATE TABLE IF NOT EXISTS focus_instagram_states(id TEXT PRIMARY KEY, session TEXT NOT NULL, company TEXT NOT NULL, expires TIMESTAMPTZ NOT NULL)");
  await db.query("CREATE TABLE IF NOT EXISTS focus_instagram_connections(company TEXT PRIMARY KEY, tokens TEXT NOT NULL, external_id TEXT NOT NULL, permissions JSONB NOT NULL, expires_at TIMESTAMPTZ NOT NULL, connected_at TIMESTAMPTZ NOT NULL DEFAULT now(), status TEXT NOT NULL DEFAULT 'connected', snapshot JSONB, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  return db;
}
export async function withConnection<T>(company: string, work: (client: import("pg").PoolClient) => Promise<T>) {
  const client = await (await instagramDb()).connect();
  try { await client.query("SELECT pg_advisory_lock(81734924,hashtext($1))", [company]); return await work(client); }
  finally { try { await client.query("SELECT pg_advisory_unlock(81734924,hashtext($1))", [company]); } finally { client.release(); } }
}
export class InstagramError extends Error {
  readonly status: number;
  readonly type: string;
  constructor(message: string, status: number, type: string) { super(message); this.status = status; this.type = type; }
}
export function safeInstagramMessage(value: unknown, sensitive: string[] = []) {
  let message = typeof value === "string" ? value : "Error de Instagram sin mensaje.";
  for (const secret of [process.env.INSTAGRAM_APP_SECRET, process.env.INSTAGRAM_TOKEN_KEY, ...sensitive]) {
    if (secret) for (const form of [secret, encodeURIComponent(secret)]) message = message.split(form).join("[REDACTED]");
  }
  return message.replace(/(?:https?:\/\/)[^\s]+/gi, "[URL REDACTED]").replace(/\b(?:IG[A-Za-z0-9_-]{20,}|EAA[A-Za-z0-9_-]{20,})\b/g, "[REDACTED]").replace(/[\r\n\x00-\x1f]/g, " ").slice(0, 800);
}
type Diagnostic = (stage: string, status: number | null) => void;
async function responseData(response: Response, sensitive: string[] = []) {
  const text = await response.text();
  let value;
  try {
    // Preserve the original digits before JS rounds provider IDs larger than 2^53.
    value = JSON.parse(text, (key: string, value: unknown, context?: { source?: string }) => {
      if (["id", "user_id"].includes(key) && typeof value === "number") {
        if (context?.source && /^\d+$/.test(context.source)) return context.source;
        if (Number.isSafeInteger(value) && value >= 0) return String(value);
        throw new InstagramError("No se pudo conservar el identificador numérico de Instagram sin pérdida de precisión.", response.status, "id_precision_error");
      }
      return value;
    });
  } catch (error) {
    if (error instanceof InstagramError) throw error;
    throw new InstagramError("Instagram devolvió una respuesta no válida. Vuelve a conectar.", response.status, "invalid_response");
  }
  if (!response.ok || !value || value.error || value.error_type) {
    const error = value?.error;
    throw new InstagramError(safeInstagramMessage(error?.message || value?.error_message || value?.message, sensitive), response.status, safeInstagramMessage(error?.type || value?.error_type || (typeof error === "string" ? error : "provider_error"), sensitive));
  }
  return value;
}
async function tokenExchange(params: Record<string, string>, diagnostic?: Diagnostic) {
  const url = new URL("https://graph.instagram.com/access_token");
  url.search = new URLSearchParams(params).toString();
  diagnostic?.("long_lived_token_exchange", null);
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  diagnostic?.("long_lived_token_exchange", response.status);
  return responseData(response, Object.values(params));
}
export async function graph(path: string, token: string, fields: string, diagnostic?: Diagnostic) {
  const url = new URL(`https://graph.instagram.com/${settings().version}/${path}`);
  url.searchParams.set("fields", fields);
  diagnostic?.("profile_request", null);
  let response: Response;
  try { response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15000) }); }
  catch (error) { throw new InstagramError(error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name) ? "La consulta del perfil de Instagram superó el tiempo de espera." : "No se pudo contactar con Instagram para consultar el perfil.", 0, "profile_network_error"); }
  diagnostic?.("profile_request", response.status);
  const data = await responseData(response, [token]);
  diagnostic?.("profile_validation", response.status);
  return data;
}
export async function snapshot(tokens: Tokens, diagnostic?: Diagnostic) {
  if (tokens.expires <= Date.now()) throw new Error("La autorización de Instagram venció. Vuelve a conectar.");
  const user = await graph("me", tokens.access_token, "id,user_id,username", diagnostic);
  const profileId = typeof user.id === "string" && /^\d+$/.test(user.id) ? user.id : "";
  const profileUserId = typeof user.user_id === "string" && /^\d+$/.test(user.user_id) ? user.user_id : "";
  if (!profileId && !profileUserId) throw new InstagramError("El perfil de Instagram no devolvió un identificador válido.", 200, "profile_id_missing");
  // Match like-for-like against both returned identifiers, without assuming
  // that id and user_id are interchangeable. Never accept an unrelated profile.
  const id = profileId === tokens.user_id ? profileId : profileUserId === tokens.user_id ? profileUserId : "";
  if (!id) {
    console.info("[instagram_profile_identity]", JSON.stringify({ token_id_type: typeof tokens.user_id, profile_id_type: typeof user.id, profile_user_id_type: typeof user.user_id, profile_id_present: !!profileId, profile_user_id_present: !!profileUserId, token_matches_id: false, token_matches_user_id: false }));
    throw new InstagramError("Ni id ni user_id del perfil coinciden exactamente con el user_id recibido al intercambiar el código de Instagram.", 200, "profile_id_mismatch");
  }
  if (typeof user.username !== "string" || !user.username.trim()) throw new InstagramError("El perfil de Instagram no devolvió un username válido.", 200, "profile_username_missing");
  // Explicit allowlist: never store or return an entire provider response.
  return { capturedAt: new Date().toISOString(), instagram: { id, username: user.username } };
}
export async function tokenRequest(code: string, diagnostic?: Diagnostic): Promise<Tokens> {
  const config = settings();
  const body = new URLSearchParams({ client_id: config.id, client_secret: config.secret, grant_type: "authorization_code", redirect_uri: config.redirect, code });
  const response = await fetch("https://api.instagram.com/oauth/access_token", { method: "POST", body, cache: "no-store", signal: AbortSignal.timeout(15000) });
  diagnostic?.("code_token_exchange", response.status);
  const raw = await responseData(response, [code]);
  const first = Array.isArray(raw.data) && raw.data.length === 1 && !raw.access_token ? raw.data[0] : raw;
  if (!first || typeof first.access_token !== "string" || !first.access_token || !/^\d+$/.test(String(first.user_id))) throw new Error("Instagram no devolvió una autorización válida.");
  const granted = Array.isArray(first.permissions) ? first.permissions : typeof first.permissions === "string" ? first.permissions.split(",").map((p: string) => p.trim()) : null;
  if (granted && !scopes.every(scope => granted.includes(scope))) throw new Error("Autoriza instagram_business_basic para conectar Instagram.");
  const long = await tokenExchange({ grant_type: "ig_exchange_token", client_secret: config.secret, access_token: first.access_token }, diagnostic);
  diagnostic?.("long_token_validation", 200);
  if (typeof long.access_token !== "string" || !long.access_token || !Number.isFinite(long.expires_in) || long.expires_in <= 0) throw new InstagramError("Instagram no confirmó la vigencia del token: access_token o expires_in inválido.", 200, "long_token_invalid");
  const permissions = granted ? [...new Set<string>(granted.filter((permission: unknown) => typeof permission === "string" && [...scopes, insightsScope].includes(permission)))] : scopes;
  const tokens = { access_token: long.access_token, user_id: String(first.user_id), permissions, expires: Date.now() + long.expires_in * 1000, issued: Date.now() };
  // Basic-profile access confirms the mandatory permission. Insight access
  // remains optional and is retained only when explicitly granted by Instagram.
  await snapshot(tokens, diagnostic);
  return tokens;
}
export async function refresh(tokens: Tokens): Promise<Tokens> {
  const now = Date.now();
  if (tokens.expires <= now) throw new Error("La autorización de Instagram venció. Vuelve a conectar.");
  if (now - tokens.issued < 86400000 || tokens.expires - now > 7 * 86400000) return tokens;
  const url = new URL("https://graph.instagram.com/refresh_access_token");
  url.search = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: tokens.access_token }).toString();
  const data = await responseData(await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) }), [tokens.access_token]);
  if (typeof data.access_token !== "string" || !data.access_token || !Number.isFinite(data.expires_in) || data.expires_in <= 0) throw new Error("Instagram no confirmó la renovación del token.");
  return { ...tokens, access_token: data.access_token, issued: now, expires: now + data.expires_in * 1000 };
}
