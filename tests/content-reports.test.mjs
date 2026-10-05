import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { createHash } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
registerHooks({ resolve(s,c,next) {
  if (s.startsWith("@/")) return next(new URL(`../${s.slice(2)}.ts`,import.meta.url).href,c);
  if ((s.startsWith("./")||s.startsWith("../")) && c.parentURL?.endsWith(".ts") && !/\.[a-z]+$/i.test(s)) return next(s+".ts",c);
  return next(s,c);
}});
const model=await import("../lib/content-reports/model.ts"), demo=await import("../lib/content-reports/demo.ts");
const query={companyId:"A",platform:"Todas",startDate:"2026-09-01",endDate:"2026-09-30",mode:"demo"};
test("reports preserve unknown metrics, exact periods, tenant separation and zero denominators",()=>{
  assert.deepEqual(model.previousPeriod(query),{startDate:"2026-08-02",endDate:"2026-08-31"});
  assert.equal(model.validDate("2026-02-30"),false);
  assert.equal(model.variation(100,0),null);
  assert.equal(model.engagement({...model.emptyMetrics(),reach:0,likes:0,comments:0,shares:0,saves:0}),0);
  assert.equal(model.engagement({...model.emptyMetrics(),reach:100,likes:10,comments:5,shares:2,saves:3}),20);
  assert.equal(model.engagement({...model.emptyMetrics(),reach:100,likes:10}),null);
  const data=demo.demoDataset(query), other=demo.demoDataset({...query,companyId:"B"});
  data.publications.push(...other.publications);
  const result=model.buildReport(data,query);
  assert.ok(result.publications.length>0);assert.ok(result.publications.every(p=>p.companyId==="A"));
  assert.ok(result.publications.every(p=>p.publishedAt.slice(0,10)>=query.startDate));
  const instagram=model.buildReport(data,{...query,platform:"Instagram"});
  assert.ok(instagram.publications.every(p=>p.platform==="Instagram"));
  assert.equal(model.buildReport({...data,publications:[]},query).summary.reach,null);
  assert.equal(model.publicationDate("2026-10-01T02:00:00Z"),"2026-09-30");
  const midnight={...data.publications[0],publishedAt:"2026-10-01T02:00:00Z"};
  assert.equal(model.buildReport({...data,publications:[midnight]},query).publications.length,1);
  const histories=[{socialAccountId:"old",platform:"TikTok",date:"2026-08-31",followers:100,gained:null,lost:null},{socialAccountId:"new",platform:"TikTok",date:"2026-09-30",followers:200,gained:null,lost:null}];
  const accounts=model.buildReport({...data,followers:histories},query).followers.filter(f=>f.platform==="TikTok");
  assert.equal(accounts.length,2);assert.ok(accounts.every(f=>f.net===null));
  assert.throws(()=>model.parseQuery(new URL("https://example.test/?companyId=A&startDate=2026-02-30&endDate=2026-03-01")));
});
test("PostgreSQL report APIs isolate companies, enforce CSRF and version notes, and import real TikTok without demo metrics",async()=>{
  const env={...process.env},pg=new PGlite();
  Object.assign(process.env,{DATABASE_URL:"postgres://test",PANEL_USER:"owner",PANEL_PASSWORD:"test-password-123456789"});
  const execute=async(sql,params)=>{
    if(sql.includes("pg_advisory"))return {rows:[]};
    if(!params&&sql.includes("CREATE TABLE")) {await pg.exec(sql);return {rows:[]};}
    return pg.query(sql,params);
  };
  globalThis.focusPool={query:execute,connect:async()=>({query:execute,release(){}})};globalThis.focusSchema=undefined;
  try{
    const repo=await import("../lib/content-reports/repository.ts"),{reportHandler}=await import("../lib/content-reports/api.ts"),{createSession}=await import("../lib/panel-auth.ts");
    const owner=createSession();
    const request=(company="A",method="GET",body,session=owner,mode="production",secure=true)=>new Request(`https://example.test/api/reports/insights?${new URLSearchParams({...query,companyId:company,mode})}`,{method,headers:{cookie:`focusmrk_session=${session}`,"Content-Type":"application/json",...(secure?{"X-FocusMRK-Request":"1"}:{})},body:body?JSON.stringify(body):undefined});
    assert.equal((await reportHandler(request("A","GET",undefined,"bad"),"summary")).status,401);
    await repo.importTikTok("A",{capturedAt:"2026-09-30T22:00:00Z",user:{open_id:"user-a",display_name:"Account",follower_count:100},videos:[{id:"external",title:"Real publication",create_time:Date.parse("2026-09-12T12:00:00-05:00")/1000,view_count:234,like_count:4,comment_count:2,share_count:1,share_url:"https://www.tiktok.com/@account/video/1"}]});
    const result=await (await reportHandler(request(),"summary")).json();
    assert.equal(result.publications.length,1);assert.equal(result.summary.views,234);assert.equal(result.summary.reach,null);assert.equal(result.publications[0].metrics.saves,null);assert.equal(result.publications[0].engagementRate,null);
    assert.equal((await (await reportHandler(request("B"),"summary")).json()).publications.length,0);
    assert.equal((await reportHandler(request("B"),"publications",result.publications[0].id)).status,404);
    const notes={worked:"Real analysis",improve:"Improve",recommendations:"Next period",version:0};
    assert.equal((await reportHandler(request("A","PUT",notes,owner,"production",false),"insights")).status,403);
    assert.equal((await reportHandler(request("A","PUT",notes),"insights")).status,200);
    assert.equal((await reportHandler(request("A","PUT",notes),"insights")).status,409);
    assert.equal((await (await reportHandler(request("B"),"insights")).json()).notes.worked,"");
    assert.equal((await (await reportHandler(request(),"insights")).json()).notes.worked,"Real analysis");
    assert.equal((await reportHandler(request("A","PUT",notes,owner,"demo"),"insights")).status,400);
    assert.equal((await (await repo.reportDb()).query("SELECT count(*) AS count FROM focus_social_publications")).rows[0].count,1);
    await pg.exec("CREATE TABLE focus_accounts(id TEXT PRIMARY KEY,login TEXT,display_name TEXT,enabled BOOLEAN);CREATE TABLE focus_account_companies(account_id TEXT,company TEXT);CREATE TABLE focus_account_sessions(token_hash TEXT,account_id TEXT,expires_at TIMESTAMPTZ);INSERT INTO focus_accounts VALUES('editor','editor','Editor',true);INSERT INTO focus_account_companies VALUES('editor','A');");
    const session="account_"+"a".repeat(64);
    await pg.query("INSERT INTO focus_account_sessions VALUES($1,'editor',now()+interval '1 hour')",[createHash("sha256").update(session).digest("hex")]);
    assert.equal((await reportHandler(request("A","GET",undefined,session),"summary")).status,200);
    assert.equal((await reportHandler(request("B","GET",undefined,session),"summary")).status,403);
    assert.equal((await reportHandler(request("B","GET",undefined,session,"demo"),"summary")).status,403);
    assert.equal((await reportHandler(request("B","PUT",notes,session),"insights")).status,403);
    assert.equal((await reportHandler(request("B","GET",undefined,session),"publications",result.publications[0].id)).status,403);
    await assert.rejects(pg.query("INSERT INTO focus_publication_metrics VALUES('B',$1,now(),'{}')",[result.publications[0].id]));
  }finally{process.env=env;globalThis.focusPool=undefined;globalThis.focusSchema=undefined;await pg.close();}
});
