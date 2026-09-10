import { NextResponse, type NextRequest } from "next/server";
import { panelAccess } from "./lib/panel-auth";

export function proxy(request: NextRequest) {
  if (["/sw.js", "/manifest.webmanifest", "/icon"].includes(request.nextUrl.pathname)) return NextResponse.next();
  return panelAccess(request) || NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
