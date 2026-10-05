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

const query = { companyId: "A", platform: "Todas", startDate: "2026-09-01", endDate: "2026-09-30", mode: "production" };
const testEnv = {
  DATABASE_URL: "postgres://test",
  INSTAGRAM_APP_ID: "instagram-test-app",
  INSTAGRAM_APP_SECRET: "instagram-secret+/=",
  INSTAGRAM_TOKEN_KEY: "test-instagram-encryption-key",
  INSTAGRAM_REDIRECT_URI: "https://example.test/api/instagram/callback",
  INSTAGRAM_GRAPH_VERSION: "v26.0",
  META_APP_ID: "facebook-test-app",
  META_APP_SECRET: "facebook-secret+/=",
  META_TOKEN_KEY: "test-facebook-encryption-key",
  META_REDIRECT_URI: "https://example.test/api/meta/callback",
  META_GRAPH_VERSION: "v26.0"
};

async function environment(work, withDatabase = false) {
  const env = { ...process.env }, originalFetch = globalThis.fetch;
  const originalPool = globalThis.focusPool, originalSchema = globalThis.focusSchema;
  const pg = withDatabase ? new PGlite() : null;
  Object.assign(process.env, testEnv);
  if (pg) {
    const execute = async (sql, params) => {
      if (sql.includes("pg_advisory")) return { rows: [] };
      if (!params && sql.includes("CREATE TABLE")) { await pg.exec(sql); return { rows: [] }; }
      return pg.query(sql, params);
    };
    globalThis.focusPool = { query: execute, connect: async () => ({ query: execute, release() {} }) };
    globalThis.focusSchema = undefined;
  }
  try { return await work(pg); }
  finally {
    process.env = env;
    globalThis.fetch = originalFetch;
    globalThis.focusPool = originalPool;
    globalThis.focusSchema = originalSchema;
    if (pg) await pg.close();
  }
}

function requestUrl(input, init, platform, token) {
  const url = new URL(input);
  assert.equal(url.origin, `https://graph.${platform === "Instagram" ? "instagram" : "facebook"}.com`);
  assert.equal(init.headers.Authorization, `Bearer ${token}`);
  assert.equal(init.cache, "no-store");
  assert.equal(url.searchParams.has("access_token"), false);
  assert.equal(url.searchParams.has("client_secret"), false);
  return url;
}

const publicationId = (company, platform, id) => createHash("sha256").update(JSON.stringify([company, platform, id])).digest("hex");

test("Graph requests preserve numeric identifiers and keep secrets in authorization headers", async () => environment(async () => {
  const { graphRequest } = await import("../lib/content-reports/provider.ts");
  const calls = [];
  globalThis.fetch = async (input, init) => {
    const url = requestUrl(input, init, calls.length === 0 ? "Instagram" : "Facebook", "private-token");
    calls.push(url);
    return new Response('{"id":900719925474099312345,"user_id":38838403035806352,"followers_count":12}');
  };
  const profile = await graphRequest("Instagram", "me", "private-token", { fields: "id,user_id,followers_count" });
  assert.equal(profile.id, "900719925474099312345");
  assert.equal(profile.user_id, "38838403035806352");
  assert.equal(profile.followers_count, 12);
  await graphRequest("Facebook", "page_a", "private-token", { fields: "id" });
  assert.equal(calls[0].pathname, "/v26.0/me");
  assert.equal(calls[0].searchParams.has("appsecret_proof"), false);
  assert.match(calls[1].searchParams.get("appsecret_proof"), /^[a-f0-9]{64}$/);
  assert.equal(calls.some(url => url.href.includes("private-token")), false);
  for (const path of ["https://evil.test/me", "../me", "/me"]) await assert.rejects(graphRequest("Instagram", path, "private-token"));
  await assert.rejects(graphRequest("Instagram", "me", "private-token", { access_token: "private-token" }));
  assert.equal(calls.length, 2, "invalid paths and token query parameters must not reach the network");
}));

