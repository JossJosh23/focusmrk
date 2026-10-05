import { hybridHandler } from "@/lib/content-reports/hybrid-api";
export const runtime = "nodejs";
export const GET=(request:Request)=>hybridHandler(request,"classification");
export const PUT=GET;
