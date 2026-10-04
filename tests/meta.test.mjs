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
  Object.assign(process.env, { DATABASE_URL: "postgres://test", PANEL_USER: "owner", PANEL_PASSWORD: "test-password-long-enough", META_APP_ID: "1125078953647694", META_APP_SECRET: "private-secret", META_REDIRECT_URI: "https://example.test/api/meta/callback", META_GRAPH_VERSION: "v24.0" });
  const pg = new PGlite();
  const query = (sql, params) => sql.includes("pg_advisory") ? { rows: [] } : pg.query(sql, params);
  globalThis.focusPool = { query, connect: async () => ({ query, release() {} }) }; globalThis.focusSchema = undefined;
  globalThis.fetch = async url => {
    const path = new URL(url).pathname;
    if (path.endsWith("oauth/access_token")) return Response.json({ access_token: "private-token", expires_in: 3600 });
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
    assert.equal(new URL(start.url).searchParams.get("client_id"), "1125078953647694");
    assert.equal((await callback.GET(request(`/callback?state=${state}&code=code`, undefined, createSession()))).status, 400);
    assert.equal((await callback.GET(request(`/callback?state=${state}&code=code`))).status, 303);
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
  } finally { globalThis.fetch = oldFetch; process.env = env; globalThis.focusPool = undefined; globalThis.focusSchema = undefined; await pg.close(); }
});
