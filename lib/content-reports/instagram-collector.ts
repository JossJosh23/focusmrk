import { createHash } from "node:crypto";
import { refresh, seal, unseal, withConnection } from "../instagram";
import { emptyMetrics, numeric, previousPeriod, publicationDate, type AccountMetric, type ContentType, type ReportQuery, type SocialPublication } from "./model";
import { collectPages, graphRequest, metricValue, safeMessage, SocialProviderError, type CollectorResult } from "./provider";

const platform = "Instagram" as const;
const insightsPermission = "instagram_business_manage_insights";
// Meta references: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/insights/
// Metric names: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/instagraminsightsresult.py
const mediaFields = "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,children{media_type,media_url,thumbnail_url}";
const storyFields = "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp";
type Media = Record<string, unknown>;

function url(value: unknown) {
  if (typeof value !== "string") return "";
  try {
    const result = new URL(value);
    if (result.protocol !== "https:" || result.username || result.password || [...result.searchParams.keys()].some(key => /^(access_token|client_secret)$/i.test(key))) return "";
    return result.href;
  } catch { return ""; }
}

function contentType(media: Media): ContentType | null {
  if (media.media_product_type === "STORY") return "STORY";
  if (media.media_product_type === "REELS") return "REEL";
  if (media.media_type === "CAROUSEL_ALBUM") return "CAROUSEL";
  if (media.media_type === "VIDEO") return "VIDEO";
  return media.media_type === "IMAGE" ? "POST" : null;
}

function fatal(error: unknown) {
  return error instanceof SocialProviderError && (error.status === 401 || error.status === 429 || [4, 17, 32, 102, 190, 613, 80004].includes(error.code ?? -1));
}

function permissionDenied(error: unknown) {
  return error instanceof SocialProviderError && [10, 200].includes(error.code ?? -1);
}

