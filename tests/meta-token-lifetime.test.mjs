import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { PGlite } from "@electric-sql/pglite";

registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) return next(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.endsWith(".ts") && !/\.[a-z]+$/i.test(specifier)) return next(specifier + ".ts", context);
  return next(specifier, context);
} });

const shortToken = "EAAlifetimeShortPrivate123456789", longToken = "EAAlifetimeLongPrivate123456789", pageToken = "EAAlifetimePagePrivate123456789";
const secret = "meta-lifetime-secret-private", appToken = `123456789|${secret}`;
function noSecrets(value, extra = []) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  for (const sensitive of [shortToken, longToken, pageToken, secret, appToken, "meta-lifetime-key-private", "private-code", ...extra]) assert.equal(text.includes(sensitive), false, "token diagnostics must not expose server credentials");
}
function diagnostic(logs) {
  const prefix = "[meta_callback] ", line = logs.findLast(value => value.startsWith(prefix));
  assert.ok(line);
  return JSON.parse(line.slice(prefix.length));
}

async function environment(work) {
  const env = { ...process.env }, originalFetch = globalThis.fetch, originalInfo = console.info, originalError = console.error;
  const originalPool = globalThis.focusPool, originalSchema = globalThis.focusSchema;
  const pg = new PGlite(), logs = [];
  Object.assign(process.env, {
    DATABASE_URL: "postgres://test", PANEL_USER: "owner", PANEL_PASSWORD: "meta-lifetime-test-password-long-enough",
    META_APP_ID: "123456789", META_APP_SECRET: secret, META_TOKEN_KEY: "meta-lifetime-key-private",
    META_REDIRECT_URI: "https://configured.example.test/api/meta/callback", META_GRAPH_VERSION: "v26.0"
  });
  const execute = async (sql, params) => {
    if (sql.includes("pg_advisory")) return { rows: [] };
    if (!params && sql.includes("CREATE TABLE")) { await pg.exec(sql); return { rows: [] }; }
    return pg.query(sql, params);
  };
  globalThis.focusPool = { query: execute, connect: async () => ({ query: execute, release() {} }) };
  globalThis.focusSchema = undefined;
  const capture = (...values) => logs.push(values.map(value => typeof value === "string" ? value : JSON.stringify(value)).join(" "));
  console.info = capture;
  console.error = capture;
  let lifetime = undefined, legacyLifetime = undefined, debugStatus = 200, debugRaw = null;
  const future = Math.floor(Date.now() / 1000) + 7200;
  let debugData = { is_valid: true, type: "USER", app_id: "123456789", user_id: "999", expires_at: future, data_access_expires_at: future + 3600 };
  let debugRequests = 0, permissionRequests = 0, pageRequests = 0;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(input);
    assert.equal(url.hostname, "graph.facebook.com");
    if (url.pathname.endsWith("/oauth/access_token")) {
      const isLong = url.searchParams.get("grant_type") === "fb_exchange_token";
      if (!isLong) assert.equal(url.searchParams.get("redirect_uri"), process.env.META_REDIRECT_URI);
      return Response.json({ access_token: isLong ? longToken : shortToken, ...(isLong ? { ...(lifetime === undefined ? {} : { expires_in: lifetime }), ...(legacyLifetime === undefined ? {} : { expires: legacyLifetime }) } : { expires_in: 60 }) });
    }
    if (url.pathname === "/v26.0/111") {
      assert.equal(init.headers.Authorization, `Bearer ${pageToken}`);
      return Response.json({ id: "111", name: "Authorized Page", followers_count: 777, fan_count: 600 });
    }
    if (url.pathname === "/v26.0/111/published_posts") {
      assert.equal(init.headers.Authorization, `Bearer ${pageToken}`);
      return Response.json({ data: [{ id: "111_1", created_time: "2026-09-15T17:00:00Z", message: "Actual publication", likes: { summary: { total_count: 2 } }, comments: { summary: { total_count: 1 } }, shares: { count: 0 } }] });
    }
    if (url.pathname === "/v26.0/111_1/insights") {
      assert.equal(init.headers.Authorization, `Bearer ${pageToken}`);
      return Response.json({ data: [{ name: "post_media_view", values: [{ value: 12 }] }, { name: "post_clicks", values: [{ value: 0 }] }] });
    }
    if (url.pathname.endsWith("/debug_token")) {
      debugRequests++;
      assert.equal(url.pathname, "/v26.0/debug_token");
      assert.equal(url.searchParams.get("input_token"), longToken);
      assert.equal(init.headers.Authorization, `Bearer ${process.env.META_APP_ID}|${secret}`);
      assert.equal(url.searchParams.has("access_token"), false, "the application credential stays in the authorization header");
      assert.equal(url.searchParams.has("client_secret"), false);
      assert.equal(init.method || "GET", "GET");
      if (debugStatus !== 200) return Response.json({ error: { type: "OAuthException", code: 190, error_subcode: 463, message: `Real debug error: ${longToken} ${process.env.META_APP_ID}|${secret} private-code https://graph.facebook.com/v26.0/debug_token?input_token=${longToken}` } }, { status: debugStatus });
      return debugRaw ? new Response(debugRaw) : Response.json({ data: debugData });
    }
    assert.equal(url.searchParams.has("access_token"), false);
    assert.equal(init.headers.Authorization, `Bearer ${longToken}`);
    if (url.pathname.endsWith("/me/permissions")) {
      permissionRequests++;
      return Response.json({ data: ["pages_show_list", "pages_read_engagement", "read_insights"].map(permission => ({ permission, status: "granted" })) });
    }
    if (url.pathname.endsWith("/me/accounts")) {
      pageRequests++;
      return Response.json({ data: [{ id: "111", name: "Authorized Page", access_token: pageToken }] });
    }
    throw new Error(`Unexpected token-lifetime test endpoint: ${url.pathname}`);
  };
  try {
    const api = await import("../app/api/meta/route.ts"), callback = await import("../app/api/meta/callback/route.ts"), meta = await import("../lib/meta.ts");
    const { createSession } = await import("../lib/panel-auth.ts");
    const session = createSession();
    await meta.metaDb();
    const priorTokens = { access_token: "old-user-private", expires: Date.now() + 86400000, pages: [{ id: "111", name: "Selected Page", access_token: "old-page-private" }], permissions: ["pages_show_list", "pages_read_engagement"] };
    const snapshot = { capturedAt: "2026-10-01T17:00:00Z", selectedPage: "111", accounts: [{ facebook: { id: "111", name: "Selected Page", followers: 777 } }] };
    await pg.query("INSERT INTO focus_meta_connections(company,tokens,snapshot,external_id,permissions,expires_at,connected_at,status) VALUES('A',$1,$2::jsonb,'111',$3::jsonb,$4,now(),'connected')", [meta.seal(priorTokens, "A"), JSON.stringify(snapshot), JSON.stringify(priorTokens.permissions), new Date(priorTokens.expires)]);
    const original = (await pg.query("SELECT * FROM focus_meta_connections WHERE company='A'")).rows[0];
    const start = async () => {
      const response = await api.POST(new Request("https://request.example.test/api/meta?company=A&reports=1", { method: "POST", headers: { cookie: `focusmrk_session=${session}`, "Content-Type": "application/json", "X-FocusMRK-Request": "1" }, body: JSON.stringify({ action: "connect" }) }));
      assert.equal(response.status, 200);
      return new URL((await response.json()).url).searchParams.get("state");
    };
    const request = state => new Request(`https://request.example.test/api/meta/callback?${new URLSearchParams({ state, code: "private-code" })}`, { headers: { cookie: `focusmrk_session=${session}` } });
    const actionRequest = action => new Request("https://request.example.test/api/meta?company=A", { method: action ? "POST" : "GET", headers: { cookie: `focusmrk_session=${session}`, "Content-Type": "application/json", "X-FocusMRK-Request": "1" }, ...(action ? { body: JSON.stringify({ action }) } : {}) });
    const unchanged = async () => assert.deepEqual((await pg.query("SELECT * FROM focus_meta_connections WHERE company='A'")).rows[0], original);
    const saved = async () => {
      const row = (await pg.query("SELECT * FROM focus_meta_connections WHERE company='A'")).rows[0];
      return { row, tokens: meta.unseal(row.tokens, "A") };
    };
    await work({ pg, logs, api, callback, meta, future, start, request, actionRequest, unchanged, saved,
      lifetime: value => { lifetime = value; }, alias: value => { legacyLifetime = value; }, debug: (value, status = 200, raw = null) => { debugData = value; debugStatus = status; debugRaw = raw; },
      counts: () => ({ debug: debugRequests, permissions: permissionRequests, pages: pageRequests }) });
  } finally {
    process.env = env;
    globalThis.fetch = originalFetch;
    console.info = originalInfo;
    console.error = originalError;
    globalThis.focusPool = originalPool;
    globalThis.focusSchema = originalSchema;
    await pg.close();
  }
}

