import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "focusmrk_session";
export const SESSION_SECONDS = 60 * 60 * 12;
export function credentialsValid(user: string, password: string) {
  if (!process.env.PANEL_USER || !process.env.PANEL_PASSWORD || process.env.PANEL_PASSWORD.length < 16) return false;
  const hash = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(JSON.stringify([user, password])), hash(JSON.stringify([process.env.PANEL_USER, process.env.PANEL_PASSWORD])));
}
function signature(value: string) {
  return createHmac("sha256", process.env.PANEL_PASSWORD!).update(`focusmrk-session:${process.env.PANEL_USER}:${value}`).digest("hex");
}
export function createSession(now = Date.now()) {
  const value = `${now + SESSION_SECONDS * 1000}.${randomBytes(24).toString("hex")}`;
  return `${value}.${signature(value)}`;
}
export function validSession(token: string, now = Date.now()) {
  if (!process.env.PANEL_PASSWORD || !process.env.PANEL_USER) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || !/^\d+$/.test(parts[0]) || !/^[a-f0-9]{48}$/.test(parts[1]) || !/^[a-f0-9]{64}$/.test(parts[2])) return false;
  const expires = Number(parts[0]);
  return expires > now && expires <= now + SESSION_SECONDS * 1000 && timingSafeEqual(Buffer.from(parts[2], "hex"), Buffer.from(signature(`${parts[0]}.${parts[1]}`), "hex"));
}

export function panelAccess(request: Request): Response | null {
  if (!process.env.DATABASE_URL) return null;
  const user = process.env.PANEL_USER;
  const password = process.env.PANEL_PASSWORD;
  if (!user || !password || password.length < 16) return new Response("Configura PANEL_USER y PANEL_PASSWORD (mínimo 16 caracteres) en Dokploy.", { status: 503 });
  const authorization = request.headers.get("authorization") || "";
  const expected = createHash("sha256").update(`${user}:${password}`).digest();
  let supplied = "";
  if (authorization.startsWith("Basic ")) supplied = Buffer.from(authorization.slice(6), "base64").toString("utf8");
  const token = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1) || "";
  const valid = validSession(token) || timingSafeEqual(expected, createHash("sha256").update(supplied).digest());
  if (!valid) return new Response("Tu sesión ha terminado. Vuelve a iniciar sesión.", { status: 401, headers: { "Cache-Control": "no-store" } });
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    // Browser mutations must come from this origin. JSON/custom headers also prevent simple cross-site requests.
    if (request.headers.get("sec-fetch-site") === "cross-site" || request.headers.get("x-focusmrk-request") !== "1") return new Response("Solicitud no permitida.", { status: 403 });
  }
  return null;
}
