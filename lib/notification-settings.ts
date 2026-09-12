export const notificationKinds = ["summary", "today", "review", "overdue"] as const;
export type NotificationKind = typeof notificationKinds[number];
export type Intensity = "off" | "gentle" | "normal" | "intense";
export type NotificationSettings = { start: string; end: string; rules: Record<NotificationKind, { intensity: Intensity; time: string }> };
export const defaultNotificationSettings: NotificationSettings = {
  start: "08:00", end: "20:00",
  rules: { summary: { intensity: "gentle", time: "08:00" }, today: { intensity: "normal", time: "10:00" }, review: { intensity: "off", time: "09:00" }, overdue: { intensity: "off", time: "11:00" } },
};
export function validNotificationSettings(value: unknown): value is NotificationSettings {
  if (!value || typeof value !== "object") return false;
  const s = value as NotificationSettings;
  const time = (v: unknown) => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
  return time(s.start) && time(s.end) && s.start < s.end && !!s.rules && notificationKinds.every(k => {
    const rule = s.rules[k];
    return rule && ["off", "gentle", "normal", "intense"].includes(rule.intensity) && time(rule.time) && rule.time >= s.start && rule.time < s.end;
  });
}
export function notificationTimes(intensity: Intensity, time: string, end: string) {
  const minute = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3));
  const offsets = { off: [], gentle: [0], normal: [0, 240], intense: [0, 120, 240, 360] }[intensity];
  return offsets.map(offset => minute(time) + offset).filter(m => m < minute(end)).map(m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
}
