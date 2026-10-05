import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { reportDb } from "./repository";
import { metricRegistry, categoryLabels, objectiveLabels, validateManual, manualAllowedForPublication, type ManualMetric, type ReportGoal, type Editorial, type Snapshot } from "./hybrid";
import { previousPeriod, validDate, type ReportQuery, type Platform } from "./model";

export class ReportWriteError extends Error { status:number; constructor(message:string,status=400){super(message);this.status=status;} }
type Row = Record<string, unknown>;
const date = (v:unknown) => v instanceof Date ? v.toISOString().slice(0,10) : String(v).slice(0,10);
const instant = (v:unknown) => new Date(String(v)).toISOString();
function manualRow(r:Row):ManualMetric {
  return {id:String(r.id),companyId:String(r.company_id),socialAccountId:r.social_account_id as string|null,publicationId:r.publication_id as string|null,platform:r.platform as Platform,metric:String(r.metric),level:r.level as ManualMetric["level"],periodStart:date(r.period_start),periodEnd:date(r.period_end),value:Number(r.value),unit:String(r.unit),source:"MANUAL",officialSource:String(r.official_source),dataDate:date(r.data_date),note:String(r.note),preference:r.preference as ManualMetric["preference"],enteredBy:String(r.entered_by),enteredAt:instant(r.entered_at),updatedBy:String(r.updated_by),updatedAt:instant(r.updated_at),version:Number(r.version)};
}
function goalRow(r:Row):ReportGoal {return {id:String(r.id),companyId:String(r.company_id),platform:r.platform as ReportGoal["platform"],periodStart:date(r.period_start),periodEnd:date(r.period_end),metric:String(r.metric),targetValue:Number(r.target_value),version:Number(r.version)};}
export async function readHybrid(query:ReportQuery) {
  const db=await reportDb(),start=previousPeriod(query).startDate;
  const [manual,editorial,goals,accounts,snapshots]=await Promise.all([
    db.query("SELECT * FROM focus_report_manual_metrics WHERE company_id=$1 AND deleted_at IS NULL AND period_start >= $2::date AND period_end <= $3::date AND ($4='Todas' OR platform=$4)",[query.companyId,start,query.endDate,query.platform]),
    db.query("SELECT e.* FROM focus_report_editorial e JOIN focus_social_publications p ON p.company_id=e.company_id AND p.id=e.publication_id WHERE e.company_id=$1",[query.companyId]),
    db.query("SELECT * FROM focus_report_goals WHERE company_id=$1 AND deleted_at IS NULL AND period_start=$2::date AND period_end=$3::date AND platform=$4",[query.companyId,query.startDate,query.endDate,query.platform]),
    db.query("SELECT id,platform FROM focus_content_accounts WHERE company_id=$1 AND ($2='Todas' OR platform=$2)",[query.companyId,query.platform]),
    db.query("SELECT m.publication_id,m.date,m.payload FROM focus_publication_metrics m JOIN focus_social_publications p ON p.company_id=m.company_id AND p.id=m.publication_id WHERE m.company_id=$1 AND (p.published_at AT TIME ZONE 'America/Guayaquil')::date <= $2::date AND ($3='Todas' OR p.platform=$3) ORDER BY m.date",[query.companyId,query.endDate,query.platform]),
  ]);
  const connections:Partial<Record<Platform,boolean>>={};
  for(const [platform,table] of [["Instagram","focus_instagram_connections"],["Facebook","focus_meta_connections"],["TikTok","focus_tiktok_connections"]] as const){
    const present=(await db.query("SELECT to_regclass($1) AS present",["public."+table])).rows[0].present;
    if(!present){connections[platform]=false;continue;}
    // Table names come only from the fixed list. Read connection state, never tokens.
    const row=(await db.query(`SELECT to_jsonb(c)->>'status' AS status,to_jsonb(c)->>'expires_at' AS expires FROM ${table} c WHERE company=$1`,[query.companyId])).rows[0];
    connections[platform]=!!row&&(!row.status||row.status==="connected")&&(!row.expires||Date.parse(row.expires)>Date.now());
  }
  return {manualMetrics:manual.rows.map(manualRow),editorial:editorial.rows.map(r=>({publicationId:r.publication_id,contentCategory:r.content_category,contentObjective:r.content_objective,version:r.version})) as Editorial[],goals:goals.rows.map(goalRow),accounts:accounts.rows as {id:string;platform:Platform}[],connections,snapshots:snapshots.rows.map(r=>({publicationId:r.publication_id,capturedAt:instant(r.date),metrics:r.payload})) as Snapshot[]};
}
async function transaction<T>(work:(client:PoolClient)=>Promise<T>) {
  const client=await (await reportDb()).connect();try{await client.query("BEGIN");const value=await work(client);await client.query("COMMIT");return value;}catch(e){await client.query("ROLLBACK");if(e && typeof e==="object" && "code" in e && e.code==="23505")throw new ReportWriteError("Ya existe un dato para esta métrica, nivel y período. Edita el registro existente.",409);throw e;}finally{client.release();}
}
async function verifyScope(client:PoolClient,company:string,platform:string,publicationId:string|null,accountId:string|null) {
  if(publicationId){const {rows}=await client.query("SELECT social_account_id FROM focus_social_publications WHERE company_id=$1 AND id=$2 AND platform=$3",[company,publicationId,platform]);if(!rows.length || (accountId&&rows[0].social_account_id!==accountId))throw new ReportWriteError("Publicación fuera de la empresa o cuenta autorizada.",403);}
  if(accountId){const {rows}=await client.query("SELECT id FROM focus_content_accounts WHERE company_id=$1 AND id=$2 AND platform=$3",[company,accountId,platform]);if(!rows.length)throw new ReportWriteError("Cuenta fuera de la empresa autorizada.",403);}
}
export async function saveManual(company:string,actor:string,input:unknown) {
  let value:ReturnType<typeof validateManual>;try{value=validateManual(input);}catch(e){throw new ReportWriteError((e as Error).message);}
  return transaction(async client=>{
    await verifyScope(client,company,value.platform,value.publicationId||null,value.socialAccountId||null);
    if(value.publicationId){const post=(await client.query("SELECT payload FROM focus_social_publications WHERE company_id=$1 AND id=$2",[company,value.publicationId])).rows[0]?.payload;if(!post||!manualAllowedForPublication(value.metric,post))throw new ReportWriteError("Esta métrica no admite carga manual para este formato o nivel.");}
    const id=value.id||randomUUID();
    const existing=(await client.query("SELECT * FROM focus_report_manual_metrics WHERE company_id=$1 AND id=$2 AND deleted_at IS NULL FOR UPDATE",[company,id])).rows[0];
    if(value.id&&!existing)throw new ReportWriteError("Dato manual no encontrado.",404);
    if((existing?.version||0)!==value.version)throw new ReportWriteError("El dato cambió en otra sesión. Recarga antes de guardar.",409);
    if(existing && (existing.platform!==value.platform||existing.metric!==value.metric||existing.level!==value.level||existing.publication_id!==(value.publicationId||null)||existing.social_account_id!==(value.socialAccountId||null)||date(existing.period_start)!==value.periodStart||date(existing.period_end)!==value.periodEnd))throw new ReportWriteError("La identidad de un dato existente no se modifica. Crea otro registro para un nivel o período diferente.");
    const params=[company,id,value.socialAccountId||null,value.publicationId||null,value.platform,value.metric,value.level,value.periodStart,value.periodEnd,value.value,value.unit,value.officialSource,value.dataDate,value.note,value.preference,actor];
    const {rows}=existing?await client.query("UPDATE focus_report_manual_metrics SET value=$3,unit=$4,official_source=$5,data_date=$6,note=$7,preference=$8,updated_by=$9,updated_at=now(),version=version+1 WHERE company_id=$1 AND id=$2 RETURNING *",[company,id,value.value,value.unit,value.officialSource,value.dataDate,value.note,value.preference,actor]):await client.query("INSERT INTO focus_report_manual_metrics(company_id,id,social_account_id,publication_id,platform,metric,level,period_start,period_end,value,unit,official_source,data_date,note,preference,entered_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$16) RETURNING *",params);
    await client.query("INSERT INTO focus_report_metric_audit(company_id,record_id,action,before_value,after_value,actor,note) VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7)",[company,id,existing?existing.preference!==value.preference?"SOURCE_DECISION":"UPDATE":"CREATE",existing?JSON.stringify(existing):null,JSON.stringify(rows[0]),actor,value.note]);
    return manualRow(rows[0]);
  });
}
export async function deleteManual(company:string,actor:string,id:string,version:number) {
  return transaction(async client=>{const before=(await client.query("SELECT * FROM focus_report_manual_metrics WHERE company_id=$1 AND id=$2 AND deleted_at IS NULL FOR UPDATE",[company,id])).rows[0];if(!before)throw new ReportWriteError("Dato no encontrado.",404);if(before.version!==version)throw new ReportWriteError("El dato cambió en otra sesión.",409);const after=(await client.query("UPDATE focus_report_manual_metrics SET deleted_at=now(),updated_at=now(),updated_by=$3,version=version+1 WHERE company_id=$1 AND id=$2 RETURNING *",[company,id,actor])).rows[0];await client.query("INSERT INTO focus_report_metric_audit(company_id,record_id,action,before_value,after_value,actor) VALUES($1,$2,'DELETE',$3::jsonb,$4::jsonb,$5)",[company,id,JSON.stringify(before),JSON.stringify(after),actor]);return {deleted:true};});
}
export async function manualHistory(company:string,id:string) {
  return (await (await reportDb()).query("SELECT action,before_value,after_value,actor,note,created_at FROM focus_report_metric_audit WHERE company_id=$1 AND record_id=$2 ORDER BY id",[company,id])).rows;
}
export async function saveEditorial(company:string,actor:string,input:Record<string,unknown>) {
  const {publicationId,contentCategory,contentObjective,version}=input;
  if(typeof publicationId!=="string" || (contentCategory!==null&&!Object.hasOwn(categoryLabels,String(contentCategory))) || (contentObjective!==null&&!Object.hasOwn(objectiveLabels,String(contentObjective))) || !Number.isSafeInteger(version) || (version as number)<0)throw new ReportWriteError("Clasificación inválida.");
  return transaction(async client=>{
    const publication=(await client.query("SELECT id FROM focus_social_publications WHERE company_id=$1 AND id=$2",[company,publicationId])).rows[0];if(!publication)throw new ReportWriteError("Publicación no encontrada.",404);
    const params=[company,publicationId,contentCategory,contentObjective,actor];
    const {rows}=version===0?await client.query("INSERT INTO focus_report_editorial(company_id,publication_id,content_category,content_objective,updated_by) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING version",params):await client.query("UPDATE focus_report_editorial SET content_category=$3,content_objective=$4,updated_by=$5,updated_at=now(),version=version+1 WHERE company_id=$1 AND publication_id=$2 AND version=$6 RETURNING version",[...params,version]);
    if(!rows.length)throw new ReportWriteError("La clasificación cambió en otra sesión.",409);return {version:rows[0].version};
  });
}
export async function saveGoal(company:string,actor:string,input:Record<string,unknown>) {
  const {id,platform,periodStart,periodEnd,metric,targetValue,version}=input;
  if(!["Todas","Instagram","Facebook","TikTok"].includes(String(platform)) || !["views","reach","interactions","followersGained","netFollowerGrowth","clicks","messages","publications"].includes(String(metric)) || typeof targetValue!=="number" || !Number.isFinite(targetValue) || targetValue<=0 || targetValue>1e15 || !Number.isSafeInteger(version) || (version as number)<0 || typeof periodStart!=="string" || typeof periodEnd!=="string" || !validDate(periodStart)||!validDate(periodEnd)||periodStart.slice(0,7)!==periodEnd.slice(0,7)||!periodStart.endsWith("-01")||new Date(Date.parse(periodEnd+"T12:00:00Z")+86400000).toISOString().slice(8,10)!=="01" || !metricRegistry[String(metric)] || (id!==undefined && (typeof id!=="string"||id.length>200)))throw new ReportWriteError("Configura un objetivo positivo para un mes completo.");
  return transaction(async client=>{const params=[company,id||randomUUID(),platform,periodStart,periodEnd,metric,targetValue,actor];const {rows}=version===0?await client.query("INSERT INTO focus_report_goals(company_id,id,platform,period_start,period_end,metric,target_value,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8) RETURNING *",params):await client.query("UPDATE focus_report_goals SET target_value=$7,updated_by=$8,updated_at=now(),version=version+1 WHERE company_id=$1 AND id=$2 AND platform=$3 AND period_start=$4 AND period_end=$5 AND metric=$6 AND version=$9 AND deleted_at IS NULL RETURNING *",[...params,version]);if(!rows.length)throw new ReportWriteError("El objetivo cambió en otra sesión.",409);return goalRow(rows[0]);});
}
