import { MarketingCalendar } from "@/components/calendar/marketing-calendar";
export const dynamic = "force-dynamic";
export default async function Page({params}:{params:Promise<{id:string}>}) { return <MarketingCalendar databaseEnabled={!!process.env.DATABASE_URL} initialModule="content" publicationId={(await params).id} notificationTimezone={process.env.REMINDER_TIMEZONE || "America/Guayaquil"}/>; }
