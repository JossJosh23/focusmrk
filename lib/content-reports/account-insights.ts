import { graphRequest, SocialProviderError } from "./provider";
import { numeric, shiftDate, type Platform, type ReportQuery } from "./model";

export type InsightValue = { value: number | null; series: { value: number | null; endTime: string }[]; breakdowns: { dimensions: string[]; results: { labels: string[]; value: number | null }[] }[]; status: "AVAILABLE" | "NO_DATA" | "NOT_SUPPORTED" | "MISSING_PERMISSION" | "DEPRECATED" };
export type AccountInsight = { platform: Platform; accountId: string; startDate: string; endDate: string; capturedAt: string; scope: "PERIOD" | "CURRENT_AUDIENCE"; metrics: Record<string, InsightValue> };
export function insightValue(response: {data?:unknown}, name:string):InsightValue {
  const entries=Array.isArray(response.data)?response.data:[];
  const item=entries.find(e=>e?.name===name);
  const series=Array.isArray(item?.values)?item.values.map((v: {value?:unknown;end_time?:unknown})=>({value:numeric(v.value),endTime:typeof v.end_time==="string"?v.end_time:""})):[];
  const breakdowns=Array.isArray(item?.total_value?.breakdowns)?item.total_value.breakdowns.map((b:{dimension_keys?:unknown;results?:unknown})=>({dimensions:Array.isArray(b.dimension_keys)?b.dimension_keys.filter((d:unknown)=>typeof d==="string"):[],results:Array.isArray(b.results)?b.results.map((r:{dimension_values?:unknown;value?:unknown})=>({labels:Array.isArray(r.dimension_values)?r.dimension_values.filter((v:unknown)=>typeof v==="string"):[],value:numeric(r.value)})):[]})):[];
  const value=numeric(item?.total_value?.value);
  return {value,series,breakdowns,status:value!==null||series.some((s:{value:number|null})=>s.value!==null)||breakdowns.some((b:{results:unknown[]})=>b.results.length)?"AVAILABLE":"NO_DATA"};
}
export async function collectAccountInsights(platform:Platform,path:string,token:string,query:ReportQuery,accountId:string,warnings:Set<string>):Promise<AccountInsight[]> {
  const output:AccountInsight[]=[];
  const names=platform==="Instagram"?["views","reach","profile_views","accounts_engaged","total_interactions"]:["page_media_view","page_views_total","page_post_engagements","page_daily_follows","page_follows","page_total_media_view_unique","page_video_views","page_video_view_time"];
  async function read(names:string[],params:Record<string,string>) {
    const metrics:Record<string,InsightValue>={};
    for(const name of names) {
      try {metrics[name]=insightValue(await graphRequest(platform,path,token,{...params,metric:name}),name);}
      catch(error) {
        if(error instanceof SocialProviderError&&(error.status===401||error.status===429||[190,102,4,17,32,613].includes(error.code??-1)))throw error;
        const status=error instanceof SocialProviderError&&[10,200].includes(error.code??-1)?"MISSING_PERMISSION":"NOT_SUPPORTED";
        metrics[name]={value:null,series:[],breakdowns:[],status};
        warnings.add(`${platform}: ${name} de cuenta no disponible (${status}).`);
      }
    }
    return metrics;
  }
  for(let start=query.startDate;start<=query.endDate;start=shiftDate(start,30)) {
    const end=shiftDate(start,29)<query.endDate?shiftDate(start,29):query.endDate;
    const metrics=await read(names,{period:"day",...(platform==="Instagram"?{metric_type:"total_value"}:{}),since:String(Date.parse(start+"T00:00:00-05:00")/1000),until:String(Date.parse(shiftDate(end,1)+"T00:00:00-05:00")/1000)});
    output.push({platform,accountId,startDate:start,endDate:end,capturedAt:new Date().toISOString(),scope:"PERIOD",metrics});
  }
  if(platform==="Instagram") {
    const audience:Record<string,InsightValue>={};
    for(const dimension of ["age","gender","city","country"]) {
      const metrics=await read(["follower_demographics"],{period:"lifetime",metric_type:"total_value",breakdown:dimension,timeframe:"last_30_days"});
      audience[`follower_demographics_${dimension}`]=metrics.follower_demographics;
    }
    output.push({platform,accountId,startDate:query.startDate,endDate:query.endDate,capturedAt:new Date().toISOString(),scope:"CURRENT_AUDIENCE",metrics:audience});
  }
  return output;
}
