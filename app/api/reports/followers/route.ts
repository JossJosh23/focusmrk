import { reportHandler } from "@/lib/content-reports/api";
export const runtime = "nodejs";
export async function GET(request: Request) { return reportHandler(request, "followers"); }
