import { ContentReportsDashboard } from "@/components/content-reports/dashboard";
export const dynamic = "force-dynamic";
export default function Page() { return <ContentReportsDashboard server={!!process.env.DATABASE_URL}/>; }
