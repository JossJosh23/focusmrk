import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { PGlite } from "@electric-sql/pglite";

registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) return next(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.endsWith(".ts") && !/\.[a-z]+$/i.test(specifier)) return next(specifier + ".ts", context);
  return next(specifier, context);
} });

const model = await import("../lib/content-reports/model.ts");
const query = { companyId: "A", platform: "Todas", startDate: "2026-09-01", endDate: "2026-09-30", mode: "production" };
let nextId = 0;
function publication(platform, metrics = {}, properties = {}) {
  const id = String(++nextId);
  return { id, companyId: "A", socialAccountId: `${platform}:account`, platform, externalPostId: id,
    title: `Actual ${platform} publication`, caption: "", mediaUrl: "", thumbnailUrl: "", permalink: "",
    contentType: platform === "TikTok" ? "TIKTOK" : "POST", publishedAt: "2026-09-15T17:00:00Z",
    campaignId: null, paid: null, capturedAt: "2026-10-04T17:00:00Z", metrics: { ...model.emptyMetrics(), ...metrics }, ...properties };
}
function dataset(publications = [], properties = {}) {
  return { publications, followers: [], ads: [], audience: [], notes: model.blankNotes(), warnings: [], ...properties };
}

test("Coverage does not redefine complete interaction sums or fabricate engagement", () => {
  assert.equal(model.sum([10, null]), null);
  const partial = { ...model.emptyMetrics(), reach: 100, likes: 10, comments: 2, shares: 3 };
  assert.equal(model.interactions(partial), null);
  assert.equal(model.engagement(partial), null);
  assert.equal(model.interactions({ ...partial, saves: 0 }), 15);
  assert.equal(model.engagement({ ...partial, saves: 0 }), 15);
});

test("Mixed-network reports expose measured subtotals and their coverage without converting missing metrics to zero", () => {
  const result = model.buildReport(dataset([
    publication("TikTok", { views: 200, likes: 10, comments: 2, shares: 3, reach: 100 }),
    publication("Instagram"),
    publication("Facebook")
  ]), query);
  assert.equal(result.summary.views, null);
  assert.equal(result.summary.interactions, null);
  assert.equal(result.summary.publications, 3);
  const views = result.summaryCoverage.views;
  assert.equal(views.availableTotal, 200);
  assert.equal(views.availableCount, 1);
  assert.equal(views.totalCount, 3);
  assert.equal(views.complete, false);
  assert.equal(views.unit, "publications");
  assert.deepEqual(views.platforms, ["TikTok"]);
  assert.deepEqual([...views.missingPlatforms].sort(), ["Facebook", "Instagram"]);
  const interactions = result.summaryCoverage.interactions;
  assert.equal(interactions.availableTotal, 15);
  assert.equal(interactions.availableCount, 3);
  assert.equal(interactions.totalCount, 12);
  assert.equal(interactions.complete, false);
  assert.equal(interactions.unit, "components");
  assert.ok(interactions.missingPlatforms.includes("TikTok"), "a TikTok publication with unavailable saves has incomplete interaction components");
  for (const [key, total] of [["likes", 10], ["comments", 2], ["shares", 3]]) {
    assert.equal(result.summary[key], null);
    assert.equal(result.summaryCoverage[key].availableTotal, total);
    assert.equal(result.summaryCoverage[key].availableCount, 1);
    assert.equal(result.summaryCoverage[key].totalCount, 3);
  }
  assert.equal(result.summaryCoverage.saves.availableTotal, null);
  assert.equal(result.publications.find(post => post.platform === "TikTok").engagementRate, null);
  const tiktok = result.networkSummaries.find(item => item.platform === "TikTok");
  assert.equal(tiktok.summary.views, 200);
  assert.equal(tiktok.coverage.views.complete, true);
  assert.equal(tiktok.coverage.views.availableCount, 1);
  assert.equal(tiktok.summary.interactions, null);
  assert.equal(tiktok.coverage.interactions.availableTotal, 15);
  assert.equal(tiktok.coverage.interactions.availableCount, 3);
  assert.equal(tiktok.coverage.interactions.totalCount, 4);
  const instagram = result.networkSummaries.find(item => item.platform === "Instagram");
  assert.equal(instagram.summary.views, null);
  assert.equal(instagram.coverage.views.availableTotal, null);
  assert.equal(instagram.coverage.views.availableCount, 0);
  assert.equal(instagram.coverage.views.totalCount, 1);
});

