import { emptyMetrics, REPORT_METRICS, metricChange, metricLabel, followerGrowth, type Report, type MetricKey } from "./reports";
import { wrapScheduleText, type ScheduleVisuals } from "./schedule-visual";

const c = { green: "#7053D6", ink: "#29213B", muted: "#665B75", bg: "#FAF9FC", pale: "#F0ECFC", white: "#FFFFFF", orange: "#A86714" };
const esc = (s: string) => s.replace(/[&<>"']/g, v => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[v]!);
const text = (s: string, x: number, y: number, size = 23, color = c.ink, bold = false) => `<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" fill="${color}" font-weight="${bold ? 700 : 400}">${esc(s)}</text>`;
const box = (x: number, y: number, w: number, h: number, fill = c.white) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${fill}"/>`;
const image = (source: string, x: number, y: number, w: number, h: number) => /^data:image\/(png|jpeg);base64,/.test(source) ? `<image href="${esc(source)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>` : "";
export type TikTokReportSnapshot = { period?: { start: string; end: string }; capturedAt: string; user: { display_name: string; follower_count?: number; video_count?: number }; hasMore: boolean; videos: { id: string; title: string; create_time?: number; view_count?: number; like_count?: number; comment_count?: number; share_count?: number }[] };
export function buildReportPages(report: Report, company: string, visuals: ScheduleVisuals, tiktok?: TikTokReportSnapshot, automatic = false): string[] {
  if (automatic) {
    if (!tiktok) throw new Error("Consulta TikTok antes de generar el reporte.");
    report = { ...report, networks: [{ network: "TikTok", current: emptyMetrics(), previous: emptyMetrics() }], highlights: [] };
  }
  const bodies: string[] = [];
  const palette: Record<string, string> = { Instagram: "#AD397E", Facebook: "#4569CB", TikTok: "#293C49" };
  const networkColor = (name: string) => palette[name] || c.green;
  const heading = (title: string, subtitle: string) => text(title, 70, 242, 36, c.ink, true) + text(subtitle, 70, 281, 21, c.muted);
  // A cover and cross-network overview introduce the detailed source metrics.
  let cover = box(70, 205, 1460, 650, c.green) + text("SOCIAL MEDIA REPORT", 120, 270, 20, c.white, true);
  cover += text("Tu contenido.", 120, 377, 64, c.white, true) + text("Tus resultados.", 120, 454, 64, c.white, true);
  cover += text("Publicaciones · Visualizaciones · Interacciones", 120, 523, 27, c.white);
  cover += text(automatic ? tiktok!.period ? `${tiktok!.period.start} - ${tiktok!.period.end}` : `Consulta: ${tiktok!.capturedAt.slice(0, 10)}` : `${report.start} — ${report.end}`, 120, 592, 25, c.white);
  report.networks.forEach((n, i) => { const x = 120 + i * 330; cover += box(x, 683, 300, 90) + text(n.network.toUpperCase(), x + 25, 738, 24, networkColor(n.network), true); });
  if (automatic && tiktok) {
    cover += box(450, 683, 430, 90) + text(`${tiktok.videos.length} videos analizados`, 475, 738, 24, c.ink, true);
    cover += text(`Datos consultados el ${new Date(tiktok.capturedAt).toLocaleDateString("es-EC", { timeZone: "America/Guayaquil" })}`, 120, 817, 20, c.white);
  }
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
  if (automatic) bodies.splice(1);
  const automaticStart = bodies.length;
  if (tiktok && report.networks.some(n => n.network === "TikTok")) {
    const label = (value?: number) => typeof value === "number" ? metricLabel(value) : "Sin datos";
    if (tiktok.period) {
      const total = (key: "view_count" | "like_count" | "comment_count" | "share_count") => tiktok.videos.every(v => typeof v[key] === "number") ? tiktok.videos.reduce((sum, v) => sum + v[key]!, 0) : undefined;
      const likes = total("like_count"), comments = total("comment_count"), shares = total("share_count");
      const interactions = likes === undefined || comments === undefined || shares === undefined ? undefined : likes + comments + shares;
      let body = heading("TikTok · Publicaciones del periodo", `${tiktok.period.start} — ${tiktok.period.end} · Hora de Ecuador`);
      [["VIDEOS PUBLICADOS", tiktok.videos.length], ["VISUALIZACIONES", total("view_count")], ["INTERACCIONES", interactions], ["SEGUIDORES ACTUALES", tiktok.user.follower_count]].forEach(([title, value], i) => {
        const x = 70 + i * 370;
        body += box(x, 315, 350, 130) + text(String(title), x + 20, 350, 17, c.muted, true) + text(label(value as number | undefined), x + 20, 410, 38, c.green, true);
      });
      body += text(`Me gusta: ${label(likes)} · Comentarios: ${label(comments)} · Compartidos: ${label(shares)}`, 70, 490, 24);
      body += text("Interacciones = me gusta + comentarios + compartidos. Contadores acumulados al consultar.", 70, 530, 21, c.muted);
      body += text("Se incluyen únicamente videos públicos publicados en las fechas seleccionadas.", 70, 565, 21, c.muted);
      const days = new Map<string, number>();
      for (let time = Date.parse(tiktok.period.start); time <= Date.parse(tiktok.period.end); time += 86400000) days.set(new Date(time).toISOString().slice(0, 10), 0);
      tiktok.videos.forEach(v => { if (v.create_time) { const day = new Date(v.create_time * 1000 - 5 * 3600000).toISOString().slice(0, 10); if (days.has(day)) days.set(day, days.get(day)! + 1); } });
      body += text("VIDEOS PUBLICADOS POR DÍA", 70, 620, 20, c.green, true);
      const max = Math.max(1, ...days.values()), width = 1400 / days.size;
      [...days].forEach(([day, count], i) => {
        const height = count / max * 140, x = 90 + i * width;
        if (count) body += `<rect x="${x}" y="${805 - height}" width="${Math.max(1, width - 3)}" height="${height}" fill="${c.green}"/>`;
        if (days.size <= 31 && count) body += text(String(count), x, 795 - height, 16);
        if (i === 0 || i === days.size - 1 || (days.size <= 31 && i % 5 === 0)) body += text(day.slice(5), x, 835, 15, c.muted);
      });
      body += text("No disponibles: alcance, demografía, visitas al perfil y seguidores ganados/perdidos del periodo.", 70, 880, 20, c.muted);
      bodies.push(body);
      const series = [
        { title: "Visualizaciones de videos publicados", keys: ["view_count"] as const, names: ["Visualizaciones"] },
        { title: "Interacciones en publicaciones del periodo", keys: ["like_count", "comment_count", "share_count"] as const, names: ["Me gusta", "Comentarios", "Compartidos"] },
      ];
      const colors = [c.green, "#24664F", c.orange];
      for (const chart of series) {
        let page = heading(chart.title, "Acumulados actuales agrupados por fecha de publicación · Hora de Ecuador");
        const cards: [string, number | undefined][] = chart.keys.length === 1 ? [["VISUALIZACIONES", total("view_count")], ["VIDEOS PUBLICADOS", tiktok.videos.length]] : [["INTERACCIONES", interactions], ["ME GUSTA", likes], ["COMENTARIOS", comments], ["COMPARTIDOS", shares], ["VIDEOS", tiktok.videos.length]];
        const cardWidth = 1460 / cards.length;
        cards.forEach(([name, value], i) => { const x = 70 + i * cardWidth; page += box(x, 315, cardWidth - 15, 115) + text(name, x + 18, 350, 17, c.muted, true) + text(label(value), x + 18, 402, 35, c.green, true); });
        const dates = [...days.keys()];
        const values = chart.keys.map(key => dates.map(day => {
          const matching = tiktok.videos.filter(v => v.create_time && new Date(v.create_time * 1000 - 18000000).toISOString().slice(0, 10) === day);
          return matching.every(v => typeof v[key] === "number") ? matching.reduce((sum, v) => sum + v[key]!, 0) : null;
        }));
        const ceiling = Math.max(1, ...values.flat().filter((v): v is number => v !== null));
        page += box(70, 465, 1460, 385);
        for (let tick = 0; tick <= 4; tick++) { const y = 795 - tick * 65; page += `<path d="M155 ${y}H1490" stroke="${c.pale}"/>` + text(Math.round(ceiling * tick / 4).toLocaleString("es"), 90, y + 5, 16, c.muted); }
        values.forEach((points, seriesIndex) => {
          let path = "", connected = false;
          points.forEach((value, i) => { if (value === null) { connected = false; return; } const x = 165 + i * 1300 / Math.max(1, dates.length - 1), y = 795 - value / ceiling * 260; path += `${connected ? "L" : "M"}${x},${y} `; connected = true; if (dates.length <= 62) page += `<circle cx="${x}" cy="${y}" r="4" fill="${colors[seriesIndex]}"/>`; });
          page += `<path d="${path}" stroke="${colors[seriesIndex]}" stroke-width="3" fill="none"/>` + text(chart.names[seriesIndex], 190 + seriesIndex * 300, 490, 18, colors[seriesIndex], true);
        });
        dates.forEach((day, i) => { if (i === 0 || i === dates.length - 1 || i % Math.max(1, Math.ceil(dates.length / 8)) === 0) page += text(day.slice(5), 165 + i * 1300 / Math.max(1, dates.length - 1), 829, 16, c.muted); });
        page += text("Cada punto suma los contadores de videos publicados ese día; no mide la actividad ocurrida ese día.", 70, 882, 20, c.muted);
        bodies.push(page);
      }
      let ranking = heading("Ranking de videos", "Hasta 5 publicaciones del periodo, ordenadas por me gusta (acumulados al consultar)");
      ranking += box(70, 315, 1460, 510);
      ["PUBLICACIÓN", "FECHA", "VISTAS", "ME GUSTA", "COMENT.", "COMPART.", "TASA / VISTAS"].forEach((title, i) => { ranking += text(title, [95, 650, 825, 970, 1100, 1220, 1350][i], 355, 16, c.green, true); });
      const ranked = [...tiktok.videos].sort((a, b) => (b.like_count ?? -1) - (a.like_count ?? -1) || a.id.localeCompare(b.id)).slice(0, 5);
      ranked.forEach((video, i) => {
        const y = 410 + i * 80;
        const short = (video.title || "Video sin título").slice(0, 75);
        ranking += wrapScheduleText(`${i + 1}. ${short}${(video.title || "").length > 75 ? "…" : ""}`, 37).slice(0, 2).map((line, j) => text(line, 95, y + j * 24, 19)).join("");
        const engagement = [video.like_count, video.comment_count, video.share_count].every(v => typeof v === "number") && typeof video.view_count === "number" && video.view_count > 0 ? ((video.like_count! + video.comment_count! + video.share_count!) / video.view_count * 100).toLocaleString("es", { maximumFractionDigits: 2 }) + "%" : "N/D";
        const cells = [video.create_time ? new Date(video.create_time * 1000 - 18000000).toISOString().slice(0, 10) : "Sin fecha", label(video.view_count), label(video.like_count), label(video.comment_count), label(video.share_count), engagement];
        cells.forEach((value, j) => { ranking += text(value, [650, 825, 970, 1100, 1220, 1350][j], y, 18); });
      });
      if (!ranked.length) ranking += text("No hay videos públicos publicados en este periodo.", 95, 425, 24, c.muted);
      ranking += text("Tasa por vistas = (me gusta + comentarios + compartidos) / visualizaciones × 100. No es alcance.", 70, 870, 20, c.muted);
      bodies.push(ranking);
    }
    for (let offset = 0; offset < Math.max(tiktok.videos.length, 1); offset += 5) {
      let body = box(70, 195, 1460, 85, c.green) + text("TIKTOK · MÉTRICAS DE LA CUENTA CONECTADA", 100, 248, 29, c.white, true);
      body += text(tiktok.user.display_name.slice(0, 65), 70, 325, 27, c.green, true) + text(`Consulta: ${new Date(tiktok.capturedAt).toLocaleString("es-EC", { timeZone: "America/Guayaquil" })}`, 850, 325, 20, c.muted);
      body += text(`Seguidores: ${label(tiktok.user.follower_count)}   ·   Videos de la cuenta: ${label(tiktok.user.video_count)}`, 70, 365, 25, c.ink, true);
      body += text("Contadores acumulados al consultar; no representan resultados exclusivos del periodo del reporte.", 70, 404, 21, c.muted);
      body += text(`${tiktok.videos.length} videos ${tiktok.period ? `publicados entre ${tiktok.period.start} y ${tiktok.period.end}` : "recientes consultados"}${tiktok.hasMore ? " · Muestra parcial: hay más videos en la cuenta" : ""}`, 70, 440, 20, c.muted);
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
    if (automatic && !value.trim()) continue;
    const rows = wrapScheduleText(value || "Sin observaciones añadidas.", 94);
    for (let offset = 0; offset < rows.length; offset += 17) bodies.push(box(70, 195, 1460, 85, c.green) + text(label + (offset ? " · CONTINUACIÓN" : ""), 100, 247, 30, c.white, true) + box(70, 305, 1460, 575) + rows.slice(offset, offset + 17).map((s, i) => text(s, 100, 350 + i * 30, 24)).join(""));
  }
  return bodies.map((body, i) => `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><rect width="1600" height="1000" fill="${c.bg}"/><rect width="1600" height="12" fill="${c.green}"/>${text(company, 70, 55, 22, c.green, true)}${wrapScheduleText(report.title, 70).map((s, j) => text(s, 70, 96 + j * 33, 28, c.ink, true)).join("")}${text(automatic ? tiktok!.period ? `Publicaciones: ${tiktok!.period.start} - ${tiktok!.period.end}` : `Consulta de TikTok: ${tiktok!.capturedAt.slice(0, 10)}` : `${report.start} — ${report.end} | Comparación: ${report.previousStart} — ${report.previousEnd}`, 70, 167, 19, c.muted)}${image(visuals.logo, 1330, 28, 200, 105)}${body}${text(automatic || (i >= automaticStart && i < automaticEnd) ? "Fuente: TikTok API. Consulta acumulada de la cuenta conectada." : "Fuente: métricas ingresadas manualmente. Los resultados se muestran por red.", 70, 927, 19, c.muted)}${text(automatic ? "Datos acumulados al consultar. Los videos mostrados pueden ser una muestra parcial de la cuenta." : "Las interacciones totales se ingresan según la plataforma; no se suman automáticamente.", 70, 956, 17, c.muted)}${text(`${i + 1} / ${bodies.length}`, 1430, 956, 20, c.green, true)}</svg>`);
}
