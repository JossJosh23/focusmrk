import { hybridHandler } from "@/lib/content-reports/hybrid-api";
export const runtime = "nodejs";
export const GET=(request:Request)=>hybridHandler(request,"goals");
export const POST=GET;
export const PUT=GET;
