import { marketingAccount, panelAccess } from "../account-access";
import { logDatabaseError } from "../database";
import { parseQuery } from "./model";
import { deleteManual, manualHistory, readHybrid, ReportWriteError, saveEditorial, saveGoal, saveManual } from "./hybrid-repository";

const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
export async function hybridHandler(request:Request,section:"manual-metrics"|"goals"|"classification") {
  try {
    const denied=await panelAccess(request);if(denied)return denied;
    const account=await marketingAccount(request);
    let query;try{query=parseQuery(new URL(request.url));}catch(e){return json({error:(e as Error).message},400);}
    if(account&&!account.companies.includes(query.companyId))return json({error:"Empresa no autorizada."},403);
    if(query.mode!=="production")return json({error:"Los datos manuales, clasificación y objetivos no se guardan en DEMO."},400);
    if(!process.env.DATABASE_URL)return json({error:"Esta operación requiere PostgreSQL."},503);
    const actor=account?.login||process.env.PANEL_USER||"owner";
    if(request.method==="GET") {
      const id=new URL(request.url).searchParams.get("id");
      if(section==="manual-metrics"&&id)return json({history:await manualHistory(query.companyId,id)});
      const data=await readHybrid(query);return json(section==="goals"?{goals:data.goals}:section==="classification"?{editorial:data.editorial}:{metrics:data.manualMetrics,accounts:data.accounts});
    }
    let body:Record<string,unknown>;
    try{const raw=await request.text();if(raw.length>16000)return json({error:"La operación supera el límite permitido."},413);body=JSON.parse(raw);if(!body||typeof body!=="object"||Array.isArray(body))throw new Error();}catch{return json({error:"Solicitud inválida."},400);}
    if(section==="manual-metrics") {
      if(request.method==="DELETE") {
        if(typeof body.id!=="string"||!Number.isSafeInteger(body.version)||(body.version as number)<1)throw new ReportWriteError("Referencia o versión inválida.");
        return json(await deleteManual(query.companyId,actor,body.id,body.version as number));
      }
      if(!["POST","PUT"].includes(request.method))return json({error:"Método no permitido."},405);
      return json({metric:await saveManual(query.companyId,actor,body)});
    }
    if(!["POST","PUT"].includes(request.method))return json({error:"Método no permitido."},405);
    if(section==="classification")return json(await saveEditorial(query.companyId,actor,body));
    return json({goal:await saveGoal(query.companyId,actor,body)});
  }catch(e){if(e instanceof ReportWriteError)return json({error:e.message},e.status);logDatabaseError("hybrid_report",e);return json({error:"No se pudo guardar o consultar el dato. Recarga para comprobar su estado."},503);}
}
