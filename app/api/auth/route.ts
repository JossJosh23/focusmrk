import { NextResponse } from "next/server";
import { createSession, credentialsValid, SESSION_COOKIE, SESSION_SECONDS } from "@/lib/panel-auth";

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site" || request.headers.get("x-focusmrk-request") !== "1") return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  if (!process.env.PANEL_USER || !process.env.PANEL_PASSWORD || process.env.PANEL_PASSWORD.length < 16) return NextResponse.json({ error: "El acceso todavía no está configurado. Contacta al administrador." }, { status: 503 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  if (!body || typeof body.user !== "string" || typeof body.password !== "string" || !credentialsValid(body.user, body.password)) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return NextResponse.json({ error: "Usuario o contraseña incorrectos. Inténtalo de nuevo." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(SESSION_COOKIE, createSession(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_SECONDS });
  return response;
}

export async function DELETE(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site" || request.headers.get("x-focusmrk-request") !== "1") return new Response(null, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
