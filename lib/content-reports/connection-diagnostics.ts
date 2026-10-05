import { unseal as instagramToken, settings as instagramSettings } from "../instagram";
import { unseal as metaToken, settings as metaSettings } from "../meta";
import { database } from "../database";

type Check = { valid:boolean|null; scopes:string[]|null; expiresAt:string|null; error:string|null };
export function permissionDiagnosis(required:string[],configured:string[],effective:string[]|null) {
  return {missingPermissions:effective===null?null:required.filter(p=>!effective.includes(p)),configuredButAbsent:effective===null?null:configured.filter(p=>!effective.includes(p)),status:effective===null?"UNVERIFIED":required.some(p=>!effective.includes(p))?"REAUTHORIZATION_REQUIRED":"READY"};
}
async function inspect(url:URL,authorization:string) {
  try {
    const response=await fetch(url,{headers:{Authorization:`Bearer ${authorization}`},cache:"no-store",signal:AbortSignal.timeout(15000)});
    const body=await response.json();
    return {ok:response.ok&&!body.error,body,error:body.error?`HTTP ${response.status} · código ${body.error.code??"desconocido"}`:null};
  }catch{return {ok:false,body:null,error:"No se pudo verificar con el proveedor."};}
}
export async function connectionDiagnostics(company:string) {
  const db=await database();
  const syncs=(await db.query("SELECT platform,payload FROM focus_content_syncs WHERE company_id=$1",[company])).rows;
  const results=[];
  for(const platform of ["Instagram","Facebook"] as const) {
    const table=platform==="Instagram"?"focus_instagram_connections":"focus_meta_connections";
    const exists=(await db.query("SELECT to_regclass($1) AS name",[table])).rows[0]?.name;
    const row=exists?(await db.query(`SELECT * FROM ${table} WHERE company=$1`,[company])).rows[0]:null;
    const required=platform==="Instagram"?["instagram_business_basic","instagram_business_manage_insights"]:["pages_show_list","pages_read_engagement","read_insights"];
    const configured=platform==="Instagram"?["instagram_business_basic","instagram_business_content_publish","instagram_business_manage_messages","instagram_manage_comments"]:["business_management","pages_manage_engagement","pages_manage_metadata","pages_manage_posts","pages_read_engagement","pages_read_user_content","pages_show_list","public_profile","read_insights"];
    const sync=syncs.find(s=>s.platform===platform)?.payload;
    const check:Check={valid:null,scopes:null,expiresAt:row?.expires_at?new Date(row.expires_at).toISOString():null,error:null};
    let insightsAccess:boolean|null=null;
    let selectedPageValid:boolean|null=null;
    if(row?.status==="connected") {
      if(platform==="Instagram") {
        const tokens=instagramToken(row.tokens,company),config=instagramSettings();
        const profile=await inspect(new URL(`https://graph.instagram.com/${config.version}/me?fields=id,username`),tokens.access_token);
        check.valid=profile.ok?true:profile.body?.error?.code===190?false:null;check.error=profile.error;
        if(profile.ok) {
          const url=new URL(`https://graph.instagram.com/${config.version}/me/insights`);
          const until=Math.floor(Date.now()/1000);
          url.search=new URLSearchParams({metric:"reach",period:"day",metric_type:"total_value",since:String(until-86400),until:String(until)}).toString();
          const insight=await inspect(url,tokens.access_token);
          insightsAccess=insight.ok?true:[10,200,190].includes(insight.body?.error?.code)?false:null;
          if(!insight.ok)check.error=insight.error;
        }
        // An operational probe proves these capabilities, not a full scope list.
      } else {
        const tokens=metaToken(row.tokens,company),config=metaSettings();
        const url=new URL(`https://graph.facebook.com/${config.version}/debug_token`);url.searchParams.set("input_token",tokens.access_token);
        const debug=await inspect(url,`${config.id}|${config.secret}`),data=debug.body?.data;
        check.valid=debug.ok&&typeof data?.is_valid==="boolean"?data.is_valid:null;
        check.error=debug.error;
        if(check.valid&&data.app_id!==config.id){check.valid=false;check.error="El token pertenece a otra aplicación.";}
        if(check.valid) {
          check.scopes=Array.isArray(data.scopes)?data.scopes.filter((s:unknown)=>typeof s==="string"):null;
          const deadlines=[data.expires_at,data.data_access_expires_at].filter((v:unknown)=>typeof v==="number"&&v>0);
          if(deadlines.length)check.expiresAt=new Date(Math.min(...deadlines)*1000).toISOString();
        }
        const page=tokens.pages.find(p=>p.id===row.snapshot?.selectedPage);
        if(page){const pageUrl=new URL(`https://graph.facebook.com/${config.version}/debug_token`);pageUrl.searchParams.set("input_token",page.access_token);const pd=await inspect(pageUrl,`${config.id}|${config.secret}`);selectedPageValid=pd.ok&&pd.body?.data?.is_valid===true&&pd.body?.data?.app_id===config.id;}
        insightsAccess=check.scopes?check.scopes.includes("read_insights"):null;
      }
    }
    const diagnosis=permissionDiagnosis(required,configured,check.scopes);
    const permissionStates=configured.map(permission=>({permission,configured:true,inToken:check.scopes===null?null:check.scopes.includes(permission),required:required.includes(permission),status:check.scopes===null?"UNVERIFIED":check.scopes.includes(permission)?"GRANTED":"REAUTHORIZATION_REQUIRED"}));
    results.push({platform,connected:row?.status==="connected",...check,selectedPageValid,insightsAccess,requiredPermissions:required,configuredPermissions:configured,permissionStates,configuredSource:"Declarados por el administrador; no verificados contra el panel de Meta",...diagnosis,status:platform==="Instagram"&&insightsAccess===true?"READY":platform==="Instagram"&&insightsAccess===false?"REAUTHORIZATION_REQUIRED":diagnosis.status,scopeEvidence:platform==="Instagram"?"Prueba operativa; lista completa de scopes no disponible":"debug_token",lastSync:sync?.capturedAt??null,lastSyncError:sync?.error??null,adsRead:check.scopes?.includes("ads_read")??null});
  }
  return {company,checkedAt:new Date().toISOString(),connections:results};
}
