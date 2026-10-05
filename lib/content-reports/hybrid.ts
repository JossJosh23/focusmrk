import { metric, numeric, validDate, type Metrics, type Platform, type SocialPublication } from "./model";

export const availabilityLabels = {
  AVAILABLE: "Disponible", NO_DATA: "Sin datos para este período", NOT_SUPPORTED: "No proporcionado por esta API",
  MISSING_PERMISSION: "Permiso requerido", DEPRECATED: "Métrica retirada por la plataforma",
  HISTORICAL_DATA_REQUIRED: "Histórico insuficiente", ACCOUNT_LEVEL_ONLY: "Disponible a nivel de cuenta",
  MEDIA_TYPE_NOT_SUPPORTED: "No disponible para este formato", NOT_CONNECTED: "Cuenta no conectada",
  PENDING_SYNC: "Pendiente de sincronización", API_ERROR: "Error al consultar la red",
  MANUAL_AVAILABLE: "Puede completarse desde un panel oficial",
} as const;
export type Availability = keyof typeof availabilityLabels;
export type Source = "API" | "MANUAL" | "CALCULATED" | "MISSING";
export type Level = "ACCOUNT" | "PUBLICATION" | "PERIOD" | "AD";
export type MetricDefinition = { label: string; unit: "count" | "percent" | "seconds" | "currency"; levels: Level[]; manualEntryAllowed: boolean; signed?: boolean };
export function manualAllowedForPublication(key:string,post:SocialPublication) {
  if(!metricRegistry[key]?.manualEntryAllowed||!metricRegistry[key].levels.includes("PUBLICATION"))return false;
  if(["totalWatchTime","averageWatchTime","averageWatchPercentage","completePlays"].includes(key))return ["REEL","VIDEO","TIKTOK"].includes(post.contentType);
  return true;
}
const count = (label: string, levels: Level[] = ["PUBLICATION", "PERIOD"]): MetricDefinition => ({label,unit:"count",levels,manualEntryAllowed:true});
export const metricRegistry: Record<string, MetricDefinition> = {
  views: count("Visualizaciones"), reach: count("Alcance"), impressions: count("Impresiones"), likes: count("Likes"),
  comments: count("Comentarios"), shares: count("Compartidos"), saves: count("Guardados"),
  clicks: count("Clics",["PUBLICATION","PERIOD","AD"]), profileVisits: count("Visitas al perfil",["PUBLICATION","ACCOUNT","PERIOD"]),
  followers: count("Seguidores",["ACCOUNT"]), followersGained: count("Seguidores ganados",["PUBLICATION","ACCOUNT","PERIOD"]),
  followersLost: count("Seguidores perdidos",["ACCOUNT","PERIOD"]),
  netFollowerGrowth: {...count("Crecimiento neto",["ACCOUNT","PERIOD"]),signed:true},
  interactions: {...count("Interacciones"),manualEntryAllowed:false}, publications: {...count("Publicaciones",["PERIOD"]),manualEntryAllowed:false},
  spend: {label:"Inversión",unit:"currency",levels:["AD"],manualEntryAllowed:true},
  adReach: count("Alcance publicitario",["AD"]), adImpressions: count("Impresiones publicitarias",["AD"]),
  messages: count("Mensajes",["AD","PERIOD"]), leads: count("Leads",["AD"]), conversions: count("Conversiones",["AD"]),
  ctr: {label:"CTR",unit:"percent",levels:["AD"],manualEntryAllowed:true},
  totalWatchTime: {label:"Tiempo total de reproducción",unit:"seconds",levels:["PUBLICATION"],manualEntryAllowed:true},
  averageWatchTime: {label:"Tiempo promedio de reproducción",unit:"seconds",levels:["PUBLICATION"],manualEntryAllowed:true},
  averageWatchPercentage: {label:"Porcentaje promedio visto",unit:"percent",levels:["PUBLICATION"],manualEntryAllowed:true},
  completePlays: count("Reproducciones completas",["PUBLICATION"]),
  uniqueReach: {...count("Alcance único entre redes",["PERIOD"]),manualEntryAllowed:false},
  retention: {label:"Retención",unit:"percent",levels:["PUBLICATION"],manualEntryAllowed:false},
  ...Object.fromEntries(["13-17","18-24","25-34","35-44","45-54","55-64","65+"].map(age=>["audience.age."+age,{label:"Audiencia "+age,unit:"percent",levels:["ACCOUNT"],manualEntryAllowed:true}])),
  ...Object.fromEntries(["female","male","other"].map(gender=>["audience.gender."+gender,{label:"Audiencia · "+({female:"Mujeres",male:"Hombres",other:"Otros"}[gender as "female"]),unit:"percent",levels:["ACCOUNT"],manualEntryAllowed:true}])),
  ...Object.fromEntries(Array.from({length:7},(_,day)=>Array.from({length:24},(_,hour)=>["activity."+day+"."+hour,{label:`Actividad · día ${day+1}, ${hour}:00`,unit:"count",levels:["ACCOUNT"],manualEntryAllowed:true}])).flat()),
};
export const categoryLabels = {HUMOR:"Humor",PRODUCTO:"Producto",PROMOCION:"Promoción",MARCA:"Marca",INSTITUCIONAL:"Institucional",EDUCATIVO:"Educativo",EFEMERIDE:"Efeméride",TESTIMONIAL:"Testimonial",OTRO:"Otro"};
export const objectiveLabels = {REACH:"Alcance",ENGAGEMENT:"Interacción",TRAFFIC:"Tráfico",SALES:"Ventas",MESSAGES:"Mensajes",BRAND_AWARENESS:"Reconocimiento de marca",COMMUNITY:"Comunidad"};
export type ManualMetric = {
  id:string; companyId:string; socialAccountId:string|null; publicationId:string|null; platform:Platform; metric:string; level:Level;
  periodStart:string; periodEnd:string; value:number; unit:string; source:"MANUAL"; officialSource:string; dataDate:string;
  note:string; preference:"API"|"MANUAL"; enteredBy:string; enteredAt:string; updatedBy:string; updatedAt:string; version:number;
};
export type Editorial = {publicationId:string; contentCategory:keyof typeof categoryLabels|null; contentObjective:keyof typeof objectiveLabels|null; version:number};
export type ReportGoal = {id:string; companyId:string; platform:Platform|"Todas"; periodStart:string; periodEnd:string; metric:string; targetValue:number; version:number};
export type Snapshot = {publicationId:string; capturedAt:string; metrics:Metrics};
export type MetricDatum = {value:number|null; source:Source; status:Availability; reason:string; manualEntryAllowed:boolean; apiValue:number|null; manualValue:number|null; manualId:string|null; preference:"API"|"MANUAL"; unit:string};
export const officialSources = {Instagram:["Instagram Insights","Meta Business Suite"],Facebook:["Facebook Insights","Meta Business Suite"],TikTok:["TikTok Analytics","TikTok Ads Manager"]};
export function validateManual(input: unknown): Omit<ManualMetric,"id"|"companyId"|"source"|"enteredBy"|"enteredAt"|"updatedBy"|"updatedAt"> & {id?:string} {
  if (!input || typeof input !== "object") throw new Error("Dato manual inválido.");
  const x = input as Record<string, unknown>, def = metricRegistry[String(x.metric)], platform = x.platform as Platform;
  if (!def?.manualEntryAllowed || !officialSources[platform]?.includes(String(x.officialSource)) || !def.levels.includes(x.level as Level)) throw new Error("La métrica, nivel o fuente oficial no admite esta carga manual.");
  if (typeof x.value!=="number" || !Number.isFinite(x.value) || Math.abs(x.value)>1e15 || (!def.signed && x.value<0) || (def.unit==="percent" && x.value>100) || (def.unit==="count" && !Number.isInteger(x.value))) throw new Error("Valor inválido para la unidad de esta métrica.");
  if (typeof x.periodStart!=="string" || typeof x.periodEnd!=="string" || !validDate(x.periodStart) || !validDate(x.periodEnd) || x.periodEnd<x.periodStart || typeof x.dataDate!=="string" || !validDate(x.dataDate)) throw new Error("Fechas inválidas.");
  if (x.verified !== true || typeof x.note!=="string" || x.note.length>2000 || !Number.isSafeInteger(x.version) || (x.version as number)<0 || !["API","MANUAL"].includes(String(x.preference))) throw new Error("Confirma el dato en el panel oficial y revisa la nota y versión.");
  for (const key of ["id","publicationId","socialAccountId"]) if(x[key]!=null && (typeof x[key]!=="string" || !(x[key] as string).length || (x[key] as string).length>200)) throw new Error("Referencia inválida.");
  if ((x.level==="PUBLICATION")!==!!x.publicationId || (x.level==="ACCOUNT" && !x.socialAccountId) || (["PERIOD","AD"].includes(String(x.level)) && (x.publicationId || x.socialAccountId))) throw new Error("Elige una referencia correspondiente al nivel.");
  if (x.unit !== def.unit && !(def.unit==="currency" && typeof x.unit==="string" && /^[A-Z]{3}$/.test(x.unit))) throw new Error("Unidad inválida; las cantidades monetarias requieren moneda ISO.");
  return x as unknown as ReturnType<typeof validateManual>;
}
export function resolveDatum(key:string,apiValue:number|null,manual?:ManualMetric,status:Availability="NO_DATA",reason=""):MetricDatum {
  const def=metricRegistry[key];
  const useManual=!!manual && (apiValue===null || manual.preference==="MANUAL");
  const value=useManual?manual.value:apiValue;
  return {value,source:value===null?"MISSING":useManual?"MANUAL":"API",status:value!==null?"AVAILABLE":def?.manualEntryAllowed?"MANUAL_AVAILABLE":status,reason:reason||availabilityLabels[status],manualEntryAllowed:!!def?.manualEntryAllowed,apiValue,manualValue:manual?.value??null,manualId:manual?.id??null,preference:manual?.preference||"API",unit:manual?.unit||def?.unit||"count"};
}
export function publicationData(post:SocialPublication,manual:ManualMetric[],start:string,end:string) {
  const records=manual.filter(m=>m.publicationId===post.id && m.companyId===post.companyId && m.periodStart===start && m.periodEnd===end);
  return Object.fromEntries(Object.keys(post.metrics).filter(k=>k!=="retention").map(key=>{
    const datum=resolveDatum(key,numeric(post.metrics[key as keyof Metrics]),records.find(m=>m.metric===key),post.availability?.[key]?.status||"NO_DATA",post.availability?.[key]?.reason||"");
    datum.manualEntryAllowed=manualAllowedForPublication(key,post);
    if(datum.value===null&&!datum.manualEntryAllowed){datum.status=post.availability?.[key]?.status||"MEDIA_TYPE_NOT_SUPPORTED";datum.reason=post.availability?.[key]?.reason||"Esta métrica no admite carga manual para este formato o nivel.";}
    return [key,datum];
  }));
}
export function shortTitle(post: Pick<SocialPublication,"title"|"caption">,max=100) {
  const original=(post.title||post.caption).split(/\r?\n/)[0]||"Publicación";
  const clean=original.replace(/#[\p{L}\p{N}_]+/gu,"").replace(/https?:\/\/\S+/g,"").replace(/\+?\d[\d\s()-]{7,}\d/g,"").replace(/(?:direcci[oó]n|ubicaci[oó]n|vis[ií]tanos|reserva|cont[aá]ctanos|ll[aá]manos|av\.|avenida|calle)\b.*$/i,"").replace(/\s+/g," ").trim();
  return clean?clean.length>max?clean.slice(0,max-1).trim()+"…":clean:"Publicación";
}
export function resolvedPublication(post:SocialPublication,manual:ManualMetric[],start:string,end:string) {
  const data=publicationData(post,manual,start,end);
  const metrics={...post.metrics};for(const [key,datum] of Object.entries(data)) metrics[key as Exclude<keyof Metrics,"retention">]=datum.value;
  return {...post,metrics,metricData:data};
}
export function completeAverage(posts:SocialPublication[],key:string) {
  const values=posts.map(p=>metric(p,key)),known=values.filter((v):v is number=>v!==null);
  return {value:known.length?known.reduce((a,b)=>a+b,0)/known.length:null,availableCount:known.length,totalCount:posts.length,complete:posts.length>0&&known.length===posts.length};
}
