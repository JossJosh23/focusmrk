/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node command run by Dokploy. */
const { Pool } = require('pg');
const webpush = require('web-push');
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
    const { rows: candidates } = await client.query(`SELECT p AS post FROM focus_panel,
      LATERAL jsonb_array_elements(posts) p WHERE id=1 AND p->>'status' <> 'Publicado'
      AND (((p->>'date') || ' ' || (p->>'time'))::timestamp AT TIME ZONE $1) > now()
      AND (((p->>'date') || ' ' || (p->>'time'))::timestamp AT TIME ZONE $1) <= now() + interval '30 minutes'`, [timezone]);
    const { rows: subscriptions } = await client.query('SELECT endpoint, subscription FROM focus_push_subscriptions');
    let sent = 0; let failed = 0;
    for (const target of subscriptions) for (const { post } of candidates) {
      const event = JSON.stringify([post.id,post.date,post.time,timezone]);
      if ((await client.query('SELECT 1 FROM focus_push_deliveries WHERE endpoint=$1 AND event_key=$2', [target.endpoint,event])).rows.length) continue;
      try {
        await webpush.sendNotification(target.subscription, JSON.stringify({ title: 'Publicación próxima', body: `${post.time} · ${post.brand.slice(0,80)} · ${post.title.slice(0,160)} · ${post.networks.join(', ')}`, tag: post.id + ':' + post.date + ':' + post.time, url: '/' }), { vapidDetails: { subject: process.env.VAPID_SUBJECT, publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY }, TTL: 60, timeout: 10000 });
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
