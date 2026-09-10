import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire, registerHooks } from 'node:module';
import { PGlite } from '@electric-sql/pglite';
registerHooks({ resolve(specifier, context, next) {
  if (context.parentURL?.endsWith('/lib/push.ts') && specifier === './database') return next('./database.ts', context);
  return next(specifier, context);
} });
const require = createRequire(import.meta.url);

test('push subscriptions only accept known HTTPS push services', async () => {
  const { validSubscription } = await import('../lib/push.ts');
  const keys = { p256dh: 'A'.repeat(87), auth: 'B'.repeat(22) };
  assert.ok(validSubscription({ endpoint: 'https://web.push.apple.com/device', keys }));
  for (const endpoint of ['http://web.push.apple.com/device', 'https://127.0.0.1/private', 'https://web.push.apple.com.evil.test/', 'https://web.push.apple.com:444/', 'https://user:pass@web.push.apple.com/']) assert.equal(validSubscription({ endpoint, keys }), false);
  assert.equal(validSubscription({ endpoint: 'https://web.push.apple.com/device', keys: {} }), false);
});

test('scheduled push uses Ecuador time, deduplicates and retries transient failures', async () => {
  const pg = require('pg'); const webpush = require('web-push');
  const originalPool = pg.Pool; const originalSend = webpush.sendNotification;
  const db = new PGlite();
  const env = ['DATABASE_URL','VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','VAPID_SUBJECT','REMINDER_TIMEZONE'];
  const old = env.map(k=>process.env[k]);
  env.forEach(k=>{process.env[k]='test'});process.env.REMINDER_TIMEZONE='America/Guayaquil';
  const query = async (sql, args) => {
    if (sql.includes('pg_try_advisory_lock')) return { rows: [{locked:true}] };
    if (sql.includes('pg_advisory_unlock')) return { rows: [] };
    return db.query(sql,args);
  };
  pg.Pool = class { async connect() { return {query, release(){}}; } async end(){} };
  let sends=0; let fail=false;
  webpush.sendNotification=async()=>{if(fail){fail=false;throw Error('temporary')} sends++;};
  try {
    await db.exec(`CREATE TABLE focus_panel(id int, posts jsonb); CREATE TABLE focus_push_subscriptions(endpoint text PRIMARY KEY, subscription jsonb); CREATE TABLE focus_push_deliveries(endpoint text REFERENCES focus_push_subscriptions ON DELETE CASCADE,event_key text,sent_at timestamptz DEFAULT now(),PRIMARY KEY(endpoint,event_key));`);
    const clock=(await db.query("SELECT to_char(now() AT TIME ZONE 'America/Guayaquil' + interval '20 minutes','YYYY-MM-DD') AS date, to_char(now() AT TIME ZONE 'America/Guayaquil' + interval '20 minutes','HH24:MI') AS time")).rows[0];
    const post={id:'one',...clock,brand:'Marca',title:'Prueba',networks:['Instagram'],status:'Aprobado'};
    await db.query('INSERT INTO focus_panel VALUES(1,$1)',[JSON.stringify([post,{...post,id:'published',status:'Publicado'},{...post,id:'old',date:'2020-01-01'}])]);
    await db.query('INSERT INTO focus_push_subscriptions VALUES($1,$2)',['test',JSON.stringify({endpoint:'test'})]);
    const {run}=require('../scripts/send-push-reminders.cjs');
    await run();await run();assert.equal(sends,1);
    await db.query('UPDATE focus_panel SET posts=$1',[JSON.stringify([{...post,id:'retry'}])]);
    fail=true;await run();assert.equal(sends,1);process.exitCode=0;
    await run();assert.equal(sends,2);
    webpush.sendNotification=async()=>{throw Object.assign(Error(),{statusCode:410})};
    await db.query('UPDATE focus_panel SET posts=$1',[JSON.stringify([{...post,id:'expired'}])]);
    await run();assert.equal((await db.query('SELECT * FROM focus_push_subscriptions')).rows.length,0);
  } finally { pg.Pool=originalPool;webpush.sendNotification=originalSend;env.forEach((k,i)=>{if(old[i]===undefined)delete process.env[k];else process.env[k]=old[i]});await db.close(); }
});
