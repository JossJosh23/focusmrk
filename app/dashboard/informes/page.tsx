import { MarketingCalendar } from "@/components/calendar/marketing-calendar";
export const dynamic = "force-dynamic";
export default function Page() { return <MarketingCalendar databaseEnabled={!!process.env.DATABASE_URL} initialModule="content" notificationTimezone={process.env.REMINDER_TIMEZONE || "America/Guayaquil"}/>; }
