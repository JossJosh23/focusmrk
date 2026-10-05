import { marketingAccount, panelAccess } from "../account-access";
import { logDatabaseError } from "../database";
import { buildReport, parseQuery, metric, type ReportNotes } from "./model";
import { demoDataset } from "./demo";
import { productionDataset, saveNotes } from "./repository";
import { syncReport } from "./sync";
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function reportHandler(request: Request, section: string, id?: string) {
  try {
    const denied = await panelAccess(request); if (denied) return denied;
    let query; try { query = parseQuery(new URL(request.url)); } catch(error) { return json({ error: (error as Error).message },400); }
    const account = await marketingAccount(request);
    if (account && !account.companies.includes(query.companyId)) return json({ error: "Empresa no autorizada." },403);
    if (!process.env.DATABASE_URL && query.mode === "production") return json({ error: "Los informes reales requieren PostgreSQL. Puedes explorar el modo DEMO." },503);
    if (request.method === "PUT") {
      if (query.mode === "demo") return json({ error: "El modo DEMO no guarda datos en producción." },400);
      let notes: ReportNotes;
      try {
        const raw = await request.text(); if (raw.length > 20000) return json({ error: "El análisis supera el límite permitido." },413);
        notes = JSON.parse(raw);
        if (!notes || ![notes.worked,notes.improve,notes.recommendations].every(v => typeof v === "string" && v.length <= 5000) || !Number.isSafeInteger(notes.version) || notes.version < 0) throw new Error();
      } catch { return json({ error: "Análisis no válido." },400); }
      const version = await saveNotes(query, notes);
      return version === null ? json({ error: "El informe cambió en otra sesión. Recarga antes de guardar." },409) : json({ version });
    }
    if (request.method === "POST") {
      if (query.mode === "demo") return json({ error: "La sincronización no está disponible en DEMO." },400);
      const results = await syncReport(request, query);
      const imported = results.reduce((count, result) => count + result.imported, 0);
      const succeeded = results.some(result => result.status === "success");
      return json({ imported, results, ...(!succeeded ? { error: "No se pudo consultar ninguna de las redes seleccionadas. Revisa el resultado de cada red." } : {}) }, succeeded ? 200 : 502);
    }
    const dataset = query.mode === "demo" ? demoDataset(query) : await productionDataset(query);
    const report = buildReport(dataset, query);
    if (id) {
      const post = report.publications.find(p => p.id === id);
      return post ? json({ query, publication: post, warnings: report.warnings }) : json({ error: "Publicación no encontrada para esta empresa y período." },404);
    }
    switch(section) {
      case "summary": return json(report);
      case "publications": return json({ query, publications: report.publications });
      case "audience": return json({ query, audience: report.audience });
      case "followers": return json({ query, followers: report.followers });
      case "comparison": return json({ query, previousPeriod: report.prior, comparison: report.comparison });
      case "ads": return json({ query, organic: report.organic, paid: report.ads, unknownDistribution: report.unknownDistribution });
      case "insights": return json({ query, notes: report.notes });
      case "top-content": {
        const sort = new URL(request.url).searchParams.get("sort") || "reach";
        if (!["reach","views","engagement","shares","saves","followersGained"].includes(sort)) return json({ error: "Criterio de orden no válido." },400);
        return json({ query, sort, publications: [...report.publications].filter(p => metric(p,sort) !== null).sort((a,b) => metric(b,sort)! - metric(a,sort)!).slice(0,5) });
      }
      default: return json({ error: "Informe no encontrado." },404);
    }
  } catch(error) { logDatabaseError("content_report",error); return json({ error: "No se pudo cargar el informe. Revisa el servicio de datos y vuelve a intentar." },503); }
}