test("Facebook accepts positive integer expires_in numbers or strings without inventing a different token lifetime", async () => environment(async ({ logs, callback, start, request, saved, lifetime, counts }) => {
  for (const value of [3600, "3600"]) {
    lifetime(value);
    const state = await start(), before = Date.now();
    const response = await callback.GET(request(state)), after = Date.now();
    assert.equal(response.status, 303);
    const { row, tokens } = await saved();
    assert.ok(tokens.expires >= before + 3600000 && tokens.expires <= after + 3600000);
    assert.equal(new Date(row.expires_at).getTime(), tokens.expires);
    assert.equal(tokens.access_token, longToken);
    assert.equal(row.snapshot.selectedPage, "111");
    assert.equal(counts().debug, 0);
    noSecrets(logs.join("\n"), [state]);
  }
}));

test("Missing or malformed expires_in is verified through debug_token and saves the earliest confirmed deadline", async () => environment(async ({ logs, callback, future, start, request, saved, lifetime, debug, counts }) => {
  debug({ is_valid: true, type: "USER", app_id: "123456789", user_id: "999", expires_at: future, data_access_expires_at: future - 3600 });
  const values = [undefined, null, 0, -1, "", "invalid", "3.5", 1.5, Number.MAX_SAFE_INTEGER];
  for (const value of values) {
    lifetime(value);
    const before = counts();
    const state = await start();
    const response = await callback.GET(request(state));
    assert.equal(response.status, 303);
    const { row, tokens } = await saved();
    assert.equal(tokens.expires, (future - 3600) * 1000);
    assert.equal(new Date(row.expires_at).getTime(), tokens.expires);
    assert.equal(row.external_id, "111");
    assert.equal(counts().debug, before.debug + 1);
    assert.equal(counts().permissions, before.permissions + 1);
    assert.equal(counts().pages, before.pages + 1);
    assert.equal(diagnostic(logs).meta_error_type, "");
    assert.equal(diagnostic(logs).token_exchange_status, 200);
    noSecrets(logs.join("\n"), [state]);
  }
}));

