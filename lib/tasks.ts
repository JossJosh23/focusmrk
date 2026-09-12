export type Task = { id: string; title: string; date: string; priority: "normal" | "important" | "urgent"; postId: string; done: boolean; snoozedUntil: string | null; version: number };
export function validTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false;
  const t = value as Task;
  return typeof t.id === "string" && /^[\w-]{1,100}$/.test(t.id) && typeof t.title === "string" && t.title.trim().length > 0 && t.title.length <= 200 &&
    typeof t.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.date) && Number.isFinite(Date.parse(t.date)) && new Date(t.date).toISOString().slice(0, 10) === t.date &&
    ["normal", "important", "urgent"].includes(t.priority) && typeof t.postId === "string" && t.postId.length <= 100 && typeof t.done === "boolean" &&
    (t.snoozedUntil === null || (typeof t.snoozedUntil === "string" && /^\d{4}-\d{2}-\d{2}T/.test(t.snoozedUntil) && Number.isFinite(Date.parse(t.snoozedUntil)))) && Number.isSafeInteger(t.version) && t.version >= 0;
}
export function zonedDay(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  return ["year", "month", "day"].map(type => parts.find(p => p.type === type)?.value).join("-");
}
export function nextDay(day: string) { return new Date(Date.parse(`${day}T12:00:00Z`) + 86400000).toISOString().slice(0, 10); }
