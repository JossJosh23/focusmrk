import { buildReport, contentTypes, metric, metricLabels, platforms, previousPeriod, publicationDate, sum, variation, type Dataset, type MetricKey, type Platform, type ReportQuery } from "./model";
import { categoryLabels, completeAverage, metricRegistry, publicationData, resolveDatum, resolvedPublication, shortTitle, type Editorial, type ManualMetric, type MetricDatum, type ReportGoal, type Snapshot, type Source } from "./hybrid";

export type HybridDataset = Dataset & {manualMetrics?:ManualMetric[];editorial?:Editorial[];goals?:ReportGoal[];accounts?:{id:string;platform:Platform}[];snapshots?:Snapshot[];connections?:Partial<Record<Platform,boolean>>};
export const formatLabels = {REEL:"Reels",POST:"Posts",CAROUSEL:"Carruseles",STORY:"Historias",VIDEO:"Videos",TIKTOK:"TikToks"};
export type ExecutiveFact = {kind:"HECHO"|"INSIGHT"|"RECOMENDACIÓN";text:string};
function sources(items:MetricDatum[],calculated=false):Source[] {return [...new Set(items.filter(x=>x.value!==null).map(x=>x.source)),...(calculated?["CALCULATED" as const]:[])].filter((v,i,a)=>a.indexOf(v)===i);}
const fmt=(n:number)=>n.toLocaleString("es-EC",{maximumFractionDigits:2});
export function buildExecutiveReport(dataset:HybridDataset,query:ReportQuery) {
  const prior=previousPeriod(query), accepts=(p:Platform)=>query.platform==="Todas"||p===query.platform;
  const manual=(dataset.manualMetrics||[]).filter(m=>m.companyId===query.companyId&&accepts(m.platform));
  const rawPublications=dataset.publications.filter(p=>p.companyId===query.companyId&&accepts(p.platform));
  const resolved=rawPublications.map(p=>resolvedPublication(p,manual,publicationDate(p.publishedAt)>=query.startDate?query.startDate:prior.startDate,publicationDate(p.publishedAt)>=query.startDate?query.endDate:prior.endDate));
  const report=buildReport({...dataset,publications:resolved},query), apiReport=buildReport({...dataset,publications:rawPublications},query);
  const rangeManual=(start:string,end:string)=>manual.filter(m=>m.periodStart===start&&m.periodEnd===end);
  const currentManual=rangeManual(query.startDate,query.endDate);
  const rawById=new Map(rawPublications.map(p=>[p.id,p]));
  const pubData=new Map(report.publications.map(p=>{
    const data=publicationData(rawById.get(p.id)!,manual,query.startDate,query.endDate);
    for(const key of ["interactions","engagement"]){const value=metric(p,key);data[key]={...resolveDatum(key,null),value,source:value===null?"MISSING":"CALCULATED",status:value===null?"NO_DATA":"AVAILABLE",reason:value===null?"Faltan componentes necesarios para el cálculo.":"Calculado a partir de métricas reales.",manualEntryAllowed:false,unit:key==="engagement"?"percent":"count"};}
    return [p.id,data] as const;
  }));
  const editorial=dataset.editorial||[];
  const publications=report.publications.map(p=>({...p,shortTitle:shortTitle(p),metricData:pubData.get(p.id)!,editorial:editorial.find(e=>e.publicationId===p.id)||{publicationId:p.id,contentCategory:null,contentObjective:null,version:0},history:(dataset.snapshots||[]).filter(s=>s.publicationId===p.id)}));
  // Scope-level manual values never get copied onto every publication.
  // A period value may replace an unavailable aggregate, while publication coverage remains explicit.
  function aggregate(key:string,platform:Platform|"Todas",start:string,end:string) {
    const posts=(start===query.startDate?publications:resolved.filter(p=>publicationDate(p.publishedAt)>=start&&publicationDate(p.publishedAt)<=end)).filter(p=>platform==="Todas"||p.platform===platform);
    const targetPlatforms=platform==="Todas"?platforms:[platform];
    const components=targetPlatforms.map(p=>{
      const subset=posts.filter(post=>post.platform===p),apiSubset=rawPublications.filter(post=>post.platform===p&&publicationDate(post.publishedAt)>=start&&publicationDate(post.publishedAt)<=end);
      const apiValue=key==="publications"?subset.length:key==="followersGained"?sum(dataset.followers.filter(f=>f.platform===p&&f.date>=start&&f.date<=end).map(f=>f.gained)):key==="netFollowerGrowth"?sum(report.followers.filter(f=>f.platform===p&&f.socialAccountId).map(f=>f.net)):key==="followers"?sum(report.followers.filter(f=>f.platform===p&&f.socialAccountId).map(f=>f.final)):sum(apiSubset.map(post=>metric(post,key)));
      const periodRecord=rangeManual(start,end).find(m=>m.platform===p&&m.metric===key&&m.level==="PERIOD");
      const accountRecords=rangeManual(start,end).filter(m=>m.platform===p&&m.metric===key&&m.level==="ACCOUNT");
      let datum=resolveDatum(key,apiValue,periodRecord);
      const publicationTotal=sum(subset.map(post=>metric(post,key)));
      if(!periodRecord&&!["publications","followers","followersGained","followersLost","netFollowerGrowth","messages"].includes(key)&&publicationTotal!==null){
        const hasManual=subset.some(post=>"metricData" in post&&(post.metricData as Record<string,MetricDatum>)[key]?.source==="MANUAL");
        datum={...datum,value:publicationTotal,source:hasManual?"MANUAL":key==="interactions"?"CALCULATED":"API",status:"AVAILABLE"};
      }
      if(!periodRecord&&accountRecords.length&&["followers","followersGained","followersLost","netFollowerGrowth","profileVisits"].includes(key)) {
        const accounts=(dataset.accounts||[]).filter(a=>a.platform===p);
        const values=accounts.map(a=>{const record=accountRecords.find(m=>m.socialAccountId===a.id);const f=report.followers.find(f=>f.platform===p&&f.socialAccountId===a.id);const api=key==="followers"?f?.final??null:key==="netFollowerGrowth"?f?.net??null:key==="followersGained"?f?.gained??null:key==="followersLost"?f?.lost??null:null;return resolveDatum(key,api,record);});
        const total=sum(values.map(v=>v.value));if(total!==null)datum={...datum,value:total,source:values.some(v=>v.source==="MANUAL")?"MANUAL":key==="netFollowerGrowth"?"CALCULATED":"API",status:"AVAILABLE"};
      }
      const avg=completeAverage(subset,key),known=subset.map(post=>metric(post,key)).filter((v):v is number=>v!==null);
      if(datum.value===null&&known.length)datum={...datum,value:known.reduce((a,b)=>a+b,0),source:subset.some(post=>"metricData" in post&&(post.metricData as Record<string,MetricDatum>)[key]?.source==="MANUAL")?"MANUAL":key==="interactions"?"CALCULATED":"API",status:"AVAILABLE"};
      if(key==="netFollowerGrowth"&&datum.source==="API"&&datum.value!==null)datum.source="CALCULATED";
      if(key==="publications"||key==="interactions")datum.source=datum.value===null?"MISSING":"CALCULATED";
      if(key==="interactions"&&datum.value===null){const known=subset.flatMap(post=>[post.metrics.likes,post.metrics.comments,post.metrics.shares,post.metrics.saves]).filter((v):v is number=>v!==null);if(known.length)datum={...datum,value:known.reduce((a,b)=>a+b,0),source:"CALCULATED",status:"AVAILABLE"};}
      const complete=key==="publications" ? true : periodRecord&&datum.value!==null ? true : ["netFollowerGrowth","followers","followersGained"].includes(key) ? datum.value!==null : avg.complete;
      const availableCount=key==="publications"?subset.length:key==="interactions"?subset.flatMap(post=>[post.metrics.likes,post.metrics.comments,post.metrics.shares,post.metrics.saves]).filter(v=>v!==null).length:avg.availableCount;
      return {platform:p,datum,availableCount,totalCount:subset.length,complete,publicationSources:subset.flatMap(post=>pubData.get(post.id)?.[key]?[pubData.get(post.id)![key]]:[])};
    }).filter(row=>row.totalCount>0||row.datum.value!==null||platform!=="Todas");
    const available=components.filter(c=>c.datum.value!==null),complete=components.length>0&&components.every(c=>c.complete);
    const value=available.length?available.reduce((n,c)=>n+c.datum.value!,0):key==="publications"?posts.length:null;
    const origin=sources(available.map(c=>c.datum));
    return {value,complete,availableCount:components.reduce((n,c)=>n+c.availableCount,0),totalCount:key==="interactions"?posts.length*4:posts.length,unit:key==="interactions"?"components" as const:"publications" as const,sources:[...new Set([...origin,...components.flatMap(c=>sources(c.publicationSources))])],platforms:available.map(c=>c.platform),scope:available.some(c=>rangeManual(start,end).some(m=>m.platform===c.platform&&m.metric===key&&m.level!=="PUBLICATION"))?"PERIOD" as const:"PUBLICATIONS" as const,components};
  }
  const kpiKeys=[...Object.keys(metricLabels),"followers","netFollowerGrowth","messages"];
  const kpis=kpiKeys.map(key=>{const now=aggregate(key,query.platform,query.startDate,query.endDate),before=["followers","netFollowerGrowth"].includes(key)?null:aggregate(key,query.platform,prior.startDate,prior.endDate);return {key,label:metricRegistry[key]?.label||key,...now,previous:before?.value??null,change:now.complete&&before?.complete?variation(now.value,before.value):null,status:now.value!==null?"AVAILABLE" as const:["followers","netFollowerGrowth"].includes(key)?"HISTORICAL_DATA_REQUIRED" as const:"NO_DATA" as const};});
  const networks=platforms.filter(accepts).map(platform=>{
    const sync=report.syncs.find(s=>s.platform===platform);
    const status=dataset.connections?.[platform]===false?"NOT_CONNECTED" as const:sync?.status==="error"?"API_ERROR" as const:!sync&&!report.publications.some(p=>p.platform===platform)?"PENDING_SYNC" as const:"AVAILABLE" as const;
    return {platform,status,reason:sync?.status==="error"?sync.error:null,metrics:Object.fromEntries(kpiKeys.map(key=>[key,aggregate(key,platform,query.startDate,query.endDate)]))};
  });
  const views=kpis.find(k=>k.key==="views")!;
  const formats=contentTypes.filter(type=>publications.some(p=>p.contentType===type)).map(type=>{const posts=publications.filter(p=>p.contentType===type);return {type,label:formatLabels[type],count:posts.length,share:publications.length?posts.length/publications.length*100:null,views:completeAverage(posts,"views"),interactions:completeAverage(posts,"interactions"),engagement:completeAverage(posts,"engagement"),viewsTotal:sum(posts.map(p=>p.metrics.views))};});
  const normalized=["views","interactions","likes","comments","shares"].map(key=>{const current=completeAverage(publications,key),previous=completeAverage(resolved.filter(p=>publicationDate(p.publishedAt)>=prior.startDate&&publicationDate(p.publishedAt)<=prior.endDate),key);return {key,label:metricLabels[key as MetricKey],current,previous,change:current.complete&&previous.complete?variation(current.value,previous.value):null};});
  const classified=publications.filter(p=>p.editorial.contentCategory);
  const categories=Object.entries(categoryLabels).map(([key,label])=>{const posts=classified.filter(p=>p.editorial.contentCategory===key);return {key,label,count:posts.length,views:completeAverage(posts,"views")};}).filter(c=>c.count>=2);
  const categorySufficient=classified.length>=3&&categories.length>0;
  const facts:ExecutiveFact[]=[];
  if(views.value!==null)facts.push({kind:"HECHO",text:`Se registraron ${fmt(views.value)} visualizaciones${views.complete?"":" en las publicaciones con datos disponibles (subtotal)"}.`});
  const comparableNetworks=networks.filter(n=>n.metrics.views.complete&&n.metrics.views.value!==null&&n.metrics.publications.value!>0).sort((a,b)=>b.metrics.views.value!-a.metrics.views.value!);
  if(comparableNetworks.length>1)facts.push({kind:"HECHO",text:`${comparableNetworks[0].platform} registró el mayor volumen de visualizaciones entre las redes con cobertura completa.`});
  const comparableFormats=formats.filter(f=>f.views.complete).sort((a,b)=>b.views.value!-a.views.value!);
  if(comparableFormats.length>1)facts.push({kind:"HECHO",text:`${comparableFormats[0].label} obtuvo el mayor promedio de visualizaciones por publicación (${fmt(comparableFormats[0].views.value!)}).`});
  const winner=[...publications].filter(p=>p.metrics.views!==null).sort((a,b)=>b.metrics.views!-a.metrics.views!)[0];
  if(winner)facts.push({kind:"HECHO",text:`«${winner.shortTitle}» fue la publicación más vista entre las piezas con datos.`});
  const recommendations:ExecutiveFact[]=[];
  if(comparableFormats.length>1)recommendations.push({kind:"RECOMENDACIÓN",text:`Probar nuevas variantes de ${comparableFormats[0].label.toLowerCase()} y medir si mantienen su promedio de visualizaciones. Esto no demuestra un mejor resultado comercial.`});
  if(winner)recommendations.push({kind:"RECOMENDACIÓN",text:`Experimentar con una variante de «${winner.shortTitle}» y contrastar sus resultados con el mismo criterio.`});
  if(!views.complete)recommendations.push({kind:"RECOMENDACIÓN",text:"Completar o consultar los datos pendientes antes de comparar el volumen total entre redes."});
  const lowerFacts:ExecutiveFact[]=[];
  if(comparableFormats.length>1)lowerFacts.push({kind:"HECHO",text:`${comparableFormats.at(-1)!.label} obtuvo el menor promedio de visualizaciones entre los formatos con cobertura completa.`});
  const accounts=dataset.accounts||[];
  const manualAudience=accounts.map(account=>{
    const existing=report.audience.find(a=>a.platform===account.platform);
    const records=currentManual.filter(m=>m.level==="ACCOUNT"&&m.socialAccountId===account.id);
    const resolveGroup=(prefix:string,api:{label:string;value:number}[])=>records.filter(m=>m.metric.startsWith(prefix)).map(m=>{
      const label=m.metric.slice(prefix.length),automatic=api.find(row=>row.label===label)?.value??null,datum=resolveDatum(m.metric,automatic,m);
      return {label,value:datum.value!,source:datum.source,apiValue:automatic,manualValue:m.value};
    });
    const age=resolveGroup("audience.age.",existing?.age||[]),gender=resolveGroup("audience.gender.",existing?.gender||[]);
    const activity=records.filter(m=>m.metric.startsWith("activity.")).map(m=>{const [,day,hour]=m.metric.split(".");return {day:Number(day),hour:Number(hour),value:m.value};});
    return {accountId:account.id,platform:account.platform,age,gender,activity};
  }).filter(a=>a.age.length||a.gender.length||a.activity.length);
  const periodData=platforms.filter(accepts).flatMap(platform=>["followersGained","followersLost","netFollowerGrowth","profileVisits","messages"].map(key=>{const api=key==="followersGained"?sum(dataset.followers.filter(f=>f.platform===platform&&f.date>=query.startDate&&f.date<=query.endDate).map(f=>f.gained)):key==="netFollowerGrowth"?sum(report.followers.filter(f=>f.platform===platform&&f.socialAccountId).map(f=>f.net)):null;const m=currentManual.find(m=>m.platform===platform&&m.metric===key&&m.level==="PERIOD");const datum=resolveDatum(key,api,m,key==="netFollowerGrowth"?"HISTORICAL_DATA_REQUIRED":"NO_DATA");if(key==="netFollowerGrowth"&&datum.source==="API")datum.source="CALCULATED";return {platform,key,level:"PERIOD" as const,publicationId:null,socialAccountId:null,datum};}));
  const publicationPending=publications.flatMap(p=>Object.entries(p.metricData).filter(([key,d])=>d.value===null&&d.manualEntryAllowed&&metricRegistry[key]?.levels.includes("PUBLICATION")).map(([key,datum])=>({platform:p.platform,key,level:"PUBLICATION" as const,publicationId:p.id,socialAccountId:p.socialAccountId,datum,title:p.shortTitle})));
  const audiencePending=accounts.flatMap(a=>["audience.age.25-34",...Object.keys(metricRegistry).filter(k=>k.startsWith("audience.")&&k!=="audience.age.25-34")].map(key=>{
    const group=key.startsWith("audience.age.")?"age":"gender",label=key.split(".").slice(2).join(".");
    const api=report.audience.find(row=>row.platform===a.platform)?.[group].find(row=>row.label===label)?.value??null;
    return {platform:a.platform,key,level:"ACCOUNT" as const,publicationId:null,socialAccountId:a.id,datum:resolveDatum(key,api,currentManual.find(m=>m.socialAccountId===a.id&&m.metric===key&&m.level==="ACCOUNT")),title:a.id};
  }));
  const allData=[...publications.flatMap(p=>Object.entries(p.metricData).filter(([key])=>metricRegistry[key]).map(([key,datum])=>({platform:p.platform,key,level:"PUBLICATION" as const,publicationId:p.id,socialAccountId:p.socialAccountId,datum,title:p.shortTitle}))),...periodData,...audiencePending];
  const completeness={API:0,MANUAL:0,CALCULATED:0,pending:0,unsupported:0,calculationUnavailable:0,percent:0};
  for(const row of allData){if(row.datum.value!==null)completeness[row.datum.source as "API"|"MANUAL"|"CALCULATED"]++;else if(row.datum.manualEntryAllowed)completeness.pending++;else if(row.key==="interactions"||row.key==="engagement")completeness.calculationUnavailable++;else completeness.unsupported++;}
  const available=completeness.API+completeness.MANUAL+completeness.CALCULATED;completeness.percent=available+completeness.pending?available/(available+completeness.pending)*100:0;
  const goals=(dataset.goals||[]).filter(g=>g.companyId===query.companyId&&g.platform===query.platform&&g.periodStart===query.startDate&&g.periodEnd===query.endDate).map(g=>{const result=kpis.find(k=>k.key===g.metric);return {...g,result:result?.value??null,coverageComplete:result?.complete??false,sources:result?.sources||[],fulfillment:result?.complete&&result.value!==null?result.value/g.targetValue*100:null};});
  const boundaries={start:query.startDate+"T05:00:00.000Z",end:new Date(Date.parse(query.endDate+"T05:00:00.000Z")+86400000).toISOString()};
  const activity=publications.map(p=>{const history=p.history;const first=history.find(s=>s.capturedAt===boundaries.start),last=history.find(s=>s.capturedAt===boundaries.end);const values=Object.fromEntries(["views","likes","comments","shares"].map(key=>{const a=first?.metrics[key as "views"]??null,b=last?.metrics[key as "views"]??null;return [key,a!==null&&b!==null&&b>=a?b-a:null];}));return {publicationId:p.id,values,status:first&&last?"AVAILABLE":"HISTORICAL_DATA_REQUIRED"};});
  const activityAvailable=activity.length>0&&activity.every(row=>Object.values(row.values).every(v=>v!==null));
  const manualAds=currentManual.filter(m=>m.level==="AD");
  return {...report,accountInsights:dataset.accountInsights||[],publications,executive:{kpis,networks,formats,normalized,categories,classifiedCount:classified.length,categorySufficient,facts,lowerFacts,recommendations,goals,completeness,pending:[...periodData.filter(r=>r.datum.value===null&&r.datum.manualEntryAllowed),...audiencePending.filter(r=>r.datum.value===null),...publicationPending],periodData,manualAudience,manualMetrics:currentManual,allManualMetrics:manual,accounts,activity,activityAvailable,manualAds,apiSummary:apiReport.summary,generatedAt:new Date().toISOString(),viewShareComplete:views.complete}};
}
export type ExecutiveReport=ReturnType<typeof buildExecutiveReport>;
