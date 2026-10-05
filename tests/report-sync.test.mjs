import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { registerHooks } from "node:module";
import { PGlite } from "@electric-sql/pglite";

registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) return next(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.endsWith(".ts") && !/\.[a-z]+$/i.test(specifier)) return next(specifier + ".ts", context);
  return next(specifier, context);
} });

const query = { companyId: "A", platform: "Todas", startDate: "2026-09-01", endDate: "2026-09-30", mode: "production" };
const secrets = ["instagram-token-A", "instagram-secret-test", "facebook-secret-test", "tiktok-token-A", "tiktok-secret-test"];

async function environment(work) {
  const env = { ...process.env }, originalFetch = globalThis.fetch, originalError = console.error;
  const originalPool = globalThis.focusPool, originalSchema = globalThis.focusSchema;
  const pg = new PGlite(), logs = [];
  Object.assign(process.env, {
    DATABASE_URL: "postgres://test", PANEL_USER: "owner", PANEL_PASSWORD: "test-password-long-enough",
    INSTAGRAM_APP_ID: "ig-test", INSTAGRAM_APP_SECRET: "instagram-secret-test", INSTAGRAM_TOKEN_KEY: "ig-encryption-test",
    INSTAGRAM_REDIRECT_URI: "https://example.test/api/instagram/callback", INSTAGRAM_GRAPH_VERSION: "v26.0",
    META_APP_ID: "fb-test", META_APP_SECRET: "facebook-secret-test", META_TOKEN_KEY: "fb-encryption-test",
    META_REDIRECT_URI: "https://example.test/api/meta/callback", META_GRAPH_VERSION: "v26.0",
    TIKTOK_CLIENT_KEY: "tt-test", TIKTOK_CLIENT_SECRET: "tiktok-secret-test", TIKTOK_TOKEN_KEY: "tt-encryption-test",
    TIKTOK_REDIRECT_URI: "https://example.test/api/tiktok/callback"
  });
  const execute = async (sql, params) => {
    if (sql.includes("pg_advisory")) return { rows: [] };
    if (!params && sql.includes("CREATE TABLE")) { await pg.exec(sql); return { rows: [] }; }
    return pg.query(sql, params);
  };
  globalThis.focusPool = { query: execute, connect: async () => ({ query: execute, release() {} }) };
  globalThis.focusSchema = undefined;
  console.error = (...values) => logs.push(values.map(value => typeof value === "string" ? value : JSON.stringify(value)).join(" "));
  try {
    const { createSession } = await import("../lib/panel-auth.ts");
    const { reportHandler } = await import("../lib/content-reports/api.ts");
    const session = createSession();
    const request = (settings = {}) => {
      const { method = "POST", parameters = {}, cookie = session, csrf = true } = settings;
      return new Request(`https://example.test/api/reports/summary?${new URLSearchParams({ ...query, ...parameters })}`, {
        method, headers: { cookie: `focusmrk_session=${cookie}`, "Content-Type": "application/json", ...(csrf ? { "X-FocusMRK-Request": "1" } : {}) },
        ...(method === "POST" ? { body: "{}" } : {})
      });
    };
    await work({ pg, logs, reportHandler, request });
  } finally {
    process.env = env;
    globalThis.fetch = originalFetch;
    console.error = originalError;
    globalThis.focusPool = originalPool;
    globalThis.focusSchema = originalSchema;
    await pg.close();
  }
}

async function connectInstagram(pg, company = "A") {
  const { instagramDb, seal } = await import("../lib/instagram.ts");
  await instagramDb();
  const tokens = { access_token: `instagram-token-${company}`, user_id: "38838403035806352", expires: Date.now() + 30 * 86400000, issued: Date.now(), permissions: ["instagram_business_basic", "instagram_business_manage_insights"] };
  await pg.query("INSERT INTO focus_instagram_connections(company,tokens,external_id,permissions,expires_at,status) VALUES($1,$2,$3,$4::jsonb,$5,'connected')", [company, seal(tokens, company), tokens.user_id, JSON.stringify(tokens.permissions), new Date(tokens.expires)]);
}

