import { parseQuery, publicationDate, shiftDate } from "./content-reports/model";

// Store only a canonical, internal report path in the session-bound OAuth state.
// No caller-provided origin or arbitrary URL may become a callback destination.
export function instagramReportPath(raw: string | null, company: string) {
  const today = publicationDate(new Date().toISOString());
  const base = "https://focusmrk.invalid";
  const url = raw === null
    ? new URL(`/dashboard/informes?${new URLSearchParams({ companyId: company, platform: "Todas", startDate: shiftDate(today, -29), endDate: today, mode: "production" })}`, base)
    : new URL(raw, base);
  if (raw !== null && (raw.length > 2048 || !raw.startsWith("/dashboard/informes?"))) throw new Error("Destino de informe no válido.");
  if (url.origin !== base || url.pathname !== "/dashboard/informes" || url.hash || url.username || url.password) throw new Error("Destino de informe no válido.");
  const query = parseQuery(url);
  if (query.companyId !== company || query.mode !== "production") throw new Error("El informe debe pertenecer a esta empresa y usar Datos reales.");
  return `/dashboard/informes?${new URLSearchParams({ ...query })}`;
}
