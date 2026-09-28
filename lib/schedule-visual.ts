import { comparePublications, type Publication } from "./calendar";
import type { SchedulePlan } from "./schedules";
import { scheduleCounts } from "./schedule-summary";

const C = { bg: "#F5F7F2", green: "#075C3D", ink: "#193B2E", muted: "#63786C", border: "#D9E5DC", pale: "#E6F1E9", orange: "#F79319", white: "#FFFFFF" };
const esc = (text: string) => text.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[ch]!);
function rect(x: number, y: number, w: number, h: number, fill = C.white, radius = 18) { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${C.border}"/>`; }
function text(value: string, x: number, y: number, size = 24, color = C.ink, bold = false) { return `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" fill="${color}" font-weight="${bold ? 700 : 400}">${esc(value)}</text>`; }
export function wrapScheduleText(value: string, width: number): string[] {
  return value.split(/\r?\n/).flatMap(paragraph => {
    const lines: string[] = []; let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const pieces = Array.from(word).join("").match(new RegExp(`.{1,${width}}`, "gu")) || [""];
      for (const piece of pieces) {
        if (line && Array.from(`${line} ${piece}`).length > width) { lines.push(line); line = piece; }
        else line = line ? `${line} ${piece}` : piece;
      }
    }
    lines.push(line); return lines;
  });
}
function lines(value: string, x: number, y: number, width: number, size = 24, color = C.ink, bold = false) {
  return wrapScheduleText(value, width).map((line, i) => text(line, x, y + i * size * 1.35, size, color, bold)).join("");
}
function img(data: string, x: number, y: number, w: number, h: number) {
  return /^data:image\/(png|jpeg);base64,/.test(data) ? `<image href="${esc(data)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>` : "";
}
export type ScheduleVisuals = { logo: string; images: Record<string, string>; warnings: string[] };
export function buildSchedulePages(posts: Publication[], plan: SchedulePlan, company: string, visuals: ScheduleVisuals): string[] {
  const bodies: string[] = [];
  const period = `${plan.start.split("-").reverse().join("/")} — ${plan.end.split("-").reverse().join("/")}`;
  function header() {
    return text("PLANIFICACIÓN DE REDES SOCIALES", 70, 58, 22, C.green, true) + lines(plan.title, 70, 115, plan.title.length > 55 ? 70 : 55, plan.title.length > 55 ? 28 : 44, C.ink, true) +
      text(period, 70, 165, 20, C.muted) + (visuals.logo ? img(visuals.logo, 1330, 25, 200, 110) : lines(company, 1250, 65, 20, 23, C.green, true)) +
      `<path d="M70 184H1530" stroke="${C.border}" stroke-width="2"/>`;
  }
  const summaryRows = [
    `Campaña: ${plan.campaign || "Plan de contenido"}`,
    ...(plan.objective ? [`Objetivo: ${plan.objective}`] : []),
    `${posts.length} publicaciones · ${scheduleCounts(posts).map(v => `${v.label}: ${v.count}`).join(" · ")}`,
    ...plan.dates.map(d => `${d.date.split("-").reverse().join("/")} · ${d.label}`),
  ].flatMap(v => wrapScheduleText(v, 92));
  for (let offset = 0; offset < summaryRows.length; offset += 16) {
    bodies.push(rect(70, 215, 1460, 95, C.green) + text(offset ? "RESUMEN · CONTINUACIÓN" : "RESUMEN DEL CRONOGRAMA", 105, 276, 32, C.white, true) + rect(70, 340, 1460, 550) + summaryRows.slice(offset, offset + 16).map((v, i) => text(v, 105, 385 + i * 30, 24)).join(""));
  }
  const sorted = [...posts].sort(comparePublications);
  for (let offset = 0; offset < sorted.length; offset += 8) {
    bodies.push(text("VISTA GENERAL", 70, 246, 28, C.green, true) + rect(70, 275, 1460, 60, C.pale) +
      text("FECHA / HORA", 90, 313, 20, C.green, true) + text("PUBLICACIÓN", 350, 313, 20, C.green, true) + text("FORMATO / PAUTA", 1000, 313, 20, C.green, true) + text("ESTADO", 1290, 313, 20, C.green, true) +
      sorted.slice(offset, offset + 8).map((p, i) => { const y = 350 + i * 65; const title = p.title.length > 80 ? `${p.title.slice(0, 77)}…` : p.title; return text(`${p.date} ${p.time}`, 90, y + 20, 21) + lines(title, 350, y + 12, 45, 20) + text(`${p.format}${p.paid ? " · Pauta" : ""}`, 1000, y + 20, 21) + text(p.status, 1290, y + 20, 21); }).join(""));
  }
  for (const post of sorted) {
    const sections = [
      plan.options.objective && post.objective && `OBJETIVO\n${post.objective}`,
      plan.options.copy && post.copy && `COPY PROPUESTO\n${post.copy}`,
      plan.options.production && post.production && `REFERENCIA DE PRODUCCIÓN\n${post.production}`,
      plan.options.footer && post.footer && `FIRMA / CONTACTO\n${post.footer}`,
      plan.options.references && post.referenceUrl && `REFERENCIA\n${post.referenceUrl}`,
      plan.options.references && post.imageUrl && `RECURSO VISUAL\n${post.imageUrl}`,
    ].filter(Boolean).join("\n\n");
    const bodyLines = wrapScheduleText(sections || "Sin texto adicional seleccionado para esta entrega.", 58);
    for (let offset = 0; offset < bodyLines.length; offset += 13) {
      let body = rect(70, 210, 1460, 128, C.green, 28) + lines(post.title, 105, 258, post.title.length > 100 ? 80 : 50, post.title.length > 100 ? 20 : post.title.length > 50 ? 26 : 36, C.white, true) + text(offset ? "Continuación" : (plan.campaign || "Contenido de la campaña"), 105, 318, plan.campaign.length > 85 ? 14 : 20, C.white) + rect(1240, 235, 245, 52, C.pale, 24) + text(post.status.toUpperCase(), 1255, 269, 20, C.green, true);
      const metadata = [["FECHA", `${post.date.split("-").reverse().join("/")} · ${post.time}`], ["PLATAFORMAS", post.networks.join(" · ")], ["FORMATO", `${post.format}${post.paid ? " · Pauta" : ""}${post.important ? " · Importante" : ""}`]];
      metadata.forEach(([label, value], i) => { const x = 70 + i * 307; body += rect(x, 360, 292, 96) + text(label, x + 20, 390, 17, C.muted, true) + lines(value, x + 20, 421, 25, 18, C.ink, true); });
      const headings = ["OBJETIVO", "COPY PROPUESTO", "REFERENCIA DE PRODUCCIÓN", "FIRMA / CONTACTO", "REFERENCIA", "RECURSO VISUAL"];
      body += rect(70, 480, 907, 410) + `<path d="M70 482H977" stroke="${C.orange}" stroke-width="8"/>` + bodyLines.slice(offset, offset + 13).map((v, i) => text(v, 100, 520 + i * 28, headings.includes(v) ? 17 : 23, headings.includes(v) ? C.green : C.ink, headings.includes(v))).join("");
      body += rect(1005, 360, 525, 530) + text("VISTA PREVIA DEL POST", 1035, 400, 22, C.green, true);
      const image = plan.options.images ? visuals.images[post.id] : "";
      body += image ? img(image, 1035, 430, 465, 435) : lines(plan.options.images ? "Sin imagen disponible. Los videos se entregan como referencia." : "Imagen excluida de esta entrega.", 1050, 600, 29, 24, C.muted);
      bodies.push(body);
    }
  }
  return bodies.map((body, i) => `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000"><rect width="1600" height="1000" fill="${C.bg}"/><rect width="1600" height="12" fill="${C.green}"/>${header()}${body}<path d="M70 925H1530" stroke="${C.green}"/>${text("PLANIFICAMOS HOY PARA CONECTAR MAÑANA", 70, 965, 19, C.green, true)}${text(`${i + 1} / ${bodies.length}`, 1420, 965, 20, C.muted, true)}</svg>`);
}
