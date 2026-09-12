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
    if (sql.includes("to_char(now() AT TIME ZONE $1")) return { rows: [{ date: '2026-09-12', time: '10:00' }] };
    if (sql.includes('pg_try_advisory_lock')) return { rows: [{locked:true}] };
    if (sql.includes('pg_advisory_unlock')) return { rows: [] };
    return db.query(sql,args);
  };
  pg.Pool = class { async connect() { return {query, release(){}}; } async end(){} };
  let sends=0; let fail=false;
  webpush.sendNotification=async()=>{if(fail){fail=false;throw Error('temporary')} sends++;};
  try {
    await db.exec(`CREATE TABLE focus_panel(id int, posts jsonb); CREATE TABLE focus_push_subscriptions(endpoint text PRIMARY KEY, subscription jsonb); CREATE TABLE focus_push_deliveries(endpoint text REFERENCES focus_push_subscriptions ON DELETE CASCADE,event_key text,sent_at timestamptz DEFAULT now(),PRIMARY KEY(endpoint,event_key));`);
    const clock={date:'2026-09-12',time:'16:00'};
    await db.exec('CREATE TABLE focus_push_health(id int PRIMARY KEY,last_run timestamptz,last_success timestamptz,last_error text,sent int DEFAULT 0)');
    const post={id:'one',...clock,brand:'Marca',title:'Prueba',networks:['Instagram'],status:'Aprobado'};
    await db.query('INSERT INTO focus_panel VALUES(1,$1)',[JSON.stringify([post,{...post,id:'published',status:'Publicado'},{...post,id:'old',date:'2020-01-01'}])]);
    await db.query('INSERT INTO focus_push_subscriptions VALUES($1,$2)',['test',JSON.stringify({endpoint:'test'})]);
    const {run}=require('../scripts/send-push-reminders.cjs');
    await run();await run();assert.equal(sends,1);
    await db.query('UPDATE focus_panel SET posts=$1',[JSON.stringify([{...post,id:'retry'}])]);
    await db.query('DELETE FROM focus_push_deliveries');
    fail=true;await run();assert.equal(sends,1);process.exitCode=0;
    assert.ok((await db.query('SELECT last_error FROM focus_push_health')).rows[0].last_error);
    await run();assert.equal(sends,2);
    assert.equal((await db.query('SELECT last_error FROM focus_push_health')).rows[0].last_error,null);
    await db.query('DELETE FROM focus_push_deliveries');
    for (let i=0;i<4;i++) await db.query("INSERT INTO focus_push_deliveries VALUES('test',$1,'2026-09-12T15:00:00Z')",[`budget-${i}`]);
    await run();assert.equal(sends,2,'daily cap blocks further sends');
    await db.query('DELETE FROM focus_push_deliveries');
    await db.query("INSERT INTO focus_push_deliveries(endpoint,event_key) VALUES('test','another-category')");
    await run();assert.equal(sends,2,'different categories cannot send within one hour');
    webpush.sendNotification=async()=>{throw Object.assign(Error(),{statusCode:410})};
    await db.query('UPDATE focus_panel SET posts=$1',[JSON.stringify([{...post,id:'expired'}])]);
    await db.query('DELETE FROM focus_push_deliveries');
    await run();assert.equal((await db.query('SELECT * FROM focus_push_subscriptions')).rows.length,0);
  } finally { pg.Pool=originalPool;webpush.sendNotification=originalSend;env.forEach((k,i)=>{if(old[i]===undefined)delete process.env[k];else process.env[k]=old[i]});await db.close(); }
});


