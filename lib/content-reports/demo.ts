import { blankNotes, emptyMetrics, platforms, previousPeriod, shiftDate, type Dataset, type ReportQuery, type SocialPublication } from "./model";
export function demoDataset(query: ReportQuery): Dataset {
  const start = previousPeriod(query).startDate, days = Math.round((Date.parse(query.endDate) - Date.parse(start)) / 86400000) + 1;
  const data: Dataset = { publications: [], followers: [], audience: [], ads: [], notes: blankNotes(), warnings: ["DEMO · Datos ficticios para explorar el informe. No pertenecen a las cuentas conectadas."] };
  const titles = ["Preparación del encebollado", "La historia detrás de la marca", "De la cocina a tu mesa", "Nuestro equipo", "Una receta para compartir", "Los favoritos de la comunidad"];
  for (let i = 0; i < days; i++) {
    const date = shiftDate(start, i), seed = Math.floor(Date.parse(date) / 86400000);
    platforms.forEach((platform, n) => {
      data.followers.push({ socialAccountId: `demo-${n}`, platform, date, followers: 8000 + n * 600 + (seed - 20000) * (n + 3), gained: 10 + seed % 5 + n, lost: 10 + seed % 5 + n - (n + 3) });
      if ((seed + n) % 3 !== 0) return;
      const reach = 1500 + seed % 17 * 800 + n * 900, duration = 18 + seed % 12;
      const contentType = platform === "TikTok" ? "TIKTOK" : platform === "Facebook" ? "VIDEO" : (["REEL", "POST", "CAROUSEL", "STORY"] as const)[seed % 4];
      const m = { ...emptyMetrics(), reach, impressions: Math.round(reach * 1.3), views: Math.round(reach * 1.7), likes: Math.round(reach * .045), comments: 20 + seed % 80, shares: 30 + seed % 160, saves: 20 + seed % 110, clicks: 5 + seed % 50, profileVisits: 25 + seed % 160, followersGained: 3 + seed % 24, duration, totalWatchTime: reach * 12, averageWatchTime: 12, averageWatchPercentage: 12 / duration * 100, completePlays: Math.round(reach * .27), retention: [{ label: "3 s", value: 82 }, { label: "5 s", value: 71 }, { label: "25%", value: 65 }, { label: "50%", value: 51 }, { label: "75%", value: 38 }, { label: "100%", value: 27 }] };
      const p: SocialPublication = { id: `demo-${date}-${n}`, companyId: query.companyId, socialAccountId: `demo-${n}`, platform, externalPostId: `demo-${seed}-${n}`, title: titles[(seed + n) % titles.length], caption: "Contenido de demostración. Cada preparación tiene una historia que merece ser compartida.", mediaUrl: "/report-demo/content.svg", thumbnailUrl: "/report-demo/content.svg", permalink: "", contentType, publishedAt: date + "T12:00:00-05:00", campaignId: "Sabores de nuestra marca", paid: seed % 4 === 0, capturedAt: query.endDate + "T23:00:00-05:00", metrics: m };
      data.publications.push(p);
      if (p.paid) data.ads.push({ platform, date, publicationId: p.id, spend: 12, reach: 4300, impressions: 7000, clicks: 130, conversions: 7, messages: 18, results: 18, currency: "USD" });
    });
  }
  platforms.forEach(platform => data.audience.push({ platform, date: query.endDate, gender: [{ label: "Hombres", value: 44 }, { label: "Mujeres", value: 53 }, { label: "No especificado", value: 3 }], age: [{ label: "18–24", value: 18 }, { label: "25–34", value: 42 }, { label: "35–44", value: 24 }, { label: "45–54", value: 11 }, { label: "55+", value: 5 }], cities: [{ label: "Quito", value: 48 }, { label: "Guayaquil", value: 23 }, { label: "Manta", value: 12 }], countries: [{ label: "Ecuador", value: 87 }, { label: "Colombia", value: 7 }, { label: "Estados Unidos", value: 6 }], followersReach: 28, nonFollowersReach: 72, activity: Array.from({ length: 7 * 24 }, (_, i) => ({ day: Math.floor(i / 24), hour: i % 24, value: Math.round(100 * Math.max(0, 1 - Math.abs(i % 24 - 19) / 12) * (.6 + Math.floor(i / 24) * .05)) })) }));
  return data;
}
