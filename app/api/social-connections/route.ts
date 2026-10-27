import { database } from "@/lib/database";
import { authorize } from "@/lib/tiktok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Which networks the company has live, for the sidebar icons. Read-only and local: never calls the providers. */
export async function GET(request: Request) {
  const company = new URL(request.url).searchParams.get("company") || "";
  const denied = await authorize(request, company); if (denied) return denied;
  try {
    const db = await database();
    const row = async (sql: string) => {
      try { return (await db.query(sql, [company])).rows[0]; } catch { return undefined; }
    };
    const live = (expires: unknown) => expires == null || new Date(expires as string).getTime() > Date.now();
    const [instagram, facebook, tiktok] = await Promise.all([
      row("SELECT status, expires_at FROM focus_instagram_connections WHERE company = $1"),
      row("SELECT status, expires_at FROM focus_meta_connections WHERE company = $1"),
      row("SELECT 1 FROM focus_tiktok_connections WHERE company = $1"),
    ]);
    // Same rules as each network's status route in Integraciones.
    return Response.json({
      instagram: !!instagram && instagram.status === "connected" && instagram.expires_at != null && live(instagram.expires_at),
      facebook: !!facebook && (!facebook.status || facebook.status === "connected") && live(facebook.expires_at),
      tiktok: !!tiktok,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return Response.json({ error: "No se pudieron cargar las conexiones." }, { status: 503 }); }
}
