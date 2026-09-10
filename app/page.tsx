import { MarketingCalendar } from "@/components/calendar/marketing-calendar";

export default function Home() {
  return <MarketingCalendar databaseEnabled={!!process.env.DATABASE_URL} />;
}
export const dynamic = "force-dynamic";
