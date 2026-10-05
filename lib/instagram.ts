import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { database } from "./database";
export { authorize, digest, sessionId } from "./tiktok";

export const scopes = ["instagram_business_basic"];
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
async function responseData(response: Response) {
  const value = await response.json().catch(() => { throw new Error("Instagram devolvió una respuesta no válida. Vuelve a conectar."); });
  if (!response.ok || !value || value.error) throw new Error("Instagram rechazó la solicitud. Revisa la autorización y vuelve a conectar.");
  return value;
}
async function tokenExchange(params: Record<string, string>) {
  const url = new URL("https://graph.instagram.com/access_token");
  url.search = new URLSearchParams(params).toString();
  return responseData(await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) }));
}
export async function graph(path: string, token: string, fields: string) {
  const url = new URL(`https://graph.instagram.com/${settings().version}/${path}`);
  url.searchParams.set("fields", fields);
  return responseData(await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15000) }));
}
export async function snapshot(tokens: Tokens) {
  if (tokens.expires <= Date.now()) throw new Error("La autorización de Instagram venció. Vuelve a conectar.");
  const user = await graph("me", tokens.access_token, "user_id,username");
  const id = String(user.user_id || user.id || "");
  if (id !== tokens.user_id || typeof user.username !== "string") throw new Error("Instagram no confirmó la cuenta autorizada.");
  // Explicit allowlist: never store or return an entire provider response.
  return { capturedAt: new Date().toISOString(), instagram: { id, username: user.username } };
}
export async function tokenRequest(code: string): Promise<Tokens> {
  const config = settings();
  const body = new URLSearchParams({ client_id: config.id, client_secret: config.secret, grant_type: "authorization_code", redirect_uri: config.redirect, code });
  const raw = await responseData(await fetch("https://api.instagram.com/oauth/access_token", { method: "POST", body, cache: "no-store", signal: AbortSignal.timeout(15000) }));
  const first = Array.isArray(raw.data) && raw.data.length === 1 && !raw.access_token ? raw.data[0] : raw;
  if (!first || typeof first.access_token !== "string" || !first.access_token || !/^\d+$/.test(String(first.user_id))) throw new Error("Instagram no devolvió una autorización válida.");
  const granted = Array.isArray(first.permissions) ? first.permissions : typeof first.permissions === "string" ? first.permissions.split(",").map((p: string) => p.trim()) : null;
  if (granted && !scopes.every(scope => granted.includes(scope))) throw new Error("Autoriza instagram_business_basic para conectar Instagram.");
  const long = await tokenExchange({ grant_type: "ig_exchange_token", client_secret: config.secret, access_token: first.access_token });
  if (typeof long.access_token !== "string" || !long.access_token || !Number.isFinite(long.expires_in) || long.expires_in <= 0) throw new Error("Instagram no confirmó la vigencia del token.");
  const tokens = { access_token: long.access_token, user_id: String(first.user_id), permissions: scopes, expires: Date.now() + long.expires_in * 1000, issued: Date.now() };
  // Successful basic-profile access confirms the only permission we request,
  // including providers that omit the optional permissions response field.
  await snapshot(tokens);
  return tokens;
}
export async function refresh(tokens: Tokens): Promise<Tokens> {
  const now = Date.now();
  if (tokens.expires <= now) throw new Error("La autorización de Instagram venció. Vuelve a conectar.");
  if (now - tokens.issued < 86400000 || tokens.expires - now > 7 * 86400000) return tokens;
  const url = new URL("https://graph.instagram.com/refresh_access_token");
  url.search = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: tokens.access_token }).toString();
  const data = await responseData(await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) }));
  if (typeof data.access_token !== "string" || !data.access_token || !Number.isFinite(data.expires_in) || data.expires_in <= 0) throw new Error("Instagram no confirmó la renovación del token.");
  return { ...tokens, access_token: data.access_token, issued: now, expires: now + data.expires_in * 1000 };
}
