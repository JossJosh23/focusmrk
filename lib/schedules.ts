import { validDate, type Publication } from "./calendar";

export type ScheduleOptions = { copy: boolean; objective: boolean; production: boolean; references: boolean; footer: boolean; images: boolean };
export type SchedulePlan = {
  id: string; title: string; start: string; end: string; campaign: string; objective: string;
  dates: { date: string; label: string }[]; selectedIds: string[]; options: ScheduleOptions;
};
export const defaultScheduleOptions: ScheduleOptions = { copy: true, objective: true, production: true, references: false, footer: true, images: true };
export function validSchedule(value: unknown): value is SchedulePlan {
  if (!value || typeof value !== "object") return false;
  const p = value as SchedulePlan;
  const bounded = (s: unknown, max: number) => typeof s === "string" && s.length <= max;
  return bounded(p.id, 100) && !!p.id && bounded(p.title, 120) && !!p.title.trim() &&
    typeof p.start === "string" && validDate(p.start) && typeof p.end === "string" && validDate(p.end) && p.start <= p.end &&
    bounded(p.campaign, 120) && bounded(p.objective, 1000) && Array.isArray(p.dates) && p.dates.length <= 30 &&
    p.dates.every(d => d && typeof d.date === "string" && validDate(d.date) && bounded(d.label, 160) && !!d.label.trim()) &&
    Array.isArray(p.selectedIds) && p.selectedIds.length <= 10000 && p.selectedIds.every(id => bounded(id, 100) && !!id) &&
    new Set(p.selectedIds).size === p.selectedIds.length && !!p.options &&
    Object.keys(defaultScheduleOptions).every(key => typeof p.options[key as keyof ScheduleOptions] === "boolean");
}
export function readSchedules(value: unknown): SchedulePlan[] {
  if (!Array.isArray(value) || value.length > 200 || !value.every(validSchedule) || new Set(value.map(p => p.id)).size !== value.length) throw new Error("Los cronogramas guardados no son válidos. No se sobrescribirán.");
  return value;
}
export function scheduleSelection(posts: Publication[], plan: SchedulePlan): Publication[] {
  return posts.filter(p => p.date >= plan.start && p.date <= plan.end && plan.selectedIds.includes(p.id));
}