test("Graph errors retain provider HTTP status and code while redacting credentials", async () => environment(async () => {
  const { graphRequest, SocialProviderError } = await import("../lib/content-reports/provider.ts");
  const token = "private-token+/=", secret = testEnv.INSTAGRAM_APP_SECRET;
  globalThis.fetch = async () => Response.json({ error: { code: 100, message: `Rejected ${token} ${encodeURIComponent(token)} ${secret} ${encodeURIComponent(secret)} https://example.test/?access_token=${token}\nunsafe` } }, { status: 400 });
  await assert.rejects(graphRequest("Instagram", "me/insights", token), error => {
    assert.ok(error instanceof SocialProviderError);
    assert.equal(error.status, 400);
    assert.equal(error.code, 100);
    assert.ok(error.message.includes("Rejected"));
    for (const value of [token, secret, encodeURIComponent(token), encodeURIComponent(secret), "https://example.test"]) assert.equal(error.message.includes(value), false);
    assert.equal(/[\r\n]/.test(error.message), false);
    return true;
  });
  globalThis.fetch = async () => new Response("upstream returned a non JSON body", { status: 502 });
  await assert.rejects(graphRequest("Facebook", "page_a", token), error => error.status === 502 && !error.message.includes("upstream returned"));
}));

test("Graph pagination reuses cursors on the trusted endpoint, rejects loops and bounds imported records", async () => environment(async () => {
  const { collectPages } = await import("../lib/content-reports/provider.ts");
  const seen = [];
  globalThis.fetch = async (input, init) => {
    const url = requestUrl(input, init, "Instagram", "private-token");
    seen.push(url);
    assert.equal(url.pathname, "/v26.0/me/media");
    assert.equal(url.searchParams.get("limit"), "100");
    return seen.length === 1
      ? Response.json({ data: [{ id: "one" }], paging: { next: "https://evil.test/steal?access_token=private-token", cursors: { after: "cursor+one" } } })
      : Response.json({ data: [{ id: "two" }] });
  };
  assert.deepEqual(await collectPages("Instagram", "me/media", "private-token"), [{ id: "one" }, { id: "two" }]);
  assert.equal(seen[0].searchParams.has("after"), false);
  assert.equal(seen[1].searchParams.get("after"), "cursor+one");
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ data: [{ id: "one" }], paging: { next: "ignored", cursors: { after: "same" } } }); };
  await assert.rejects(collectPages("Instagram", "me/media", "private-token"), error => error.status === 502);
  assert.equal(calls, 2);
  calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ data: [], paging: { next: "ignored", cursors: { after: String(calls) } } }); };
  await assert.rejects(collectPages("Instagram", "me/media", "private-token"), error => error.status === 422);
  assert.equal(calls, 100, "a provider cannot make pagination run without a bound");
  globalThis.fetch = async () => Response.json({ data: Array.from({ length: 10001 }, (_, i) => ({ id: String(i) })) });
  await assert.rejects(collectPages("Instagram", "me/media", "private-token"), error => error.status === 422);
}));

test("Unavailable, breakdown and interval metrics remain unknown rather than fabricated totals", async () => {
  const { metricValue } = await import("../lib/content-reports/provider.ts");
  const result = { data: [
    { name: "reach", values: [{ value: 0 }] },
    { name: "views", total_value: { value: 120 } },
    { name: "countries", values: [{ value: { EC: 12, CO: 3 } }] },
    { name: "daily", values: [{ value: 2 }, { value: 4 }] },
    { name: "malformed", total_value: { value: "12" } }
  ] };
  assert.equal(metricValue(result, "reach"), 0);
  assert.equal(metricValue(result, "views"), 120);
  for (const key of ["missing", "countries", "daily", "malformed"]) assert.equal(metricValue(result, key), null);
});

async function facebookConnection(pg, company = "A", permissions = ["pages_show_list", "pages_read_engagement", "read_insights"]) {
  const meta = await import("../lib/meta.ts");
  await meta.metaDb();
  const tokens = { access_token: `facebook-user-token-${company}`, expires: Date.now() + 86400000,
    pages: [{ id: "111", name: "Selected Page", access_token: `facebook-page-token-${company}` }, { id: "222", name: "Other Page", access_token: "do-not-use-other-page-token" }], permissions };
  const snapshot = { selectedPage: "111", capturedAt: "2026-08-31T15:00:00Z", accounts: [{ facebook: { id: "111", name: "Selected Page", followers: 700 } }, { facebook: { id: "222", name: "Other Page", followers: 900 } }] };
  await pg.query("INSERT INTO focus_meta_connections(company,tokens,snapshot,permissions,status,expires_at) VALUES($1,$2,$3::jsonb,$4::jsonb,'connected',$5)", [company, meta.seal(tokens, company), JSON.stringify(snapshot), JSON.stringify(permissions), new Date(tokens.expires)]);
  return { tokens, snapshot };
}

