import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import JSZip from "jszip";
registerHooks({ resolve(specifier, context, next) {
  if (/\/lib\/(media|media-download)\.ts$/.test(context.parentURL || "") && /^\.\/[a-z-]+$/.test(specifier)) return next(new URL(specifier + ".ts", context.parentURL).href, context);
  return next(specifier, context);
} });
const { uniqueMedia, assetFromFile } = await import("../lib/media.ts");
const { mediaArchive } = await import("../lib/media-download.ts");
const asset = (name, content) => assetFromFile(new File([content], name, { type: "image/png" }), "Mi marca");
test("duplicates compare bytes across renamed files and within a batch", async () => {
  const existing = asset("original.png", "abc");
  const renamed = asset("renamed.png", "abc");
  const different = asset("original.png", "xyz");
  const repeated = asset("again.png", "xyz");
  const result = await uniqueMedia([renamed, different, repeated], [existing]);
  assert.deepEqual(result.accepted.map(a => a.id), [different.id]);
  assert.deepEqual(result.duplicates, ["renamed.png", "again.png"]);
});
test("bulk ZIP preserves bytes and prevents colliding or path-like names", async () => {
  const result = await mediaArchive([asset("photo.png", "abc"), asset("photo.png", "xyz"), asset("../file.png", "safe")]);
  const zip = await JSZip.loadAsync(await result.arrayBuffer());
  assert.equal(await zip.file("photo.png").async("string"), "abc");
  assert.equal(await zip.file("2-photo.png").async("string"), "xyz");
  assert.equal(await zip.file(".._file.png").async("string"), "safe");
});
