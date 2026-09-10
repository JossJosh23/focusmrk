import { comparePublications, type Publication } from "./calendar";

export function scheduleSections(post: Publication) {
  return [
    `${post.date} · ${post.time} | ${post.brand}`,
    `${post.networks.join(", ")} | ${post.format} | ${post.status} | ${post.paid ? "Con pauta" : "Orgánico"}`,
    post.objective && `OBJETIVO\n${post.objective}`,
    post.copy && `TEXTO DE PUBLICACIÓN\n${post.copy}`,
    post.production && `PRODUCCIÓN\n${post.production}`,
    post.footer && `FOOTER\n${post.footer}`,
    post.referenceUrl && `REFERENCIA\n${post.referenceUrl}`,
    post.imageUrl && `IMAGEN\n${post.imageUrl}`,
    post.mediaId && "Recurso visual adjunto en la biblioteca personal.",
  ].filter(Boolean).join("\n\n");
}

// Bound each slide by both line count and line length so long copy gets continuation slides.
export function schedulePages(text: string): string[] {
  const lines = text.split("\n").flatMap((line) => {
    const chars = Array.from(line);
    if (!chars.length) return [""];
    const result = [];
    while (chars.length) result.push(chars.splice(0, 85).join(""));
    return result;
  });
  const pages = [];
  while (lines.length) pages.push(lines.splice(0, 15).join("\n"));
  return pages;
}

export async function exportSchedulePowerPoint(posts: Publication[], title: string, period: string) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "FocusMRK";
  pptx.subject = period;
  pptx.title = title;
  const cover = pptx.addSlide();
  cover.background = { color: "F6F4FC" };
  cover.addText(title, { x: .7, y: 1.4, w: 11.9, h: 2, fontSize: 32, bold: true, color: "40315F", breakLine: false });
  cover.addText(`${period}\n${posts.length} publicaciones · Horario local`, { x: .7, y: 4, w: 11, h: 1, fontSize: 18, color: "70637F" });
  for (const post of [...posts].sort(comparePublications)) {
    const pages = schedulePages(scheduleSections(post));
    pages.forEach((body, index) => {
      const slide = pptx.addSlide();
      slide.addText(post.title, { x: .6, y: .35, w: 12.1, h: 1, fontSize: 23, bold: true, color: "40315F", fit: "shrink" });
      slide.addText(body, { x: .6, y: 1.5, w: 12.1, h: 5.25, fontSize: 16, valign: "top", breakLine: false, fit: "shrink" });
      slide.addText(`FocusMRK · ${post.date} · ${index + 1}/${pages.length}`, { x: .6, y: 7, w: 12, h: .25, fontSize: 9, color: "70637F" });
    });
  }
  await pptx.writeFile({ fileName: `cronograma-${period.replace(/[^0-9-]/g, "_")}.pptx` });
}
