import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { PGlite } from "@electric-sql/pglite";

registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) return next(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.endsWith(".ts") && !/\.[a-z]+$/i.test(specifier)) return next(specifier + ".ts", context);
  return next(specifier, context);
} });

const basic = "instagram_business_basic", insight = "instagram_business_manage_insights";
const query = { companyId: "A", platform: "Instagram", startDate: "2026-09-01", endDate: "2026-09-30", mode: "production" };
const unknown = { insightsRequested: true, permissionsVerified: false };
const media = (id = "101", timestamp = "2026-09-15T18:00:00Z") => ({ id, timestamp, media_type: "IMAGE", caption: "Owned media", like_count: 5, comments_count: 2 });
const secret = "instagram-probe-secret+/=", token = "instagram-probe-token+/=";

async function environment(work) {
  const env = { ...process.env }, oldFetch = globalThis.fetch;
  const oldPool = globalThis.focusPool, oldSchema = globalThis.focusSchema;
  const pg = new PGlite();
  Object.assign(process.env, { DATABASE_URL: "postgres://test", INSTAGRAM_APP_ID: "probe-app", INSTAGRAM_APP_SECRET: secret, INSTAGRAM_TOKEN_KEY: "probe-encryption-key", INSTAGRAM_GRAPH_VERSION: "v26.0", INSTAGRAM_REDIRECT_URI: "https://example.test/api/instagram/callback" });
  const execute = (sql, params) => sql.includes("pg_advisory") ? { rows: [] } : pg.query(sql, params);
  globalThis.focusPool = { query: execute, connect: async () => ({ query: execute, release() {} }) };
  globalThis.focusSchema = undefined;
  try {
    const library = await import("../lib/instagram.ts"), collector = await import("../lib/content-reports/instagram-collector.ts");
    await library.instagramDb();
    await work(pg, library, collector);
  } finally { process.env = env; globalThis.fetch = oldFetch; globalThis.focusPool = oldPool; globalThis.focusSchema = oldSchema; await pg.close(); }
}
async function seed(pg, library, flags = unknown, company = "A") {
  const tokens = { access_token: token, user_id: "38838403035806352", permissions: [basic], expires: Date.now() + 30 * 86400000, issued: Date.now(), ...flags };
  const encrypted = library.seal(tokens, company);
  await pg.query("INSERT INTO focus_instagram_connections(company,tokens,external_id,permissions,expires_at,status,snapshot) VALUES($1,$2,$3,$4::jsonb,$5,'connected',$6::jsonb) ON CONFLICT(company) DO UPDATE SET tokens=$2,external_id=$3,permissions=$4::jsonb,expires_at=$5,status='connected',snapshot=$6::jsonb", [company, encrypted, tokens.user_id, JSON.stringify(tokens.permissions), new Date(tokens.expires), JSON.stringify({ instagram: { id: tokens.user_id, username: "professional" }, capturedAt: "2026-09-01T12:00:00Z" })]);
  return { tokens, encrypted };
}
async function row(pg, company = "A") { return (await pg.query("SELECT * FROM focus_instagram_connections WHERE company=$1", [company])).rows[0]; }
function network(insights, publications = [media(), media("102")]) {
  const calls = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(input);
    calls.push(url);
    assert.equal(url.origin, "https://graph.instagram.com");
    assert.equal(init.headers.Authorization, `Bearer ${token}`);
    assert.equal(init.cache, "no-store");
    assert.equal(url.searchParams.has("access_token"), false);
    assert.equal(url.searchParams.has("client_secret"), false);
    if (url.pathname === "/v26.0/me") return Response.json({ id: "17841400000000001", user_id: "38838403035806352", username: "professional", followers_count: 80 });
    if (url.pathname === "/v26.0/me/media") return Response.json({ data: publications });
    if (url.pathname === "/v26.0/me/stories") return Response.json({ data: [] });
    if (/^\/v26\.0\/\d+\/insights$/.test(url.pathname)) {
      const owned = publications.map(item => item.id);
      assert.ok(owned.includes(url.pathname.split("/")[2]), "Only IDs returned by authenticated /me/media may be probed");
      assert.equal(url.searchParams.get("period"), "lifetime");
      return insights(url);
    }
    throw new Error(`Unexpected fixture path ${url.pathname}`);
  };
  return calls;
}
const zero = url => Response.json({ data: url.searchParams.get("metric").split(",").map(name => ({ name, values: [{ value: 0 }] })) });

