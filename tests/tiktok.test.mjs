import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { PGlite } from "@electric-sql/pglite";
registerHooks({ resolve(s, c, next) {
  if (s.startsWith("@/lib/")) return next(new URL(`../lib/${s.slice(6)}.ts`, import.meta.url).href, c);
  if (/\/lib\/tiktok.ts$/.test(c.parentURL || "") && s.startsWith("./")) return next(s + ".ts", c);
  return next(s, c);
} });

test("TikTok binds OAuth to session and company, encrypts tokens, refreshes and deletes snapshots", async () => {
  const env = { ...process.env }, oldFetch = globalThis.fetch;
  Object.assign(process.env, { DATABASE_URL: "postgres://test", PANEL_USER: "owner", PANEL_PASSWORD: "test-password-long-enough", TIKTOK_CLIENT_KEY: "key", TIKTOK_CLIENT_SECRET: "secret", TIKTOK_REDIRECT_URI: "https://example.test/api/tiktok/callback" });
  const pg = new PGlite();
  const query = async (sql, params) => sql.includes("pg_advisory") ? { rows: [] } : pg.query(sql, params);
  globalThis.focusPool = { query, connect: async () => ({ query, release() {} }) }; globalThis.focusSchema = undefined;
  let refreshes = 0;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes("oauth/token")) { if (init.body.get("grant_type") === "refresh_token") refreshes++;
      return Response.json({ access_token: "access-secret", refresh_token: "refresh-secret", open_id: "user", scope: "user.info.basic,user.info.stats,video.list", expires_in: 3600, refresh_expires_in: 86400 }); }
    if (String(url).includes("oauth/revoke")) return Response.json({});
    return Response.json({ error: { code: "ok" }, data: String(url).includes("user/info") ? { user: { display_name: "Cuenta", follower_count: 100 } } : { videos: [{ id: "video", title: "Video", view_count: 50 }], has_more: true } });
  };
  try {
    const api = await import("../app/api/tiktok/route.ts"), callback = await import("../app/api/tiktok/callback/route.ts");
    const lib = await import("../lib/tiktok.ts"), { createSession } = await import("../lib/panel-auth.ts");
    const session = createSession();
    const request = (path = "?company=A", action, cookie = session) => new Request(`https://example.test/api/tiktok${path}`, { method: action ? "POST" : "GET", headers: { cookie: `focusmrk_session=${cookie}`, "X-FocusMRK-Request": "1", "Content-Type": "application/json" }, body: action ? JSON.stringify({ action }) : undefined });
    assert.equal((await api.GET(request("?company=A", undefined, "bad"))).status, 401);
    const deniedCSRF = new Request("https://example.test/api/tiktok?company=A", { method: "POST", headers: { cookie: `focusmrk_session=${session}` }, body: JSON.stringify({ action: "connect" }) });
    assert.equal((await api.POST(deniedCSRF)).status, 403);
    const start = await (await api.POST(request("?company=A", "connect"))).json();
    const state = new URL(start.url).searchParams.get("state");
    assert.equal((await callback.GET(request(`/callback?state=${state}&code=code`, undefined, createSession()))).status, 400);
    assert.equal((await callback.GET(request(`/callback?state=${state}&code=code`))).status, 303);
    assert.equal((await callback.GET(request(`/callback?state=${state}&code=code`))).status, 400);
    const stored = (await pg.query("SELECT tokens FROM focus_tiktok_connections")).rows[0].tokens;
    assert.equal(stored.includes("access-secret"), false);
    assert.throws(() => lib.unseal(stored, "B"));
    assert.equal((await (await api.GET(request("?company=B"))).json()).connected, false);
    const tokens = lib.unseal(stored, "A"); tokens.expires = 0;
    await pg.query("UPDATE focus_tiktok_connections SET tokens=$1", [lib.seal(tokens, "A")]);
    const synced = await (await api.POST(request("?company=A", "sync"))).json();
    assert.equal(refreshes, 1); assert.equal(synced.snapshot.user.follower_count, 100); assert.equal(synced.snapshot.hasMore, true);
    assert.equal(JSON.stringify(synced).includes("access-secret"), false);
    assert.equal((await pg.query("SELECT * FROM focus_tiktok_snapshots")).rows.length, 1);
    assert.equal((await api.POST(request("?company=A", "disconnect"))).status, 200);
    assert.equal((await pg.query("SELECT * FROM focus_tiktok_snapshots")).rows.length, 0);
    assert.equal((await (await api.GET(request())).json()).connected, false);
    const again = await (await api.POST(request("?company=A", "connect"))).json();
    const stale = new URL(again.url).searchParams.get("state");
    await pg.query("UPDATE focus_tiktok_states SET expires=now()-interval '1 hour'");
    assert.equal((await callback.GET(request(`/callback?state=${stale}&code=code`))).status, 400);
    const validFetch = globalThis.fetch;
    globalThis.fetch = async () => Response.json({ error: "invalid_client", error_description: "secret-should-not-leak" }, { status: 401 });
    await assert.rejects(() => lib.tokenRequest({ grant_type: "authorization_code", code: "private-code" }), error => error.code === "invalid_client" && !error.message.includes("secret-should-not-leak"));
    const validTokens = { access_token: "access", refresh_token: "refresh", open_id: "id", expires_in: 3600, refresh_expires_in: 86400 };
    globalThis.fetch = async () => Response.json({ ...validTokens, scope: "user.info.basic" });
    await assert.rejects(() => lib.tokenRequest({}), error => error.code === "missing_scopes" && error.message.includes("video.list"));
    globalThis.fetch = async () => Response.json({ ...validTokens, scope: "user.info.basic, user.info.stats, video.list" });
    assert.equal((await lib.tokenRequest({})).open_id, "id");
    globalThis.fetch = async () => { throw new Error("secret-network-details"); };
    await assert.rejects(() => lib.tokenRequest({}), error => error.code === "token_network" && !error.message.includes("secret-network-details"));
    globalThis.fetch = validFetch;
  } finally {
    globalThis.fetch = oldFetch; process.env = env; globalThis.focusPool = undefined; globalThis.focusSchema = undefined; await pg.close();
  }
});