test("A verified token with zero token expiration uses a positive confirmed data-access deadline and optional absent deadlines remain optional", async () => environment(async ({ logs, callback, future, start, request, saved, debug }) => {
  for (const values of [
    { expires_at: 0, data_access_expires_at: future },
    { expires_at: String(future), data_access_expires_at: null },
    { expires_at: future },
    { expires_at: future, data_access_expires_at: 0 }
  ]) {
    debug({ is_valid: true, type: "USER", app_id: "123456789", user_id: "999", ...values });
    const state = await start();
    assert.equal((await callback.GET(request(state))).status, 303);
    const { row, tokens } = await saved();
    assert.equal(tokens.expires, future * 1000);
    assert.equal(new Date(row.expires_at).getTime(), future * 1000);
    noSecrets(logs.join("\n"), [state]);
  }
}));

test("Debugging rejects invalid tokens, different applications, unsupported token types and missing user identity without overwriting credentials", async () => environment(async ({ logs, callback, future, start, request, unchanged, debug, counts }) => {
  const good = { is_valid: true, type: "USER", app_id: "123456789", user_id: "999", expires_at: future, data_access_expires_at: future + 3600 };
  const cases = [{ is_valid: false }, { is_valid: "true" }, { app_id: "different-app" }, { type: "PAGE" }, { type: "APP" }, { user_id: undefined }, { user_id: "" }, { user_id: "not-numeric" }];
  for (const changes of cases) {
    debug({ ...good, ...changes });
    const before = counts(), state = await start();
    const response = await callback.GET(request(state));
    assert.equal(response.status, 502);
    const text = await response.text();
    assert.ok(text.includes("Etapa: token_debug_validation"));
    assert.ok(text.includes("token_debug_invalid"));
    assert.ok(text.includes("Meta HTTP 200"));
    assert.equal(diagnostic(logs).http_status, 200);
    assert.equal(diagnostic(logs).meta_error_type, "token_debug_invalid");
    assert.equal(counts().debug, before.debug + 1);
    assert.equal(counts().permissions, before.permissions);
    assert.equal(counts().pages, before.pages);
    noSecrets(text, [state]);
    noSecrets(logs.join("\n"), [state]);
    await unchanged();
  }
}));

