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
  if (url.protocol !== "https:" || url.pathname !== "/api/meta/callback" || url.search || url.hash) throw new Error("Revisa META_REDIRECT_URI.");
  return { id, secret, redirect, version, origin: url.origin };
}
export type Page = { id: string; name: string; access_token: string };
export type Tokens = { access_token: string; expires: number; pages: Page[]; permissions?: string[] };
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
export async function graph(path: string, token: string, params: Record<string, string> = {}) {
  const config = settings(), url = new URL(`https://graph.facebook.com/${config.version}/${path}`);
  url.search = new URLSearchParams({ ...params, appsecret_proof: createHmac("sha256", config.secret).update(token).digest("hex") }).toString();
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15000) });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error("Meta rechazó la consulta. Revisa los permisos o vuelve a conectar la cuenta.");
  return data;
}
async function exchange(params: Record<string, string>) {
  const config = settings(), url = new URL(`https://graph.facebook.com/${config.version}/oauth/access_token`);
  url.search = new URLSearchParams({ client_id: config.id, client_secret: config.secret, ...params }).toString();
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  const data = await response.json();
  if (!response.ok || data.error || typeof data.access_token !== "string") throw new Error("Meta rechazó la autorización. Revisa las credenciales y la URL de retorno.");
  return data;
}
export async function tokenRequest(code: string): Promise<Tokens> {
  const first = await exchange({ code, redirect_uri: settings().redirect });
  const data = await exchange({ grant_type: "fb_exchange_token", fb_exchange_token: first.access_token });
  if (!Number.isFinite(data.expires_in) || data.expires_in <= 0) throw new Error("Meta no confirmó la vigencia de la autorización.");
  const permissions = await graph("me/permissions", data.access_token);
  if (!Array.isArray(permissions.data) || scopes.some(scope => !permissions.data.some((p: { permission: string; status: string }) => p.permission === scope && p.status === "granted"))) throw new Error("Autoriza los permisos de páginas para conectar Facebook.");
  const granted = permissions.data.filter((p: { permission: string; status: string }) => p.status === "granted" && typeof p.permission === "string").map((p: { permission: string }) => p.permission);
  const pages: Page[] = []; let after = "";
  for (let n = 0; n < 100; n++) {
    const result = await graph("me/accounts", data.access_token, { fields: "id,name,access_token", limit: "100", ...(after ? { after } : {}) });
    if (!Array.isArray(result.data)) throw new Error("Meta no devolvió una lista de páginas válida.");
    for (const page of result.data) if (typeof page.id === "string" && typeof page.name === "string" && typeof page.access_token === "string") pages.push({ id: page.id, name: page.name, access_token: page.access_token });
    if (!result.paging?.next) return { access_token: data.access_token, expires: Date.now() + data.expires_in * 1000, pages, permissions: granted };
    if (!result.paging?.cursors?.after || result.paging.cursors.after === after) break;
    after = result.paging.cursors.after;
  }
  throw new Error("No se pudo completar la lista de páginas.");
}
export async function snapshot(tokens: Tokens) {
  if (tokens.expires <= Date.now()) throw new Error("La autorización venció. Vuelve a conectar Meta.");
  return { capturedAt: new Date().toISOString(), accounts: await Promise.all(tokens.pages.map(async page => {
    const facebook = await graph(page.id, page.access_token, { fields: "id,name,followers_count,fan_count" });
    return { facebook: { id: facebook.id, name: facebook.name, followers: facebook.followers_count, likes: facebook.fan_count } };
  })) };
}
