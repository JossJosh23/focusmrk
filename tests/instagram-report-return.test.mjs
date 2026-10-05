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

const company = "Empresa con espacios";
const filters = { companyId: company, platform: "Instagram", startDate: "2026-09-01", endDate: "2026-09-30", mode: "production" };
const returnTo = `/dashboard/informes?${new URLSearchParams(filters)}`;

async function environment(work) {
  const env = { ...process.env }, originalFetch = globalThis.fetch, originalInfo = console.info;
  const originalPool = globalThis.focusPool, originalSchema = globalThis.focusSchema;
  const pg = new PGlite(), logs = [];
  Object.assign(process.env, {
    DATABASE_URL: "postgres://test", PANEL_USER: "owner", PANEL_PASSWORD: "instagram-return-test-password-long-enough",
    INSTAGRAM_APP_ID: "456", INSTAGRAM_APP_SECRET: "instagram-secret-private", INSTAGRAM_TOKEN_KEY: "instagram-encryption-test",
    INSTAGRAM_REDIRECT_URI: "https://configured.example.test/api/instagram/callback", INSTAGRAM_GRAPH_VERSION: "v26.0"
  });
  const execute = async (sql, params) => {
    if (sql.includes("pg_advisory")) return { rows: [] };
    if (!params && sql.includes("CREATE TABLE")) { await pg.exec(sql); return { rows: [] }; }
    return pg.query(sql, params);
  };
  globalThis.focusPool = { query: execute, connect: async () => ({ query: execute, release() {} }) };
  globalThis.focusSchema = undefined;
  console.info = (...values) => logs.push(values.map(value => typeof value === "string" ? value : JSON.stringify(value)).join(" "));
  let permissionMode = "granted", exchanges = 0;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(input);
    assert.ok(["api.instagram.com", "graph.instagram.com"].includes(url.hostname), "Instagram report authorization never calls Facebook");
    if (url.hostname === "api.instagram.com") {
      assert.equal(url.pathname, "/oauth/access_token");
      assert.equal(init.method, "POST");
      assert.equal(init.body.get("client_id"), "456");
      assert.equal(init.body.get("redirect_uri"), process.env.INSTAGRAM_REDIRECT_URI);
      exchanges++;
      const permissions = permissionMode === "granted" ? ["instagram_business_basic", "instagram_business_manage_insights"] : ["instagram_business_basic"];
      return Response.json({ access_token: "instagram-short-private", user_id: "999", ...(permissionMode === "unknown" ? {} : { permissions }) });
    }
    if (url.pathname === "/access_token") return Response.json({ access_token: "instagram-long-private", expires_in: 5184000 });
    assert.equal(init.headers.Authorization, "Bearer instagram-long-private");
    if (url.pathname === "/v26.0/me") return Response.json({ id: "999", username: "professional" });
    throw new Error(`Unexpected Instagram report-return endpoint: ${url.pathname}`);
  };
  try {
    const connect = await import("../app/api/instagram/connect/route.ts");
    const callback = await import("../app/api/instagram/callback/route.ts");
    const instagram = await import("../lib/instagram.ts");
    const { createSession } = await import("../lib/panel-auth.ts");
    const session = createSession();
    const startRequest = (parameters = {}, cookie = session, csrf = true) => new Request(`https://untrusted-request.example.test/api/instagram/connect?${new URLSearchParams({ company, ...parameters })}`, {
      method: "POST", headers: { cookie: `focusmrk_session=${cookie}`, "Content-Type": "application/json", ...(csrf ? { "X-FocusMRK-Request": "1" } : {}) }
    });
    const callbackRequest = (state, parameters = {}, cookie = session) => new Request(`https://untrusted-request.example.test/api/instagram/callback?${new URLSearchParams({ state, ...parameters })}`, { headers: { cookie: `focusmrk_session=${cookie}` } });
    const start = async (parameters = {}, cookie = session) => {
      const response = await connect.POST(startRequest(parameters, cookie));
      assert.equal(response.status, 200);
      const oauth = new URL((await response.json()).url), state = oauth.searchParams.get("state");
      assert.match(state, /^[a-f0-9]{64}$/);
      return { oauth, state };
    };
    await work({ pg, logs, connect, callback, instagram, createSession, session, startRequest, callbackRequest, start,
      exchanges: () => exchanges, permissions: mode => { permissionMode = mode; } });
  } finally {
    process.env = env;
    globalThis.fetch = originalFetch;
    console.info = originalInfo;
    globalThis.focusPool = originalPool;
    globalThis.focusSchema = originalSchema;
    await pg.close();
  }
}

function assertSafeRedirect(response, path) {
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  const url = new URL(response.headers.get("location"));
  assert.equal(url.origin, "https://configured.example.test");
  assert.equal(url.pathname, path);
  for (const secret of ["instagram-short-private", "instagram-long-private", "instagram-secret-private"]) assert.equal(url.href.includes(secret), false);
  return url;
}

