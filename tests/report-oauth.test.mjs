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

const origin = "https://focusmrkt.tgxlabs.io";
async function environment(work) {
  const env = { ...process.env }, oldFetch = globalThis.fetch, oldInfo = console.info;
  const oldPool = globalThis.focusPool, oldSchema = globalThis.focusSchema;
  const pg = new PGlite();
  Object.assign(process.env, {
    DATABASE_URL: "postgres://test", PANEL_USER: "owner", PANEL_PASSWORD: "test-password-long-enough",
    META_APP_ID: "facebook-test-app", META_APP_SECRET: "facebook-test-secret", META_TOKEN_KEY: "facebook-test-key", META_GRAPH_VERSION: "v26.0", META_REDIRECT_URI: `${origin}/api/meta/callback`,
    INSTAGRAM_APP_ID: "instagram-test-app", INSTAGRAM_APP_SECRET: "instagram-test-secret", INSTAGRAM_TOKEN_KEY: "instagram-test-key", INSTAGRAM_GRAPH_VERSION: "v26.0", INSTAGRAM_REDIRECT_URI: `${origin}/api/instagram/callback`,
  });
  const query = (sql, params) => sql.includes("pg_advisory") ? { rows: [] } : pg.query(sql, params);
  globalThis.focusPool = { query, connect: async () => ({ query, release() {} }) };
  globalThis.focusSchema = undefined;
  globalThis.fetch = () => { throw new Error("Opening OAuth must not call a provider"); };
  console.info = () => {};
  try { await work(pg); }
  finally { process.env = env; globalThis.fetch = oldFetch; console.info = oldInfo; globalThis.focusPool = oldPool; globalThis.focusSchema = oldSchema; await pg.close(); }
}

async function providers() {
  const meta = await import("../lib/meta.ts"), instagram = await import("../lib/instagram.ts");
  return [
    { name: "Facebook", library: meta, api: await import("../app/api/meta/route.ts"), callback: await import("../app/api/meta/callback/route.ts"), connectPath: "/api/meta", callbackPath: "/api/meta/callback", table: "focus_meta_states", connections: "focus_meta_connections", base: ["pages_show_list", "pages_read_engagement"], insight: "read_insights", appId: "facebook-test-app", authorizationOrigin: "https://www.facebook.com" },
    { name: "Instagram", library: instagram, api: await import("../app/api/instagram/connect/route.ts"), callback: await import("../app/api/instagram/callback/route.ts"), connectPath: "/api/instagram/connect", callbackPath: "/api/instagram/callback", table: "focus_instagram_states", connections: "focus_instagram_connections", base: ["instagram_business_basic"], insight: "instagram_business_manage_insights", appId: "instagram-test-app", authorizationOrigin: "https://www.instagram.com" },
  ];
}
function connectRequest(provider, session, company = "A", reports, headers = {}) {
  const url = new URL(provider.connectPath, origin);
  url.searchParams.set("company", company);
  if (reports !== undefined) url.searchParams.set("reports", reports);
  return new Request(url, { method: "POST", headers: { cookie: `focusmrk_session=${session}`, "X-FocusMRK-Request": "1", "Content-Type": "application/json", ...headers }, body: JSON.stringify({ action: "connect" }) });
}
function callbackRequest(provider, session, state) {
  const url = new URL(provider.callbackPath, origin);
  url.searchParams.set("state", state); url.searchParams.set("code", "fixture-code");
  return new Request(url, { headers: { cookie: `focusmrk_session=${session}` } });
}

test("Report OAuth requests insight permissions only with reports=1 and binds state to company and session", async () => environment(async pg => {
  const { createSession } = await import("../lib/panel-auth.ts"), session = createSession();
  for (const provider of await providers()) {
    assert.deepEqual(provider.library.scopes, provider.base);
    let previousState = "";
    for (const reports of [undefined, "0", "true", "1", undefined]) {
      const response = await provider.api.POST(connectRequest(provider, session, "A", reports));
      assert.equal(response.status, 200, provider.name);
      const payload = await response.json(), url = new URL(payload.url), state = url.searchParams.get("state");
      assert.equal(url.origin, provider.authorizationOrigin);
      assert.equal(url.searchParams.get("client_id"), provider.appId);
      assert.equal(url.searchParams.get("redirect_uri"), `${origin}${provider.callbackPath}`);
      assert.equal(url.searchParams.get("response_type"), "code");
      assert.deepEqual(url.searchParams.get("scope").split(","), reports === "1" ? [...provider.base, provider.insight] : provider.base);
      assert.deepEqual(provider.library.scopes, provider.base, "An insight request must not mutate the default scopes");
      assert.match(state, /^[a-f0-9]{64}$/); assert.notEqual(state, previousState); previousState = state;
      assert.equal(payload.url.includes("test-secret"), false);
      assert.equal(url.searchParams.has("client_secret"), false);
      assert.equal(url.searchParams.has("access_token"), false);
      if (provider.name === "Instagram") assert.equal(url.searchParams.get("enable_fb_login"), "0");
      const states = (await pg.query(`SELECT * FROM ${provider.table}`)).rows;
      assert.equal(states.length, 1, "New attempts replace the previous pending state for this company and session");
      assert.equal(states[0].id, provider.library.digest(state));
      assert.notEqual(states[0].id, state);
      assert.equal(states[0].session, provider.library.digest(session));
      assert.equal(states[0].company, "A");
      const remaining = new Date(states[0].expires).getTime() - Date.now();
      assert.ok(remaining > 9 * 60 * 1000 && remaining <= 10 * 60 * 1000);
    }
  }
}));

