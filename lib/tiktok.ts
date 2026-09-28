import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { database } from "./database";
import { marketingAccount, panelAccess } from "./account-access";
import { SESSION_COOKIE } from "./panel-auth";

export const scopes = ["user.info.basic", "user.info.stats", "video.list"];
export function settings() {
  const key = process.env.TIKTOK_CLIENT_KEY, secret = process.env.TIKTOK_CLIENT_SECRET, redirect = process.env.TIKTOK_REDIRECT_URI;
  if (!key || !secret || !redirect || !process.env.DATABASE_URL) throw new Error("Configura las variables de TikTok y la base de datos en el servidor.");
  const url = new URL(redirect);
  if (url.protocol !== "https:" || url.pathname !== "/api/tiktok/callback" || url.search || url.hash) throw new Error("Revisa TIKTOK_REDIRECT_URI.");
  return { key, secret, redirect, origin: url.origin };
}
export const digest = (s: string) => createHash("sha256").update(s).digest("hex");
export function sessionId(request: Request) {
  const value = request.headers.get("cookie")?.split(";").map(s => s.trim()).find(s => s.startsWith(SESSION_COOKIE + "="))?.slice(SESSION_COOKIE.length + 1);
  if (!value) throw new Error("Inicia sesión en FocusMRK antes de conectar TikTok.");
  return digest(value);
}
function encryptionKey() { return createHash("sha256").update(`focusmrk-tiktok:${process.env.TIKTOK_TOKEN_KEY || settings().secret}`).digest(); }
export function seal(value: unknown, company: string) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(company));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
}
export function unseal(value: string, company: string): Tokens {
  const bytes = Buffer.from(value, "base64"), cipher = createDecipheriv("aes-256-gcm", encryptionKey(), bytes.subarray(0, 12));
  cipher.setAAD(Buffer.from(company)); cipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString("utf8"));
}
export type Tokens = { access_token: string; refresh_token: string; open_id: string; scope: string; expires: number; refreshExpires: number };
export async function tiktokDb() {
  const db = await database();
  await db.query("CREATE TABLE IF NOT EXISTS focus_tiktok_states (id TEXT PRIMARY KEY, session TEXT NOT NULL, company TEXT NOT NULL, expires TIMESTAMPTZ NOT NULL)");
  await db.query("CREATE TABLE IF NOT EXISTS focus_tiktok_connections (company TEXT PRIMARY KEY, tokens TEXT NOT NULL, snapshot JSONB, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  await db.query("CREATE TABLE IF NOT EXISTS focus_tiktok_snapshots (company TEXT NOT NULL, captured_at TIMESTAMPTZ NOT NULL DEFAULT now(), snapshot JSONB NOT NULL)");
  return db;
}
export async function authorize(request: Request, company: string) {
  const denied = await panelAccess(request); if (denied) return denied;
  if (!process.env.DATABASE_URL) return Response.json({ error: "La conexión requiere modo servidor." }, { status: 503 });
  if (!company.trim() || company.length > 80) return Response.json({ error: "Selecciona una empresa." }, { status: 400 });
  const account = await marketingAccount(request);
  if (account && !account.companies.includes(company)) return Response.json({ error: "Empresa no asignada." }, { status: 403 });
  return null;
}
export async function tokenRequest(params: Record<string, string>): Promise<Tokens> {
  const config = settings();
  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", { method: "POST", body: new URLSearchParams({ client_key: config.key, client_secret: config.secret, ...params }), cache: "no-store", signal: AbortSignal.timeout(15000) });
  const data = await response.json();
  if (!response.ok || data.error || typeof data.access_token !== "string" || typeof data.refresh_token !== "string" || typeof data.open_id !== "string" || typeof data.scope !== "string" || !Number.isFinite(data.expires_in) || !Number.isFinite(data.refresh_expires_in)) throw new Error("TikTok no autorizó la conexión. Vuelve a conectar la cuenta.");
  if (!scopes.every(s => data.scope.split(",").includes(s))) throw new Error("Autoriza los permisos de perfil, estadísticas y videos en TikTok.");
  return { access_token: data.access_token, refresh_token: data.refresh_token, open_id: data.open_id, scope: data.scope, expires: Date.now() + data.expires_in * 1000, refreshExpires: Date.now() + data.refresh_expires_in * 1000 };
}
async function api(path: string, token: string, body?: object) {
  const response = await fetch(`https://open.tiktokapis.com/v2/${path}`, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, cache: "no-store", signal: AbortSignal.timeout(15000) });
  const data = await response.json();
  if (!response.ok || data.error?.code !== "ok") throw new Error("No se pudieron consultar las métricas. Reintenta o vuelve a conectar TikTok si los permisos vencieron.");
  return data.data;
}
export async function snapshot(token: string) {
  const profile = await api("user/info/?fields=open_id,display_name,follower_count,following_count,likes_count,video_count", token);
  const result = await api("video/list/?fields=id,title,create_time,share_url,view_count,like_count,comment_count,share_count", token, { max_count: 20 });
  return { capturedAt: new Date().toISOString(), user: profile.user, videos: result.videos || [], hasMore: !!result.has_more };
}
export async function withConnection<T>(company: string, work: (client: import("pg").PoolClient) => Promise<T>) {
  const client = await (await tiktokDb()).connect();
  try { await client.query("SELECT pg_advisory_lock(81734922, hashtext($1))", [company]); return await work(client); }
  finally { try { await client.query("SELECT pg_advisory_unlock(81734922, hashtext($1))", [company]); } finally { client.release(); } }
}