test("Facebook imports the selected Page only, preserves both comparison periods and isolates publication IDs by company", async () => environment(async pg => {
  await facebookConnection(pg);
  await facebookConnection(pg, "B");
  const { collectFacebook } = await import("../lib/content-reports/facebook-collector.ts");
  const { buildReport, blankNotes, publicationDate } = await import("../lib/content-reports/model.ts");
  const calls = [];
  const post = (id, created_time, extra = {}) => ({ id, created_time, message: `Real post ${id}`, permalink_url: `https://www.facebook.com/111/posts/${id}`, likes: { summary: { total_count: 6 } }, comments: { summary: { total_count: 2 } }, shares: { count: 1 }, ...extra });
  globalThis.fetch = async (input, init) => {
    const token = init.headers.Authorization.slice(7);
    assert.ok(["facebook-page-token-A", "facebook-page-token-B"].includes(token), "only the selected Page token may be sent");
    const url = requestUrl(input, init, "Facebook", token);
    calls.push(url);
    if (url.pathname === "/v26.0/111") return Response.json({ id: "111", followers_count: 777 });
    if (url.pathname === "/v26.0/111/published_posts") {
      assert.equal(url.searchParams.get("since"), "2026-08-02T00:00:00-05:00");
      assert.equal(url.searchParams.get("until"), "2026-10-01T00:00:00-05:00");
      if (!url.searchParams.has("after")) return Response.json({ data: [post("111_1", "2026-09-12T17:00:00Z"), post("111_2", "2026-10-01T02:00:00Z"), post("111_3", "2026-08-31T18:00:00Z"), post("111_4", "2026-08-01T18:00:00Z")], paging: { next: "https://evil.test/not-followed", cursors: { after: "posts-after" } } });
      assert.equal(url.searchParams.get("after"), "posts-after");
      return Response.json({ data: [post("111_1", "2026-09-12T17:00:00Z"), post("111_5", "2026-10-01T05:00:00Z")] });
    }
    if (/^\/v26\.0\/111_[123]\/insights$/.test(url.pathname)) {
      assert.equal(url.searchParams.get("period"), "lifetime");
      return Response.json({ data: [{ name: "post_media_view", values: [{ value: 100 }] }, { name: "post_clicks", values: [{ value: 3 }] }] });
    }
    throw new Error(`Unexpected Facebook test endpoint: ${url.pathname}`);
  };
  const a = await collectFacebook(query);
  assert.equal(a.accountId, "Facebook:111");
  assert.equal(a.publications.length, 3);
  assert.equal(a.follower.followers, 777);
  assert.equal(a.follower.date, publicationDate(new Date().toISOString()));
  for (const post of a.publications) {
    assert.equal(post.companyId, "A");
    assert.equal(post.socialAccountId, "Facebook:111");
    assert.equal(post.id, publicationId("A", "Facebook", post.externalPostId));
    assert.equal(post.metrics.views, 100);
    assert.equal(post.metrics.clicks, 3);
    assert.equal(post.metrics.reach, null);
    assert.equal(post.metrics.impressions, null);
    assert.equal(post.metrics.saves, null);
    assert.equal(post.paid, null);
  }
  const report = buildReport({ publications: a.publications, followers: [a.follower], ads: [], audience: [], notes: blankNotes(), warnings: a.warnings }, query);
  assert.equal(report.publications.length, 2);
  assert.equal(report.summary.views, 200);
  assert.equal(report.comparison.find(item => item.key === "views").previous, 100);
  const b = await collectFacebook({ ...query, companyId: "B" });
  assert.equal(b.publications[0].id, publicationId("B", "Facebook", "111_1"));
  assert.notEqual(a.publications[0].id, b.publications[0].id);
  assert.equal(calls.some(url => /222/.test(url.pathname)), false);
  const raw = (await pg.query("SELECT tokens FROM focus_meta_connections WHERE company='A'")).rows[0].tokens;
  assert.equal(raw.includes("facebook-page-token-A"), false);
  const before = calls.length;
  await pg.query("UPDATE focus_meta_connections SET snapshot='{}'::jsonb WHERE company='A'");
  await assert.rejects(collectFacebook(query), error => error.status === 409);
  assert.equal(calls.length, before, "a Page selection is required before any network request");
}, true));

