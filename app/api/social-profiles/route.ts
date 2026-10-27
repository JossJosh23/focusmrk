import { authorize } from "@/lib/tiktok";
import { socialProfiles } from "@/lib/social-profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const company = new URL(request.url).searchParams.get("company") || "";
  const denied = await authorize(request, company); if (denied) return denied;
  try { return Response.json(await socialProfiles(company), { headers: { "Cache-Control": "private, no-store" } }); }
  catch { return Response.json({ error: "No se pudieron cargar los perfiles conectados." }, { status: 503 }); }
}
