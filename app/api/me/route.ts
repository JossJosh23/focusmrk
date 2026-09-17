import { panelAccess, marketingAccount } from "@/lib/account-access";
export async function GET(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  if (!process.env.DATABASE_URL) return Response.json({ account: null });
  const account = await marketingAccount(request);
  if (account) return Response.json({ account: { ...account, role: "marketing_manager", company: account.companies.join(", ") } }, { headers: { "Cache-Control": "no-store" } });
  return Response.json({ account: { login: process.env.PANEL_USER, display_name: process.env.PANEL_USER, role: "administrator", company: "Todas las empresas" } }, { headers: { "Cache-Control": "no-store" } });

}
