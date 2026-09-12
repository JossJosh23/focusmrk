import { panelAccess } from "@/lib/panel-auth";
import { database } from "@/lib/database";
import { defaultNotificationSettings, validNotificationSettings } from "@/lib/notification-settings";

export async function GET(request: Request) {
  const denied = panelAccess(request); if (denied) return denied;
  if (!process.env.DATABASE_URL) return Response.json({ error: "Los avisos automáticos requieren conexión al servidor." }, { status: 503 });
  try {
    const db = await database();
    const result = await db.query("SELECT settings FROM focus_notification_settings WHERE id=1");
    return Response.json({ settings: result.rows[0]?.settings || defaultNotificationSettings }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "No se pudo cargar la configuración." }, { status: 503 }); }
}
export async function PUT(request: Request) {
  const denied = panelAccess(request); if (denied) return denied;
  if (!process.env.DATABASE_URL) return Response.json({ error: "Se necesita conexión al servidor." }, { status: 503 });
  if (request.headers.get("x-focusmrk-request") !== "1") return new Response(null, { status: 403 });
  let settings;
  try { const raw = await request.text(); if (raw.length > 4096) throw new Error(); settings = JSON.parse(raw); } catch { return Response.json({ error: "Configuración inválida." }, { status: 400 }); }
  if (!validNotificationSettings(settings)) return Response.json({ error: "Revisa los horarios: deben estar dentro del horario permitido, sin cruzar medianoche." }, { status: 400 });
  try {
    const db = await database();
    await db.query("INSERT INTO focus_notification_settings(id,settings) VALUES(1,$1::jsonb) ON CONFLICT(id) DO UPDATE SET settings=EXCLUDED.settings", [JSON.stringify(settings)]);
    return Response.json({ ok: true });
  } catch { return Response.json({ error: "No se pudo guardar. Inténtalo de nuevo." }, { status: 503 }); }
}
