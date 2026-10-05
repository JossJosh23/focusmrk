import { hybridHandler } from "@/lib/content-reports/hybrid-api";
export const runtime = "nodejs";
export const GET=(request:Request)=>hybridHandler(request,"manual-metrics");
export const POST=GET;
export const PUT=GET;
export const DELETE=GET;