test("Instagram report OAuth preserves validated filters in server state and returns to the configured origin with exact permission status", async () => environment(async ({ pg, logs, callback, instagram, start, callbackRequest, permissions }) => {
  for (const status of ["granted", "not_granted", "unknown"]) {
    permissions(status);
    const { oauth, state } = await start({ reports: "1", returnTo });
    assert.equal(oauth.origin, "https://www.instagram.com");
    assert.equal(oauth.searchParams.get("scope"), "instagram_business_basic,instagram_business_manage_insights");
    assert.equal(oauth.searchParams.get("redirect_uri"), process.env.INSTAGRAM_REDIRECT_URI);
    assert.equal(oauth.searchParams.has("returnTo"), false, "report navigation stays server-side rather than travelling through Instagram");
    const row = (await pg.query("SELECT * FROM focus_instagram_states WHERE id=$1", [instagram.digest(state)])).rows[0];
    assert.equal(row.company, company);
    assert.equal(row.context.insightsRequested, true);
    const stored = new URL(row.context.reportPath, "https://configured.example.test");
    assert.equal(stored.pathname, "/dashboard/informes");
    for (const [key, value] of Object.entries(filters)) assert.equal(stored.searchParams.get(key), value);
    const response = await callback.GET(callbackRequest(state, { code: "private-code", returnTo: "https://evil.example.test/steal", reports: "0", company: "Other company" }));
    const back = assertSafeRedirect(response, "/dashboard/informes");
    for (const [key, value] of Object.entries(filters)) assert.equal(back.searchParams.get(key), value);
    assert.equal(back.searchParams.get("instagram"), "connected");
    assert.equal(back.searchParams.get("instagramInsights"), status);
    assert.equal(back.searchParams.has("returnTo"), false);
    const connection = (await pg.query("SELECT tokens,permissions FROM focus_instagram_connections WHERE company=$1", [company])).rows[0];
    const tokens = instagram.unseal(connection.tokens, company);
    assert.equal(tokens.insightsRequested, true);
    assert.equal(tokens.permissionsVerified, status !== "unknown");
    assert.equal(tokens.permissions.includes("instagram_business_manage_insights"), status === "granted");
    assert.equal(connection.tokens.includes("instagram-long-private"), false);
    assert.equal((await pg.query("SELECT count(*) AS count FROM focus_instagram_states WHERE id=$1", [instagram.digest(state)])).rows[0].count, 0);
    const replay = await callback.GET(callbackRequest(state, { code: "private-code" }));
    assert.equal(replay.status, 400);
    assert.equal(replay.headers.has("location"), false);
    for (const secret of ["instagram-long-private", "instagram-short-private", "instagram-secret-private", "private-code", state]) assert.equal(logs.join("\n").includes(secret), false);
  }
}));

test("Instagram report cancellation returns to the saved filters without token exchange; basic OAuth keeps Integrations navigation", async () => environment(async ({ pg, callback, instagram, start, callbackRequest, exchanges }) => {
  const reportStart = await start({ reports: "1", returnTo });
  const cancelled = await callback.GET(callbackRequest(reportStart.state, { error: "access_denied", returnTo: "//evil.example.test" }));
  const reportBack = assertSafeRedirect(cancelled, "/dashboard/informes");
  assert.equal(reportBack.searchParams.get("companyId"), company);
  assert.equal(reportBack.searchParams.get("startDate"), filters.startDate);
  assert.equal(reportBack.searchParams.get("endDate"), filters.endDate);
  assert.equal(reportBack.searchParams.get("instagram"), "cancelled");
  assert.equal(reportBack.searchParams.has("instagramInsights"), false);
  assert.equal(exchanges(), 0);
  assert.equal((await pg.query("SELECT count(*) AS count FROM focus_instagram_connections")).rows[0].count, 0);
  assert.equal((await callback.GET(callbackRequest(reportStart.state, { error: "access_denied" }))).status, 400);
  const normalStart = await start({ returnTo: "https://evil.example.test/steal" });
  assert.equal(normalStart.oauth.searchParams.get("scope"), "instagram_business_basic");
  const normalRow = (await pg.query("SELECT context FROM focus_instagram_states WHERE id=$1", [instagram.digest(normalStart.state)])).rows[0];
  assert.deepEqual(normalRow.context, {});
  const normalBack = assertSafeRedirect(await callback.GET(callbackRequest(normalStart.state, { code: "private-code" })), "/");
  assert.equal(normalBack.searchParams.get("module"), "integrations");
  assert.equal(normalBack.searchParams.get("company"), company);
  assert.equal(normalBack.searchParams.get("instagram"), "connected");
  assert.equal(normalBack.searchParams.has("instagramInsights"), false);
  assert.equal(normalBack.searchParams.has("returnTo"), false);
}));

