import { reportHandler } from "@/lib/content-reports/api";
export const runtime = "nodejs";
export async function GET(request: Request) { return reportHandler(request, "insights"); }
export async function PUT(request: Request) { return reportHandler(request, "insights"); }
export async function POST(request: Request) { return reportHandler(request, "insights"); }
