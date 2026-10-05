import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { PGlite } from "@electric-sql/pglite";

registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) return next(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.endsWith(".ts") && !/\.[a-z]+$/i.test(specifier)) return next(specifier + ".ts", context);
  return next(specifier, context);
} });

const privateValues = ["meta-secret-private", "meta-token-key-private", "old-user-private", "old-page-private", "EAAnewShortPrivateToken123456789", "EAAnewLongPrivateToken123456789", "EAAnewPagePrivateToken123456789", "private-code"];

function noSecrets(value, extra = []) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  for (const secret of [...privateValues, ...extra]) assert.equal(text.includes(secret), false, `diagnostics must redact ${secret}`);
}

async function environment(work) {
  const env = { ...process.env }, originalFetch = globalThis.fetch, originalInfo = console.info, originalError = console.error;
  const originalPool = globalThis.focusPool, originalSchema = globalThis.focusSchema;
  const pg = new PGlite(), logs = [];
  Object.assign(process.env, {
    DATABASE_URL: "postgres://test", PANEL_USER: "owner", PANEL_PASSWORD: "facebook-diagnostics-test-password-long-enough",
    META_APP_ID: "123456789", META_APP_SECRET: "meta-secret-private", META_TOKEN_KEY: "meta-token-key-private",
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
  let mode = "success", network = 0, exchanges = 0;
  globalThis.fetch = async (input, init = {}) => {
    network++;
    const url = new URL(input);
    assert.equal(url.hostname, "graph.facebook.com", "Facebook diagnostics must never query Instagram");
    if (url.pathname.endsWith("/oauth/access_token")) {
      exchanges++;
      const isLong = url.searchParams.get("grant_type") === "fb_exchange_token";
      const phase = isLong ? "long" : "code";
      if (mode === `${phase}-400` || mode === `${phase}-401`) return providerFailure(Number(mode.slice(-3)));
      if (!isLong) assert.equal(url.searchParams.get("redirect_uri"), process.env.META_REDIRECT_URI);
      return Response.json({ access_token: isLong ? "EAAnewLongPrivateToken123456789" : "EAAnewShortPrivateToken123456789", expires_in: 5184000 });
    }
    assert.equal(url.searchParams.has("access_token"), false);
    assert.equal(init.headers.Authorization, "Bearer EAAnewLongPrivateToken123456789");
    if (url.pathname.endsWith("/me/permissions")) {
      if (mode === "permissions-400" || mode === "permissions-401") return providerFailure(Number(mode.slice(-3)));
      const granted = mode === "missing-permissions" ? ["pages_show_list"] : ["pages_show_list", "pages_read_engagement", "read_insights"];
      return Response.json({ data: granted.map(permission => ({ permission, status: "granted" })) });
    }
    if (url.pathname.endsWith("/me/accounts")) {
      if (mode === "pages-400" || mode === "pages-401") return providerFailure(Number(mode.slice(-3)));
      if (mode === "malformed-json") return new Response("not valid JSON", { status: 200 });
      if (mode === "malformed-pages") return Response.json({ data: [{ id: "111", name: "Missing Page token" }] });
      if (mode === "multiple-pages") return Response.json({ data: [{ id: "222", name: "First Page", access_token: "EAAnewFirstPageToken123456789" }, { id: "111", name: "Authorized Page", access_token: "EAAnewPagePrivateToken123456789" }] });
      if (mode === "removed-pages") return Response.json({ data: [{ id: "222", name: "First Page", access_token: "EAAnewFirstPageToken123456789" }, { id: "333", name: "Second Page", access_token: "EAAnewSecondPageToken123456789" }] });
      if (mode === "numeric-page") return new Response('{"data":[{"id":900719925474099312345,"name":"Large numeric Page","access_token":"EAAnewPagePrivateToken123456789"}]}');
      return Response.json({ data: mode === "no-pages" ? [] : [{ id: "111", name: "Authorized Page", access_token: "EAAnewPagePrivateToken123456789" }] });
    }
    throw new Error(`Unexpected Meta diagnostic test endpoint: ${url.pathname}`);
  };
  function providerFailure(status) {
    return Response.json({ error: { type: "OAuthException", code: 190, error_subcode: 463, message: "Real provider explanation: EAAnewLongPrivateToken123456789 EAAnewShortPrivateToken123456789 meta-secret-private meta-token-key-private private-code https://graph.facebook.com/?access_token=EAAnewLongPrivateToken123456789" } }, { status });
  }
  try {
    const api = await import("../app/api/meta/route.ts");
    const callback = await import("../app/api/meta/callback/route.ts");
    const meta = await import("../lib/meta.ts");
    const { createSession } = await import("../lib/panel-auth.ts");
    const session = createSession();
    await meta.metaDb();
    const tokens = { access_token: "old-user-private", expires: Date.now() + 86400000, pages: [{ id: "111", name: "Selected Page", access_token: "old-page-private" }], permissions: ["pages_show_list", "pages_read_engagement"] };
    const snapshot = { capturedAt: "2026-10-01T17:00:00Z", selectedPage: "111", accounts: [{ facebook: { id: "111", name: "Selected Page", followers: 777, likes: 600 } }] };
    await pg.query("INSERT INTO focus_meta_connections(company,tokens,snapshot,external_id,permissions,expires_at,connected_at,status) VALUES('A',$1,$2::jsonb,'111',$3::jsonb,$4,now(),'connected')", [meta.seal(tokens, "A"), JSON.stringify(snapshot), JSON.stringify(tokens.permissions), new Date(tokens.expires)]);
    const original = (await pg.query("SELECT * FROM focus_meta_connections WHERE company='A'")).rows[0];
    await pg.exec("CREATE TABLE focus_instagram_connections(company TEXT PRIMARY KEY,tokens TEXT NOT NULL,snapshot JSONB); INSERT INTO focus_instagram_connections VALUES('A','instagram-row-preserved','{}');");
    const request = (state, parameters = {}, cookie = session) => new Request(`https://untrusted-request.example.test/api/meta/callback?${new URLSearchParams({ state, ...parameters })}`, { headers: { cookie: `focusmrk_session=${cookie}` } });
    const start = async () => {
      const response = await api.POST(new Request("https://untrusted-request.example.test/api/meta?company=A&reports=1", { method: "POST", headers: { cookie: `focusmrk_session=${session}`, "Content-Type": "application/json", "X-FocusMRK-Request": "1" }, body: JSON.stringify({ action: "connect" }) }));
      assert.equal(response.status, 200);
      const oauth = new URL((await response.json()).url), state = oauth.searchParams.get("state");
      assert.match(state, /^[a-f0-9]{64}$/);
      return state;
    };
    const unchanged = async () => {
      assert.deepEqual((await pg.query("SELECT * FROM focus_meta_connections WHERE company='A'")).rows[0], original);
      assert.equal((await pg.query("SELECT tokens FROM focus_instagram_connections WHERE company='A'")).rows[0].tokens, "instagram-row-preserved");
    };
    await work({ pg, logs, api, callback, meta, original, request, start, unchanged, createSession,
      mode: value => { mode = value; }, network: () => network, exchanges: () => exchanges });
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

function diagnostic(logs) {
  const prefix = "[meta_callback] ", line = logs.findLast(value => value.startsWith(prefix));
  assert.ok(line, "each callback must emit its safe diagnostic record");
  return JSON.parse(line.slice(prefix.length));
}

test("Facebook distinguishes no authorized Pages and missing permissions while preserving an existing connection", async () => environment(async ({ pg, logs, callback, meta, start, request, mode, unchanged }) => {
  for (const [failure, stage, type] of [["no-pages", "pages_validation", "no_pages"], ["missing-permissions", "permissions_validation", "missing_permissions"]]) {
    mode(failure);
    const state = await start();
    const response = await callback.GET(request(state, { code: "private-code" }));
    assert.equal(response.status, 403);
    const text = await response.text();
    assert.ok(text.includes(`Etapa: ${stage}`));
    assert.ok(text.includes(type));
    assert.ok(text.includes("Meta HTTP 200"), "provider success and local access rejection must remain distinguishable");
    noSecrets(text, [state]);
    const result = diagnostic(logs);
    assert.equal(result.meta_callback_received, true);
    assert.equal(result.code_present, true);
    assert.equal(result.state_present, true);
    assert.equal(result.state_valid, true);
    assert.equal(result.stage, stage);
    assert.equal(result.meta_error_type, type);
    assert.equal(result.http_status, 200);
    assert.equal(result.token_exchange_status, 200);
    assert.equal(result.redirect_uri, process.env.META_REDIRECT_URI);
    if (failure === "no-pages") {
      assert.equal(result.raw_pages_count, 0);
      assert.equal(result.usable_pages_count, 0);
    }
    noSecrets(logs.join("\n"), [state]);
    await unchanged();
    assert.equal((await pg.query("SELECT count(*) AS count FROM focus_meta_states WHERE id=$1", [meta.digest(state)])).rows[0].count, 0);
    assert.equal((await callback.GET(request(state, { code: "private-code" }))).status, 400);
  }
}));

test("Facebook exposes safe real HTTP 400 and 401 Graph errors with the exact exchange or lookup stage", async () => environment(async ({ logs, callback, start, request, mode, unchanged }) => {
  const cases = [["code-400", "code_token_exchange", 400], ["long-401", "long_lived_token_exchange", 401], ["permissions-400", "permissions_request", 400], ["permissions-401", "permissions_request", 401], ["pages-400", "pages_request", 400], ["pages-401", "pages_request", 401]];
  for (const [failure, stage, status] of cases) {
    mode(failure);
    const state = await start();
    const response = await callback.GET(request(state, { code: "private-code" }));
    assert.equal(response.status, status);
    const text = await response.text();
    assert.ok(text.includes(`Etapa: ${stage}`));
    assert.ok(text.includes(`Meta HTTP ${status}`));
    assert.ok(text.includes("OAuthException"));
    assert.ok(text.includes("190"));
    assert.ok(text.includes("Real provider explanation"));
    noSecrets(text, [state]);
    assert.equal(text.includes("https://graph.facebook.com"), false);
    const result = diagnostic(logs);
    assert.equal(result.stage, stage);
    assert.equal(result.state_valid, true);
    assert.equal(result.http_status, status);
    assert.equal(result.meta_error_type, "OAuthException");
    assert.equal(result.meta_error_code, 190);
    assert.equal(result.meta_error_subcode, 463);
    if (stage.endsWith("token_exchange")) assert.equal(result.token_exchange_status, status);
    else assert.equal(result.token_exchange_status, 200);
    noSecrets(logs.join("\n"), [state]);
    await unchanged();
  }
}));

test("Facebook callback guards reject malformed, unknown, expired and mismatched state before any provider request", async () => environment(async ({ pg, logs, callback, meta, start, request, createSession, network, unchanged }) => {
  for (const state of ["", "invalid", "f".repeat(64)]) {
    const response = await callback.GET(request(state, { code: "private-code" }));
    assert.equal(response.status, 400);
    assert.equal(response.headers.has("location"), false);
    const result = diagnostic(logs);
    assert.equal(result.state_valid, false);
    assert.ok(["state_format", "state_lookup"].includes(result.stage));
    noSecrets(await response.text(), /^[a-f0-9]{64}$/.test(state) ? [state] : []);
  }
  const state = await start();
  const wrong = await callback.GET(request(state, { code: "private-code" }, createSession()));
  assert.equal(wrong.status, 400);
  assert.equal(diagnostic(logs).meta_error_type, "state_expired_or_session_mismatch");
  assert.equal((await pg.query("SELECT count(*) AS count FROM focus_meta_states WHERE id=$1", [meta.digest(state)])).rows[0].count, 1);
  await pg.query("UPDATE focus_meta_states SET expires=now()-interval '1 second' WHERE id=$1", [meta.digest(state)]);
  assert.equal((await callback.GET(request(state, { code: "private-code" }))).status, 400);
  assert.equal(diagnostic(logs).stage, "state_lookup");
  assert.equal(network(), 0);
  const fresh = await start();
  const missingCode = await callback.GET(request(fresh));
  assert.equal(missingCode.status, 400);
  assert.equal(diagnostic(logs).stage, "code_validation");
  assert.equal(diagnostic(logs).meta_error_type, "code_missing");
  assert.equal(network(), 0);
  noSecrets(logs.join("\n"), [state, fresh]);
  await unchanged();
}));

test("Facebook cancellation consumes only OAuth state, keeps prior Page credentials and returns safely to Integrations", async () => environment(async ({ pg, logs, callback, meta, start, request, exchanges, unchanged }) => {
  const state = await start();
  const response = await callback.GET(request(state, { error: "access_denied", error_description: "Authorization cancelled", returnTo: "https://evil.example.test/steal" }));
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  const url = new URL(response.headers.get("location"));
  assert.equal(url.origin, "https://configured.example.test");
  assert.equal(url.pathname, "/");
  assert.equal(url.searchParams.get("module"), "integrations");
  assert.equal(url.searchParams.get("company"), "A");
  assert.equal(url.searchParams.get("meta"), "cancelled");
  assert.equal(exchanges(), 0);
  assert.equal(diagnostic(logs).stage, "cancelled");
  assert.equal((await pg.query("SELECT count(*) AS count FROM focus_meta_states WHERE id=$1", [meta.digest(state)])).rows[0].count, 0);
  await unchanged();
  assert.equal((await callback.GET(request(state, { code: "private-code" }))).status, 400);
  noSecrets(logs.join("\n"), [state]);
}));

test("Successful Facebook reauthorization replaces encrypted tokens but retains an authorized selected Page with a fresh safe snapshot", async () => environment(async ({ pg, logs, callback, meta, original, start, request }) => {
  const state = await start();
  const response = await callback.GET(request(state, { code: "private-code" }));
  assert.equal(response.status, 303);
  const url = new URL(response.headers.get("location"));
  assert.equal(url.origin, "https://configured.example.test");
  assert.equal(url.searchParams.get("meta"), "connected");
  const row = (await pg.query("SELECT * FROM focus_meta_connections WHERE company='A'")).rows[0];
  assert.equal(row.status, "connected");
  assert.equal(row.external_id, "111");
  assert.equal(row.snapshot.selectedPage, "111");
  assert.equal(row.snapshot.accounts[0].facebook.id, "111");
  assert.equal(row.snapshot.accounts[0].facebook.name, "Authorized Page");
  assert.equal(row.snapshot.accounts[0].facebook.followers, undefined, "old follower counters must not be stamped as freshly measured");
  assert.equal(row.snapshot.accounts[0].facebook.likes, undefined);
  assert.notEqual(row.tokens, original.tokens);
  assert.equal(meta.unseal(row.tokens, "A").access_token, "EAAnewLongPrivateToken123456789");
  assert.ok(row.permissions.includes("read_insights"));
  noSecrets(row.snapshot);
  assert.equal((await pg.query("SELECT tokens FROM focus_instagram_connections WHERE company='A'")).rows[0].tokens, "instagram-row-preserved");
  const result = diagnostic(logs);
  assert.equal(result.state_valid, true);
  assert.equal(result.raw_pages_count, 1);
  assert.equal(result.usable_pages_count, 1);
  assert.equal(result.meta_error_type, "");
  noSecrets(logs.join("\n"), [state]);
}));

test("Malformed HTTP 200 Page responses are not misreported as missing authorization and never overwrite prior credentials", async () => environment(async ({ logs, callback, start, request, mode, unchanged }) => {
  for (const [failure, stage, type] of [["malformed-pages", "pages_validation", "page_response_invalid"], ["malformed-json", "pages_request", "invalid_response"]]) {
    mode(failure);
    const state = await start();
    const response = await callback.GET(request(state, { code: "private-code" }));
    assert.equal(response.status, 502);
    const text = await response.text();
    assert.ok(text.includes(`Etapa: ${stage}`));
    assert.ok(text.includes(type));
    assert.ok(text.includes("Meta HTTP 200"));
    assert.equal(diagnostic(logs).http_status, 200);
    assert.equal(diagnostic(logs).meta_error_type, type);
    if (failure === "malformed-pages") {
      assert.equal(diagnostic(logs).raw_pages_count, 1);
      assert.equal(diagnostic(logs).usable_pages_count, 0);
    }
    noSecrets(text, [state]);
    await unchanged();
  }
}));

test("Facebook reauthorization retains an authorized prior selection beyond the first Page and clears a selection excluded by the fresh grant", async () => environment(async ({ pg, logs, callback, meta, start, request, mode }) => {
  mode("multiple-pages");
  const retainedState = await start();
  assert.equal((await callback.GET(request(retainedState, { code: "private-code" }))).status, 303);
  const retained = (await pg.query("SELECT * FROM focus_meta_connections WHERE company='A'")).rows[0];
  assert.equal(retained.external_id, "111");
  assert.equal(retained.snapshot.selectedPage, "111");
  assert.deepEqual(retained.snapshot.accounts.map(item => item.facebook.id), ["222", "111"]);
  assert.equal(meta.unseal(retained.tokens, "A").pages.find(page => page.id === "111").access_token, "EAAnewPagePrivateToken123456789");
  assert.equal(diagnostic(logs).raw_pages_count, 2);
  assert.equal(diagnostic(logs).usable_pages_count, 2);
  mode("removed-pages");
  const removedState = await start();
  assert.equal((await callback.GET(request(removedState, { code: "private-code" }))).status, 303);
  const removed = (await pg.query("SELECT * FROM focus_meta_connections WHERE company='A'")).rows[0];
  assert.equal(removed.external_id, null);
  assert.equal(removed.snapshot.selectedPage, null);
  assert.deepEqual(removed.snapshot.accounts.map(item => item.facebook.id), ["222", "333"]);
  const tokens = meta.unseal(removed.tokens, "A");
  assert.equal(tokens.pages.some(page => page.id === "111" || page.access_token === "old-page-private"), false);
  assert.equal(tokens.access_token, "EAAnewLongPrivateToken123456789");
  assert.equal(removed.status, "connected");
  noSecrets(removed.snapshot, ["EAAnewFirstPageToken123456789", "EAAnewSecondPageToken123456789"]);
  noSecrets(logs.join("\n"), [retainedState, removedState, "EAAnewFirstPageToken123456789", "EAAnewSecondPageToken123456789"]);
}));

test("Facebook callbacks preserve every digit of a numeric Page identifier beyond JavaScript integer precision", async () => environment(async ({ pg, logs, callback, meta, start, request, mode }) => {
  mode("numeric-page");
  const state = await start();
  assert.equal((await callback.GET(request(state, { code: "private-code" }))).status, 303);
  const row = (await pg.query("SELECT * FROM focus_meta_connections WHERE company='A'")).rows[0];
  const expected = "900719925474099312345";
  assert.equal(row.external_id, expected);
  assert.equal(row.snapshot.selectedPage, expected);
  assert.equal(row.snapshot.accounts[0].facebook.id, expected);
  assert.equal(meta.unseal(row.tokens, "A").pages[0].id, expected);
  noSecrets(logs.join("\n"), [state]);
}));

test("A callback configured with URL credentials fails before exchange without leaking those credentials in diagnostic logs", async () => environment(async ({ logs, callback, start, request, network, unchanged }) => {
  const state = await start();
  process.env.META_REDIRECT_URI = "https://redirect-user-private:redirect-password-private@configured.example.test/api/meta/callback";
  const response = await callback.GET(request(state, { code: "private-code" }));
  assert.equal(response.status, 502);
  assert.equal(response.headers.has("location"), false);
  const text = await response.text();
  assert.ok(text.includes("Etapa: settings"));
  assert.equal(diagnostic(logs).stage, "settings");
  assert.equal(diagnostic(logs).redirect_uri, "");
  noSecrets(text, [state, "redirect-user-private", "redirect-password-private"]);
  noSecrets(logs.join("\n"), [state, "redirect-user-private", "redirect-password-private"]);
  assert.equal(network(), 0);
  await unchanged();
}));
