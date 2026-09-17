import { createHash, randomBytes, scrypt as derive, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { database } from "@/lib/database";
import { panelAccess as ownerAccess, SESSION_COOKIE, SESSION_SECONDS } from "@/lib/panel-auth";

const scrypt = promisify(derive);
export type MarketingAccount = { id: string; login: string; display_name: string; companies: string[] };
const accounts = new WeakMap<Request, Promise<MarketingAccount | null>>();
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

export function marketingAccount(request: Request): Promise<MarketingAccount | null> {
  const cached = accounts.get(request); if (cached) return cached;
  const lookup = (async () => {
    const token = request.headers.get("cookie")?.split(";").map(value => value.trim()).find(value => value.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1) || "";
    if (!/^account_[a-f0-9]{64}$/.test(token) || !process.env.DATABASE_URL) return null;
    const db = await database();
    const { rows } = await db.query("SELECT a.id, a.login, a.display_name, ARRAY(SELECT company FROM focus_account_companies WHERE account_id = a.id ORDER BY company) AS companies FROM focus_accounts a JOIN focus_account_sessions s ON s.account_id = a.id WHERE s.token_hash = $1 AND s.expires_at > now() AND a.enabled = true", [digest(token)]);
    return (rows[0] as MarketingAccount) || null;
  })();
  accounts.set(request, lookup); return lookup;
}

export async function accountLogin(login: string, password: string) {
  if (!process.env.DATABASE_URL || login.length > 80 || password.length > 1024) return null;
  const db = await database();
  if (!(await db.query("SELECT to_regclass('public.focus_accounts') AS name")).rows[0].name) return null;
  const { rows } = await db.query("SELECT id, salt, password_hash FROM focus_accounts WHERE login = $1 AND enabled = true", [login]);
  const account = rows[0];
  const hash = await scrypt(password, account?.salt || "focusmrk-missing-account", 64) as Buffer;
  if (!account || !timingSafeEqual(hash, Buffer.from(account.password_hash, "hex"))) return null;
  const token = `account_${randomBytes(32).toString("hex")}`;
  await db.query("INSERT INTO focus_account_sessions(token_hash, account_id, expires_at) VALUES ($1, $2, now() + $3 * interval '1 second')", [digest(token), account.id, SESSION_SECONDS]);
  return token;
}

export async function revokeAccountSession(request: Request) {
  const token = request.headers.get("cookie")?.split(";").map(value => value.trim()).find(value => value.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1) || "";
  if (/^account_[a-f0-9]{64}$/.test(token)) await (await database()).query("DELETE FROM focus_account_sessions WHERE token_hash = $1", [digest(token)]);
}

export async function panelAccess(request: Request): Promise<Response | null> {
  const denied = ownerAccess(request);
  if (!denied || denied.status !== 401) return denied;
  try {
    const account = await marketingAccount(request);
    if (!account) return denied;
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && (request.headers.get("sec-fetch-site") === "cross-site" || request.headers.get("x-focusmrk-request") !== "1")) return new Response("Solicitud no permitida.", { status: 403 });
    const url = new URL(request.url);
    // Global notification/push settings remain reserved for the owner until they are user-scoped.
    if (url.pathname.startsWith("/api/") && !["/api/auth", "/api/me", "/api/workspace", "/api/media", "/api/companies", "/api/company-profile", "/api/tasks"].includes(url.pathname)) return new Response("Esta función requiere una cuenta administradora.", { status: 403 });
    if (url.pathname === "/api/companies" && request.method !== "GET") return new Response("El administrador asigna las empresas.", { status: 403 });
    if (url.pathname === "/api/company-profile") {
      const company = request.method === "GET" ? url.searchParams.get("company") : (await request.clone().json()).company;
      if (!account.companies.includes(company)) return new Response("Empresa no asignada.", { status: 403 });
    }
    if (url.pathname === "/api/media") {
      const db = await database();
      const id = request.method === "PATCH" ? (await request.clone().json()).id : url.searchParams.get("id");
      if (id) {
        const { rows } = await db.query("SELECT brand FROM focus_media WHERE id = $1", [id]);
        if (!rows.length || !account.companies.includes(rows[0].brand)) return new Response("Archivo no encontrado.", { status: 404 });
      } else if (["PATCH", "DELETE"].includes(request.method)) return new Response("Falta el archivo.", { status: 400 });
    }
    return null;
  } catch { return new Response("No se pudo verificar el acceso.", { status: 503 }); }
}