test("Coverage distinguishes empty datasets from measured zero and keeps denominators tied to the selected tenant, network and Ecuador dates", () => {
  const empty = model.buildReport(dataset(), query);
  assert.equal(empty.summary.views, null);
  assert.equal(empty.summaryCoverage.views.availableTotal, null);
  assert.equal(empty.summaryCoverage.views.availableCount, 0);
  assert.equal(empty.summaryCoverage.views.totalCount, 0);
  assert.equal(empty.summary.publications, 0);
  const zero = model.buildReport(dataset([publication("TikTok", { views: 0, likes: 0, comments: 0, shares: 0 })]), query);
  assert.equal(zero.summary.views, 0);
  assert.equal(zero.summaryCoverage.views.availableTotal, 0);
  assert.equal(zero.summaryCoverage.views.availableCount, 1);
  assert.equal(zero.summaryCoverage.views.totalCount, 1);
  assert.equal(zero.summaryCoverage.views.complete, true);
  assert.equal(zero.summary.interactions, null);
  assert.equal(zero.summaryCoverage.interactions.availableTotal, 0);
  assert.equal(zero.summaryCoverage.interactions.availableCount, 3);
  assert.equal(zero.summaryCoverage.interactions.totalCount, 4);
  const data = dataset([
    publication("TikTok", { views: 20 }, { publishedAt: "2026-10-01T02:00:00Z" }),
    publication("TikTok", { views: 999 }, { publishedAt: "2026-10-01T05:00:00Z" }),
    publication("TikTok", { views: 999 }, { companyId: "B" }),
    publication("Instagram", { views: 30 }),
    publication("Facebook", { views: 999 }, { publishedAt: "2026-07-31T17:00:00Z" })
  ]);
  const filtered = model.buildReport(data, { ...query, platform: "TikTok" });
  assert.equal(filtered.summary.views, 20);
  assert.equal(filtered.summary.publications, 1);
  assert.equal(filtered.summaryCoverage.views.availableCount, 1);
  assert.equal(filtered.summaryCoverage.views.totalCount, 1);
  assert.deepEqual(filtered.summaryCoverage.views.platforms, ["TikTok"]);
  assert.equal(filtered.summaryCoverage.views.complete, true);
  const all = model.buildReport(data, query);
  assert.equal(all.summary.views, 50);
  assert.equal(all.summaryCoverage.views.availableCount, 2);
  assert.equal(all.summaryCoverage.views.totalCount, 2);
  const other = model.buildReport(data, { ...query, companyId: "B" });
  assert.equal(other.summary.views, 999);
  assert.equal(other.summaryCoverage.views.totalCount, 1);
});

test("Incomplete metric cohorts expose available coverage but do not generate a misleading percent comparison", () => {
  const previous = publication("TikTok", { views: 100 }, { publishedAt: "2026-08-20T17:00:00Z" });
  const current = publication("TikTok", { views: 150 });
  const complete = model.buildReport(dataset([previous, current]), query).comparison.find(item => item.key === "views");
  assert.equal(complete.current, 150);
  assert.equal(complete.previous, 100);
  assert.equal(complete.change, 50);
  assert.equal(complete.currentCoverage.complete, true);
  assert.equal(complete.previousCoverage.complete, true);
  const partial = model.buildReport(dataset([previous, current, publication("Instagram")]), query).comparison.find(item => item.key === "views");
  assert.equal(partial.current, null);
  assert.equal(partial.previous, 100);
  assert.equal(partial.change, null);
  assert.equal(partial.currentCoverage.availableTotal, 150);
  assert.equal(partial.currentCoverage.availableCount, 1);
  assert.equal(partial.currentCoverage.totalCount, 2);
  assert.equal(partial.currentCoverage.complete, false);
  assert.equal(partial.previousCoverage.complete, true);
  const unknownPrevious = model.buildReport(dataset([current, publication("TikTok", {}, { publishedAt: "2026-08-20T17:00:00Z" })]), query).comparison.find(item => item.key === "views");
  assert.equal(unknownPrevious.previous, null);
  assert.equal(unknownPrevious.previousCoverage.availableTotal, null);
  assert.equal(unknownPrevious.change, null);
  const previousZero = model.buildReport(dataset([current, publication("TikTok", { views: 0 }, { publishedAt: "2026-08-20T17:00:00Z" })]), query).comparison.find(item => item.key === "views");
  assert.equal(previousZero.previous, 0);
  assert.equal(previousZero.previousCoverage.complete, true);
  assert.equal(previousZero.change, null);
});

