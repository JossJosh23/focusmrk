import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
// Match the extensionless TypeScript imports that Next.js resolves in production.
registerHooks({ resolve(specifier, context, next) {
  if (/\/lib\/(backup|media|reminders)\.ts$/.test(context.parentURL || "") && /^\.\/[a-z-]+$/.test(specifier)) return next(`${specifier}.ts`, context);
  return next(specifier, context);
} });
const { parseBackup, mergeBackup } = await import("../lib/backup.ts");
const { emptyPublication, readPublications } = await import("../lib/calendar.ts");
const { assetFromFile } = await import("../lib/media.ts");
const { reminderPosts, publicationTime } = await import("../lib/reminders.ts");

test("backups validate attachments and merge as new copies without replacing originals", () => {
  const post = { ...emptyPublication("2026-09-10"), id: "post", title: "Oferta", mediaId: "asset" };
  const backup = { format: "focusmrk-backup", version: 1, createdAt: new Date().toISOString(), posts: [post], templates: [], assets: [{ id: "asset", name: "image.png", brand: "Mi marca", type: "image/png", size: 3, createdAt: new Date().toISOString(), data: "YWJj" }] };
  const parsed = parseBackup(JSON.stringify(backup));
  const withExtra = parseBackup(JSON.stringify({ ...backup, assets: [{ ...backup.assets[0], remoteUrl: "https://example.com/untrusted" }] }));
  assert.equal(withExtra.assets[0].remoteUrl, undefined);
  const merged = mergeBackup(parsed, [post], []);
  assert.equal(merged.posts.length, 2);
  assert.deepEqual(merged.posts[0], post);
  assert.notEqual(merged.posts[1].id, post.id);
  assert.equal(merged.posts[1].mediaId, merged.assets[0].id);
  assert.equal(merged.assets[0].blob.size, 3);
  assert.throws(() => parseBackup(JSON.stringify({ ...backup, assets: [] })), /referencias/);
  assert.throws(() => parseBackup(JSON.stringify({ ...backup, assets: [{ ...backup.assets[0], data: "!@#$" }] })), /no válido/);
  assert.throws(() => parseBackup(JSON.stringify({ ...backup, version: 999 })), /compatible/);
});

test("uploads reject unsupported formats and normalize the brand", () => {
  const asset = assetFromFile(new File(["test"], "image.png", { type: "image/png" }), "  Marca A  ");
  assert.equal(asset.brand, "Marca A");
  assert.throws(() => assetFromFile(new File(["<script>"], "file.html", { type: "text/html" }), "Marca"));
  assert.throws(() => assetFromFile(new File([], "empty.png", { type: "image/png" }), "Marca"));
});

test("reminders use local date/time, include review and skip published posts", () => {
  const p = { ...emptyPublication("2026-09-10"), id: "a", title: "Post", time: "10:00" };
  const now = new Date(2026, 8, 10, 9, 45).getTime();
  assert.equal(publicationTime(p), new Date(2026, 8, 10, 10, 0).getTime());
  const result = reminderPosts([p, { ...p, id: "b", status: "Publicado" }, { ...p, id: "c", status: "En revisión", time: "08:00" }], now, 15);
  assert.deepEqual(result.upcoming.map((x) => x.id), ["a"]);
  assert.deepEqual(result.review.map((x) => x.id), ["c"]);
  assert.deepEqual(result.overdue.map((x) => x.id), ["c"]);
  const legacy = { ...p }; delete legacy.brand; delete legacy.mediaId;
  assert.equal(readPublications(JSON.stringify([legacy]))[0].brand, "Mi marca");
});


test("media previews share concurrent metadata reads and retry after failure", async () => {
  const { configureMediaServer, getMedia } = await import("../lib/media.ts");
  const originalFetch = globalThis.fetch;
  let calls = 0;
  configureMediaServer(true);
  globalThis.fetch = async (url) => {
    calls++;
    assert.equal(url, "/api/media?id=one&metadata=1");
    return Response.json({ id: "one", type: "image/png", size: 3 });
  };
  try {
    const [first, second] = await Promise.all([getMedia("one"), getMedia("one")]);
    assert.equal(calls, 1);
    assert.equal(first, second);
    assert.equal(first.remoteUrl, "/api/media?id=one");
    assert.equal(first.blob.size, 0);
    globalThis.fetch = async () => new Response("Unavailable", { status: 503 });
    await assert.rejects(getMedia("one"));
    globalThis.fetch = async () => Response.json(null);
    assert.equal(await getMedia("one"), undefined);
  } finally {
    globalThis.fetch = originalFetch;
    configureMediaServer(false);
  }
});
