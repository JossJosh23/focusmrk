import { createHash } from "node:crypto";
import { database } from "../database";
import { blankNotes, emptyMetrics, numeric, previousPeriod, type ReportQuery, type SocialPublication, type ReportNotes, type SyncStatus } from "./model";
import type { CollectorResult } from "./provider";
import type { TikTokReportSnapshot } from "../report-visual";
import { hybridSchema } from "./hybrid-schema";
import { readHybrid } from "./hybrid-repository";
import type { HybridDataset } from "./executive";
type TikTokSource = Omit<TikTokReportSnapshot, "user" | "videos"> & { user: TikTokReportSnapshot["user"] & { open_id: string }; videos: (TikTokReportSnapshot["videos"][number] & { share_url?: string; cover_image_url?: string; duration?: number; video_description?: string })[] };
// Separate additive tables. Existing OAuth tokens and legacy reports are untouched.
export async function reportDb() {
  const db = await database();
  await db.query(`CREATE TABLE IF NOT EXISTS focus_content_accounts(company_id TEXT NOT NULL, id TEXT NOT NULL, platform TEXT NOT NULL CHECK(platform IN ('Instagram','Facebook','TikTok')), PRIMARY KEY(company_id,id));
    CREATE TABLE IF NOT EXISTS focus_social_publications(company_id TEXT NOT NULL, id TEXT NOT NULL, social_account_id TEXT NOT NULL, platform TEXT NOT NULL, external_post_id TEXT NOT NULL, published_at TIMESTAMPTZ NOT NULL, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(company_id,id), UNIQUE(company_id,platform,external_post_id), FOREIGN KEY(company_id,social_account_id) REFERENCES focus_content_accounts(company_id,id));
    CREATE TABLE IF NOT EXISTS focus_publication_metrics(company_id TEXT NOT NULL, publication_id TEXT NOT NULL, date TIMESTAMPTZ NOT NULL, payload JSONB NOT NULL, PRIMARY KEY(company_id,publication_id,date), FOREIGN KEY(company_id,publication_id) REFERENCES focus_social_publications(company_id,id));
    CREATE TABLE IF NOT EXISTS focus_audience_metrics(company_id TEXT NOT NULL, social_account_id TEXT NOT NULL, platform TEXT NOT NULL, date DATE NOT NULL, payload JSONB NOT NULL, PRIMARY KEY(company_id,social_account_id,date), FOREIGN KEY(company_id,social_account_id) REFERENCES focus_content_accounts(company_id,id));
    CREATE TABLE IF NOT EXISTS focus_follower_metrics(company_id TEXT NOT NULL, social_account_id TEXT NOT NULL, platform TEXT NOT NULL, date DATE NOT NULL, payload JSONB NOT NULL, PRIMARY KEY(company_id,social_account_id,date), FOREIGN KEY(company_id,social_account_id) REFERENCES focus_content_accounts(company_id,id));
    CREATE TABLE IF NOT EXISTS focus_ad_metrics(company_id TEXT NOT NULL, id TEXT NOT NULL, social_account_id TEXT NOT NULL, publication_id TEXT, platform TEXT NOT NULL, date DATE NOT NULL, payload JSONB NOT NULL, PRIMARY KEY(company_id,id), FOREIGN KEY(company_id,social_account_id) REFERENCES focus_content_accounts(company_id,id), FOREIGN KEY(company_id,publication_id) REFERENCES focus_social_publications(company_id,id));
    CREATE TABLE IF NOT EXISTS focus_content_reports(company_id TEXT NOT NULL, platform TEXT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, notes JSONB NOT NULL, version INTEGER NOT NULL DEFAULT 1, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(company_id,platform,start_date,end_date));
    CREATE TABLE IF NOT EXISTS focus_report_recommendations(company_id TEXT NOT NULL, platform TEXT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, source TEXT NOT NULL DEFAULT 'manual', body TEXT NOT NULL, PRIMARY KEY(company_id,platform,start_date,end_date), FOREIGN KEY(company_id,platform,start_date,end_date) REFERENCES focus_content_reports(company_id,platform,start_date,end_date));
    CREATE TABLE IF NOT EXISTS focus_content_syncs(company_id TEXT NOT NULL, platform TEXT NOT NULL, payload JSONB NOT NULL, PRIMARY KEY(company_id,platform));
    CREATE INDEX IF NOT EXISTS focus_publications_period ON focus_social_publications(company_id,platform,published_at);`);
  await db.query(hybridSchema);
  await db.query(`CREATE TABLE IF NOT EXISTS focus_account_insights(company_id TEXT NOT NULL, social_account_id TEXT NOT NULL, captured_at TIMESTAMPTZ NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, scope TEXT NOT NULL, payload JSONB NOT NULL, PRIMARY KEY(company_id,social_account_id,captured_at,scope), FOREIGN KEY(company_id,social_account_id) REFERENCES focus_content_accounts(company_id,id))`);
  return db;
}
export async function productionDataset(query: ReportQuery): Promise<HybridDataset> {
  const db = await reportDb(), start = previousPeriod(query).startDate;
  const { rows } = await db.query(`SELECT p.payload, m.payload AS metrics, m.date AS captured_at FROM focus_social_publications p LEFT JOIN LATERAL (SELECT payload,date FROM focus_publication_metrics WHERE company_id=p.company_id AND publication_id=p.id ORDER BY date DESC LIMIT 1) m ON true WHERE p.company_id=$1 AND (p.published_at AT TIME ZONE 'America/Guayaquil')::date BETWEEN $2::date AND $3::date`, [query.companyId, start, query.endDate]);
  const range = [query.companyId, query.endDate];
  const followers = await db.query("SELECT payload FROM focus_follower_metrics WHERE company_id=$1 AND date<=$2::date ORDER BY date", range);
  const audience = await db.query("SELECT payload FROM focus_audience_metrics WHERE company_id=$1 AND date<=$2::date", range);
  const ads = await db.query("SELECT payload FROM focus_ad_metrics WHERE company_id=$1 AND date BETWEEN $2::date AND $3::date", [query.companyId, start, query.endDate]);
  const notes = await db.query("SELECT notes,version FROM focus_content_reports WHERE company_id=$1 AND platform=$2 AND start_date=$3 AND end_date=$4", [query.companyId, query.platform, query.startDate, query.endDate]);
  const syncs = await db.query("SELECT payload FROM focus_content_syncs WHERE company_id=$1 AND ($2='Todas' OR platform=$2)", [query.companyId,query.platform]);
  const accountInsights = await db.query("SELECT DISTINCT ON (social_account_id,start_date,end_date,scope) payload FROM focus_account_insights WHERE company_id=$1 AND start_date >= $2 AND end_date <= $3 AND ($4='Todas' OR payload->>'platform'=$4) ORDER BY social_account_id,start_date,end_date,scope,captured_at DESC", [query.companyId,query.startDate,query.endDate,query.platform]);
  return { accountInsights: accountInsights.rows.map(r=>r.payload), ...(await readHybrid(query)), publications: rows.map(r => ({ ...r.payload, metrics: { ...emptyMetrics(), ...(r.metrics || {}) }, capturedAt: r.captured_at ? new Date(r.captured_at).toISOString() : r.payload.capturedAt })), followers: followers.rows.map(r => r.payload), audience: audience.rows.map(r => r.payload), ads: ads.rows.map(r => r.payload), notes: notes.rows.length ? { ...notes.rows[0].notes, version: notes.rows[0].version } : blankNotes(), syncs: syncs.rows.map(r=>r.payload), warnings: ["Las cifras de publicaciones son acumuladas a la última consulta, agrupadas por fecha de publicación; no representan actividad diaria histórica.", "El alcance sumado entre publicaciones o redes no equivale a personas únicas.", "Las métricas que la API no entrega o que requieren permisos adicionales se muestran como No disponible.", ...syncs.rows.flatMap(r=>r.payload.warnings||[])] };
}
export async function saveNotes(query: ReportQuery, notes: ReportNotes) {
  const client = await (await reportDb()).connect();
  try {
    await client.query("BEGIN");
    const params = [query.companyId, query.platform, query.startDate, query.endDate, JSON.stringify({ worked: notes.worked, improve: notes.improve, recommendations: notes.recommendations })];
    const { rows } = notes.version === 0
      ? await client.query("INSERT INTO focus_content_reports(company_id,platform,start_date,end_date,notes) VALUES($1,$2,$3,$4,$5::jsonb) ON CONFLICT DO NOTHING RETURNING version", params)
      : await client.query("UPDATE focus_content_reports SET notes=$5::jsonb,version=version+1,updated_at=now() WHERE company_id=$1 AND platform=$2 AND start_date=$3 AND end_date=$4 AND version=$6 RETURNING version", [...params, notes.version]);
    if (!rows.length) { await client.query("ROLLBACK"); return null; }
    await client.query("INSERT INTO focus_report_recommendations(company_id,platform,start_date,end_date,body) VALUES($1,$2,$3,$4,$5) ON CONFLICT(company_id,platform,start_date,end_date) DO UPDATE SET body=$5,source='manual'", [...params.slice(0,4), notes.recommendations]);
    await client.query("COMMIT"); return rows[0].version as number;
  } catch(error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}
export async function importTikTok(companyId: string, data: TikTokSource) {
  const db = await reportDb(), socialAccountId = `TikTok:${data.user.open_id}`;
  if (!data.user.open_id || !Array.isArray(data.videos)) throw new Error("Respuesta TikTok inválida.");
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO focus_content_accounts VALUES($1,$2,'TikTok') ON CONFLICT DO NOTHING", [companyId,socialAccountId]);
    for (const video of data.videos) {
      const id = createHash("sha256").update(JSON.stringify([companyId, "TikTok", video.id])).digest("hex");
      const metrics = { ...emptyMetrics(), views: numeric(video.view_count), likes: numeric(video.like_count), comments: numeric(video.comment_count), shares: numeric(video.share_count), duration: numeric(video.duration) };
      if (typeof video.create_time !== "number" || !Number.isFinite(video.create_time)) throw new Error("Video sin fecha válida.");
      const publishedAt = new Date(video.create_time * 1000).toISOString();
      const availability: NonNullable<SocialPublication["availability"]> = Object.fromEntries(["reach","impressions","saves","clicks","profileVisits","followersGained","totalWatchTime","averageWatchTime","averageWatchPercentage","completePlays","retention"].map(key=>[key,{status:"NOT_SUPPORTED" as const,reason:"La integración actual de TikTok no recibe esta métrica de la API; no se estima."}]));
      const post: SocialPublication = { id, companyId, socialAccountId, platform: "TikTok", externalPostId: video.id, title: video.title || "Video de TikTok", caption: video.video_description || "", mediaUrl: "", thumbnailUrl: video.cover_image_url || "", permalink: video.share_url || "", contentType: "TIKTOK", publishedAt, campaignId: null, paid: null, capturedAt: data.capturedAt, metrics, availability };
      await client.query("INSERT INTO focus_social_publications(company_id,id,social_account_id,platform,external_post_id,published_at,payload) VALUES($1,$2,$3,'TikTok',$4,$5,$6::jsonb) ON CONFLICT(company_id,id) DO UPDATE SET payload=$6::jsonb,social_account_id=EXCLUDED.social_account_id,published_at=EXCLUDED.published_at,updated_at=now()", [companyId,id,socialAccountId,video.id,publishedAt,JSON.stringify(post)]);
      await client.query("INSERT INTO focus_publication_metrics VALUES($1,$2,$3,$4::jsonb) ON CONFLICT DO NOTHING", [companyId,id,data.capturedAt,JSON.stringify(metrics)]);
    }
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil" }).format(new Date(data.capturedAt));
    const follower = { socialAccountId, platform: "TikTok", date, followers: numeric(data.user.follower_count), gained: null, lost: null };
    await client.query("INSERT INTO focus_follower_metrics VALUES($1,$2,'TikTok',$3,$4::jsonb) ON CONFLICT(company_id,social_account_id,date) DO UPDATE SET payload=$4::jsonb", [companyId,socialAccountId,date,JSON.stringify(follower)]);
    await client.query("COMMIT"); return data.videos.length;
  } catch(error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}
export async function importCollector(companyId: string, result: CollectorResult) {
  const socialAccountId = result.accountId;
  if (!socialAccountId.startsWith(`${result.platform}:`) || !socialAccountId.slice(result.platform.length + 1)) throw new Error("Cuenta de informe no válida.");
  const db = await reportDb(), client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO focus_content_accounts VALUES($1,$2,$3) ON CONFLICT DO NOTHING",[companyId,socialAccountId,result.platform]);
    for (const post of result.publications) {
      if (post.companyId!==companyId || post.platform!==result.platform || post.socialAccountId!==socialAccountId) throw new Error("Publicación fuera de la cuenta autorizada.");
      const payload = {...post,metrics: {...emptyMetrics(),...post.metrics}};
      await client.query("INSERT INTO focus_social_publications(company_id,id,social_account_id,platform,external_post_id,published_at,payload) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb) ON CONFLICT(company_id,id) DO UPDATE SET payload=$7::jsonb,social_account_id=EXCLUDED.social_account_id,published_at=EXCLUDED.published_at,updated_at=now()",[companyId,post.id,socialAccountId,post.platform,post.externalPostId,post.publishedAt,JSON.stringify(payload)]);
      await client.query("INSERT INTO focus_publication_metrics VALUES($1,$2,$3,$4::jsonb) ON CONFLICT DO NOTHING",[companyId,post.id,post.capturedAt,JSON.stringify(payload.metrics)]);
    }
    if (result.follower) {
      const f = result.follower;
      if (f.socialAccountId!==socialAccountId || f.platform!==result.platform) throw new Error("Historial fuera de la cuenta autorizada.");
      await client.query("INSERT INTO focus_follower_metrics VALUES($1,$2,$3,$4,$5::jsonb) ON CONFLICT(company_id,social_account_id,date) DO UPDATE SET payload=$5::jsonb",[companyId,socialAccountId,result.platform,f.date,JSON.stringify(f)]);
    }
    for (const insight of result.accountInsights || []) {
      if(insight.accountId!==socialAccountId||insight.platform!==result.platform) throw new Error("Insight fuera de la cuenta autorizada.");
      await client.query("INSERT INTO focus_account_insights VALUES($1,$2,$3,$4,$5,$6,$7::jsonb) ON CONFLICT DO NOTHING",[companyId,socialAccountId,insight.capturedAt,insight.startDate,insight.endDate,insight.scope,JSON.stringify(insight)]);
    }
    await client.query("COMMIT");return result.publications.length;
  } catch(error) {await client.query("ROLLBACK");throw error;} finally {client.release();}
}
export async function saveSyncStatus(companyId: string, result: SyncStatus) {
  await (await reportDb()).query("INSERT INTO focus_content_syncs VALUES($1,$2,$3::jsonb) ON CONFLICT(company_id,platform) DO UPDATE SET payload=$3::jsonb",[companyId,result.platform,JSON.stringify(result)]);
}