test("New-follower coverage uses dated account observations rather than lifetime per-post follower attribution", () => {
  const posts = [publication("TikTok", { followersGained: 999 }), publication("Instagram", { followersGained: 9999 })];
  const observation = (platform, date, gained) => ({ socialAccountId: `${platform}:account`, platform, date, followers: 100, gained, lost: null });
  const followers = [observation("TikTok", "2026-09-15", 3), observation("TikTok", "2026-09-20", 2), observation("Instagram", "2026-08-20", 99), observation("TikTok", "2026-10-01", 99)];
  const complete = model.buildReport(dataset(posts, { followers }), query);
  assert.equal(complete.summary.followersGained, 5);
  assert.equal(complete.summaryCoverage.followersGained.availableTotal, 5);
  assert.equal(complete.summaryCoverage.followersGained.availableCount, 2);
  assert.equal(complete.summaryCoverage.followersGained.totalCount, 2);
  assert.equal(complete.summaryCoverage.followersGained.complete, true);
  assert.equal(complete.summaryCoverage.followersGained.unit, "observations");
  const partial = model.buildReport(dataset(posts, { followers: [...followers, observation("Instagram", "2026-09-15", null)] }), query);
  assert.equal(partial.summary.followersGained, null);
  assert.equal(partial.summaryCoverage.followersGained.availableTotal, 5);
  assert.equal(partial.summaryCoverage.followersGained.availableCount, 2);
  assert.equal(partial.summaryCoverage.followersGained.totalCount, 3);
  assert.equal(partial.summaryCoverage.followersGained.complete, false);
  const noHistory = model.buildReport(dataset(posts), query);
  assert.equal(noHistory.summary.followersGained, null);
  assert.equal(noHistory.summaryCoverage.followersGained.availableTotal, null);
  assert.equal(noHistory.summaryCoverage.followersGained.totalCount, 0);
});

test("Real report APIs serialize available coverage while keeping another company's imported data separate", async () => {
  const env = { ...process.env }, originalPool = globalThis.focusPool, originalSchema = globalThis.focusSchema, originalFetch = globalThis.fetch;
  const pg = new PGlite();
  Object.assign(process.env, { DATABASE_URL: "postgres://test", PANEL_USER: "owner", PANEL_PASSWORD: "coverage-test-password-long-enough" });
  const execute = async (sql, params) => {
    if (sql.includes("pg_advisory")) return { rows: [] };
    if (!params && sql.includes("CREATE TABLE")) { await pg.exec(sql); return { rows: [] }; }
    return pg.query(sql, params);
  };
  globalThis.focusPool = { query: execute, connect: async () => ({ query: execute, release() {} }) };
  globalThis.focusSchema = undefined;
  globalThis.fetch = async () => { throw new Error("Reading stored reports must not contact social providers"); };
  try {
    const { importTikTok, importCollector } = await import("../lib/content-reports/repository.ts");
    const { reportHandler } = await import("../lib/content-reports/api.ts");
    const { createSession } = await import("../lib/panel-auth.ts");
    await importTikTok("A", { capturedAt: "2026-09-30T17:00:00Z", user: { open_id: "tiktok-account", display_name: "Creator", follower_count: 100 }, videos: [{ id: "real-video", title: "Actual video", create_time: Date.parse("2026-09-15T17:00:00Z") / 1000, view_count: 200, like_count: 10, comment_count: 2, share_count: 3 }] });
    for (const platform of ["Instagram", "Facebook"]) {
      await importCollector("A", { platform, accountId: `${platform}:account`, publications: [publication(platform)], follower: null, warnings: [] });
    }
    const session = createSession();
    const request = companyId => new Request(`https://example.test/api/reports/summary?${new URLSearchParams({ ...query, companyId })}`, { headers: { cookie: `focusmrk_session=${session}` } });
    const response = await reportHandler(request("A"), "summary");
    assert.equal(response.status, 200);
    const a = await response.json();
    assert.equal(a.summary.views, null);
    assert.equal(a.summaryCoverage.views.availableTotal, 200);
    assert.equal(a.summaryCoverage.views.availableCount, 1);
    assert.equal(a.summaryCoverage.views.totalCount, 3);
    assert.equal(a.summaryCoverage.interactions.availableTotal, 15);
    assert.equal(a.summaryCoverage.interactions.unit, "components");
    assert.equal(a.summary.interactions, null);
    assert.ok(a.publications.every(post => post.companyId === "A"));
    const b = await (await reportHandler(request("B"), "summary")).json();
    assert.equal(b.publications.length, 0);
    assert.equal(b.summaryCoverage.views.availableTotal, null);
    assert.equal(b.summaryCoverage.views.availableCount, 0);
    assert.equal(b.summaryCoverage.views.totalCount, 0);
    assert.equal(b.networkSummaries.find(item => item.platform === "TikTok").coverage.views.availableCount, 0);
  } finally {
    process.env = env;
    globalThis.focusPool = originalPool;
    globalThis.focusSchema = originalSchema;
    globalThis.fetch = originalFetch;
    await pg.close();
  }
});
