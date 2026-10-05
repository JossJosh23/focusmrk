import { ContentReportsDashboard } from "@/components/content-reports/dashboard";
export const dynamic = "force-dynamic";
export default async function Page({params}:{params:Promise<{id:string}>}) { return <ContentReportsDashboard server={!!process.env.DATABASE_URL} publicationId={(await params).id}/>; }