test("Unknown or past debug deadlines stop before Page queries and preserve the previously connected account", async () => environment(async ({ logs, callback, future, start, request, unchanged, debug, counts }) => {
  const good = { is_valid: true, type: "USER", app_id: "123456789", user_id: "999" };
  const cases = [
    [{}, "token_lifetime_unknown"],
    [{ data_access_expires_at: future }, "token_lifetime_unknown"],
    [{ expires_at: null }, "token_lifetime_unknown"],
    [{ expires_at: 0 }, "token_lifetime_unknown"],
    [{ expires_at: -1 }, "token_lifetime_unknown"],
    [{ expires_at: 1.5 }, "token_lifetime_unknown"],
    [{ expires_at: Number.MAX_SAFE_INTEGER }, "token_lifetime_unknown"],
    [{ expires_at: "not-a-deadline" }, "token_lifetime_unknown"],
    [{ expires_at: future, data_access_expires_at: -1 }, "token_lifetime_unknown"],
    [{ expires_at: future, data_access_expires_at: "not-a-deadline" }, "token_lifetime_unknown"],
    [{ expires_at: future, data_access_expires_at: Number.MAX_SAFE_INTEGER }, "token_lifetime_unknown"],
    [{ expires_at: Math.floor(Date.now() / 1000) - 10 }, "token_expired"],
    [{ expires_at: future, data_access_expires_at: Math.floor(Date.now() / 1000) - 10 }, "token_expired"]
  ];
  for (const [values, type] of cases) {
    debug({ ...good, ...values });
    const before = counts(), state = await start();
    const response = await callback.GET(request(state));
    assert.equal(response.status, 502);
    const text = await response.text();
    assert.ok(text.includes("Etapa: token_debug_validation"));
    assert.ok(text.includes(type));
    assert.ok(text.includes("Meta HTTP 200"));
    assert.equal(diagnostic(logs).meta_error_type, type);
    assert.equal(counts().permissions, before.permissions);
    assert.equal(counts().pages, before.pages);
    noSecrets(text, [state]);
    await unchanged();
  }
}));

test("Debug-token HTTP 400 and 401 errors preserve real provider details while hiding application credentials and inspected tokens", async () => environment(async ({ logs, callback, start, request, unchanged, debug, counts }) => {
  for (const status of [400, 401]) {
    debug({}, status);
    const before = counts(), state = await start();
    const response = await callback.GET(request(state));
    assert.equal(response.status, status);
    const text = await response.text();
    assert.ok(text.includes("Etapa: token_debug_request"));
    assert.ok(text.includes(`Meta HTTP ${status}`));
    assert.ok(text.includes("OAuthException"));
    assert.ok(text.includes("Real debug error"));
    const result = diagnostic(logs);
    assert.equal(result.stage, "token_debug_request");
    assert.equal(result.http_status, status);
    assert.equal(result.token_exchange_status, 200);
    assert.equal(result.meta_error_code, 190);
    assert.equal(result.meta_error_subcode, 463);
    assert.equal(counts().permissions, before.permissions);
    assert.equal(counts().pages, before.pages);
    noSecrets(text, [state]);
    noSecrets(logs.join("\n"), [state]);
    await unchanged();
  }
}));

