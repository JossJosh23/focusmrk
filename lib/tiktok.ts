import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { database } from "./database";
import { marketingAccount, panelAccess } from "./account-access";
import { SESSION_COOKIE } from "./panel-auth";
import { periodBounds } from "./tiktok-period";

export class TikTokError extends Error {
  readonly code: string;
  constructor(code: string, message: string) { super(message); this.code = code; }
}
export const scopes = ["user.info.basic", "user.info.stats", "video.list"];
export function settings() {
  const key = process.env.TIKTOK_CLIENT_KEY?.trim(), secret = process.env.TIKTOK_CLIENT_SECRET?.trim(), redirect = process.env.TIKTOK_REDIRECT_URI?.trim();
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
  let response: Response;
  try {
    response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_key: config.key, client_secret: config.secret, ...params }), cache: "no-store", signal: AbortSignal.timeout(15000) });
  } catch { throw new TikTokError("token_network", "El servidor no pudo comunicarse con TikTok. Reintenta y revisa la salida HTTPS del VPS si persiste."); }
  const data = await response.json().catch(() => { throw new TikTokError("token_response", "TikTok devolvi? una respuesta no v?lida. Inicia una conexi?n nueva."); });
  if (!response.ok || data?.error) {
    const messages: Record<string, string> = {
      invalid_client: "TikTok rechaz? las credenciales. Revisa que Client key y Client secret en Dokploy pertenezcan al mismo Sandbox y vuelve a desplegar.",
      invalid_grant: "TikTok rechaz? el c?digo de autorizaci?n: puede haber vencido o haberse utilizado. Inicia una conexi?n nueva desde FocusMRK.",
      invalid_request: "TikTok rechaz? la solicitud. Comprueba que la Redirect URI del portal y TIKTOK_REDIRECT_URI sean exactamente iguales y correspondan al mismo Sandbox.",
      invalid_scope: "Revisa los permisos user.info.basic, user.info.stats y video.list en el Sandbox y aplica los cambios.",
      unauthorized_client: "Esta aplicaci?n no est? autorizada para este flujo. Revisa Login Kit Web y las credenciales del Sandbox.",
    };
    const code = typeof data?.error === "string" && Object.hasOwn(messages, data.error) ? data.error : "token_rejected";
    throw new TikTokError(code, messages[code] || "TikTok rechaz? el intercambio de autorizaci?n. Revisa las credenciales y la configuraci?n del Sandbox.");
  }
  if (!data || typeof data.access_token !== "string" || typeof data.refresh_token !== "string" || typeof data.open_id !== "string" || typeof data.scope !== "string" || !Number.isFinite(data.expires_in) || !Number.isFinite(data.refresh_expires_in)) throw new TikTokError("token_format", "La respuesta de autorizaci?n de TikTok no contiene los datos necesarios.");
  const granted = data.scope.split(",").map((s: string) => s.trim());
  const missing = scopes.filter(s => !granted.includes(s));
  if (missing.length) throw new TikTokError("missing_scopes", "Faltan permisos autorizados: " + missing.join(", ") + ". A??delos al Sandbox, aplica los cambios y vuelve a conectar acept?ndolos.");
  return { access_token: data.access_token, refresh_token: data.refresh_token, open_id: data.open_id, scope: data.scope, expires: Date.now() + data.expires_in * 1000, refreshExpires: Date.now() + data.refresh_expires_in * 1000 };
}
async function api(path: string, token: string, body?: object) {
  const response = await fetch(`https://open.tiktokapis.com/v2/${path}`, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, cache: "no-store", signal: AbortSignal.timeout(15000) });
  const data = await response.json();
  if (!response.ok || data.error?.code !== "ok") throw new Error("No se pudieron consultar las métricas. Reintenta o vuelve a conectar TikTok si los permisos vencieron.");
  return data.data;
}
export async function snapshot(token: string, period?: { start: string; end: string }) {
  const bounds = period ? periodBounds(period.start, period.end) : null;
  const profile = await api("user/info/?fields=open_id,display_name,follower_count,following_count,likes_count,video_count", token);
  if (bounds && period) {
    const videos = new Map<string, { id: string; title: string; create_time: number; view_count?: number; like_count?: number; comment_count?: number; share_count?: number }>();
    let cursor = bounds.until;
    for (let page = 0; page < 100; page++) {
      const result = await api("video/list/?fields=id,title,video_description,create_time,share_url,cover_image_url,duration,view_count,like_count,comment_count,share_count", token, { max_count: 20, cursor });
      if (!Array.isArray(result.videos)) throw new Error("Respuesta de videos no válida.");
      let reachedStart = false;
      for (const video of result.videos) {
        if (!Number.isFinite(video.create_time) || typeof video.id !== "string") throw new Error("Video sin fecha válida.");
        const time = video.create_time * 1000;
        if (time < bounds.from) reachedStart = true;
        if (time >= bounds.from && time < bounds.until) videos.set(video.id, video);
      }
      if (!result.has_more || reachedStart) return { capturedAt: new Date().toISOString(), user: profile.user, videos: [...videos.values()], hasMore: false, period };
      if (!Number.isFinite(result.cursor) || result.cursor >= cursor) throw new Error("TikTok no permitió completar la consulta del periodo.");
      cursor = result.cursor;
    }
    throw new Error("El periodo contiene demasiados videos. Selecciona un rango más corto.");
  }
  const result = await api("video/list/?fields=id,title,video_description,create_time,share_url,cover_image_url,duration,view_count,like_count,comment_count,share_count", token, { max_count: 20 });
  return { capturedAt: new Date().toISOString(), user: profile.user, videos: result.videos || [], hasMore: !!result.has_more };
}
export async function withConnection<T>(company: string, work: (client: import("pg").PoolClient) => Promise<T>) {
  const client = await (await tiktokDb()).connect();
  try { await client.query("SELECT pg_advisory_lock(81734922, hashtext($1))", [company]); return await work(client); }
  finally { try { await client.query("SELECT pg_advisory_unlock(81734922, hashtext($1))", [company]); } finally { client.release(); } }
}
