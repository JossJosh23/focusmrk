import { comparePublications, type Publication } from "./calendar";

export async function exportCalendarPdf(posts: Publication[], period: string) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  let y = 22;
  function line(text: string, size = 10) {
    pdf.setFontSize(size);
    // Built-in PDF font supports Spanish and Latin-1. Replace unsupported emoji rather than corrupting glyphs.
    const clean = text.replace(/[^\u0000-\u00ff]/gu, " ");
    const lines: string[] = pdf.splitTextToSize(clean, 174);
    for (const row of lines) {
      if (y > 275) { pdf.addPage(); y = 20; }
      pdf.text(row, 18, y); y += size * .45 + 2;
    }
  }
  pdf.setTextColor(60, 45, 90); line(`Calendario de contenido | ${period}`, 18);
  pdf.setTextColor(70); line(`${posts.length} publicaciones · Horario local · Publicación manual`); y += 6;
  for (const post of [...posts].sort(comparePublications)) {
    if (y > 220) { pdf.addPage(); y = 20; }
    pdf.setFont("helvetica", "bold"); line(`${post.date}  ${post.time} | ${post.brand}`, 11); line(post.title, 13);
    pdf.setFont("helvetica", "normal"); line(`${post.networks.join(", ")} | ${post.format} | ${post.status} | ${post.paid ? "Pautado" : "Orgánico"}`);
    if (post.copy) line(post.copy);
    if (post.footer) line(post.footer);
    if (post.referenceUrl) line(`Referencia: ${post.referenceUrl}`, 9);
    if (post.imageUrl) line(`Imagen: ${post.imageUrl}`, 9);
    if (post.mediaId) line("Incluye un archivo de la biblioteca personal.", 9);
    y += 7;
  }
  if (!posts.length) line("No hay publicaciones en esta selección.");
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) { pdf.setPage(page); pdf.setFontSize(8); pdf.text(`FocusMRK · ${page} / ${pages}`, 18, 289); }
  pdf.save(`calendario-${period}.pdf`);
}