test("Facebook permission errors leave optional metrics null, stop repeated probes and retain secure provider errors", async () => environment(async pg => {
  await facebookConnection(pg, "A", ["pages_show_list", "pages_read_engagement"]);
  const { collectFacebook } = await import("../lib/content-reports/facebook-collector.ts");
  let insights = 0, mode = "permission";
  globalThis.fetch = async (input, init) => {
    const url = requestUrl(input, init, "Facebook", "facebook-page-token-A");
    if (url.pathname === "/v26.0/111") return Response.json({ id: mode === "identity" ? "222" : "111", followers_count: 800 });
    if (url.pathname === "/v26.0/111/published_posts") return Response.json({ data: [1, 2].map(id => ({ id: mode === "foreign-post" ? `222_${id}` : `111_${id}`, created_time: "2026-09-15T18:00:00Z", message: "Basic post" })) });
    if (url.pathname.endsWith("/insights")) {
      insights++;
      return Response.json({ error: { code: mode === "expired" ? 190 : 10, message: "Missing permission facebook-page-token-A facebook-secret+/=" } }, { status: mode === "expired" ? 401 : 400 });
    }
    throw new Error(`Unexpected Facebook test endpoint: ${url.pathname}`);
  };
  const result = await collectFacebook(query);
  assert.equal(insights, 1);
  assert.equal(result.publications.length, 2);
  assert.ok(result.publications.every(post => post.metrics.views === null && post.metrics.clicks === null && post.metrics.likes === null));
  assert.ok(result.warnings.some(warning => warning.includes("read_insights")));
  assert.equal(JSON.stringify(result).includes("facebook-page-token-A"), false);
  assert.equal(JSON.stringify(result).includes("facebook-secret+/="), false);
  mode = "expired";
  await assert.rejects(collectFacebook(query), error => error.status === 401 && error.code === 190);
  mode = "identity";
  await assert.rejects(collectFacebook(query), error => error.status === 502);
  mode = "foreign-post";
  await assert.rejects(collectFacebook(query), error => error.status === 502);
}, true));

async function instagramConnection(pg, company = "A", permissions = ["instagram_business_basic", "instagram_business_manage_insights"]) {
  const instagram = await import("../lib/instagram.ts");
  await instagram.instagramDb();
  const tokens = { access_token: `instagram-token-${company}`, user_id: "38838403035806352", expires: Date.now() + 30 * 86400000, issued: Date.now(), permissions };
  await pg.query("INSERT INTO focus_instagram_connections(company,tokens,external_id,permissions,expires_at,status) VALUES($1,$2,$3,$4::jsonb,$5,'connected')", [company, instagram.seal(tokens, company), tokens.user_id, JSON.stringify(permissions), new Date(tokens.expires)]);
  return tokens;
}

test("Restricted Story preserves its own missing data and does not disable insights on later media", async () => environment(async pg => {
  await instagramConnection(pg);
  const {collectInstagram}=await import("../lib/content-reports/instagram-collector.ts");
  const calls=[];
  globalThis.fetch=async(input)=>{
    const u=new URL(input);calls.push(u.pathname);
    if(u.pathname.endsWith("/me"))return Response.json({id:"111",username:"professional"});
    if(u.pathname.endsWith("/me/media"))return Response.json({data:[{id:"1",media_type:"IMAGE",media_product_type:"STORY",timestamp:"2026-09-10T12:00:00Z"},{id:"2",media_type:"IMAGE",timestamp:"2026-09-11T12:00:00Z"}]});
    if(u.pathname.endsWith("/1/insights"))return Response.json({error:{code:200,message:"Story viewer restriction"}},{status:400});
    if(u.pathname.endsWith("/2/insights"))return Response.json({data:u.searchParams.get("metric").split(",").map(name=>({name,values:[{value:0}]}))});
    return Response.json({data:[]});
  };
  const result=await collectInstagram(query);
  assert.equal(result.publications.length,2);
  assert.equal(result.publications[0].metrics.views,null);
  assert.equal(result.publications[1].metrics.views,0);
  assert.equal(result.publications[1].providerMetrics.totalInteractions,0);
  assert.ok(calls.some(p=>p.endsWith("/2/insights")));
},true));