async function connectTikTok(pg, company = "A") {
  const { tiktokDb, seal } = await import("../lib/tiktok.ts");
  await tiktokDb();
  const tokens = { access_token: `tiktok-token-${company}`, refresh_token: "tiktok-refresh-private", open_id: "tiktok-account", scope: "user.info.basic,user.info.stats,video.list", expires: Date.now() + 86400000, refreshExpires: Date.now() + 30 * 86400000 };
  await pg.query("INSERT INTO focus_tiktok_connections(company,tokens) VALUES($1,$2)", [company, seal(tokens, company)]);
}

function noSecrets(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  for (const secret of secrets) assert.equal(text.includes(secret), false, `must not expose ${secret}`);
}

test("Report sync persists partial successes and per-company statuses, and rejects unsafe or unauthorized requests before provider calls", async () => environment(async ({ pg, logs, reportHandler, request }) => {
  await connectInstagram(pg);
  await connectTikTok(pg);
  let network = 0;
  globalThis.fetch = async (input, init) => {
    network++;
    const url = new URL(input);
    assert.equal(url.searchParams.has("access_token"), false);
    if (url.hostname === "open.tiktokapis.com") {
      assert.equal(init.headers.Authorization, "Bearer tiktok-token-A");
      return Response.json({ error: { code: "access_token_invalid", message: "Private tiktok-token-A tiktok-secret-test" } }, { status: 401 });
    }
    assert.equal(url.hostname, "graph.instagram.com");
    assert.equal(init.headers.Authorization, "Bearer instagram-token-A");
    if (url.pathname === "/v26.0/me") return Response.json({ id: "11111", username: "professional", followers_count: 500 });
    if (url.pathname === "/v26.0/me/media") return Response.json({ data: [{ id: "101", timestamp: "2026-09-15T17:00:00Z", media_type: "IMAGE", caption: "Imported from real provider", like_count: 5, comments_count: 1 }] });
    if (url.pathname === "/v26.0/me/stories") return Response.json({ data: [] });
    if (url.pathname === "/v26.0/101/insights") return Response.json({ data: url.searchParams.get("metric").split(",").map(name => ({ name, values: [{ value: name === "views" ? 120 : 10 }] })) });
    throw new Error(`Unexpected partial-sync endpoint: ${url.pathname}`);
  };
  const response = await reportHandler(request(), "summary");
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.imported, 1);
  assert.deepEqual(result.results.map(item => [item.platform, item.status]), [["Instagram", "success"], ["Facebook", "error"], ["TikTok", "error"]]);
  assert.equal(result.results[0].imported, 1);
  assert.equal(result.results[0].startDate, "2026-08-02");
  assert.equal(result.results[0].endDate, "2026-09-30");
  noSecrets(result);
  const report = await (await reportHandler(request({ method: "GET" }), "summary")).json();
  assert.equal(report.publications.length, 1);
  assert.equal(report.publications[0].companyId, "A");
  assert.equal(report.summary.views, 120);
  assert.equal(report.syncs.length, 3);
  assert.deepEqual(report.syncs.map(item => [item.platform, item.status]).sort(), result.results.map(item => [item.platform, item.status]).sort());
  noSecrets(report);
  const other = await (await reportHandler(request({ method: "GET", parameters: { companyId: "B" } }), "summary")).json();
  assert.equal(other.publications.length, 0);
  assert.equal(other.syncs.length, 0);
  const before = network;
  assert.equal((await reportHandler(request({ csrf: false }), "summary")).status, 403);
  assert.equal((await reportHandler(request({ cookie: "bad-session" }), "summary")).status, 401);
  assert.equal((await reportHandler(request({ parameters: { mode: "demo" } }), "summary")).status, 400);
  await pg.exec("CREATE TABLE focus_accounts(id TEXT PRIMARY KEY,login TEXT,display_name TEXT,enabled BOOLEAN); CREATE TABLE focus_account_companies(account_id TEXT,company TEXT); CREATE TABLE focus_account_sessions(token_hash TEXT,account_id TEXT,expires_at TIMESTAMPTZ); INSERT INTO focus_accounts VALUES('editor','editor','Editor',true); INSERT INTO focus_account_companies VALUES('editor','A');");
  const member = "account_" + "a".repeat(64);
  await pg.query("INSERT INTO focus_account_sessions VALUES($1,'editor',now()+interval '1 hour')", [createHash("sha256").update(member).digest("hex")]);
  assert.equal((await reportHandler(request({ cookie: member, parameters: { companyId: "B" } }), "summary")).status, 403);
  assert.equal((await reportHandler(request({ cookie: member, csrf: false }), "summary")).status, 403);
  assert.equal(network, before, "access, CSRF and DEMO checks precede provider requests");
  const failedResponse = await reportHandler(request({ parameters: { companyId: "B" } }), "summary");
  assert.equal(failedResponse.status, 502);
  const failed = await failedResponse.json();
  assert.equal(failed.imported, 0);
  assert.ok(failed.results.every(item => item.status === "error"));
  assert.equal((await pg.query("SELECT count(*) AS count FROM focus_social_publications WHERE company_id='B'")).rows[0].count, 0);
  const failedReport = await (await reportHandler(request({ method: "GET", parameters: { companyId: "B" } }), "summary")).json();
  assert.equal(failedReport.syncs.length, 3);
  noSecrets(failed);
  noSecrets(logs.join("\n"));
}));