test("An explicitly requested unknown Instagram grant is confirmed by real zero-valued owned-media insights and persisted encrypted", async () => environment(async (pg, library, collector) => {
  const original = await seed(pg, library), other = await seed(pg, library, unknown, "B"), before = await row(pg);
  const calls = network(zero);
  const result = await collector.collectInstagram(query);
  assert.equal(result.publications.length, 2);
  assert.ok(result.publications.every(post => post.metrics.views === 0 && post.metrics.reach === 0 && post.metrics.likes === 0 && post.metrics.comments === 0 && post.metrics.saves === 0 && post.metrics.shares === 0));
  assert.ok(calls.some(url => url.pathname === "/v26.0/101/insights"));
  assert.equal(calls.some(url => url.pathname.includes("38838403035806352/media")), false);
  const current = await row(pg), persisted = library.unseal(current.tokens, "A");
  assert.deepEqual(current.permissions, [basic, insight]);
  assert.deepEqual(persisted.permissions, [basic, insight]);
  assert.equal(persisted.permissionsVerified, true);
  assert.equal(persisted.insightsRequested, true);
  assert.equal(persisted.access_token, original.tokens.access_token);
  assert.equal(persisted.user_id, original.tokens.user_id);
  assert.equal(persisted.expires, original.tokens.expires); assert.equal(persisted.issued, original.tokens.issued);
  assert.equal(current.external_id, before.external_id); assert.equal(current.status, before.status);
  assert.equal(new Date(current.expires_at).getTime(), new Date(before.expires_at).getTime());
  assert.deepEqual(current.snapshot, before.snapshot);
  assert.notEqual(current.tokens, original.encrypted);
  assert.equal(current.tokens.includes(token), false);
  assert.equal((await row(pg, "B")).tokens, other.encrypted, "Permission confirmation is isolated to the queried company");
  assert.equal(JSON.stringify(result).includes(token), false); assert.equal(JSON.stringify(result).includes(secret), false);
  // The resulting verified connection continues to collect insights, without
  // repeatedly rewriting its encrypted token solely to re-confirm permission.
  network(zero);
  await collector.collectInstagram(query);
  assert.equal((await row(pg)).tokens, current.tokens);
}));

for (const code of [10, 200]) test(`Unknown Instagram grant rejected with code ${code} stops after one probe and preserves safe provider detail`, async () => environment(async (pg, library, collector) => {
  const original = await seed(pg, library);
  const calls = network(() => Response.json({ error: { code, message: `actual-denial-marker ${token} ${secret}` } }, { status: 400 }));
  const result = await collector.collectInstagram(query);
  assert.equal(calls.filter(url => url.pathname.endsWith("/insights")).length, 1);
  assert.equal(result.publications.length, 2);
  assert.ok(result.publications.every(post => post.metrics.likes === 5 && post.metrics.comments === 2 && post.metrics.views === null && post.metrics.reach === null));
  const warnings = result.warnings.join(" ");
  assert.match(warnings, /instagram_business_manage_insights/);
  assert.match(warnings, /actual-denial-marker/);
  assert.match(warnings, /HTTP 400/);
  assert.equal(warnings.includes(token), false); assert.equal(warnings.includes(secret), false);
  assert.equal((await row(pg)).tokens, original.encrypted);
  assert.deepEqual((await row(pg)).permissions, [basic]);
  assert.equal(library.unseal((await row(pg)).tokens, "A").permissionsVerified, false);
}));

