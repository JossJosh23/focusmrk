import { MarketingCalendar } from "@/components/calendar/marketing-calendar";

export default function Home() {
  return <MarketingCalendar databaseEnabled={!!process.env.DATABASE_URL} notificationTimezone={process.env.REMINDER_TIMEZONE || "America/Guayaquil"} />;
}
export const dynamic = "force-dynamic";