test("TikTok sync queries current and previous one-year cohorts separately, merges duplicate video IDs and rejects a changed account", async () => environment(async ({ pg, reportHandler, request }) => {
  await connectTikTok(pg);
  const { previousPeriod } = await import("../lib/content-reports/model.ts");
  const { periodBounds } = await import("../lib/tiktok-period.ts");
  const parameters = { platform: "TikTok", startDate: "2025-10-01", endDate: "2026-09-30" };
  const prior = previousPeriod(parameters), bounds = [periodBounds(prior.startDate, prior.endDate), periodBounds(parameters.startDate, parameters.endDate)];
  let profileCalls = 0, mode = "normal";
  const cursors = [];
  const video = (id, time, view_count) => ({ id, title: `Real TikTok ${id}`, create_time: Date.parse(time) / 1000, view_count, like_count: 4, comment_count: 2, share_count: 1, share_url: `https://www.tiktok.com/@real/video/${id}` });
  globalThis.fetch = async (input, init) => {
    const url = new URL(input);
    assert.equal(url.origin, "https://open.tiktokapis.com");
    assert.equal(init.headers.Authorization, "Bearer tiktok-token-A");
    assert.equal(url.searchParams.has("access_token"), false);
    if (url.pathname === "/v2/user/info/") {
      profileCalls++;
      return Response.json({ data: { user: { open_id: mode === "changed" && profileCalls % 2 === 0 ? "another-account" : "tiktok-account", display_name: "Creator", follower_count: 300 } }, error: { code: "ok" } });
    }
    if (url.pathname === "/v2/video/list/") {
      const body = JSON.parse(init.body);
      assert.equal(init.method, "POST");
      assert.equal(body.max_count, 20);
      cursors.push(body.cursor);
      const isPrior = body.cursor === bounds[0].until;
      assert.ok(isPrior || body.cursor === bounds[1].until);
      const videos = isPrior
        ? [video("old", "2025-05-01T17:00:00Z", 100), video("duplicate", "2025-06-01T17:00:00Z", 50)]
        : [video("new", "2026-05-01T17:00:00Z", 200), video("duplicate", "2026-06-01T17:00:00Z", 456)];
      return Response.json({ data: { videos, has_more: false }, error: { code: "ok" } });
    }
    throw new Error(`Unexpected TikTok-sync endpoint: ${url.pathname}`);
  };
  const response = await reportHandler(request({ parameters }), "summary");
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.imported, 3);
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].status, "success");
  assert.deepEqual(cursors, bounds.map(item => item.until));
  assert.equal(profileCalls, 2);
  assert.ok(bounds.every(item => item.until - item.from <= 366 * 86400000));
  const rows = (await pg.query("SELECT payload FROM focus_social_publications WHERE company_id='A' AND platform='TikTok' ORDER BY external_post_id")).rows;
  assert.equal(rows.length, 3);
  const duplicate = rows.find(row => row.payload.externalPostId === "duplicate").payload;
  assert.equal(duplicate.metrics.views, 456);
  assert.equal(duplicate.publishedAt, "2026-06-01T17:00:00.000Z");
  const report = await (await reportHandler(request({ method: "GET", parameters }), "summary")).json();
  assert.equal(report.summary.views, 656);
  assert.equal(report.comparison.find(item => item.key === "views").previous, 100);
  assert.equal(report.publications.length, 2);
  assert.equal(report.summary.reach, null);
  assert.ok(report.publications.every(post => post.metrics.saves === null));
  const other = await (await reportHandler(request({ method: "GET", parameters: { ...parameters, companyId: "B" } }), "summary")).json();
  assert.equal(other.publications.length, 0);
  mode = "changed";
  const changedResponse = await reportHandler(request({ parameters }), "summary");
  assert.equal(changedResponse.status, 502);
  const changed = await changedResponse.json();
  assert.equal(changed.results[0].status, "error");
  assert.ok(changed.results[0].error.includes("cuenta de TikTok"));
  assert.equal(changed.imported, 0);
  assert.equal((await pg.query("SELECT count(*) AS count FROM focus_social_publications")).rows[0].count, 3);
  noSecrets(changed);
}));

