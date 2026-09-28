import { NETWORKS, dateKey, parseDate, validDate, validReferenceUrl } from "./calendar";

export const REPORT_METRICS = { reach: "Alcance", views: "Visualizaciones", interactions: "Interacciones", likes: "Me gusta", comments: "Comentarios", shares: "Compartidos", saves: "Guardados", followersStart: "Seguidores al inicio", followersEnd: "Seguidores al cierre" } as const;
export type MetricKey = keyof typeof REPORT_METRICS;
export type Metrics = Record<MetricKey, number | null>;
export type ReportNetwork = { network: typeof NETWORKS[number]; current: Metrics; previous: Metrics };
export type Report = { id: string; title: string; start: string; end: string; previousStart: string; previousEnd: string; networks: ReportNetwork[]; highlights: { id: string; title: string; network: typeof NETWORKS[number]; url: string; imageUrl: string; mediaId: string; note: string }[]; conclusions: string; nextSteps: string };
export function emptyMetrics(): Metrics { return Object.fromEntries(Object.keys(REPORT_METRICS).map(key => [key, null])) as Metrics; }
export function newReport(today: string): Report {
  const anchor = parseDate(today);
  return { id: "", title: "Reporte de redes sociales", start: dateKey(new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12)), end: dateKey(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 12)), previousStart: dateKey(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1, 12)), previousEnd: dateKey(new Date(anchor.getFullYear(), anchor.getMonth(), 0, 12)), networks: NETWORKS.map(network => ({ network, current: emptyMetrics(), previous: emptyMetrics() })), highlights: [], conclusions: "", nextSteps: "" };
}
export function metricChange(current: number | null, previous: number | null): string {
  if (current === null || previous === null) return "Sin comparación";
  if (previous === 0) return current === 0 ? "Sin cambio" : "Base anterior: 0";
  const change = (current - previous) / previous * 100;
  return `${change > 0 ? "+" : ""}${change.toLocaleString("es", { maximumFractionDigits: 1 })}%`;
}
export const metricLabel = (value: number | null) => value === null ? "Sin datos" : value.toLocaleString("es");
export const followerGrowth = (m: Metrics) => m.followersStart === null || m.followersEnd === null ? null : m.followersEnd - m.followersStart;
export function validReport(value: unknown): value is Report {
  if (!value || typeof value !== "object") return false;
  const r = value as Report;
  const string = (v: unknown, n: number) => typeof v === "string" && v.length <= n;
  const date = (v: unknown) => typeof v === "string" && validDate(v);
  const metrics = (v: Metrics) => !!v && typeof v === "object" && Object.keys(REPORT_METRICS).every(k => v[k as MetricKey] === null || (Number.isSafeInteger(v[k as MetricKey]) && v[k as MetricKey]! >= 0));
  return string(r.id, 100) && !!r.id && string(r.title, 120) && !!r.title.trim() && date(r.start) && date(r.end) && r.start <= r.end && date(r.previousStart) && date(r.previousEnd) && r.previousStart <= r.previousEnd && r.previousEnd < r.start &&
    Array.isArray(r.networks) && r.networks.length > 0 && r.networks.length <= 3 && new Set(r.networks.map(n => n?.network)).size === r.networks.length && r.networks.every(n => n && NETWORKS.includes(n.network) && metrics(n.current) && metrics(n.previous)) &&
    string(r.conclusions, 5000) && string(r.nextSteps, 5000) && Array.isArray(r.highlights) && r.highlights.length <= 20 && new Set(r.highlights.map(h => h?.id)).size === r.highlights.length &&
    r.highlights.every(h => h && string(h.id, 100) && !!h.id && string(h.title, 160) && !!h.title.trim() && NETWORKS.includes(h.network) && r.networks.some(n => n.network === h.network) && string(h.url, 2000) && validReferenceUrl(h.url) && string(h.imageUrl, 2000) && validReferenceUrl(h.imageUrl) && string(h.mediaId, 100) && string(h.note, 1500));
}
export function readReports(value: unknown): Report[] {
  if (!Array.isArray(value) || value.length > 200 || !value.every(validReport) || new Set(value.map(r => r.id)).size !== value.length) throw new Error("Los reportes guardados no son válidos. No se sobrescribirán.");
  return value;
}
