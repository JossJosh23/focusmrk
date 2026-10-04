import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { PGlite } from "@electric-sql/pglite";
registerHooks({ resolve(s, c, next) {
  if (s.startsWith("@/lib/")) return next(new URL(`../lib/${s.slice(6)}.ts`, import.meta.url).href, c);
  if (/\/lib\/(meta|tiktok).ts$/.test(c.parentURL || "") && s.startsWith("./")) return next(s + ".ts", c);
  return next(s, c);
} });
test("Meta OAuth protects sessions, tokens and company connections", async () => {
  const env = { ...process.env }, oldFetch = globalThis.fetch;
  Object.assign(process.env, { DATABASE_URL: "postgres://test", PANEL_USER: "owner", PANEL_PASSWORD: "test-password-long-enough", META_APP_ID: "123456789", META_APP_SECRET: "private-secret", META_REDIRECT_URI: "https://focusmrkt.tgxlabs.io/api/meta/callback", META_GRAPH_VERSION: "v24.0" });
  const exchanges = [];
  const pg = new PGlite();
  const query = (sql, params) => sql.includes("pg_advisory") ? { rows: [] } : pg.query(sql, params);
  globalThis.focusPool = { query, connect: async () => ({ query, release() {} }) }; globalThis.focusSchema = undefined;
  globalThis.fetch = async url => {
    const path = new URL(url).pathname;
    if (path.endsWith("oauth/access_token")) { exchanges.push(new URL(url)); return Response.json({ access_token: "private-token", expires_in: 3600 }); }
    if (path.endsWith("me/permissions")) return Response.json({ data: ["pages_show_list", "pages_read_engagement", "instagram_basic"].map(permission => ({ permission, status: "granted" })) });
    if (path.endsWith("me/accounts")) return Response.json({ data: [{ id: "page", name: "Página", access_token: "private-page-token", instagram_business_account: { id: "ig" } }] });
    if (path.endsWith("/page")) return Response.json({ id: "page", name: "Página", followers_count: 45, fan_count: 30 });
    return Response.json({ id: "ig", username: "cuenta", followers_count: 90, media_count: 10 });
  };
  try {
    const api = await import("../app/api/meta/route.ts"), callback = await import("../app/api/meta/callback/route.ts"), lib = await import("../lib/meta.ts");
    const { createSession } = await import("../lib/panel-auth.ts"), session = createSession();
    const request = (path = "?company=A", action, cookie = session) => new Request(`https://example.test/api/meta${path}`, { method: action ? "POST" : "GET", headers: { cookie: `focusmrk_session=${cookie}`, "X-FocusMRK-Request": "1", "Content-Type": "application/json" }, body: action ? JSON.stringify({ action }) : undefined });
    assert.equal((await api.GET(request("?company=A", undefined, "bad"))).status, 401);
    assert.equal((await api.POST(new Request("https://example.test/api/meta?company=A", { method: "POST", headers: { cookie: `focusmrk_session=${session}` }, body: JSON.stringify({ action: "connect" }) }))).status, 403);
    const start = await (await api.POST(request("?company=A", "connect"))).json(), state = new URL(start.url).searchParams.get("state");
    const dialog = new URL(start.url);
    assert.equal(dialog.origin, "https://www.facebook.com");
    assert.equal(dialog.searchParams.get("client_id"), "123456789");
    assert.equal(dialog.searchParams.get("redirect_uri"), "https://focusmrkt.tgxlabs.io/api/meta/callback");
    assert.equal(dialog.searchParams.get("response_type"), "code");
    assert.deepEqual(dialog.searchParams.get("scope").split(","), lib.scopes);
    assert.ok(!start.url.includes("private-secret"));
    assert.equal((await callback.GET(request(`/callback?state=${state}&code=code`, undefined, createSession()))).status, 400);
    const returned = await callback.GET(request(`/callback?state=${state}&code=code`));
    assert.equal(returned.status, 303);
    assert.equal(returned.headers.get("location"), "https://focusmrkt.tgxlabs.io/?module=company&company=A&meta=connected");
    assert.equal(exchanges[0].searchParams.get("redirect_uri"), dialog.searchParams.get("redirect_uri"));
    assert.equal((await callback.GET(request(`/callback?state=${state}&code=code`))).status, 400);
    const stored = (await pg.query("SELECT tokens FROM focus_meta_connections")).rows[0].tokens;
    assert.ok(!stored.includes("private-token")); assert.throws(() => lib.unseal(stored, "B"));
    assert.equal((await (await api.GET(request("?company=B"))).json()).connected, false);
    const result = await (await api.POST(request("?company=A", "sync"))).json();
    assert.equal(result.snapshot.accounts[0].instagram.followers, 90);
    assert.equal(result.snapshot.selectedPage, "page");
    assert.ok(!JSON.stringify(result).includes("private-token")); assert.ok(!JSON.stringify(result).includes("private-page-token"));
    const tokens = lib.unseal(stored, "A"); tokens.expires = 0;
    await pg.query("UPDATE focus_meta_connections SET tokens=$1", [lib.seal(tokens, "A")]);
    assert.equal((await api.POST(request("?company=A", "sync"))).status, 502);
    assert.equal((await api.POST(request("?company=A", "disconnect"))).status, 200);
    assert.equal((await (await api.GET(request())).json()).connected, false);
    const cancelledStart = await (await api.POST(request("?company=A", "connect"))).json();
    const cancelledState = new URL(cancelledStart.url).searchParams.get("state");
    const cancelled = await callback.GET(request(`/callback?state=${cancelledState}&error=access_denied`));
    assert.equal(cancelled.status, 303);
    assert.equal(new URL(cancelled.headers.get("location")).searchParams.get("meta"), "cancelled");
    assert.equal(exchanges.length, 2, "cancellation must not exchange tokens");
    assert.equal((await (await api.GET(request())).json()).connected, false);
    assert.equal((await callback.GET(request(`/callback?state=${cancelledState}&code=code`))).status, 400);
    const expiredStart = await (await api.POST(request("?company=A", "connect"))).json();
    const expiredState = new URL(expiredStart.url).searchParams.get("state");
    await pg.query("UPDATE focus_meta_states SET expires=now()-interval '1 second'");
    assert.equal((await callback.GET(request(`/callback?state=${expiredState}&code=code`))).status, 400);
  } finally { globalThis.fetch = oldFetch; process.env = env; globalThis.focusPool = undefined; globalThis.focusSchema = undefined; await pg.close(); }
});

