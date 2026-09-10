import { panelAccess } from "@/lib/panel-auth";
import { pushConfigured, pushDatabase, validSubscription, sendPush } from "@/lib/push";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const denied = panelAccess(request); if (denied) return denied;
  return Response.json({ configured: pushConfigured(), publicKey: pushConfigured() ? process.env.VAPID_PUBLIC_KEY : null }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  const denied = panelAccess(request); if (denied) return denied;
  if (!pushConfigured()) return Response.json({ error: "Configura las claves push en Dokploy." }, { status: 503 });
  let body;
  try { const raw = await request.text(); if (raw.length > 10000) throw new Error(); body = JSON.parse(raw); if (!validSubscription(body.subscription)) throw new Error(); }
  catch { return Response.json({ error: "Suscripción no válida." }, { status: 400 }); }
  try {
    const db = await pushDatabase();
    if (body.action === "disable") {
      await db.query("DELETE FROM focus_push_subscriptions WHERE endpoint=$1", [body.subscription.endpoint]);
    } else if (body.action === "test") {
      const saved = await db.query("SELECT subscription FROM focus_push_subscriptions WHERE endpoint=$1", [body.subscription.endpoint]);
      if (!saved.rows.length) return Response.json({ error: "Activa primero los avisos en este dispositivo." }, { status: 400 });
      await sendPush(saved.rows[0].subscription, { title: "FocusMRK conectado", body: "Este dispositivo puede recibir recordatorios de publicación.", tag: "focusmrk-test", url: "/" });
    } else if (body.action === "subscribe") {
      await db.query("INSERT INTO focus_push_subscriptions(endpoint,subscription) VALUES($1,$2::jsonb) ON CONFLICT(endpoint) DO UPDATE SET subscription=EXCLUDED.subscription", [body.subscription.endpoint, JSON.stringify(body.subscription)]);
    } else return Response.json({ error: "Acción no válida." }, { status: 400 });
    return Response.json({ ok: true });
  } catch { return Response.json({ error: "No se pudo completar la operación push. Vuelve a activar los avisos o revisa la configuración del servidor." }, { status: 503 }); }
}