// Media insights are lifetime values captured now, not daily history. Only
// /me/media IDs owned by this token are queried; OAuth user_id and /me id can
// belong to different identifier namespaces and are not compared here.
export async function collectInstagram(query: ReportQuery): Promise<CollectorResult> {
  if (query.mode !== "production") throw new SocialProviderError("Selecciona Datos reales para consultar Instagram.", 400);
  const tokens = await withConnection(query.companyId, async client => {
    const { rows } = await client.query("SELECT tokens,status FROM focus_instagram_connections WHERE company=$1", [query.companyId]);
    if (!rows[0] || rows[0].status !== "connected") throw new SocialProviderError("Conecta Instagram para esta empresa antes de consultar sus métricas.", 409);
    const original = unseal(rows[0].tokens, query.companyId);
    const renewed = await refresh(original);
    if (renewed !== original) await client.query("UPDATE focus_instagram_connections SET tokens=$2,expires_at=$3,updated_at=now() WHERE company=$1", [query.companyId, seal(renewed, query.companyId), new Date(renewed.expires)]);
    return renewed;
  });
  if (!tokens.access_token || typeof tokens.user_id !== "string" || !/^\d+$/.test(tokens.user_id)) throw new SocialProviderError("La autorización de Instagram no es válida. Vuelve a conectar.", 401);

  const warnings = new Set<string>();
  const accountId = `${platform}:${tokens.user_id}`;
  const capturedAt = new Date().toISOString();
  const token = tokens.access_token;
  let profile: Record<string, unknown>;
  try { profile = await graphRequest(platform, "me", token, { fields: "id,user_id,username,followers_count" }); }
  catch (error) {
    if (!(error instanceof SocialProviderError) || error.code !== 100 || fatal(error)) throw error;
    // An optional profile field must not block media listing on API versions
    // where it is unavailable. The authenticated /me request remains required.
    profile = await graphRequest(platform, "me", token, { fields: "id,user_id,username" });
    warnings.add(`Instagram: total actual de seguidores no disponible. ${safeMessage(error.message, token)}`);
  }
  if (typeof profile.username !== "string" || !profile.username.trim()) throw new SocialProviderError("Instagram no devolvió el perfil de la cuenta autenticada. Vuelve a conectar.", 502);
  const follower: AccountMetric | null = numeric(profile.followers_count) === null ? null : {
    socialAccountId: accountId, platform, date: publicationDate(capturedAt), followers: numeric(profile.followers_count), gained: null, lost: null,
  };

  // The media edge does not support time-based pagination. Fetch its validated
  // cursor pages and filter publication dates in the report's Ecuador timezone.
  const media = await collectPages(platform, "me/media", token, { fields: mediaFields });
  const prior = previousPeriod(query);
  const today = publicationDate(capturedAt);
  if (query.endDate >= today && prior.startDate <= today) {
    try {
      const stories = await collectPages(platform, "me/stories", token, { fields: storyFields });
      media.push(...stories.map(story => ({ ...story, media_product_type: "STORY" })));
    } catch (error) {
      if (fatal(error)) throw error;
      warnings.add(`Instagram: no se pudieron consultar las historias activas. ${safeMessage(error instanceof Error ? error.message : "Respuesta no disponible.", token)}`);
    }
  }
  warnings.add("Instagram: las métricas son acumuladas por publicación a la fecha de consulta. Las historias antiguas, impresiones retiradas y curvas de retención no están disponibles en esta consulta.");
  let insightsEnabled = Array.isArray(tokens.permissions) && tokens.permissions.includes(insightsPermission);
  const missingPermission = () => warnings.add(`Instagram: vuelve a conectar desde Informes y autoriza ${insightsPermission} para obtener alcance, visualizaciones, guardados, compartidos y tiempos de reproducción.`);
  if (!insightsEnabled) missingPermission();

  // Remember unsupported metrics by format to avoid repeatedly requesting
  // fields that this Graph version has removed. Other metrics remain usable.
  const unsupported = new Map<ContentType, Set<string>>();
  const insights = async (id: string, type: ContentType, names: string[]): Promise<Record<string, number | null>> => {
    const values: Record<string, number | null> = {};
    const omitted = unsupported.get(type) ?? new Set<string>();
    unsupported.set(type, omitted);
    const requested = names.filter(name => !omitted.has(name));
    if (!insightsEnabled || !requested.length) return values;
    const read = async (metrics: string[]) => {
      const response = await graphRequest(platform, `${id}/insights`, token, { metric: metrics.join(","), period: "lifetime" });
      for (const name of metrics) values[name] = metricValue(response, name);
    };
    const recover = (error: unknown) => {
      if (fatal(error)) throw error;
      if (permissionDenied(error)) { insightsEnabled = false; missingPermission(); return; }
      warnings.add(`Instagram: algunas métricas de ${type} no están disponibles. ${safeMessage(error instanceof Error ? error.message : "Respuesta no disponible.", token)}`);
    };
    try { await read(requested); }
    catch (error) {
      recover(error);
      if (!insightsEnabled || !(error instanceof SocialProviderError) || error.code !== 100) return values;
      // A bundle can fail because one metric is unsupported for this media.
      // Isolate that metric instead of losing the rest of the response.
      for (const name of requested) {
        if (!insightsEnabled) break;
        try { await read([name]); }
        catch (singleError) {
          recover(singleError);
          if (singleError instanceof SocialProviderError && singleError.code === 100 && /metric.*(?:invalid|not supported|valid|allowed|must be)|(?:invalid|not supported).*metric/i.test(singleError.message)) omitted.add(name);
        }
      }
    }
    return values;
  };

  const publications: SocialPublication[] = [];
  const seen = new Set<string>();
  for (const item of media) {
    if (!item || typeof item !== "object") continue;
    const externalId = typeof item.id === "string" && /^\d+$/.test(item.id) ? item.id : "";
    const timestamp = typeof item.timestamp === "string" ? Date.parse(item.timestamp) : NaN;
    const type = contentType(item);
    if (!externalId || !Number.isFinite(timestamp) || !type) { warnings.add("Instagram: se omitió una publicación cuyo identificador, fecha o formato no era válido."); continue; }
    if (seen.has(externalId)) continue;
    seen.add(externalId);
    const publishedAt = new Date(timestamp).toISOString();
    const date = publicationDate(publishedAt);
    if (date < prior.startDate || date > query.endDate) continue;

    const metrics = emptyMetrics();
    metrics.likes = numeric(item.like_count);
    metrics.comments = numeric(item.comments_count);
    const common = type === "STORY" ? ["views", "reach", "shares"] : ["views", "reach", "likes", "comments", "saved", "shares"];
    const data = await insights(externalId, type, common);
    metrics.views = data.views ?? null;
    metrics.reach = data.reach ?? null;
    metrics.likes = data.likes ?? metrics.likes;
    metrics.comments = data.comments ?? metrics.comments;
    metrics.saves = data.saved ?? null;
    metrics.shares = data.shares ?? null;
    const extraNames = type === "REEL" ? ["ig_reels_video_view_total_time", "ig_reels_avg_watch_time"] : type === "POST" || type === "CAROUSEL" || type === "STORY" ? ["profile_visits", "follows"] : [];
    const extra = await insights(externalId, type, extraNames);
    metrics.profileVisits = extra.profile_visits ?? null;
    metrics.followersGained = extra.follows ?? null;
    // Instagram returns Reels watch-time metrics in milliseconds; reports use
    // seconds. Do not infer retention or duration from the averages.
    metrics.totalWatchTime = extra.ig_reels_video_view_total_time === undefined || extra.ig_reels_video_view_total_time === null ? null : extra.ig_reels_video_view_total_time / 1000;
    metrics.averageWatchTime = extra.ig_reels_avg_watch_time === undefined || extra.ig_reels_avg_watch_time === null ? null : extra.ig_reels_avg_watch_time / 1000;

    const children = item.children && typeof item.children === "object" ? (item.children as { data?: Media[] }).data : null;
    const child = Array.isArray(children) ? children.find(value => value && typeof value === "object") : undefined;
    const mediaUrl = url(item.media_url) || url(child?.media_url);
    const thumbnailUrl = url(item.thumbnail_url) || url(child?.thumbnail_url) || (item.media_type === "IMAGE" ? mediaUrl : child?.media_type === "IMAGE" ? url(child.media_url) : "");
    const caption = typeof item.caption === "string" ? item.caption.slice(0, 10000) : "";
    publications.push({
      id: createHash("sha256").update(JSON.stringify([query.companyId, platform, externalId])).digest("hex"),
      companyId: query.companyId, socialAccountId: accountId, platform, externalPostId: externalId,
      title: caption.split(/\r?\n/)[0].slice(0, 120) || `Publicación de @${profile.username}`,
      caption, mediaUrl, thumbnailUrl, permalink: url(item.permalink), contentType: type, publishedAt,
      campaignId: null, paid: null, capturedAt, metrics,
    });
  }
  return { platform, accountId, publications, follower, warnings: [...warnings] };
}
