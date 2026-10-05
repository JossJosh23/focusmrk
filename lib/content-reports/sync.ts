import { POST as tiktokAction } from "../../app/api/tiktok/route";
import { platforms, previousPeriod, type ReportQuery, type SyncStatus } from "./model";
import { collectInstagram } from "./instagram-collector";
import { collectFacebook } from "./facebook-collector";
import { importCollector, importTikTok, saveSyncStatus } from "./repository";
import { SocialProviderError, safeMessage } from "./provider";

// The caller performs session, tenant and CSRF checks before any API request.
export async function syncReport(request: Request, query: ReportQuery): Promise<SyncStatus[]> {
  const prior = previousPeriod(query), results: SyncStatus[] = [];
  for (const platform of platforms.filter(p => query.platform === "Todas" || p === query.platform)) {
    const result: SyncStatus = { platform, status: "success", imported: 0, capturedAt: new Date().toISOString(), startDate: prior.startDate, endDate: query.endDate, warnings: [], error: null };
    try {
      if (platform === "TikTok") {
        // Each request stays within the existing one-year TikTok limit. Both
        // cohorts are imported, so a first sync can compare the prior period.
        const snapshots = [];
        for (const period of [prior, query]) {
          const response = await tiktokAction(new Request(new URL(`/api/tiktok?company=${encodeURIComponent(query.companyId)}`, request.url), {
            method: "POST", headers: request.headers, body: JSON.stringify({ action: "report", start: period.startDate, end: period.endDate }),
          }));
          const data = await response.json().catch(() => null);
          if (!response.ok || !data?.snapshot) throw new SocialProviderError(`TikTok: ${safeMessage(data?.error || "Respuesta no válida del servidor.")}`, response.status);
          snapshots.push(data.snapshot);
        }
        if (snapshots[0].user.open_id !== snapshots[1].user.open_id) throw new SocialProviderError("La cuenta de TikTok cambió durante la consulta. Inicia una consulta nueva.", 409);
        const videos = new Map<string, (typeof snapshots)[number]["videos"][number]>();
        for (const snapshot of snapshots) for (const video of snapshot.videos) videos.set(video.id, video);
        result.imported = await importTikTok(query.companyId, { ...snapshots[1], videos: [...videos.values()] });
        result.warnings = ["TikTok: las métricas son acumuladas por video a la fecha de consulta. Alcance, guardados, retención y demografía no están disponibles con estos permisos."];
      } else {
        const collected = await (platform === "Instagram" ? collectInstagram(query) : collectFacebook(query));
        result.imported = await importCollector(query.companyId, collected);
        result.warnings = collected.warnings;
      }
    } catch (error) {
      result.status = "error";
      result.error = error instanceof SocialProviderError ? safeMessage(error.message) : `No se pudo consultar o guardar ${platform}. Revisa su conexión y los logs del servidor.`;
      // Log only a public stage/platform and numeric API status; raw errors may
      // contain tokens, query URLs or database connection strings.
      console.error("[content_report_sync]", { platform, stage: "collect_or_store", http_status: error instanceof SocialProviderError ? error.status : null, provider_code: error instanceof SocialProviderError ? error.code : null });
    }
    result.capturedAt = new Date().toISOString();
    await saveSyncStatus(query.companyId, result);
    results.push(result);
  }
  return results;
}
