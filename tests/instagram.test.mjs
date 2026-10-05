import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { registerHooks } from "node:module";
import { PGlite } from "@electric-sql/pglite";
registerHooks({ resolve(s, c, next) {
  if (s.startsWith("@/lib/")) return next(new URL(`../lib/${s.slice(6)}.ts`, import.meta.url).href, c);
  if (s === "@/app/api/instagram/route") return next(new URL("../app/api/instagram/route.ts", import.meta.url).href, c);
  if (/\/lib\/(instagram|meta|tiktok).ts$/.test(c.parentURL || "") && /^\.\/[a-z-]+$/.test(s)) return next(s + ".ts", c);
  return next(s, c);
} });

test("direct Instagram OAuth isolates providers, companies, sessions and encrypted tokens", async () => {
  const env = { ...process.env }, oldFetch = globalThis.fetch;
  Object.assign(process.env, { DATABASE_URL: "postgres://test", PANEL_USER: "owner", PANEL_PASSWORD: "test-password-long-enough", INSTAGRAM_APP_ID: "456", INSTAGRAM_APP_SECRET: "ig-secret", INSTAGRAM_REDIRECT_URI: "https://focusmrkt.tgxlabs.io/api/instagram/callback", INSTAGRAM_GRAPH_VERSION: "v24.0" });
  const pg = new PGlite(), query = (sql, params) => sql.includes("pg_advisory") ? { rows: [] } : pg.query(sql, params);
  globalThis.focusPool = { query, connect: async () => ({ query, release() {} }) }; globalThis.focusSchema = undefined;
  let exchanges = 0, refreshes = 0, rejectProfile = false;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(input);
    assert.ok(["api.instagram.com", "graph.instagram.com"].includes(url.hostname), "no Facebook endpoint or Page token permitted");
    if (url.hostname === "api.instagram.com") {
      assert.equal(init.method, "POST"); assert.equal(init.body.get("client_id"), "456"); assert.equal(init.body.get("client_secret"), "ig-secret");
      assert.equal(init.body.get("redirect_uri"), process.env.INSTAGRAM_REDIRECT_URI);
      exchanges++; return Response.json({ data: [{ access_token: "ig-short-token", user_id: "999", permissions: "instagram_business_basic" }] });
    }
    if (url.pathname === "/access_token") return Response.json({ access_token: "ig-private-token", expires_in: 5184000 });
    if (url.pathname === "/refresh_access_token") { refreshes++; return Response.json({ access_token: "ig-refreshed-token", expires_in: 5184000 }); }
    assert.ok(init.headers.Authorization.startsWith("Bearer ig-"));
    if (rejectProfile) return Response.json({ error: { message: "must never leak ig-private-token or ig-secret" } }, { status: 400 });
    return Response.json({ user_id: "999", username: "professional", access_token: "should-not-be-forwarded" });
  };
  try {
    const api = await import("../app/api/instagram/route.ts"), connect = await import("../app/api/instagram/connect/route.ts"), callback = await import("../app/api/instagram/callback/route.ts"), lib = await import("../lib/instagram.ts"), facebook = await import("../lib/meta.ts");
    const { createSession } = await import("../lib/panel-auth.ts"), session = createSession();
    const request = (company = "A", action, cookie = session, query = "") => new Request(`https://example.test/api/instagram${query ? "/callback?" + query : "?company=" + company}`, { method: action ? "POST" : "GET", headers: { cookie: `focusmrk_session=${cookie}`, "X-FocusMRK-Request": "1", "Content-Type": "application/json" }, body: action ? JSON.stringify({ action }) : undefined });
    assert.equal((await api.GET(request("A", undefined, "bad"))).status, 401);
    const connectRequest = (company = "A", cookie = session, secureHeaders = true) => new Request(`https://example.test/api/instagram/connect?company=${company}`, { method: "POST", headers: { cookie: `focusmrk_session=${cookie}`, ...(secureHeaders ? { "X-FocusMRK-Request": "1" } : {}) } });
    assert.equal((await connect.POST(connectRequest("A", "bad"))).status, 401);
    assert.equal((await connect.POST(connectRequest("A", session, false))).status, 403);
    assert.equal((await api.POST(new Request("https://example.test/api/instagram?company=A", { method: "POST", headers: { cookie: `focusmrk_session=${session}` }, body: JSON.stringify({ action: "connect" }) }))).status, 403);
    await facebook.metaDb();
    await pg.query("INSERT INTO focus_meta_connections(company,tokens) VALUES('A','facebook-row-preserved')");
    const start = await (await connect.POST(connectRequest())).json(), url = new URL(start.url), state = url.searchParams.get("state");
    assert.equal(url.origin, "https://www.instagram.com"); assert.equal(url.searchParams.get("client_id"), "456");
    assert.equal(url.searchParams.get("enable_fb_login"), "0"); assert.equal(url.searchParams.get("scope"), "instagram_business_basic");
    assert.equal(url.searchParams.get("redirect_uri"), process.env.INSTAGRAM_REDIRECT_URI);
    assert.equal((await callback.GET(request("A", undefined, createSession(), `state=${state}&code=code`))).status, 400);
    const response = await callback.GET(request("A", undefined, session, `state=${state}&code=code`));
    assert.equal(response.status, 303); assert.equal(new URL(response.headers.get("location")).searchParams.get("module"), "integrations");
    assert.equal((await callback.GET(request("A", undefined, session, `state=${state}&code=code`))).status, 400);
    const row = (await pg.query("SELECT * FROM focus_instagram_connections WHERE company='A'")).rows[0];
    assert.equal(row.external_id, "999"); assert.deepEqual(row.permissions, ["instagram_business_basic"]); assert.ok(row.connected_at); assert.ok(row.expires_at);
    assert.ok(!row.tokens.includes("ig-private-token")); assert.throws(() => lib.unseal(row.tokens, "B"));
    const publicData = await (await api.GET(request())).json();
    assert.equal(publicData.snapshot.instagram.username, "professional");
    assert.ok(!JSON.stringify(publicData).includes("token")); assert.ok(!JSON.stringify(publicData).includes("ig-secret"));
    assert.equal((await (await api.GET(request("B"))).json()).connected, false);
    const tokens = lib.unseal(row.tokens, "A"); tokens.issued = Date.now() - 2 * 86400000; tokens.expires = Date.now() + 86400000;
    await pg.query("UPDATE focus_instagram_connections SET tokens=$1 WHERE company='A'", [lib.seal(tokens, "A")]);
    assert.equal((await api.POST(request("A", "sync"))).status, 200); assert.equal(refreshes, 1);
    assert.equal((await api.POST(request("A", "sync"))).status, 200); assert.equal(refreshes, 1);
    rejectProfile = true;
    const rejected = await (await api.POST(request("A", "sync"))).json(); assert.ok(!JSON.stringify(rejected).includes("ig-private-token")); assert.ok(!JSON.stringify(rejected).includes("ig-secret"));
    rejectProfile = false;
    tokens.expires = 0;
    await pg.query("UPDATE focus_instagram_connections SET tokens=$1,expires_at=$2 WHERE company='A'", [lib.seal(tokens, "A"), new Date(0)]);
    assert.equal((await (await api.GET(request())).json()).status, "expired"); assert.equal((await api.POST(request("A", "sync"))).status, 502);

    // Real session lookup and company assignments, not a stubbed authorize function.
    await pg.query("CREATE TABLE focus_accounts(id TEXT PRIMARY KEY,login TEXT,display_name TEXT,enabled BOOLEAN)");
    await pg.query("CREATE TABLE focus_account_companies(account_id TEXT,company TEXT)");
    await pg.query("CREATE TABLE focus_account_sessions(token_hash TEXT,account_id TEXT,expires_at TIMESTAMPTZ)");
    await pg.query("INSERT INTO focus_accounts VALUES('manager','manager','Manager',true)");
    await pg.query("INSERT INTO focus_account_companies VALUES('manager','A')");
    const manager = "account_" + "a".repeat(64), hash = createHash("sha256").update(manager).digest("hex");
    await pg.query("INSERT INTO focus_account_sessions VALUES($1,'manager',now()+interval '1 hour')", [hash]);
    assert.equal((await api.GET(request("A", undefined, manager))).status, 200);
    assert.equal((await api.GET(request("B", undefined, manager))).status, 403);
    assert.equal((await api.POST(request("B", "connect", manager))).status, 403);
    assert.equal((await api.POST(request("B", "disconnect", manager))).status, 403);
    assert.equal((await connect.POST(connectRequest("B", manager))).status, 403);
    assert.equal((await connect.POST(connectRequest("A", manager))).status, 200);
    const facebookApi = await import("../app/api/meta/route.ts");
    const otherCompany = new Request("https://example.test/api/meta?company=B", { headers: { cookie: `focusmrk_session=${manager}` } });
    assert.equal((await facebookApi.GET(otherCompany)).status, 403);
    const otherDisconnect = new Request("https://example.test/api/meta?company=B", { method: "POST", headers: { cookie: `focusmrk_session=${manager}`, "X-FocusMRK-Request": "1", "Content-Type": "application/json" }, body: JSON.stringify({ action: "disconnect" }) });
    assert.equal((await facebookApi.POST(otherDisconnect)).status, 403);
    const pending = await (await api.POST(request("A", "connect", manager))).json();
    const pendingState = new URL(pending.url).searchParams.get("state");
    await pg.query("DELETE FROM focus_account_companies WHERE account_id='manager'");
    assert.equal((await callback.GET(request("A", undefined, manager, `state=${pendingState}&code=code`))).status, 403);
    assert.equal(exchanges, 1);
    assert.equal((await api.POST(request("A", "disconnect"))).status, 200);
    assert.equal((await pg.query("SELECT tokens FROM focus_meta_connections WHERE company='A'")).rows[0].tokens, "facebook-row-preserved");
    const cancelled = await (await api.POST(request("A", "connect"))).json(), cancelledState = new URL(cancelled.url).searchParams.get("state");
    assert.equal((await callback.GET(request("A", undefined, session, `state=${cancelledState}&error=access_denied`))).status, 303);
    assert.equal(exchanges, 1); assert.equal((await (await api.GET(request())).json()).connected, false);
    const expired = await (await api.POST(request("A", "connect"))).json(), expiredState = new URL(expired.url).searchParams.get("state");
    await pg.query("UPDATE focus_instagram_states SET expires=now()-interval '1 second'");
    assert.equal((await callback.GET(request("A", undefined, session, `state=${expiredState}&code=code`))).status, 400);
    const beforeDisconnect = await (await api.POST(request("A", "connect"))).json();
    const removedState = new URL(beforeDisconnect.url).searchParams.get("state");
    assert.equal((await api.POST(request("A", "disconnect"))).status, 200);
    assert.equal((await callback.GET(request("A", undefined, session, `state=${removedState}&code=code`))).status, 400);
    assert.equal(exchanges, 1, "a disconnected pending authorization must not reconnect");
    // Preserve real provider errors and status without exposing OAuth credentials.
    const oldInfo = console.info, logs = [];
    console.info = (...args) => logs.push(args.join(" "));
    try {
      for (const status of [400, 401]) {
        const retry = await (await connect.POST(connectRequest())).json(), retryState = new URL(retry.url).searchParams.get("state");
        globalThis.fetch = async () => Response.json({ error_type: "OAuthException", error_message: "Invalid code: private-code; secret ig-secret" }, { status });
        const failed = await callback.GET(request("A", undefined, session, `state=${retryState}&code=private-code`));
        assert.equal(failed.status, status);
        const text = await failed.text();
        assert.match(text, /code_token_exchange/); assert.match(text, /OAuthException/); assert.match(text, /Invalid code/);
        assert.ok(!text.includes("private-code")); assert.ok(!text.includes("ig-secret"));
        const diagnostic = JSON.parse(logs.findLast(line => line.startsWith("[instagram_callback]")).slice("[instagram_callback] ".length));
        assert.equal(diagnostic.code_present, true); assert.equal(diagnostic.state_present, true); assert.equal(diagnostic.state_valid, true);
        assert.equal(diagnostic.token_exchange_status, status); assert.equal(diagnostic.redirect_uri, process.env.INSTAGRAM_REDIRECT_URI);
        assert.ok(!logs.join(" ").includes("private-code")); assert.ok(!logs.join(" ").includes("ig-secret")); assert.ok(!logs.join(" ").includes(retryState));
      }
      // A Graph failure after the short token must identify the second exchange.
      const retry = await (await connect.POST(connectRequest())).json(), retryState = new URL(retry.url).searchParams.get("state");
      globalThis.fetch = async input => new URL(input).hostname === "api.instagram.com"
        ? Response.json({ access_token: "ig-short-token", user_id: "999" })
        : Response.json({ error: { type: "OAuthException", message: "Invalid token ig-short-token", code: 190 } }, { status: 400 });
      const failed = await callback.GET(request("A", undefined, session, `state=${retryState}&code=private-code`));
      assert.match(await failed.text(), /long_lived_token_exchange/);
      assert.ok(!logs.join(" ").includes("ig-short-token"));
      for (const [profile, expectedType] of [
        [{ user_id: "888", username: "professional" }, "profile_id_mismatch"],
        [{ user_id: "999" }, "profile_username_missing"],
        [{ username: "professional" }, "profile_id_missing"],
      ]) {
        const start = await (await connect.POST(connectRequest())).json(), state = new URL(start.url).searchParams.get("state");
        globalThis.fetch = async input => {
          const url = new URL(input);
          if (url.hostname === "api.instagram.com") return Response.json({ access_token: "ig-short-token", user_id: "999" });
          if (url.pathname === "/access_token") return Response.json({ access_token: "ig-private-token", expires_in: 5184000 });
          return Response.json(profile);
        };
        const response = await callback.GET(request("A", undefined, session, `state=${state}&code=private-code`));
        const text = await response.text();
        assert.match(text, /profile_validation/); assert.ok(text.includes(expectedType)); assert.ok(!text.includes("Fallo interno"));
        const diagnostic = JSON.parse(logs.findLast(line => line.startsWith("[instagram_callback]")).slice("[instagram_callback] ".length));
        assert.equal(diagnostic.token_exchange_status, 200); assert.equal(diagnostic.state_valid, true);
        assert.ok(!logs.join(" ").includes("ig-private-token"));
      }
    } finally { console.info = oldInfo; }
    process.env.INSTAGRAM_REDIRECT_URI = "https://focusmrkt.tgxlabs.io/api/meta/callback"; assert.throws(lib.settings, /INSTAGRAM_REDIRECT_URI/);
  } finally { globalThis.fetch = oldFetch; process.env = env; globalThis.focusPool = undefined; globalThis.focusSchema = undefined; await pg.close(); }
});
