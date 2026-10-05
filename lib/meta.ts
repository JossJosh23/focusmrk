import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import { database } from "./database";
export { authorize, digest, sessionId } from "./tiktok";

export const scopes = ["pages_show_list", "pages_read_engagement"];
export const insightsScope = "read_insights";
export function settings() {
  const id = process.env.META_APP_ID?.trim(), secret = process.env.META_APP_SECRET?.trim(), redirect = process.env.META_REDIRECT_URI?.trim(), version = process.env.META_GRAPH_VERSION?.trim();
  const missing = [["META_APP_ID", id], ["META_APP_SECRET", secret], ["META_REDIRECT_URI", redirect], ["META_GRAPH_VERSION", version]].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) throw new Error("Configura en el servicio de Focus en Dokploy: " + missing.join(", ") + ". Guarda y vuelve a desplegar.");
  if (!id || !secret || !redirect || !version) throw new Error("Configura las variables de Meta en el servidor.");
  if (!/^v\d+\.0$/.test(version)) throw new Error("Revisa META_GRAPH_VERSION: usa la versión de tu app con formato v seguido del número y .0; no uses el texto versión_del_panel_de_Meta.");
  let url: URL;
  try { url = new URL(redirect); } catch { throw new Error("Revisa META_REDIRECT_URI: debe ser una URL HTTPS válida terminada en /api/meta/callback."); }
  if (url.protocol !== "https:" || url.pathname !== "/api/meta/callback" || url.search || url.hash || url.username || url.password) throw new Error("Revisa META_REDIRECT_URI.");
  return { id, secret, redirect, version, origin: url.origin };
}
export type Page = { id: string; name: string; access_token: string };
export type Tokens = { access_token: string; expires: number | null; noExpiration?: boolean; pages: Page[]; permissions?: string[] };
export function tokenExpired(tokens: Tokens, now = Date.now()) {
  // A null deadline is valid only when inspection explicitly confirmed no
  // expiration. Missing or malformed legacy expiry data never implies that.
  return tokens.expires === null ? tokens.noExpiration !== true : !Number.isFinite(tokens.expires) || !Number.isFinite(new Date(tokens.expires).getTime()) || tokens.expires <= now;
}
const key = () => createHash("sha256").update(`focusmrk-meta:${process.env.META_TOKEN_KEY || settings().secret}`).digest();
export function seal(value: Tokens, company: string) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(company));
  const data = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64");
}
export function unseal(value: string, company: string): Tokens {
  const bytes = Buffer.from(value, "base64"), cipher = createDecipheriv("aes-256-gcm", key(), bytes.subarray(0, 12));
  cipher.setAAD(Buffer.from(company)); cipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString());
}
export async function metaDb() {
  const db = await database();
  await db.query("CREATE TABLE IF NOT EXISTS focus_meta_states(id TEXT PRIMARY KEY, session TEXT NOT NULL, company TEXT NOT NULL, expires TIMESTAMPTZ NOT NULL)");
  await db.query("CREATE TABLE IF NOT EXISTS focus_meta_connections(company TEXT PRIMARY KEY, tokens TEXT NOT NULL, snapshot JSONB, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  // Keep the existing Facebook rows and encryption key; never copy them into Instagram.
  await db.query("ALTER TABLE focus_meta_connections ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'facebook', ADD COLUMN IF NOT EXISTS external_id TEXT, ADD COLUMN IF NOT EXISTS permissions JSONB, ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'connected'");
  return db;
}
export function publicSnapshot(value: { capturedAt: string; selectedPage?: string | null; accounts: { facebook: { id: string; name: string; followers?: number; likes?: number } }[] } | null) {
  if (!value) return null;
  return { capturedAt: value.capturedAt, selectedPage: value.selectedPage || null, accounts: value.accounts.map(({ facebook }) => ({ facebook: { id: facebook.id, name: facebook.name, followers: facebook.followers, likes: facebook.likes } })) };
}
export async function withConnection<T>(company: string, work: (client: import("pg").PoolClient) => Promise<T>) {
  const client = await (await metaDb()).connect();
  try { await client.query("SELECT pg_advisory_lock(81734923,hashtext($1))", [company]); return await work(client); }
  finally { try { await client.query("SELECT pg_advisory_unlock(81734923,hashtext($1))", [company]); } finally { client.release(); } }
}
export class MetaError extends Error {
  readonly status: number;
  readonly type: string;
  readonly code: number | null;
  readonly subcode: number | null;
  constructor(message: string, status: number, type: string, code: number | null = null, subcode: number | null = null) {
    super(message); this.status = status; this.type = type; this.code = code; this.subcode = subcode;
  }
}
export function safeMetaMessage(value: unknown, sensitive: string[] = []) {
  let message = typeof value === "string" ? value : "Meta no devolvió un mensaje de error.";
  for (const secret of [process.env.META_APP_SECRET, process.env.META_TOKEN_KEY, ...sensitive]) {
    if (secret) for (const form of [secret, encodeURIComponent(secret)]) message = message.split(form).join("[REDACTED]");
  }
  return message.replace(/https?:\/\/[^\s]+/gi, "[URL REDACTED]").replace(/\b(?:EAA|IG)[A-Za-z0-9_-]{20,}\b/g, "[REDACTED]").replace(/[\r\n\x00-\x1f]/g, " ").slice(0, 800);
}
type Diagnostic = (stage: string, status: number | null, counts?: { raw_pages_count: number; usable_pages_count: number }) => void;
async function responseData(response: Response, sensitive: string[]) {
  let value;
  try {
    value = JSON.parse(await response.text(), (key: string, value: unknown, context?: { source?: string }) => {
      if (["id", "app_id", "user_id"].includes(key) && typeof value === "number") {
        if (context?.source && /^\d+$/.test(context.source)) return context.source;
        if (Number.isSafeInteger(value) && value >= 0) return String(value);
        throw new MetaError("No se pudo conservar un identificador de Meta sin pérdida de precisión.", response.status, key === "id" ? "page_response_invalid" : "token_debug_invalid");
      }
      return value;
    });
  } catch (error) {
    if (error instanceof MetaError) throw error;
    throw new MetaError("Meta devolvió una respuesta JSON no válida.", response.status, "invalid_response");
  }
  if (!response.ok || value?.error) {
    const error = value?.error;
    throw new MetaError(safeMetaMessage(error?.message || value?.message, sensitive), response.status,
      safeMetaMessage(error?.type || "provider_error", sensitive),
      Number.isSafeInteger(error?.code) ? error.code : null, Number.isSafeInteger(error?.error_subcode) ? error.error_subcode : null);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new MetaError("Meta devolvió una respuesta no válida.", response.status, "invalid_response");
  return value;
}
async function providerFetch(url: URL, init: RequestInit) {
  try { return await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(15000) }); }
  catch (error) {
    throw new MetaError(error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name) ? "La solicitud a Meta superó el tiempo de espera." : "No se pudo contactar con Meta.", 0, "network_error");
  }
}
export async function graph(path: string, token: string, params: Record<string, string> = {}, diagnostic?: Diagnostic) {
  const config = settings(), url = new URL(`https://graph.facebook.com/${config.version}/${path}`);
  url.search = new URLSearchParams({ ...params, appsecret_proof: createHmac("sha256", config.secret).update(token).digest("hex") }).toString();
  const stage = path === "me/permissions" ? "permissions_request" : path === "me/accounts" ? "pages_request" : "profile_request";
  diagnostic?.(stage, null);
  const response = await providerFetch(url, { headers: { Authorization: `Bearer ${token}` } });
  diagnostic?.(stage, response.status);
  return responseData(response, [token, url.searchParams.get("appsecret_proof") || ""]);
}
async function exchange(params: Record<string, string>, stage: string, diagnostic?: Diagnostic) {
  const config = settings(), url = new URL(`https://graph.facebook.com/${config.version}/oauth/access_token`);
  url.search = new URLSearchParams({ client_id: config.id, client_secret: config.secret, ...params }).toString();
  diagnostic?.(stage, null);
  const response = await providerFetch(url, {});
  diagnostic?.(stage, response.status);
  const data = await responseData(response, Object.values(params));
  if (typeof data.access_token !== "string" || !data.access_token.trim()) throw new MetaError("Meta no devolvió un access token válido.", response.status, "token_invalid");
  return data;
}
function seconds(value: unknown) {
  const number = typeof value === "number" ? value : typeof value === "string" && /^\d+$/.test(value) ? Number(value) : NaN;
  return Number.isSafeInteger(number) && number >= 0 && number <= 8640000000000 ? number : null;
}
async function tokenLifetime(data: { access_token: string; expires_in?: unknown; expires?: unknown }, diagnostic?: Diagnostic): Promise<{ expires: number | null; noExpiration?: boolean }> {
  diagnostic?.("token_validation", 200);
  const now = Date.now();
  const durations = [["expires_in", seconds(data.expires_in)], ["expires", seconds(data.expires)]] as const;
  const confirmed = durations.filter((entry): entry is readonly ["expires_in" | "expires", number] => entry[1] !== null && entry[1] > 0 && Number.isFinite(new Date(now + entry[1] * 1000).getTime())).sort((a, b) => a[1] - b[1])[0];
  console.info("[meta_token_lifetime]", JSON.stringify({ expires_in_present: data.expires_in !== undefined, expires_in_type: typeof data.expires_in, expires_present: data.expires !== undefined, expires_type: typeof data.expires, lifetime_source: confirmed?.[0] || "debug_token" }));
  if (confirmed) return { expires: now + confirmed[1] * 1000 };

  // Inspect the final token instead of guessing a lifetime or borrowing the
  // first token's expiry. App credentials stay in the server's auth header.
  const config = settings(), appToken = `${config.id}|${config.secret}`;
  const url = new URL(`https://graph.facebook.com/${config.version}/debug_token`);
  url.searchParams.set("input_token", data.access_token);
  diagnostic?.("token_debug_request", null);
  const response = await providerFetch(url, { headers: { Authorization: `Bearer ${appToken}` } });
  diagnostic?.("token_debug_request", response.status);
  const result = await responseData(response, [data.access_token, appToken]);
  diagnostic?.("token_debug_validation", response.status);
  const inspected = result.data;
  if (inspected?.error) {
    const error = inspected.error;
    throw new MetaError(safeMetaMessage(error.message, [data.access_token, appToken]), response.status, safeMetaMessage(error.type || "token_debug_invalid", [data.access_token, appToken]), Number.isSafeInteger(error.code) ? error.code : null, Number.isSafeInteger(error.error_subcode ?? error.subcode) ? (error.error_subcode ?? error.subcode) : null);
  }
  if (!inspected || inspected.is_valid !== true || inspected.type !== "USER" || inspected.app_id !== config.id || typeof inspected.user_id !== "string" || !/^[1-9]\d*$/.test(inspected.user_id)) {
    throw new MetaError("Meta no confirmó un token de usuario válido para esta aplicación de Facebook.", response.status, "token_debug_invalid");
  }
  const expiresAt = seconds(inspected.expires_at), accessExpiresAt = seconds(inspected.data_access_expires_at);
  if (expiresAt === null || (inspected.data_access_expires_at != null && accessExpiresAt === null)) throw new MetaError("Meta no devolvió una vigencia verificable en la inspección del token.", response.status, "token_lifetime_unknown");
  const deadlines = [expiresAt, accessExpiresAt].filter((value): value is number => value !== null && value > 0).map(value => value * 1000);
  if (deadlines.some(value => value <= Date.now())) throw new MetaError("La autorización de Facebook o su acceso a datos ya venció según Meta. Inicia una autorización nueva.", response.status, "token_expired");
  if (deadlines.length) return { expires: Math.min(...deadlines) };
  if (expiresAt === 0 && accessExpiresAt === 0) return { expires: null, noExpiration: true };
  throw new MetaError("Meta no confirmó una fecha de vigencia ni la ausencia de vencimiento del acceso a datos.", response.status, "token_lifetime_unknown");
}
export async function tokenRequest(code: string, diagnostic?: Diagnostic): Promise<Tokens> {
  const first = await exchange({ code, redirect_uri: settings().redirect }, "code_token_exchange", diagnostic);
  const data = await exchange({ grant_type: "fb_exchange_token", fb_exchange_token: first.access_token }, "long_lived_token_exchange", diagnostic);
  const lifetime = await tokenLifetime(data, diagnostic);
  const permissions = await graph("me/permissions", data.access_token, {}, diagnostic);
  diagnostic?.("permissions_validation", 200);
  if (!Array.isArray(permissions.data)) throw new MetaError("Meta no devolvió una lista de permisos válida.", 200, "permissions_response_invalid");
  const granted: string[] = [...new Set<string>(permissions.data.filter((p: { permission?: string; status?: string } | null) => p?.status === "granted" && typeof p.permission === "string").map((p: { permission: string }) => p.permission))];
  const missing = scopes.filter(scope => !granted.includes(scope));
  if (missing.length) throw new MetaError(`Autoriza los permisos de Facebook: ${missing.join(", ")}.`, 200, "missing_permissions");
  const pages: Page[] = [], cursors = new Set<string>(); let after = "", rawCount = 0;
  for (let n = 0; n < 100; n++) {
    const result = await graph("me/accounts", data.access_token, { fields: "id,name,access_token", limit: "100", ...(after ? { after } : {}) }, diagnostic);
    diagnostic?.("pages_validation", 200);
    if (!Array.isArray(result.data)) throw new MetaError("Meta no devolvió una lista de Páginas válida.", 200, "page_response_invalid");
    rawCount += result.data.length;
    let invalid = false;
    for (const page of result.data) {
      if (!page || typeof page.id !== "string" || !page.id.trim() || typeof page.name !== "string" || !page.name.trim() || typeof page.access_token !== "string" || !page.access_token.trim()) { invalid = true; continue; }
      if (!pages.some(existing => existing.id === page.id)) pages.push({ id: page.id, name: page.name, access_token: page.access_token });
    }
    diagnostic?.("pages_validation", 200, { raw_pages_count: rawCount, usable_pages_count: pages.length });
    if (invalid) throw new MetaError("Meta devolvió Páginas con un identificador, nombre o token ausente o inválido.", 200, "page_response_invalid");
    if (!result.paging?.next) {
      const tokens = { access_token: data.access_token, ...lifetime, pages, permissions: granted };
      if (tokenExpired(tokens)) throw new MetaError("La autorización de Facebook venció antes de completar la conexión. Inicia una autorización nueva.", 200, "token_expired");
      return tokens;
    }
    diagnostic?.("pages_pagination", 200);
    if (typeof result.paging?.cursors?.after !== "string" || !result.paging.cursors.after || cursors.has(result.paging.cursors.after)) break;
    after = result.paging.cursors.after;
    cursors.add(after);
  }
  throw new MetaError("No se pudo completar la lista de Páginas autorizadas: paginación inválida o demasiado extensa.", 200, "pages_pagination_invalid");
}
export async function snapshot(tokens: Tokens) {
  if (tokenExpired(tokens)) throw new Error("La autorización venció. Vuelve a conectar Meta.");
  return { capturedAt: new Date().toISOString(), accounts: await Promise.all(tokens.pages.map(async page => {
    const facebook = await graph(page.id, page.access_token, { fields: "id,name,followers_count,fan_count" });
    return { facebook: { id: facebook.id, name: facebook.name, followers: facebook.followers_count, likes: facebook.fan_count } };
  })) };
}