test("Debug-token validation preserves exact numeric application and user identifiers beyond JavaScript integer precision", async () => environment(async ({ logs, callback, future, start, request, saved, debug }) => {
  process.env.META_APP_ID = "900719925474099312345";
  debug({}, 200, `{"data":{"is_valid":true,"type":"USER","app_id":900719925474099312345,"user_id":900719925474099398765,"expires_at":${future}}}`);
  const state = await start();
  assert.equal((await callback.GET(request(state))).status, 303);
  assert.equal((await saved()).tokens.expires, future * 1000);
  noSecrets(logs.join("\n"), [state, `${process.env.META_APP_ID}|${secret}`]);
}));

test("Historical expires duration is accepted and the shorter valid duration wins when both relative fields exist", async () => environment(async ({ logs, callback, start, request, saved, lifetime, alias, counts }) => {
  for (const [expiresIn, expires, expected] of [[undefined, 3600, 3600], [undefined, "3600", 3600], [7200, "3600", 3600], ["3600", 7200, 3600], ["invalid", "3600", 3600]]) {
    lifetime(expiresIn);
    alias(expires);
    const state = await start(), before = Date.now();
    assert.equal((await callback.GET(request(state))).status, 303);
    const after = Date.now(), { tokens, row } = await saved();
    assert.ok(tokens.expires >= before + expected * 1000 && tokens.expires <= after + expected * 1000);
    assert.equal(new Date(row.expires_at).getTime(), tokens.expires);
    assert.equal(counts().debug, 0);
    noSecrets(logs.join("\n"), [state]);
  }
}));

test("Explicit verified zero deadlines persist as no expiration and remain usable through Facebook APIs and the real collector", async () => environment(async ({ pg, logs, api, callback, meta, start, request, actionRequest, saved, debug }) => {
  const { collectFacebook } = await import("../lib/content-reports/facebook-collector.ts");
  for (const expires of [0, "0"]) {
    debug({ is_valid: true, type: "USER", app_id: "123456789", user_id: "999", expires_at: expires, data_access_expires_at: expires });
    const state = await start();
    assert.equal((await callback.GET(request(state))).status, 303);
    const { row, tokens } = await saved();
    assert.equal(tokens.expires, null);
    assert.equal(tokens.noExpiration, true);
    assert.equal(row.expires_at, null);
    const info = await (await api.GET(actionRequest())).json();
    assert.equal(info.connected, true);
    assert.equal(info.status, "connected");
    assert.equal(info.expiresAt, null);
    assert.equal((await api.POST(actionRequest("sync"))).status, 200);
    const collected = await collectFacebook({ companyId: "A", platform: "Facebook", startDate: "2026-09-01", endDate: "2026-09-30", mode: "production" });
    assert.equal(collected.accountId, "Facebook:111");
    assert.equal(collected.publications.length, 1);
    assert.equal(collected.publications[0].metrics.views, 12);
    noSecrets(logs.join("\n"), [state]);
  }
  // The same nullable timestamp with no verified marker must not grant access.
  const latest = (await saved()).tokens;
  await pg.query("UPDATE focus_meta_connections SET tokens=$1,expires_at=NULL WHERE company='A'", [meta.seal({ ...latest, noExpiration: false }, "A")]);
  assert.equal((await (await api.GET(actionRequest())).json()).connected, false);
  assert.equal((await api.POST(actionRequest("sync"))).status, 502);
  await assert.rejects(collectFacebook({ companyId: "A", platform: "Facebook", startDate: "2026-09-01", endDate: "2026-09-30", mode: "production" }), error => error.status === 409);
}));
