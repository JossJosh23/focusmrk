import { createHash, timingSafeEqual } from "node:crypto";

export function panelAccess(request: Request): Response | null {
  if (!process.env.DATABASE_URL) return null;
  const user = process.env.PANEL_USER;
  const password = process.env.PANEL_PASSWORD;
  if (!user || !password || password.length < 16) return new Response("Configura PANEL_USER y PANEL_PASSWORD (mínimo 16 caracteres) en Dokploy.", { status: 503 });
  const authorization = request.headers.get("authorization") || "";
  const expected = createHash("sha256").update(`${user}:${password}`).digest();
  let supplied = "";
  if (authorization.startsWith("Basic ")) supplied = Buffer.from(authorization.slice(6), "base64").toString("utf8");
  const valid = timingSafeEqual(expected, createHash("sha256").update(supplied).digest());
  if (!valid) return new Response("Acceso personal de FocusMRK", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="FocusMRK", charset="UTF-8"', "Cache-Control": "no-store" } });
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    // Browser mutations must come from this origin. JSON/custom headers also prevent simple cross-site requests.
    if (request.headers.get("sec-fetch-site") === "cross-site" || request.headers.get("x-focusmrk-request") !== "1") return new Response("Solicitud no permitida.", { status: 403 });
  }
  return null;
}