test("Report OAuth rejects open redirects, other companies, unsupported filters and invalid periods before creating state", async () => environment(async ({ pg, connect, instagram, startRequest, start, exchanges }) => {
  await instagram.instagramDb();
  const pending = await start({ reports: "1", returnTo });
  const badPaths = [
    `https://evil.example.test${returnTo}`,
    `//evil.example.test${returnTo}`,
    `/other-page?${new URLSearchParams(filters)}`,
    `/dashboard/informes?${new URLSearchParams({ ...filters, companyId: "Other company" })}`,
    `/dashboard/informes?${new URLSearchParams({ ...filters, platform: "LinkedIn" })}`,
    `/dashboard/informes?${new URLSearchParams({ ...filters, mode: "demo" })}`,
    `/dashboard/informes?${new URLSearchParams({ ...filters, startDate: "2026-02-30" })}`,
    `/dashboard/informes?${new URLSearchParams({ ...filters, endDate: "2026-08-01" })}`,
    `/dashboard/informes?${new URLSearchParams({ ...filters, startDate: "2024-01-01" })}`
  ];
  for (const path of badPaths) {
    const response = await connect.POST(startRequest({ reports: "1", returnTo: path }));
    assert.equal(response.status, 400, `invalid report return must be rejected: ${path}`);
    assert.equal(response.headers.has("location"), false);
    assert.equal((await pg.query("SELECT count(*) AS count FROM focus_instagram_states")).rows[0].count, 1);
    assert.ok((await pg.query("SELECT id FROM focus_instagram_states WHERE id=$1", [instagram.digest(pending.state)])).rows.length, "invalid input must not replace an existing valid pending state");
  }
  assert.equal(exchanges(), 0);
}));

test("Missing report return filters get a safe default and OAuth callbacks require the original unexpired session", async () => environment(async ({ pg, callback, instagram, createSession, start, callbackRequest, exchanges }) => {
  const { publicationDate, shiftDate } = await import("../lib/content-reports/model.ts");
  const today = publicationDate(new Date().toISOString());
  const initial = await start({ reports: "1" });
  const context = (await pg.query("SELECT context FROM focus_instagram_states WHERE id=$1", [instagram.digest(initial.state)])).rows[0].context;
  const stored = new URL(context.reportPath, "https://configured.example.test");
  assert.equal(stored.pathname, "/dashboard/informes");
  assert.equal(stored.searchParams.get("companyId"), company);
  assert.equal(stored.searchParams.get("platform"), "Todas");
  assert.equal(stored.searchParams.get("mode"), "production");
  assert.equal(stored.searchParams.get("startDate"), shiftDate(today, -29));
  assert.equal(stored.searchParams.get("endDate"), today);
  const wrongSession = await callback.GET(callbackRequest(initial.state, { code: "private-code" }, createSession()));
  assert.equal(wrongSession.status, 400);
  assert.equal(wrongSession.headers.has("location"), false);
  assert.equal(exchanges(), 0);
  assert.equal((await pg.query("SELECT count(*) AS count FROM focus_instagram_states WHERE id=$1", [instagram.digest(initial.state)])).rows[0].count, 1);
  await pg.query("UPDATE focus_instagram_states SET expires=now()-interval '1 second' WHERE id=$1", [instagram.digest(initial.state)]);
  const expired = await callback.GET(callbackRequest(initial.state, { code: "private-code" }));
  assert.equal(expired.status, 400);
  assert.equal(expired.headers.has("location"), false);
  assert.equal(exchanges(), 0);
}));

test("Report return state migration preserves legacy Integrations callbacks and rechecks tenant authorization", async () => environment(async ({ pg, callback, instagram, session, start, callbackRequest, exchanges }) => {
  await pg.exec("CREATE TABLE focus_instagram_states(id TEXT PRIMARY KEY,session TEXT NOT NULL,company TEXT NOT NULL,expires TIMESTAMPTZ NOT NULL)");
  const legacyState = "a".repeat(64);
  await pg.query("INSERT INTO focus_instagram_states VALUES($1,$2,$3,now()+interval '10 minutes')", [instagram.digest(legacyState), instagram.digest(session), company]);
  const legacyBack = assertSafeRedirect(await callback.GET(callbackRequest(legacyState, { code: "private-code" })), "/");
  assert.equal(legacyBack.searchParams.get("module"), "integrations");
  assert.equal(legacyBack.searchParams.get("company"), company);
  await pg.exec("CREATE TABLE focus_accounts(id TEXT PRIMARY KEY,login TEXT,display_name TEXT,enabled BOOLEAN); CREATE TABLE focus_account_companies(account_id TEXT,company TEXT); CREATE TABLE focus_account_sessions(token_hash TEXT,account_id TEXT,expires_at TIMESTAMPTZ); INSERT INTO focus_accounts VALUES('manager','manager','Manager',true);");
  await pg.query("INSERT INTO focus_account_companies VALUES('manager',$1)", [company]);
  const manager = "account_" + "b".repeat(64);
  await pg.query("INSERT INTO focus_account_sessions VALUES($1,'manager',now()+interval '1 hour')", [createHash("sha256").update(manager).digest("hex")]);
  const pending = await start({ reports: "1", returnTo }, manager);
  await pg.query("DELETE FROM focus_account_companies WHERE account_id='manager'");
  const before = exchanges();
  const denied = await callback.GET(callbackRequest(pending.state, { code: "private-code" }, manager));
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.has("location"), false);
  assert.equal(exchanges(), before);
}));
