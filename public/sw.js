self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
// No fetch handler: private calendar responses are never cached for offline use.
self.addEventListener("push", event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { /* Always show a visible notification. */ }
  event.waitUntil(Promise.all([self.registration.showNotification(data.title || "FocusMRK", {
    body: data.body || "Tienes una publicación pendiente.", tag: data.tag || "focusmrk",
    icon: "/icon", data: { url: data.url === "/?module=notifications" ? data.url : "/" },
  }), Number.isInteger(data.badge) && data.badge >= 0 && self.navigator.setAppBadge ? self.navigator.setAppBadge(data.badge).catch(() => {}) : Promise.resolve()]));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    const url = event.notification.data?.url === "/?module=notifications" ? "/?module=notifications" : "/";
    if (existing) { await existing.navigate(url); return existing.focus(); }
    return self.clients.openWindow(url);
  })());
});
