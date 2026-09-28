import { REPORT_METRICS, metricChange, metricLabel, followerGrowth, type Report, type MetricKey } from "./reports";
import { wrapScheduleText, type ScheduleVisuals } from "./schedule-visual";

const c = { green: "#075C3D", ink: "#193B2E", muted: "#63786C", bg: "#F5F7F2", pale: "#E6F1E9", white: "#FFFFFF", orange: "#F79319" };
const esc = (s: string) => s.replace(/[&<>"']/g, v => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[v]!);
const text = (s: string, x: number, y: number, size = 23, color = c.ink, bold = false) => `<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" fill="${color}" font-weight="${bold ? 700 : 400}">${esc(s)}</text>`;
const box = (x: number, y: number, w: number, h: number, fill = c.white) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${fill}"/>`;
const image = (source: string, x: number, y: number, w: number, h: number) => /^data:image\/(png|jpeg);base64,/.test(source) ? `<image href="${esc(source)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>` : "";
export type TikTokReportSnapshot = { capturedAt: string; user: { display_name: string; follower_count?: number; video_count?: number }; hasMore: boolean; videos: { id: string; title: string; view_count?: number; like_count?: number; comment_count?: number; share_count?: number }[] };
export function buildReportPages(report: Report, company: string, visuals: ScheduleVisuals, tiktok?: TikTokReportSnapshot): string[] {
  const bodies: string[] = [];
  const palette: Record<string, string> = { Instagram: "#AD397E", Facebook: "#4569CB", TikTok: "#293C49" };
  const networkColor = (name: string) => palette[name] || c.green;
  const heading = (title: string, subtitle: string) => text(title, 70, 242, 36, c.ink, true) + text(subtitle, 70, 281, 21, c.muted);
  // A cover and cross-network overview introduce the detailed source metrics.
  let cover = box(70, 205, 1460, 650, c.green) + text("SOCIAL MEDIA REPORT", 120, 270, 20, c.white, true);
  cover += text("Resultados que", 120, 377, 64, c.white, true) + text("orientan tu contenido.", 120, 454, 64, c.white, true);
  cover += text("Alcance · Comunidad · Interacciones", 120, 523, 27, c.white);
  cover += text(`${report.start} — ${report.end}`, 120, 592, 25, c.white);
  report.networks.forEach((n, i) => { const x = 120 + i * 330; cover += box(x, 683, 300, 90) + text(n.network.toUpperCase(), x + 25, 738, 24, networkColor(n.network), true); });
  bodies.push(cover);

  let overview = heading("Resumen del periodo", "Una lectura conjunta de las redes incluidas en este reporte.");
  overview += box(70, 320, 1460, 365);
  ["RED SOCIAL", "ALCANCE", "VISUALIZACIONES", "INTERACCIONES", "SEGUIDORES"].forEach((label, i) => overview += text(label, [100, 400, 675, 985, 1260][i], 365, 17, c.muted, true));
  report.networks.forEach((n, i) => {
    const y = 430 + i * 95;
    overview += `<rect x="85" y="${y - 25}" width="5" height="48" rx="2" fill="${networkColor(n.network)}"/>` + text(n.network, 105, y, 26, networkColor(n.network), true);
    (["reach", "views", "interactions", "followersEnd"] as MetricKey[]).forEach((key, j) => { const x = [400, 675, 985, 1260][j]; overview += text(metricLabel(n.current[key]), x, y, 26, c.ink, true) + text(n.network === "TikTok" && tiktok && n.current[key] === null ? "Ver consulta de TikTok" : metricChange(n.current[key], n.previous[key]), x, y + 27, 17, c.muted); });
  });
  overview += box(70, 715, 1460, 150, c.pale) + text("CÓMO LEER ESTE REPORTE", 100, 755, 19, c.green, true);
  overview += text("Cada variación compara el periodo actual con el anterior. Los campos vacíos aparecen como «Sin datos».", 100, 795, 23);
  overview += text("El alcance se muestra por red: una misma persona puede estar presente en varias plataformas.", 100, 834, 23);
  bodies.push(overview);

  for (const key of ["reach", "views", "interactions", "followersEnd"] as MetricKey[]) {
    let body = heading(key === "followersEnd" ? "Comunidad de seguidores" : REPORT_METRICS[key], "Resultados por red social · Periodo actual frente al anterior");
    const max = Math.max(1, ...report.networks.flatMap(n => [n.current[key] ?? 0, n.previous[key] ?? 0]));
    report.networks.forEach((n, i) => {
      const y = 315 + i * 182, color = networkColor(n.network);
      body += box(70, y, 1460, 163) + text(n.network.toUpperCase(), 100, y + 37, 19, color, true);
      body += text(metricLabel(n.current[key]), 100, y + 90, 38, c.ink, true) + text(metricChange(n.current[key], n.previous[key]), 100, y + 128, 19, c.muted);
      [n.current[key], n.previous[key]].forEach((value, j) => {
        const by = y + 35 + j * 65;
        body += text(j ? "Anterior" : "Actual", 430, by + 20, 18, c.muted) + box(535, by, 745, 27, c.pale);
        if (value !== null && value > 0) body += `<rect x="535" y="${by}" width="${745 * value / max}" height="27" rx="8" fill="${color}" opacity="${j ? .35 : 1}"/>`;
        body += text(metricLabel(value), 1305, by + 21, 21, c.ink, true);
      });
    });
    bodies.push(body);
  }
  for (const n of report.networks) {
    let body = box(70, 195, 1460, 85, c.green) + text(`${n.network.toUpperCase()} · RESULTADOS DEL PERIODO`, 100, 248, 29, c.white, true);
    const keys: MetricKey[] = ["reach", "views", "interactions"];
    keys.forEach((key, i) => {
      const x = 70 + i * 495;
      body += box(x, 300, 470, 140) + text(REPORT_METRICS[key].toUpperCase(), x + 25, 335, 18, c.muted, true) + text(metricLabel(n.current[key]), x + 25, 389, n.current[key] === null ? 28 : 40, c.green, true) + text(metricChange(n.current[key], n.previous[key]), x + 25, 421, 18, c.muted);
    });
    body += box(70, 465, 910, 410) + text("MÉTRICA", 95, 507, 19, c.green, true) + text("ACTUAL", 460, 507, 19, c.green, true) + text("ANTERIOR", 655, 507, 19, c.green, true) + text("CAMBIO", 825, 507, 19, c.green, true);
    const detailKeys: MetricKey[] = ["likes", "comments", "shares", "saves", "followersStart", "followersEnd"];
    detailKeys.forEach((key, i) => { const y = 552 + i * 42; body += text(REPORT_METRICS[key], 95, y, 22) + text(metricLabel(n.current[key]), 460, y, 21) + text(metricLabel(n.previous[key]), 655, y, 21) + text(metricChange(n.current[key], n.previous[key]), 825, y, 16); });
    body += text(`Crecimiento neto de seguidores: ${metricLabel(followerGrowth(n.current))}`, 95, 845, 22, c.green, true);
    body += box(1005, 465, 525, 410) + text("INTERACCIONES", 1035, 507, 22, c.green, true) + text("Comparación del periodo", 1035, 540, 20, c.muted);
    const max = Math.max(n.current.interactions || 0, n.previous.interactions || 0, 1);
    [n.previous.interactions, n.current.interactions].forEach((value, i) => { const y = 600 + i * 118; body += text(i ? "Actual" : "Anterior", 1035, y, 20) + text(metricLabel(value), 1340, y, 20, c.green, true); if (value !== null) body += box(1035, y + 18, 460, 25, c.pale) + `<rect x="1035" y="${y + 18}" width="${460 * value / max}" height="25" rx="8" fill="${i ? c.green : c.orange}"/>`; });
    bodies.push(body);
  }
  const automaticStart = bodies.length;
  if (tiktok && report.networks.some(n => n.network === "TikTok")) {
    const label = (value?: number) => typeof value === "number" ? metricLabel(value) : "Sin datos";
    for (let offset = 0; offset < Math.max(tiktok.videos.length, 1); offset += 5) {
      let body = box(70, 195, 1460, 85, c.green) + text("TIKTOK · MÉTRICAS DE LA CUENTA CONECTADA", 100, 248, 29, c.white, true);
      body += text(tiktok.user.display_name.slice(0, 65), 70, 325, 27, c.green, true) + text(`Consulta: ${new Date(tiktok.capturedAt).toLocaleString("es-EC", { timeZone: "America/Guayaquil" })}`, 850, 325, 20, c.muted);
      body += text(`Seguidores: ${label(tiktok.user.follower_count)}   ·   Videos de la cuenta: ${label(tiktok.user.video_count)}`, 70, 365, 25, c.ink, true);
      body += text("Contadores acumulados al consultar; no representan resultados exclusivos del periodo del reporte.", 70, 404, 21, c.muted);
      body += text(`${tiktok.videos.length} videos recientes consultados${tiktok.hasMore ? " · Muestra parcial: hay más videos en la cuenta" : ""}`, 70, 440, 20, c.muted);
      body += box(70, 460, 1460, 425);
      ["VIDEO", "VISTAS", "ME GUSTA", "COMENTARIOS", "COMPARTIDOS"].forEach((s, i) => { body += text(s, [95, 800, 980, 1150, 1340][i], 497, 17, c.green, true); });
      tiktok.videos.slice(offset, offset + 5).forEach((video, i) => {
        const y = 540 + i * 67;
        const title = video.title || "Video sin título";
        body += wrapScheduleText(title.length > 90 ? title.slice(0, 87) + "…" : title, 48).slice(0, 2).map((s, j) => text(s, 95, y + j * 24, 20)).join("");
        [video.view_count, video.like_count, video.comment_count, video.share_count].forEach((v, j) => { body += text(label(v), [800, 980, 1150, 1340][j], y, 20); });
      });
      if (!tiktok.videos.length) body += text("No hay videos públicos disponibles en esta consulta.", 95, 555, 24, c.muted);
      bodies.push(body);
    }
  }
  const automaticEnd = bodies.length;
  for (const h of report.highlights) {
    const rows = wrapScheduleText(`${h.note || "Sin observaciones."}${h.url ? `\n\nEnlace: ${h.url}` : ""}`, 55);
    for (let offset = 0; offset < rows.length; offset += 18) {
      let body = box(70, 195, 1460, 110, c.green) + text(`${h.network.toUpperCase()} · CONTENIDO DESTACADO${offset ? " · CONTINUACIÓN" : ""}`, 100, 227, 18, c.white, true);
      body += wrapScheduleText(h.title, 80).map((s, i) => text(s, 100, 260 + i * 28, 23, c.white, true)).join("");
      body += box(70, 330, 850, 550) + rows.slice(offset, offset + 18).map((s, i) => text(s, 100, 368 + i * 27, 22)).join("") + box(945, 330, 585, 550);
      body += visuals.images[h.id] ? image(visuals.images[h.id], 970, 355, 535, 500) : text("Sin imagen disponible", 1030, 590, 24, c.muted);
      bodies.push(body);
    }
  }
  for (const [label, value] of [["CONCLUSIONES", report.conclusions], ["PRÓXIMAS ACCIONES", report.nextSteps]]) {
    const rows = wrapScheduleText(value || "Sin observaciones añadidas.", 94);
    for (let offset = 0; offset < rows.length; offset += 17) bodies.push(box(70, 195, 1460, 85, c.green) + text(label + (offset ? " · CONTINUACIÓN" : ""), 100, 247, 30, c.white, true) + box(70, 305, 1460, 575) + rows.slice(offset, offset + 17).map((s, i) => text(s, 100, 350 + i * 30, 24)).join(""));
  }
  return bodies.map((body, i) => `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><rect width="1600" height="1000" fill="${c.bg}"/><rect width="1600" height="12" fill="${c.green}"/>${text(company, 70, 55, 22, c.green, true)}${wrapScheduleText(report.title, 70).map((s, j) => text(s, 70, 96 + j * 33, 28, c.ink, true)).join("")}${text(`${report.start} — ${report.end} | Comparación: ${report.previousStart} — ${report.previousEnd}`, 70, 167, 19, c.muted)}${image(visuals.logo, 1330, 28, 200, 105)}${body}${text(i >= automaticStart && i < automaticEnd ? "Fuente: TikTok API. Consulta acumulada de la cuenta conectada." : "Fuente: métricas ingresadas manualmente. Los resultados se muestran por red.", 70, 927, 19, c.muted)}${text("Las interacciones totales se ingresan según la plataforma; no se suman automáticamente.", 70, 956, 17, c.muted)}${text(`${i + 1} / ${bodies.length}`, 1430, 956, 20, c.green, true)}</svg>`);
}