test("Report OAuth can preserve basic connections when insights are declined and records granted insight scopes", async () => environment(async pg => {
  const { createSession } = await import("../lib/panel-auth.ts"), session = createSession();
  for (const provider of await providers()) {
    for (const grantInsights of [false, true]) {
      const granted = grantInsights ? [...provider.base, provider.insight] : provider.base;
      let exchanges = 0;
      globalThis.fetch = async (input, init = {}) => {
        const url = new URL(input);
        if (provider.name === "Facebook") {
          assert.equal(url.hostname, "graph.facebook.com");
          if (url.pathname.endsWith("/oauth/access_token")) { exchanges++; return Response.json({ access_token: "facebook-token", expires_in: 3600 }); }
          if (url.pathname.endsWith("/me/permissions")) return Response.json({ data: [...granted.map(permission => ({ permission, status: "granted" })), ...(!grantInsights ? [{ permission: provider.insight, status: "declined" }] : [])] });
          if (url.pathname.endsWith("/me/accounts")) return Response.json({ data: [{ id: "123", name: "Company Page", access_token: "facebook-page-token" }] });
        } else {
          assert.ok(["api.instagram.com", "graph.instagram.com"].includes(url.hostname));
          if (url.hostname === "api.instagram.com") {
            assert.equal(init.method, "POST"); assert.equal(init.body.get("client_id"), "instagram-test-app");
            exchanges++; return Response.json({ access_token: "instagram-short-token", user_id: "999", permissions: granted.join(",") });
          }
          if (url.pathname === "/access_token") return Response.json({ access_token: "instagram-token", expires_in: 5184000 });
          if (url.pathname.endsWith("/me")) return Response.json({ id: "999", user_id: "999", username: "company_account" });
        }
        throw new Error(`Unexpected ${provider.name} fixture endpoint`);
      };
      const start = await provider.api.POST(connectRequest(provider, session, "A", "1"));
      assert.equal(start.status, 200);
      const state = new URL((await start.json()).url).searchParams.get("state");
      const result = await provider.callback.GET(callbackRequest(provider, session, state));
      assert.equal(result.status, 303, `${provider.name} should accept the base connection without optional insight grants`);
      const rows = (await pg.query(`SELECT * FROM ${provider.connections} WHERE company=$1`, ["A"])).rows;
      assert.equal(rows.length, 1);
      assert.deepEqual(rows[0].permissions, granted);
      assert.deepEqual(provider.library.unseal(rows[0].tokens, "A").permissions, granted);
      assert.equal(rows[0].status, "connected");
      assert.equal((await pg.query(`SELECT * FROM ${provider.table}`)).rows.length, 0);
      const beforeReplay = exchanges;
      assert.equal((await provider.callback.GET(callbackRequest(provider, session, state))).status, 400);
      assert.equal(exchanges, beforeReplay, "A consumed report OAuth state must not exchange tokens again");
    }
  }
}));

test("Report OAuth retains CSRF, session and company membership checks before creating state or exchanging tokens", async () => environment(async pg => {
  const { createSession } = await import("../lib/panel-auth.ts"), owner = createSession(), manager = "account_" + "a".repeat(64);
  const all = await providers();
  await all[0].library.metaDb(); await all[1].library.instagramDb();
  await pg.exec("CREATE TABLE focus_accounts(id TEXT PRIMARY KEY,login TEXT,display_name TEXT,enabled BOOLEAN); CREATE TABLE focus_account_companies(account_id TEXT,company TEXT); CREATE TABLE focus_account_sessions(token_hash TEXT,account_id TEXT,expires_at TIMESTAMPTZ); INSERT INTO focus_accounts VALUES('manager','manager','Manager',true); INSERT INTO focus_account_companies VALUES('manager','A');");
  await pg.query("INSERT INTO focus_account_sessions VALUES($1,'manager',now()+interval '1 hour')", [createHash("sha256").update(manager).digest("hex")]);
  for (const provider of all) {
    assert.equal((await provider.api.POST(connectRequest(provider, "bad-session", "A", "1"))).status, 401);
    for (const session of [owner, manager]) {
      assert.equal((await provider.api.POST(connectRequest(provider, session, "A", "1", { "X-FocusMRK-Request": "" }))).status, 403);
      assert.equal((await provider.api.POST(connectRequest(provider, session, "A", "1", { "sec-fetch-site": "cross-site" }))).status, 403);
    }
    assert.equal((await provider.api.POST(connectRequest(provider, manager, "B", "1"))).status, 403);
    assert.equal((await provider.api.POST(connectRequest(provider, manager, "", "1"))).status, 400);
    assert.equal((await pg.query(`SELECT * FROM ${provider.table}`)).rows.length, 0);
    const authorized = await provider.api.POST(connectRequest(provider, manager, "A", "1"));
    assert.equal(authorized.status, 200);
    const state = new URL((await authorized.json()).url).searchParams.get("state");
    const pending = (await pg.query(`SELECT * FROM ${provider.table}`)).rows;
    assert.equal(pending.length, 1); assert.equal(pending[0].company, "A");
    assert.equal((await provider.callback.GET(callbackRequest(provider, owner, state))).status, 400, "The original authorized session owns the state");
    await pg.query("DELETE FROM focus_account_companies WHERE account_id='manager'");
    assert.equal((await provider.callback.GET(callbackRequest(provider, manager, state))).status, 403, "Company access must be checked again on OAuth return");
    assert.equal((await pg.query(`SELECT * FROM ${provider.connections}`)).rows.length, 0);
    await pg.query("INSERT INTO focus_account_companies VALUES('manager','A')");
  }
}));
