/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node command run by Dokploy. */
const { Pool } = require('pg');
const webpush = require('web-push');
const { plan, defaults } = require('./notification-plan.cjs');
async function run() {
  for (const key of ['DATABASE_URL','VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','VAPID_SUBJECT']) if (!process.env[key]) throw Error('Falta ' + key);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 8000 });
  let client; let locked = false;
  try {
    client = await pool.connect();
    locked = (await client.query('SELECT pg_try_advisory_lock(81734922) AS locked')).rows[0].locked;
    if (!locked) { console.log('Ya hay una revisión en curso.'); return; }
    if (!(await client.query("SELECT to_regclass('focus_push_deliveries') AS present")).rows[0].present) { console.log('Todavía no hay dispositivos registrados.'); return; }
    const timezone = process.env.REMINDER_TIMEZONE || 'America/Guayaquil';
    const clock = (await client.query("SELECT to_char(now() AT TIME ZONE $1, 'YYYY-MM-DD') AS date, to_char(now() AT TIME ZONE $1, 'HH24:MI') AS time", [timezone])).rows[0];
    const posts = (await client.query('SELECT posts FROM focus_panel WHERE id=1')).rows[0]?.posts || [];
    const hasSettings = (await client.query("SELECT to_regclass('focus_notification_settings') AS present")).rows[0].present;
    const settings = hasSettings ? (await client.query('SELECT settings FROM focus_notification_settings WHERE id=1')).rows[0]?.settings || defaults : defaults;
    const events = plan(posts, settings, clock.date, clock.time);
    const { rows: subscriptions } = await client.query('SELECT endpoint, subscription FROM focus_push_subscriptions');
    let sent = 0; let failed = 0;
    for (const target of subscriptions) for (const note of events) {
      const event = note.key;
      if ((await client.query('SELECT 1 FROM focus_push_deliveries WHERE endpoint=$1 AND event_key=$2', [target.endpoint,event])).rows.length) continue;
      try {
        await webpush.sendNotification(target.subscription, JSON.stringify(note.payload), { vapidDetails: { subject: process.env.VAPID_SUBJECT, publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY }, TTL: note.ttl, timeout: 10000 });
        await client.query('INSERT INTO focus_push_deliveries(endpoint,event_key) VALUES($1,$2) ON CONFLICT DO NOTHING', [target.endpoint,event]); sent++;
      } catch (e) {
        if ([404,410].includes(e.statusCode)) { await client.query('DELETE FROM focus_push_subscriptions WHERE endpoint=$1', [target.endpoint]); break; }
        failed++;
      }
    }
    await client.query("DELETE FROM focus_push_deliveries WHERE sent_at < now() - interval '90 days'");
    console.log(`Recordatorios: ${sent} enviados; ${failed} fallidos.`);
    if (failed) process.exitCode = 1;
  } finally { if (locked) await client.query('SELECT pg_advisory_unlock(81734922)'); client?.release(); await pool.end(); }
}
if (require.main === module) run().catch(() => { console.error('No se pudo revisar los avisos. Comprueba PostgreSQL y las variables push.'); process.exitCode = 1; });
module.exports = { run };
