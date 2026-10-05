import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { createHash } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
registerHooks({resolve(s,c,next){if(s.startsWith("@/"))return next(new URL(`../${s.slice(2)}.ts`,import.meta.url).href,c);if((s.startsWith("./")||s.startsWith("../"))&&c.parentURL?.endsWith(".ts")&&!/\.[a-z]+$/i.test(s))return next(s+".ts",c);return next(s,c);}});
const {buildExecutiveReport}=await import("../lib/content-reports/executive.ts");
const {emptyMetrics,blankNotes}=await import("../lib/content-reports/model.ts");
const {resolveDatum,shortTitle,validateManual}=await import("../lib/content-reports/hybrid.ts");
const q={companyId:"A",platform:"Todas",startDate:"2026-09-01",endDate:"2026-09-30",mode:"production"};
const post=(id,platform="TikTok",views=null,date="2026-09-12T17:00:00Z")=>({id,companyId:"A",socialAccountId:platform+":a",platform,externalPostId:id,title:"Una publicación",caption:"Texto completo #conservado",mediaUrl:"",thumbnailUrl:"",permalink:"",contentType:platform==="TikTok"?"TIKTOK":"POST",publishedAt:date,campaignId:null,paid:null,capturedAt:"2026-10-05T15:00:00Z",metrics:{...emptyMetrics(),views,likes:2,comments:1,shares:1}});
const data=publications=>({publications,followers:[],audience:[],ads:[],notes:blankNotes(),warnings:[],accounts:[{id:"TikTok:a",platform:"TikTok"}]});
const manual=(metric,value,extra={})=>({id:"m",companyId:"A",platform:"TikTok",metric,value,level:"PERIOD",socialAccountId:null,publicationId:null,periodStart:q.startDate,periodEnd:q.endDate,unit:"count",source:"MANUAL",officialSource:"TikTok Analytics",dataDate:q.endDate,note:"Verificado",preference:"API",version:1,enteredBy:"owner",enteredAt:"2026-10-05T15:00:00Z",updatedBy:"owner",updatedAt:"2026-10-05T15:00:00Z",...extra});
test("Hybrid resolution preserves zero, originals, priorities, explicit overrides and nulls",()=>{
 assert.equal(resolveDatum("views",0,manual("views",100)).value,0);
 assert.equal(resolveDatum("views",null,manual("views",100)).source,"MANUAL");
 assert.equal(resolveDatum("views",90,manual("views",100,{preference:"MANUAL"})).value,100);
 assert.equal(resolveDatum("views",90,manual("views",100)).manualValue,100);
 assert.equal(resolveDatum("uniqueReach",null).manualEntryAllowed,false);
 const api=post("1");const result=buildExecutiveReport({...data([api]),manualMetrics:[manual("views",100,{level:"PUBLICATION",publicationId:"1"})]},q);
 assert.equal(result.summary.views,100);assert.equal(result.executive.apiSummary.views,null);assert.equal(api.metrics.views,null);
 assert.equal(result.publications[0].metricData.views.source,"MANUAL");
 assert.equal(result.summary.reach,null);assert.equal(result.executive.activityAvailable,false);
});
test("Periods and tenants stay isolated; period values are never broadcast onto publications",()=>{
 const result=buildExecutiveReport({...data([post("1")]),manualMetrics:[manual("views",123),manual("reach",999,{companyId:"B"})]},q);
 assert.equal(result.publications[0].metrics.views,null);assert.equal(result.executive.kpis.find(k=>k.key==="views").value,123);
 assert.equal(result.executive.kpis.find(k=>k.key==="reach").value,null);
 const noMatch=buildExecutiveReport({...data([post("1")]),manualMetrics:[manual("views",123,{periodStart:"2026-08-01",periodEnd:"2026-08-31"})]},q);
 assert.equal(noMatch.executive.kpis.find(k=>k.key==="views").value,null);
 for(const platform of ["Instagram","Facebook","TikTok"]){const r=buildExecutiveReport(data([post("ig","Instagram",10),post("fb","Facebook",20),post("tt","TikTok",30)]),{...q,platform});assert.ok(r.publications.every(p=>p.platform===platform));assert.equal(r.executive.networks.length,1);}
 assert.equal(buildExecutiveReport(data([]),q).summary.views,null);
});
test("Normalized comparisons do not pretend partial averages or zero baselines are comparable",()=>{
 const r=buildExecutiveReport(data([post("now","TikTok",200),post("prev","TikTok",100,"2026-08-20T17:00:00Z")]),q);
 assert.equal(r.executive.normalized.find(n=>n.key==="views").change,100);
 const partial=buildExecutiveReport(data([post("now","TikTok",200),post("missing"),post("prev","TikTok",100,"2026-08-20T17:00:00Z")]),q);
 assert.equal(partial.executive.normalized[0].change,null);assert.equal(partial.executive.kpis.find(k=>k.key==="views").complete,false);
 assert.equal(partial.executive.kpis.find(k=>k.key==="interactions").value,8);assert.equal(partial.executive.kpis.find(k=>k.key==="interactions").complete,false);
});
test("Historical activity requires exact Ecuador boundary snapshots; follower net growth is not gains",()=>{
 const snapshots=[{publicationId:"1",capturedAt:"2026-09-01T05:00:00.000Z",metrics:{...emptyMetrics(),views:10,likes:1,comments:1,shares:0}},{publicationId:"1",capturedAt:"2026-10-01T05:00:00.000Z",metrics:{...emptyMetrics(),views:30,likes:3,comments:2,shares:1}}];
 const followers=[{platform:"TikTok",socialAccountId:"TikTok:a",date:"2026-08-31",followers:100,gained:null,lost:null},{platform:"TikTok",socialAccountId:"TikTok:a",date:"2026-09-30",followers:95,gained:null,lost:null}];
 const r=buildExecutiveReport({...data([post("1","TikTok",30)]),snapshots,followers},q);
 assert.equal(r.executive.activityAvailable,true);assert.equal(r.executive.activity[0].values.views,20);
 assert.equal(r.executive.kpis.find(k=>k.key==="netFollowerGrowth").value,-5);assert.equal(r.executive.kpis.find(k=>k.key==="followersGained").value,null);
 assert.equal(buildExecutiveReport({...data([post("1")]),snapshots:[snapshots[1]]},q).executive.activityAvailable,false);
});
test("Validation rejects invented units, impossible scopes, percentages, missing verification and retains full captions",()=>{
 const valid={...manual("views",1),verified:true,version:0};assert.doesNotThrow(()=>validateManual(valid));
 for(const change of [{value:-1},{value:null},{value:"1"},{unit:"percent"},{verified:false},{metric:"uniqueReach"},{metric:"ctr",level:"AD",unit:"percent",value:101},{level:"ACCOUNT",socialAccountId:null}])assert.throws(()=>validateManual({...valid,...change}));
 assert.doesNotThrow(()=>validateManual({...valid,metric:"netFollowerGrowth",value:-20}));
 assert.doesNotThrow(()=>validateManual({...valid,metric:"ctr",level:"AD",unit:"percent",value:1.23}));
 assert.equal(shortTitle({title:"Oferta #promo\nLlama al 0991234567",caption:""}),"Oferta");
 assert.ok(shortTitle({title:"x".repeat(200),caption:""}).length<=100);
});
test("PostgreSQL manual CRUD, source decisions, audit, concurrency, goals and classification survive resync and tenant attacks",async()=>{
 const env={...process.env},pg=new PGlite();Object.assign(process.env,{DATABASE_URL:"postgres://test",PANEL_USER:"owner",PANEL_PASSWORD:"test-hybrid-password-long-enough"});
 const execute=async(sql,params)=>{if(sql.includes("pg_advisory"))return {rows:[]};if(!params&&sql.includes("CREATE TABLE")){await pg.exec(sql);return {rows:[]};}return pg.query(sql,params);};globalThis.focusPool={query:execute,connect:async()=>({query:execute,release(){}})};globalThis.focusSchema=undefined;
 try{
  const repo=await import("../lib/content-reports/repository.ts"),{hybridHandler}=await import("../lib/content-reports/hybrid-api.ts"),{reportHandler}=await import("../lib/content-reports/api.ts"),{createSession}=await import("../lib/panel-auth.ts");const owner=createSession();
  const req=(section,method="GET",body,company="A",session=owner,secure=true)=>new Request(`https://example.test/api/reports/${section}?${new URLSearchParams({...q,companyId:company})}`,{method,headers:{cookie:`focusmrk_session=${session}`,"Content-Type":"application/json",...(secure?{"X-FocusMRK-Request":"1"}:{})},body:body?JSON.stringify(body):undefined});
  const snapshot=views=>({capturedAt:`2026-09-30T22:${views===null?"00":String(views).padStart(2,"0")}:00Z`,user:{open_id:"a",follower_count:100},videos:[{id:"1",title:"Publicación real",create_time:Date.parse("2026-09-12T17:00:00Z")/1000,...(views===null?{}:{view_count:views}),like_count:1,comment_count:0,share_count:0}]});await repo.importTikTok("A",snapshot(null));
  const db=await repo.reportDb();const publicationId=(await db.query("SELECT id FROM focus_social_publications WHERE company_id='A'")).rows[0].id;
  const input={...manual("views",20,{level:"PUBLICATION",publicationId}),id:undefined,version:0,verified:true};
  assert.equal((await hybridHandler(req("manual-metrics","POST",input,"A",owner,false),"manual-metrics")).status,403);
  let response=await hybridHandler(req("manual-metrics","POST",input),"manual-metrics");assert.equal(response.status,200);let m=(await response.json()).metric;
  assert.equal((await hybridHandler(req("manual-metrics","POST",input),"manual-metrics")).status,409);
  response=await hybridHandler(req("manual-metrics","PUT",{...m,value:25,verified:true}),"manual-metrics");assert.equal(response.status,200);const edited=(await response.json()).metric;
  assert.equal((await hybridHandler(req("manual-metrics","PUT",{...m,value:26,verified:true}),"manual-metrics")).status,409);m=edited;
  await repo.importTikTok("A",snapshot(30));let report=await (await reportHandler(req("summary"),"summary")).json();assert.equal(report.publications[0].metricData.views.apiValue,30);assert.equal(report.publications[0].metricData.views.manualValue,25);assert.equal(report.publications[0].metrics.views,30);
  response=await hybridHandler(req("manual-metrics","PUT",{...m,preference:"MANUAL",verified:true}),"manual-metrics");m=(await response.json()).metric;
  report=await (await reportHandler(req("summary"),"summary")).json();assert.equal(report.publications[0].metrics.views,25);assert.equal(report.executive.kpis.find(k=>k.key==="views").value,25);assert.ok(report.executive.kpis.find(k=>k.key==="views").sources.includes("MANUAL"));
  assert.equal((await hybridHandler(req("classification","PUT",{publicationId,contentCategory:"HUMOR",contentObjective:"REACH",version:0}),"classification")).status,200);
  const goal={platform:"Todas",periodStart:q.startDate,periodEnd:q.endDate,metric:"views",targetValue:50,version:0};response=await hybridHandler(req("goals","POST",goal),"goals");assert.equal(response.status,200);const g=(await response.json()).goal;
  assert.equal((await hybridHandler(req("goals","PUT",{...g,targetValue:60}),"goals")).status,200);assert.equal((await hybridHandler(req("goals","PUT",{...g,targetValue:70}),"goals")).status,409);
  await repo.importTikTok("A",snapshot(40));report=await (await reportHandler(req("summary"),"summary")).json();assert.equal(report.publications[0].editorial.contentCategory,"HUMOR");assert.equal(report.executive.manualMetrics.length,1);assert.equal(report.executive.goals[0].targetValue,60);
  assert.equal((await hybridHandler(req("manual-metrics","PUT",{...m,value:1,verified:true},"B"),"manual-metrics")).status,403);
  await pg.exec("CREATE TABLE focus_accounts(id TEXT PRIMARY KEY,login TEXT,display_name TEXT,enabled BOOLEAN);CREATE TABLE focus_account_companies(account_id TEXT,company TEXT);CREATE TABLE focus_account_sessions(token_hash TEXT,account_id TEXT,expires_at TIMESTAMPTZ);INSERT INTO focus_accounts VALUES('manager','manager','Manager',true);INSERT INTO focus_account_companies VALUES('manager','A');");const session="account_"+"a".repeat(64);await pg.query("INSERT INTO focus_account_sessions VALUES($1,'manager',now()+interval '1 hour')",[createHash("sha256").update(session).digest("hex")]);
  assert.equal((await hybridHandler(req("manual-metrics","GET",undefined,"B",session),"manual-metrics")).status,403);
  assert.equal((await hybridHandler(req("goals","POST",goal,"B",session),"goals")).status,403);
  assert.equal((await hybridHandler(req("classification","PUT",{publicationId,contentCategory:"MARCA",contentObjective:null,version:1},"B",session),"classification")).status,403);
  const {GET:diagnostics}=await import("../app/api/reports/diagnostics/route.ts");
  assert.equal((await diagnostics(req("diagnostics","GET",undefined,"B",session))).status,403);
  assert.equal((await hybridHandler(req("manual-metrics","DELETE",{id:m.id,version:m.version}),"manual-metrics")).status,200);
  assert.equal((await db.query("SELECT count(*) AS n FROM focus_report_metric_audit WHERE record_id=$1",[m.id])).rows[0].n,4);
  assert.equal((await db.query("SELECT count(*) AS n FROM focus_report_manual_metrics WHERE deleted_at IS NOT NULL")).rows[0].n,1);
  assert.equal((await db.query("SELECT count(*) AS n FROM focus_social_publications")).rows[0].n,1);
 }finally{process.env=env;globalThis.focusPool=undefined;globalThis.focusSchema=undefined;await pg.close();}
});
