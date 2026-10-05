import { reportHandler } from "@/lib/content-reports/api";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) { return reportHandler(request, "publications", (await context.params).id); }