test('notification intensity respects quiet hours, completion and daily categories', async () => {
  const {plan,defaults}=require('../scripts/notification-plan.cjs');
  const {defaultNotificationSettings, validNotificationSettings, notificationTimes}=await import('../lib/notification-settings.ts');
  assert.deepEqual(defaults,defaultNotificationSettings);
  assert.equal(validNotificationSettings(defaults),true);
  assert.equal(validNotificationSettings({...defaults,end:'07:00'}),false);
  assert.equal(validNotificationSettings({...defaults,rules:{}}),false);
  const settings=structuredClone(defaults);
  settings.rules.today={intensity:'intense',time:'10:00'};
  const post={id:'a',date:'2026-09-12',title:'Preparar reel',brand:'Marca',status:'Borrador'};
  const events=(time,posts=[post])=>plan(posts,settings,'2026-09-12',time);
  assert.equal(events('07:59').length,0);
  assert.equal(events('08:00')[0].payload.title,'Tu plan para hoy');
  assert.equal(events('10:00').length,1);
  assert.equal(events('11:00').length,0);
  assert.equal(events('12:00').length,1);
  assert.equal(events('14:00').length,1);
  assert.equal(events('16:00').length,1);
  assert.equal(events('18:00').length,0);
  assert.equal(events('20:00').length,0);
  assert.equal(events('10:00',[{...post,status:'Publicado'}]).length,0);
  assert.equal(events('10:00',[{...post,date:'2026-09-13'}]).length,0);
  assert.deepEqual(notificationTimes('intense','17:00','20:00'),['17:00','19:00']);
  settings.rules.today.intensity='off';
  assert.equal(events('10:00').length,0);
  settings.rules.review={intensity:'gentle',time:'09:00'};
  assert.equal(events('09:00',[{...post,status:'En revisión'}]).length,1);
  assert.equal(events('09:00',[{...post,date:'2026-09-13',status:'En revisión'}]).length,0);
  settings.rules.overdue={intensity:'gentle',time:'11:00'};
  assert.equal(events('11:00',[{...post,date:'2026-09-11'}]).length,1);
});

test('tasks follow their work date and priority, pause during snooze, and merge with summary', async () => {
  const {plan,defaults}=require('../scripts/notification-plan.cjs');
  const {validTask,nextDay,zonedDay}=await import('../lib/tasks.ts');
  const settings=structuredClone(defaults);
  const task={id:'a',title:'Escribir guion',date:'2026-09-12',priority:'urgent',postId:'future-post',done:false,snoozedUntil:null,version:1};
  const now=Date.parse('2026-09-12T15:00:00Z');
  const events=(time,tasks=[task])=>plan([],settings,'2026-09-12',time,tasks,now);
  assert.equal(validTask(task),true);
  assert.equal(validTask({...task,date:'2026-02-30'}),false);
  assert.equal(validTask({...task,priority:'invalid'}),false);
  assert.equal(nextDay('2026-12-31'),'2027-01-01');
  assert.equal(zonedDay(new Date('2026-09-13T01:00:00Z'),'America/Guayaquil'),'2026-09-12');
  assert.equal(events('08:00').length,1);
  for (const time of ['10:00','12:00','14:00','16:00']) assert.equal(events(time).length,1);
  assert.equal(events('12:00',[{...task,priority:'important'}]).length,0);
  assert.equal(events('10:00',[{...task,priority:'normal'}]).length,0);
  assert.equal(events('08:00',[{...task,priority:'normal'}]).length,1);
  assert.equal(events('10:00',[{...task,snoozedUntil:new Date(now+3600000).toISOString()}]).length,0);
  assert.equal(events('10:00',[{...task,snoozedUntil:new Date(now-1).toISOString()}]).length,1);
  assert.equal(events('10:00',[{...task,done:true}]).length,0);
  assert.equal(events('10:00',[{...task,date:'2026-09-13'}]).length,0);
  settings.rules.summary.time='10:00';
  assert.equal(events('10:00').length,1);
  assert.match(events('10:00')[0].payload.body,/1 pendiente/);
  assert.equal(events('10:00')[0].payload.url,'/?module=day');
  settings.rules.review={intensity:'normal',time:'10:00'};
  const post={id:'p',date:'2026-09-12',title:'Revisar',brand:'Marca',status:'En revisión'};
  const merged=plan([post],settings,'2026-09-12','10:00',[],now);
  assert.equal(merged.length,1);
  assert.match(merged[0].payload.body,/1 pendiente/);
});