test("Meta settings reject incorrect callback routes and missing credentials", async () => {
  const env = { ...process.env };
  Object.assign(process.env, { META_APP_ID: "123456789", META_APP_SECRET: "test-secret", META_REDIRECT_URI: "https://focusmrkt.tgxlabs.io/api/meta/callback", META_GRAPH_VERSION: "v24.0" });
  try {
    const { settings } = await import("../lib/meta.ts");
    assert.equal(settings().redirect, "https://focusmrkt.tgxlabs.io/api/meta/callback");
    for (const redirect of ["https://focusmrkt.tgxlabs.io/api/auth/callback/facebook", "https://focusmrkt.tgxlabs.io/api/meta/callback/", "http://focusmrkt.tgxlabs.io/api/meta/callback", "https://focusmrkt.tgxlabs.io/api/meta/callback?extra=1", "https://focusmrkt.tgxlabs.io/api/meta/callback#extra"]) {
      process.env.META_REDIRECT_URI = redirect;
      assert.throws(settings, /META_REDIRECT_URI/);
    }
    process.env.META_REDIRECT_URI = env.META_REDIRECT_URI || "https://focusmrkt.tgxlabs.io/api/meta/callback";
    delete process.env.META_APP_SECRET;
    assert.throws(settings, /META_APP_SECRET/);
  } finally { process.env = env; }
});
