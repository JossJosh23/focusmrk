import { createHash } from "node:crypto";
import { unseal, withConnection } from "../meta";
import { emptyMetrics, numeric, previousPeriod, publicationDate, shiftDate, type AccountMetric, type ContentType, type ReportQuery, type SocialPublication } from "./model";
import { collectPages, graphRequest, metricValue, SocialProviderError, type CollectorResult } from "./provider";

type ObjectValue = Record<string, unknown>;
const object = (value: unknown): ObjectValue => value && typeof value === "object" && !Array.isArray(value) ? value as ObjectValue : {};
const text = (value: unknown) => typeof value === "string" ? value : "";
function safeUrl(value: unknown) {
  try { const url = new URL(text(value)); return url.protocol === "https:" ? url.href : ""; } catch { return ""; }
}
function summaryCount(value: unknown) { return numeric(object(object(value).summary).total_count); }
function fatal(error: unknown) {
  return error instanceof SocialProviderError && (error.status === 401 || error.status === 429 || [190, 4, 17, 32, 613, 80001].includes(error.code ?? -1));
}
function optionalError(error: unknown) {
  return error instanceof SocialProviderError ? error.message : "Facebook no devolvió esta métrica.";
}
function attachmentDetails(post: ObjectValue): { contentType: ContentType; thumbnailUrl: string; mediaUrl: string; title: string } {
  const entries = object(post.attachments).data;
  const attachment = object(Array.isArray(entries) ? entries[0] : null);
  const children = object(attachment.subattachments).data;
  const type = text(attachment.type).toLowerCase();
  const permalink = text(post.permalink_url);
  const image = object(object(attachment.media).image);
  const contentType: ContentType = /\/(?:reel|reels)\//.test(permalink) || type.includes("reel") ? "REEL"
    : type === "album" || (Array.isArray(children) && children.length > 1) ? "CAROUSEL"
      : type.includes("video") || text(post.status_type) === "added_video" ? "VIDEO" : "POST";
  const thumbnailUrl = safeUrl(post.full_picture) || safeUrl(image.src);
  // Attachment URLs usually point to a Facebook permalink, not a video file.
  // Keep mediaUrl empty for videos unless an actual media source is returned.
  return { contentType, thumbnailUrl, mediaUrl: contentType === "POST" || contentType === "CAROUSEL" ? thumbnailUrl : "", title: text(attachment.title) };
}

