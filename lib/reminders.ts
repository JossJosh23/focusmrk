import { parseDate, type Publication } from "./calendar";
export function publicationTime(post: Publication): number {
  const date = parseDate(post.date); const [hour, minute] = post.time.split(":").map(Number); date.setHours(hour, minute, 0, 0); return date.getTime();
}
export function reminderPosts(posts: Publication[], now: number, leadMinutes: number) {
  return {
    upcoming: posts.filter((p) => p.status !== "Publicado" && publicationTime(p) >= now && publicationTime(p) <= now + leadMinutes * 60_000).sort((a, b) => publicationTime(a) - publicationTime(b)),
    overdue: posts.filter((p) => p.status !== "Publicado" && publicationTime(p) < now && publicationTime(p) >= now - 86400_000),
    review: posts.filter((p) => p.status === "En revisión"),
  };
}
