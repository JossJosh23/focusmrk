import webpush from "web-push";
import { database } from "./database";

export function pushConfigured() {
  return !!(process.env.DATABASE_URL && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}
export function validSubscription(value: unknown): value is webpush.PushSubscription {
  if (!value || typeof value !== "object") return false;
  const sub = value as webpush.PushSubscription;
  try {
    const url = new URL(sub.endpoint);
    const host = url.hostname;
    const allowed = host === "web.push.apple.com" || host.endsWith(".push.apple.com") || host === "fcm.googleapis.com" || host === "updates.push.services.mozilla.com" || host.endsWith(".notify.windows.com");
    return allowed && url.protocol === "https:" && !url.username && !url.password && !url.port && sub.endpoint.length < 4096 &&
      /^[A-Za-z0-9_-]{87}$/.test(sub.keys?.p256dh || "") && /^[A-Za-z0-9_-]{22}$/.test(sub.keys?.auth || "");
  } catch { return false; }
}
export const pushDatabase = database;
export async function sendPush(subscription: webpush.PushSubscription, payload: object) {
  return webpush.sendNotification(subscription, JSON.stringify(payload), {
    vapidDetails: { subject: process.env.VAPID_SUBJECT!, publicKey: process.env.VAPID_PUBLIC_KEY!, privateKey: process.env.VAPID_PRIVATE_KEY! }, TTL: 1800, timeout: 10000,
  });
}