/** Collect only the Page explicitly selected for this company's Facebook connection. */
export async function collectFacebook(query: ReportQuery): Promise<CollectorResult> {
  return withConnection(query.companyId, async client => {
    const { rows } = await client.query("SELECT tokens,snapshot,status,permissions,expires_at FROM focus_meta_connections WHERE company=$1", [query.companyId]);
    const row = rows[0];
    if (!row || (row.status && row.status !== "connected")) throw new SocialProviderError("Conecta Facebook para esta empresa antes de consultar sus publicaciones.", 409);
    const tokens = unseal(row.tokens, query.companyId);
    if (!Number.isFinite(tokens.expires) || tokens.expires <= Date.now() || (row.expires_at && new Date(row.expires_at).getTime() <= Date.now())) throw new SocialProviderError("La autorización de Facebook venció. Vuelve a conectar la cuenta.", 409);
    const snapshot = object(row.snapshot), selectedPage = text(snapshot.selectedPage);
    if (!/^\d+$/.test(selectedPage)) throw new SocialProviderError("Selecciona la Página de esta empresa en Integraciones antes de consultar Facebook.", 409);
    const page = tokens.pages.find(item => item.id === selectedPage);
    if (!page || typeof page.access_token !== "string" || !page.access_token) throw new SocialProviderError("La Página seleccionada no está autorizada para esta empresa. Vuelve a conectar Facebook.", 409);

    const accountId = `Facebook:${selectedPage}`, capturedAt = new Date().toISOString(), warnings = new Set<string>();
    let follower: AccountMetric | null = null;
    try {
      const profile = await graphRequest("Facebook", selectedPage, page.access_token, { fields: "id,followers_count" });
      if (profile.id !== selectedPage) throw new SocialProviderError("Facebook devolvió una Página distinta de la seleccionada.", 502);
      const followers = numeric(profile.followers_count);
      if (followers !== null) follower = { socialAccountId: accountId, platform: "Facebook", date: publicationDate(capturedAt), followers, gained: null, lost: null };
      else warnings.add("Facebook no devolvió el número de seguidores de la Página.");
    } catch (error) {
      if (fatal(error) || (error instanceof SocialProviderError && error.message === "Facebook devolvió una Página distinta de la seleccionada.")) throw error;
      warnings.add(`No se pudo actualizar el número de seguidores de Facebook. ${optionalError(error)}`);
      // An older snapshot is evidence only for the date when it was captured.
      const accounts = Array.isArray(snapshot.accounts) ? snapshot.accounts : [];
      const prior = object(object(accounts.find(item => object(object(item).facebook).id === selectedPage)).facebook);
      const count = numeric(prior.followers), date = text(snapshot.capturedAt);
      if (count !== null && date && !Number.isNaN(Date.parse(date))) follower = { socialAccountId: accountId, platform: "Facebook", date: publicationDate(date), followers: count, gained: null, lost: null };
    }

    const firstDate = previousPeriod(query).startDate;
    const list = await collectPages("Facebook", `${selectedPage}/published_posts`, page.access_token, {
      fields: "id,created_time,message,permalink_url,full_picture,status_type,attachments{media,type,title,url,subattachments{type,media}},likes.limit(0).summary(true),comments.limit(0).summary(true),shares",
      since: `${firstDate}T00:00:00-05:00`, until: `${shiftDate(query.endDate, 1)}T00:00:00-05:00`, limit: "100",
    });
    const publications: SocialPublication[] = [], seen = new Set<string>();
    for (const value of list) {
      const raw = object(value), id = text(raw.id), created = text(raw.created_time);
      if (!/^[0-9]+(?:_[0-9]+)?$/.test(id) || !created || Number.isNaN(Date.parse(created))) throw new SocialProviderError("Facebook devolvió una publicación sin identificador o fecha válidos.", 502);
      if (id.includes("_") && !id.startsWith(`${selectedPage}_`)) throw new SocialProviderError("Facebook devolvió una publicación de otra Página.", 502);
      const publishedAt = new Date(created).toISOString(), date = publicationDate(publishedAt);
      if (date < firstDate || date > query.endDate || seen.has(id)) continue;
      seen.add(id);
      const media = attachmentDetails(raw), caption = text(raw.message);
      publications.push({ id: createHash("sha256").update(JSON.stringify([query.companyId, "Facebook", id])).digest("hex"), companyId: query.companyId, socialAccountId: accountId, platform: "Facebook", externalPostId: id,
        title: caption.slice(0, 120) || media.title || "Publicación de Facebook", caption, mediaUrl: media.mediaUrl, thumbnailUrl: media.thumbnailUrl, permalink: safeUrl(raw.permalink_url), contentType: media.contentType, publishedAt,
        campaignId: null, paid: null, capturedAt, metrics: { ...emptyMetrics(), likes: summaryCount(raw.likes), comments: summaryCount(raw.comments), shares: numeric(object(raw.shares).count) } });
    }

    // v25+ removed the former impression/reach metric family. Request actual
    // media views; never relabel unique media viewers as reach or views as impressions.
    const enabled = new Set(["post_media_view", "post_clicks"]);
    let insightsDisabled = false;
    function rejected(error: unknown) {
      if (fatal(error)) throw error;
      if (error instanceof SocialProviderError && [10, 200].includes(error.code ?? -1)) {
        insightsDisabled = true;
        warnings.add(`Facebook necesita read_insights y acceso a estadísticas de la Página para consultar vistas y clics. Autoriza el permiso y vuelve a conectar Facebook. ${optionalError(error)}`);
      } else {
        warnings.add(`Algunas estadísticas de publicaciones de Facebook no están disponibles. ${optionalError(error)}`);
      }
    }
    function assign(post: SocialPublication, response: { data?: unknown }, metric: string) {
      if (metric === "post_media_view") post.metrics.views = metricValue(response, metric);
      if (metric === "post_clicks") post.metrics.clicks = metricValue(response, metric);
    }
    async function insights(post: SocialPublication) {
      if (insightsDisabled || !enabled.size) return;
      const requested = [...enabled];
      try {
        const response = await graphRequest("Facebook", `${post.externalPostId}/insights`, page!.access_token, { metric: requested.join(","), period: "lifetime" });
        for (const name of requested) assign(post, response, name);
      } catch (error) {
        if (fatal(error)) throw error;
        if (error instanceof SocialProviderError && error.code === 100 && requested.length > 1) {
          // One format's unsupported metric must not hide a supported metric,
          // including on later posts with a different format.
          for (const name of requested) {
            if (insightsDisabled || !enabled.has(name)) break;
            try { assign(post, await graphRequest("Facebook", `${post.externalPostId}/insights`, page!.access_token, { metric: name, period: "lifetime" }), name); }
            catch (individual) { rejected(individual); }
          }
        } else rejected(error);
      }
    }
    // Probe once before parallel work, avoiding repeated missing-permission calls.
    if (publications[0]) await insights(publications[0]);
    for (let index = 1; index < publications.length && !insightsDisabled && enabled.size; index += 4) await Promise.all(publications.slice(index, index + 4).map(insights));
    if (publications.some(post => post.metrics.views === null || post.metrics.clicks === null)) warnings.add("Facebook no entregó vistas o clics para todas las publicaciones; las métricas ausentes se muestran como No disponible.");
    warnings.add("Facebook: alcance, impresiones, guardados, retención y desglose de anuncios no se obtienen con este recolector. No se sustituyen por otras métricas.");
    return { platform: "Facebook", accountId, publications, follower, warnings: [...warnings] };
  });
}