test("Null insights, empty media and out-of-period media cannot promote an unknown requested scope", async () => environment(async (pg, library, collector) => {
  for (const publications of [[media()], [], [media("103", "2026-08-01T18:00:00Z")]]) {
    const original = await seed(pg, library);
    const calls = network(url => Response.json({ data: url.searchParams.get("metric").split(",").map(name => ({ name, values: [{ value: null }] })) }), publications);
    const result = await collector.collectInstagram(query);
    assert.equal((await row(pg)).tokens, original.encrypted);
    assert.deepEqual((await row(pg)).permissions, [basic]);
    assert.equal(library.unseal((await row(pg)).tokens, "A").permissionsVerified, false);
    assert.ok(result.warnings.some(warning => /no se pudo confirmar/i.test(warning)));
    assert.equal(result.publications.length, publications.length && publications[0].id === "101" ? 1 : 0);
    if (!result.publications.length) assert.equal(calls.filter(url => url.pathname.endsWith("/insights")).length, 0);
  }
}));

test("Verified basic-only grants, legacy grants and nonrequested unknown grants never probe Instagram insights", async () => environment(async (pg, library, collector) => {
  for (const flags of [{ insightsRequested: true, permissionsVerified: true }, {}, { insightsRequested: false, permissionsVerified: false }, { insightsRequested: true }]) {
    const original = await seed(pg, library, flags);
    const calls = network(() => { throw new Error("This connection must not probe insights"); });
    const result = await collector.collectInstagram(query);
    assert.equal(result.publications.length, 2);
    assert.ok(result.publications.every(post => post.metrics.likes === 5 && post.metrics.comments === 2 && post.metrics.views === null));
    assert.equal(calls.filter(url => url.pathname.endsWith("/insights")).length, 0);
    assert.equal((await row(pg)).tokens, original.encrypted);
    assert.deepEqual((await row(pg)).permissions, [basic]);
    assert.ok(result.warnings.some(warning => warning.includes(insight)));
  }
}));

test("A successful earlier probe cannot overwrite a renewed, disconnected, deleted or switched Instagram connection", async () => environment(async (pg, library, collector) => {
  for (const change of ["renewed-token", "disconnected", "deleted", "switched-user"]) {
    const original = await seed(pg, library);
    let changed = false, expected;
    network(async url => {
      if (!changed) {
        changed = true;
        if (change === "deleted") await pg.query("DELETE FROM focus_instagram_connections WHERE company='A'");
        else if (change === "disconnected") await pg.query("UPDATE focus_instagram_connections SET status='disconnected' WHERE company='A'");
        else {
          const latest = { ...original.tokens, permissions: [basic, "instagram_business_manage_comments"], ...(change === "renewed-token" ? { access_token: "latest-instagram-token", issued: original.tokens.issued + 1000 } : { user_id: "999" }) };
          await pg.query("UPDATE focus_instagram_connections SET tokens=$1,external_id=$2,permissions=$3::jsonb WHERE company='A'", [library.seal(latest, "A"), latest.user_id, JSON.stringify(latest.permissions)]);
        }
        expected = await row(pg);
      }
      return zero(url);
    });
    const result = await collector.collectInstagram(query);
    assert.equal(changed, true); assert.ok(result.publications.every(post => post.metrics.views === 0));
    const after = await row(pg);
    if (change === "deleted") assert.equal(after, undefined);
    else {
      assert.equal(after.tokens, expected.tokens, `${change} must preserve the latest encrypted token`);
      assert.equal(after.status, expected.status); assert.equal(after.external_id, expected.external_id);
      assert.deepEqual(after.permissions, expected.permissions);
      assert.equal(library.unseal(after.tokens, "A").permissions.includes(insight), false);
    }
  }
}));

test("Unknown-grant probes retain fatal token and rate-limit failures without promoting permissions", async () => environment(async (pg, library, collector) => {
  for (const [status, code] of [[401, 190], [429, 4]]) {
    const original = await seed(pg, library);
    const calls = network(() => Response.json({ error: { code, message: `fatal-provider-marker ${token} ${secret}` } }, { status }));
    await assert.rejects(collector.collectInstagram(query), error => {
      assert.equal(error.status, status); assert.equal(error.code, code);
      assert.match(error.message, /fatal-provider-marker/);
      assert.equal(error.message.includes(token), false); assert.equal(error.message.includes(secret), false);
      return true;
    });
    assert.equal(calls.filter(url => url.pathname.endsWith("/insights")).length, 1);
    assert.equal((await row(pg)).tokens, original.encrypted);
    assert.deepEqual((await row(pg)).permissions, [basic]);
  }
}));
