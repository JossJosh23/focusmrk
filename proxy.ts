import { NextResponse, type NextRequest } from "next/server";
import { panelAccess } from "./lib/account-access";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/tiktokFT9wa06lFjbLmws56g8kSj5mHCp2xWHd.txt" && ["GET", "HEAD"].includes(request.method)) return NextResponse.next();
  if (["/login", "/terminos", "/privacidad", "/privacy", "/terms", "/data-deletion", "/api/auth", "/sw.js", "/manifest.webmanifest", "/icon"].includes(request.nextUrl.pathname)) return NextResponse.next();
  const denied = await panelAccess(request);
  if (denied && !request.nextUrl.pathname.startsWith("/api/") && ["GET", "HEAD"].includes(request.method)) {
    const login = new URL("/login", request.url);
    if (request.nextUrl.searchParams.get("module") === "day") login.searchParams.set("next", "day");
    return NextResponse.redirect(login);
  }
  return denied || NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
