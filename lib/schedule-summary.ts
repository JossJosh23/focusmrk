import type { Publication } from "./calendar";

export type ScheduleDetails = {
  campaign: string;
  objective: string;
  importantDate: string;
  importantDateLabel: string;
};

export function scheduleCounts(posts: Publication[]) {
  return [
    { label: "Posts", count: posts.filter(post => post.format === "Post").length },
    { label: "Reels", count: posts.filter(post => post.format === "Reel").length },
    { label: "Con pauta", count: posts.filter(post => post.paid).length },
    { label: "Historias", count: posts.filter(post => post.format === "Historia").length },
  ].filter((item, index) => index < 3 || item.count > 0);
}

export function scheduleSummary(posts: Publication[], details?: ScheduleDetails): string {
  return [
    details?.campaign.trim() && `Campaña: ${details.campaign.trim()}`,
    details?.objective.trim() && `Objetivo: ${details.objective.trim()}`,
    details?.importantDate && `Fecha importante: ${details.importantDate.split("-").reverse().join("/")}${details.importantDateLabel.trim() ? ` · ${details.importantDateLabel.trim()}` : ""}`,
    "Publicaciones seleccionadas",
    ...scheduleCounts(posts).map(item => `${item.label}: ${item.count}`),
    "La pauta puede aplicarse a cualquier formato.",
  ].filter(Boolean).join("\n\n");
}