test("Collector imports enforce company and account identity atomically and upsert without duplicating publications", async () => environment(async ({ pg }) => {
  const { importCollector } = await import("../lib/content-reports/repository.ts");
  const { emptyMetrics } = await import("../lib/content-reports/model.ts");
  const accountId = "Instagram:101", id = createHash("sha256").update(JSON.stringify(["A", "Instagram", "post101"])).digest("hex");
  const post = { id, companyId: "A", socialAccountId: accountId, platform: "Instagram", externalPostId: "post101", title: "Actual post", caption: "", mediaUrl: "", thumbnailUrl: "", permalink: "", contentType: "POST", publishedAt: "2026-09-15T17:00:00Z", campaignId: null, paid: null, capturedAt: "2026-09-30T17:00:00Z", metrics: { ...emptyMetrics(), views: 10 } };
  const result = { platform: "Instagram", accountId, publications: [post], follower: null, warnings: [] };
  await assert.rejects(importCollector("A", { ...result, accountId: "Facebook:101" }));
  await assert.rejects(importCollector("A", { ...result, publications: [post, { ...post, id: "foreign", companyId: "B" }] }));
  assert.equal((await pg.query("SELECT count(*) AS count FROM focus_social_publications")).rows[0].count, 0);
  assert.equal((await pg.query("SELECT count(*) AS count FROM focus_content_accounts")).rows[0].count, 0);
  await assert.rejects(importCollector("A", { ...result, follower: { socialAccountId: "Instagram:other", platform: "Instagram", date: "2026-09-30", followers: 20, gained: null, lost: null } }));
  assert.equal((await pg.query("SELECT count(*) AS count FROM focus_social_publications")).rows[0].count, 0);
  assert.equal(await importCollector("A", result), 1);
  assert.equal(await importCollector("A", result), 1);
  assert.equal((await pg.query("SELECT count(*) AS count FROM focus_social_publications")).rows[0].count, 1);
  assert.equal((await pg.query("SELECT count(*) AS count FROM focus_publication_metrics")).rows[0].count, 1);
}));