test("Account insights preserve provider intervals, zero, sparse demographics and capture scope", async()=>environment(async()=>{
  const {insightValue,collectAccountInsights}=await import("../lib/content-reports/account-insights.ts");
  assert.equal(insightValue({data:[{name:"reach",total_value:{value:0}}]},"reach").value,0);
  assert.equal(insightValue({data:[{name:"reach",values:[{value:2},{value:3}]}]},"reach").value,null,"unique intervals must never be summed");
  globalThis.fetch=async input=>{const u=new URL(input),name=u.searchParams.get("metric");return Response.json({data:[{name,total_value:name==="follower_demographics"?{breakdowns:[{dimension_keys:["age"],results:[{dimension_values:["25-34"],value:10}]}]}:{value:0}}]});};
  const rows=await collectAccountInsights("Instagram","me/insights","token",query,"Instagram:1",new Set());
  assert.equal(rows.length,2);
  assert.equal(rows[0].metrics.reach.value,0);
  assert.equal(rows[1].scope,"CURRENT_AUDIENCE");
  assert.deepEqual(rows[1].metrics.follower_demographics_age.breakdowns[0].results,[{labels:["25-34"],value:10}]);
  const {permissionDiagnosis}=await import("../lib/content-reports/connection-diagnostics.ts");
  assert.equal(permissionDiagnosis(["read_insights"],["read_insights"],[]).status,"REAUTHORIZATION_REQUIRED");
  assert.equal(permissionDiagnosis(["read_insights"],[],null).status,"UNVERIFIED");
}));

test("Instagram imports authenticated media pages, preserves numeric IDs, compares Ecuador dates and converts Reels watch time to seconds", async () => environment(async pg => {
  await instagramConnection(pg);
  await instagramConnection(pg, "B");
  const { collectInstagram } = await import("../lib/content-reports/instagram-collector.ts");
  const { buildReport, blankNotes, publicationDate } = await import("../lib/content-reports/model.ts");
  const calls = [];
  const media = (id, timestamp, extra = {}) => ({ id, timestamp, media_type: "IMAGE", media_product_type: "FEED", caption: "Actual publication", media_url: "https://cdn.example.test/photo.jpg", permalink: `https://www.instagram.com/p/${id}/`, like_count: 5, comments_count: 1, ...extra });
  globalThis.fetch = async (input, init) => {
    const token = init.headers.Authorization.slice(7);
    assert.ok(["instagram-token-A", "instagram-token-B"].includes(token));
    const url = requestUrl(input, init, "Instagram", token);
    calls.push(url);
    if (url.pathname === "/v26.0/me") return Response.json({ id: "11111", user_id: "38838403035806352", username: "professional", followers_count: 1000 });
    if (url.pathname === "/v26.0/me/stories") return Response.json({ data: [] });
    if (url.pathname === "/v26.0/me/media") {
      assert.equal(url.searchParams.has("since"), false, "Instagram media uses cursor pagination rather than unsupported time pagination");
      assert.equal(url.searchParams.has("until"), false);
      if (!url.searchParams.has("after")) {
        const result = { data: [media("900719925474099312345", "2026-09-12T17:00:00Z", { media_type: "VIDEO", media_product_type: "REELS" }), media("102", "2026-10-01T02:00:00Z"), media("103", "2026-08-31T18:00:00Z"), media("104", "2026-08-01T18:00:00Z")], paging: { next: "https://evil.test/not-followed", cursors: { after: "media-after" } } };
        return new Response(JSON.stringify(result).replace('"id":"900719925474099312345"', '"id":900719925474099312345'));
      }
      assert.equal(url.searchParams.get("after"), "media-after");
      return Response.json({ data: [media("102", "2026-10-01T02:00:00Z"), media("105", "2026-10-01T05:00:00Z"), media("106", "2026-09-20T17:00:00Z", { media_type: "CAROUSEL_ALBUM", media_url: undefined, children: { data: [{ media_type: "IMAGE", media_url: "https://cdn.example.test/carousel.jpg" }] } })] });
    }
    if (/^\/v26\.0\/(900719925474099312345|102|103|106)\/insights$/.test(url.pathname)) {
      assert.equal(url.searchParams.get("period"), "lifetime");
      const values = { views: 100, reach: 80, likes: 10, comments: 4, saved: 2, shares: 3, profile_visits: 4, follows: 2, ig_reels_video_view_total_time: 12000, ig_reels_avg_watch_time: 2500 };
      return Response.json({ data: url.searchParams.get("metric").split(",").map(name => ({ name, values: [{ value: values[name] }] })) });
    }
    throw new Error(`Unexpected Instagram test endpoint: ${url.pathname}`);
  };
  const a = await collectInstagram(query);
  assert.equal(a.accountId, "Instagram:38838403035806352");
  assert.equal(a.publications.length, 4);
  assert.equal(a.follower.followers, 1000);
  assert.equal(a.follower.date, publicationDate(new Date().toISOString()));
  const reel = a.publications.find(post => post.contentType === "REEL");
  assert.equal(reel.externalPostId, "900719925474099312345");
  assert.equal(reel.metrics.totalWatchTime, 12);
  assert.equal(reel.metrics.averageWatchTime, 2.5);
  assert.equal(reel.metrics.duration, null);
  assert.deepEqual(reel.metrics.retention, []);
  assert.equal(a.publications.find(post => post.externalPostId === "106").thumbnailUrl, "https://cdn.example.test/carousel.jpg");
  for (const post of a.publications) {
    assert.equal(post.companyId, "A");
    assert.equal(post.socialAccountId, a.accountId);
    assert.equal(post.id, publicationId("A", "Instagram", post.externalPostId));
    assert.equal(post.metrics.views, 100);
    assert.equal(post.metrics.reach, 80);
    assert.equal(post.metrics.impressions, null);
    assert.equal(post.paid, null);
  }
  const report = buildReport({ publications: a.publications, followers: [a.follower], ads: [], audience: [], notes: blankNotes(), warnings: a.warnings }, query);
  assert.equal(report.publications.length, 3);
  assert.equal(report.summary.views, 300);
  assert.equal(report.comparison.find(item => item.key === "views").previous, 100);
  const b = await collectInstagram({ ...query, companyId: "B" });
  assert.equal(b.publications[0].id, publicationId("B", "Instagram", "900719925474099312345"));
  assert.notEqual(a.publications[0].id, b.publications[0].id);
  assert.equal(calls.some(url => url.pathname.includes("38838403035806352/media")), false, "queries remain bound to the authenticated /me edge");
  const raw = (await pg.query("SELECT tokens FROM focus_instagram_connections WHERE company='A'")).rows[0].tokens;
  assert.equal(raw.includes("instagram-token-A"), false);
}, true));

