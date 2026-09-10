import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { PGlite } from "@electric-sql/pglite";
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith("@/lib/")) return next(new URL(`../lib/${specifier.slice(6)}.ts`, import.meta.url).href, context);
  return next(specifier, context);
} });

test("private PostgreSQL APIs enforce auth, preserve media and reject stale writes", async () => {
  const before = { database: process.env.DATABASE_URL, user: process.env.PANEL_USER, password: process.env.PANEL_PASSWORD };
  process.env.DATABASE_URL = "postgres://test";
  process.env.PANEL_USER = "owner";
  process.env.PANEL_PASSWORD = "test-password-123456789";
  const pg = new PGlite();
  const query = async (sql, params) => {
    if (sql.includes("pg_advisory_xact_lock")) return { rows: [] };
    const result = await pg.query(sql, params);
    return { ...result, rowCount: result.rows.length || result.affectedRows || 0 };
  };
  globalThis.focusPool = { query, connect: async () => ({ query, release() {} }) };
  globalThis.focusSchema = undefined;
  const workspace = await import("../app/api/workspace/route.ts");
  const media = await import("../app/api/media/route.ts");
  const { emptyPublication } = await import("../lib/calendar.ts");
  const headers = { authorization: `Basic ${Buffer.from('owner:test-password-123456789').toString('base64')}`, "x-focusmrk-request": "1" };
  const request = (path, method = "GET", body) => new Request(`http://localhost/api/${path}`, { method, headers, body });
  try {
    assert.equal((await workspace.GET(new Request("http://localhost/api/workspace"))).status, 401);
    const state = await (await workspace.GET(request("workspace"))).json();
    assert.deepEqual(state.posts, []);
    const form = new FormData(); form.set("id", "asset"); form.set("brand", "Marca"); form.set("file", new Blob(["abc"], { type: "image/png" }), "image.png");
    assert.equal((await media.POST(request("media", "POST", form))).status, 200);
    const post = { ...emptyPublication("2026-09-10"), id: "post", title: "Persistente", mediaId: "asset", objective: "Interacción" };
    const body = JSON.stringify({ version: 0, posts: [post], templates: [] });
    assert.equal((await workspace.PUT(request("workspace", "PUT", body))).status, 200);
    assert.equal((await workspace.PUT(request("workspace", "PUT", body))).status, 409);
    assert.equal((await media.DELETE(request("media?id=asset", "DELETE"))).status, 409);
    const restored = await (await workspace.GET(request("workspace"))).json();
    assert.deepEqual(restored.posts, [post]);
    assert.equal(await (await media.GET(request("media?id=asset"))).text(), "abc");
    assert.equal((await workspace.PUT(request("workspace", "PUT", JSON.stringify({ version: 1, posts: [{ ...post, mediaId: "missing" }], templates: [] })))).status, 400);
    assert.equal((await workspace.PUT(new Request("http://localhost/api/workspace", { method: "PUT", headers: { ...headers, "sec-fetch-site": "cross-site" }, body }))).status, 403);
    assert.equal((await workspace.PUT(request("workspace", "PUT", JSON.stringify({ version: 1, posts: [], templates: [] })))).status, 200);
    assert.equal((await media.DELETE(request("media?id=asset", "DELETE"))).status, 200);
    process.env.PANEL_PASSWORD = "";
    assert.equal((await workspace.GET(request("workspace"))).status, 503);
  } finally {
    for (const [key, value] of Object.entries({ DATABASE_URL: before.database, PANEL_USER: before.user, PANEL_PASSWORD: before.password })) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    delete globalThis.focusPool; delete globalThis.focusSchema;
    await pg.close();
  }
});
