import type { Publication } from "./calendar";
import { getMedia, mediaBlob } from "./media";
import { buildSchedulePages, type ScheduleVisuals } from "./schedule-visual";
import type { SchedulePlan } from "./schedules";

async function rasterImage(source: string, width = 1200, height = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image(); image.crossOrigin = "anonymous";
    const timer = window.setTimeout(() => { image.src = ""; reject(new Error("Imagen no disponible")); }, 12000);
    image.onerror = () => { clearTimeout(timer); reject(new Error("Imagen no disponible")); };
    image.onload = () => {
      clearTimeout(timer);
      try {
        const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight, 1);
        const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas no disponible");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL("image/png"));
      } catch (error) { reject(error); }
    };
    image.src = source;
  });
}
export async function prepareSchedule(posts: Publication[], plan: SchedulePlan, company: string, logo: string) {
  const visuals: ScheduleVisuals = { logo: "", images: {}, warnings: [] };
  if (logo) { try { visuals.logo = await rasterImage(logo, 500, 500); } catch { visuals.warnings.push("No se pudo cargar el logo de la empresa."); } }
  if (plan.options.images) {
    // Bound concurrent decoding to avoid exhausting memory on large monthly plans.
    for (let offset = 0; offset < posts.length; offset += 4) await Promise.all(posts.slice(offset, offset + 4).map(async post => {
      let local = "";
      try {
        if (post.mediaId) {
          const asset = await getMedia(post.mediaId);
          if (!asset) throw new Error();
          if (!asset.type.startsWith("image/")) { visuals.warnings.push(`${post.title}: video adjunto; la entrega muestra una referencia.`); return; }
          local = URL.createObjectURL(await mediaBlob(asset)); visuals.images[post.id] = await rasterImage(local);
        } else if (post.imageUrl) visuals.images[post.id] = await rasterImage(post.imageUrl);
      } catch { visuals.warnings.push(`${post.title}: no se pudo incorporar la imagen. Usa una imagen de la biblioteca o un enlace directo accesible.`); }
      finally { if (local) URL.revokeObjectURL(local); }
    }));
  }
  return { pages: buildSchedulePages(posts, plan, company, visuals), warnings: visuals.warnings };
}
export const schedulePageUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
export async function downloadVisualSchedule(pages: string[], format: "PDF" | "PowerPoint", title: string) {
  const filename = title.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ _-]/g, "").slice(0, 100) || "cronograma";
  if (format === "PDF") {
    const { jsPDF } = await import("jspdf"); const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [320, 200], compress: true });
    for (let i = 0; i < pages.length; i++) {
      if (i) pdf.addPage([320, 200], "landscape");
      pdf.addImage(await rasterImage(schedulePageUrl(pages[i]), 1600, 1000), "PNG", 0, 0, 320, 200, undefined, "FAST");
    }
    pdf.save(`${filename}.pdf`);
  } else {
    const { default: PptxGenJS } = await import("pptxgenjs"); const pptx = new PptxGenJS();
    pptx.defineLayout({ name: "SCHEDULE", width: 12.8, height: 8 }); pptx.layout = "SCHEDULE"; pptx.title = title; pptx.author = "FocusMRK";
    for (const page of pages) pptx.addSlide().addImage({ data: await rasterImage(schedulePageUrl(page), 1600, 1000), x: 0, y: 0, w: 12.8, h: 8 });
    await pptx.writeFile({ fileName: `${filename}.pptx` });
  }
}