test("Instagram keeps basic metrics when insights permission is missing and rejects disconnected or unauthorized companies before fetching", async () => environment(async pg => {
  const tokens = await instagramConnection(pg, "A", ["instagram_business_basic"]);
  const { collectInstagram } = await import("../lib/content-reports/instagram-collector.ts");
  const { seal } = await import("../lib/instagram.ts");
  let network = 0, insights = 0, mode = "basic";
  globalThis.fetch = async (input, init) => {
    network++;
    const url = requestUrl(input, init, "Instagram", "instagram-token-A");
    if (url.pathname === "/v26.0/me") return Response.json({ id: "11111", username: "professional" });
    if (url.pathname === "/v26.0/me/stories") return Response.json({ data: [] });
    if (url.pathname === "/v26.0/me/media") return Response.json({ data: [1, 2].map(id => ({ id: String(id), timestamp: "2026-09-15T18:00:00Z", media_type: "IMAGE", like_count: 5, comments_count: 0, media_url: "http://cdn.example.test/unsafe.jpg", thumbnail_url: "https://user:password@cdn.example.test/unsafe.jpg", permalink: "https://www.instagram.com/p/test/?access_token=instagram-token-A" })) });
    if (url.pathname.endsWith("/insights")) {
      insights++;
      return Response.json({ error: { code: mode === "expired" ? 190 : 200, message: "Denied instagram-token-A instagram-secret+/=" } }, { status: mode === "expired" ? 401 : 400 });
    }
    throw new Error(`Unexpected Instagram test endpoint: ${url.pathname}`);
  };
  const basic = await collectInstagram(query);
  assert.equal(insights, 0);
  assert.equal(basic.follower, null);
  assert.equal(basic.publications.length, 2);
  assert.ok(basic.publications.every(post => post.metrics.likes === 5 && post.metrics.comments === 0 && post.metrics.reach === null && post.metrics.views === null && post.metrics.shares === null && post.metrics.saves === null));
  assert.ok(basic.publications.every(post => !post.mediaUrl && !post.thumbnailUrl && !post.permalink));
  assert.ok(basic.warnings.some(warning => warning.includes("instagram_business_manage_insights")));
  const before = network;
  await assert.rejects(collectInstagram({ ...query, companyId: "B" }), error => error.status === 409);
  await assert.rejects(collectInstagram({ ...query, mode: "demo" }), error => error.status === 400);
  assert.equal(network, before);
  tokens.permissions.push("instagram_business_manage_insights");
  await pg.query("UPDATE focus_instagram_connections SET tokens=$1 WHERE company='A'", [seal(tokens, "A")]);
  const denied = await collectInstagram(query);
  assert.equal(insights, 1, "a denied permission is probed only once");
  assert.ok(denied.publications.every(post => post.metrics.likes === 5 && post.metrics.reach === null));
  assert.equal(JSON.stringify(denied).includes("instagram-token-A"), false);
  assert.equal(JSON.stringify(denied).includes("instagram-secret+/="), false);
  mode = "expired";
  await assert.rejects(collectInstagram(query), error => error.status === 401 && error.code === 190);
  await pg.query("UPDATE focus_instagram_connections SET status='disconnected' WHERE company='A'");
  const disconnectedBefore = network;
  await assert.rejects(collectInstagram(query), error => error.status === 409);
  assert.equal(network, disconnectedBefore);
}, true));

