import { marketingAccount, panelAccess } from "@/lib/account-access";
import { connectionDiagnostics } from "@/lib/content-reports/connection-diagnostics";
export async function GET(request:Request) {
  const denied=await panelAccess(request);if(denied)return denied;
  const company=new URL(request.url).searchParams.get("companyId")||"";
  if(!company.trim()||company.length>80)return Response.json({error:"Selecciona una empresa válida."},{status:400});
  const account=await marketingAccount(request);
  if(account&&!account.companies.includes(company))return Response.json({error:"Empresa no autorizada."},{status:403});
  try{return Response.json(await connectionDiagnostics(company),{headers:{"Cache-Control":"no-store"}});}
  catch{return Response.json({error:"No se pudo completar el diagnóstico."},{status:503,headers:{"Cache-Control":"no-store"}});}
}