test("Unsupported individual insights stay null without hiding supported metrics on later Facebook formats", async () => environment(async pg => {
  await instagramConnection(pg);
  await facebookConnection(pg);
  const { collectInstagram } = await import("../lib/content-reports/instagram-collector.ts");
  const { collectFacebook } = await import("../lib/content-reports/facebook-collector.ts");
  let unsupportedInstagram = 0, unsupportedFacebook = 0;
  globalThis.fetch = async (input, init) => {
    const url = new URL(input), platform = url.hostname === "graph.instagram.com" ? "Instagram" : "Facebook";
    requestUrl(input, init, platform, platform === "Instagram" ? "instagram-token-A" : "facebook-page-token-A");
    if (url.pathname === "/v26.0/me") return Response.json({ username: "professional", id: "11111" });
    if (url.pathname === "/v26.0/me/stories") return Response.json({ data: [] });
    if (url.pathname === "/v26.0/me/media") return Response.json({ data: [1, 2].map(id => ({ id: String(id), timestamp: "2026-09-15T18:00:00Z", media_type: "IMAGE" })) });
    if (url.pathname === "/v26.0/111") return Response.json({ id: "111", followers_count: 700 });
    if (url.pathname === "/v26.0/111/published_posts") return Response.json({ data: [1, 2].map(id => ({ id: `111_${id}`, created_time: "2026-09-15T18:00:00Z", ...(id === 2 ? { status_type: "added_video" } : {}) })) });
    if (url.pathname.endsWith("/insights")) {
      const names = url.searchParams.get("metric").split(",");
      const unsupported = platform === "Instagram" ? "saved" : "post_media_view";
      if (names.includes(unsupported) && (platform === "Instagram" || url.pathname === "/v26.0/111_1/insights")) {
        if (names.length === 1) {
          if (platform === "Instagram") unsupportedInstagram++;
          else unsupportedFacebook++;
        }
        return Response.json({ error: { code: 100, message: `Invalid metric ${unsupported}; metric not supported` } }, { status: 400 });
      }
      return Response.json({ data: names.map(name => ({ name, values: [{ value: 10 }] })) });
    }
    throw new Error(`Unexpected fallback test endpoint: ${url.pathname}`);
  };
  const instagram = await collectInstagram(query);
  assert.equal(instagram.publications.length, 2);
  assert.ok(instagram.publications.every(post => post.metrics.views === 10 && post.metrics.reach === 10 && post.metrics.saves === null));
  assert.equal(unsupportedInstagram, 1);
  const facebook = await collectFacebook(query);
  assert.equal(facebook.publications.length, 2);
  assert.equal(facebook.publications[0].metrics.views, null);
  assert.equal(facebook.publications[1].metrics.views, 10, "an unsupported metric on one format must not suppress another format");
  assert.ok(facebook.publications.every(post => post.metrics.clicks === 10));
  assert.equal(unsupportedFacebook, 1);
}, true));
