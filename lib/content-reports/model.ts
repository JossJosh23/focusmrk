export const platforms = ["Instagram", "Facebook", "TikTok"] as const;
export type Platform = typeof platforms[number];
export const contentTypes = ["REEL", "POST", "CAROUSEL", "STORY", "VIDEO", "TIKTOK"] as const;
export type ContentType = typeof contentTypes[number];
export const metricLabels = { reach: "Alcance", impressions: "Impresiones", views: "Visualizaciones", interactions: "Interacciones", likes: "Likes", comments: "Comentarios", shares: "Compartidos", saves: "Guardados", followersGained: "Nuevos seguidores", profileVisits: "Visitas al perfil", clicks: "Clics", publications: "Publicaciones" } as const;
export type MetricKey = keyof typeof metricLabels;
export type MetricCoverage = { availableTotal: number | null; availableCount: number; totalCount: number; complete: boolean; unit: "publications" | "observations" | "components"; platforms: Platform[]; missingPlatforms: Platform[] };
export type Metrics = Record<"reach" | "impressions" | "views" | "likes" | "comments" | "shares" | "saves" | "clicks" | "profileVisits" | "followersGained" | "totalWatchTime" | "averageWatchTime" | "duration" | "averageWatchPercentage" | "completePlays", number | null> & { retention: { label: string; value: number | null }[] };
export const emptyMetrics = (): Metrics => ({ reach: null, impressions: null, views: null, likes: null, comments: null, shares: null, saves: null, clicks: null, profileVisits: null, followersGained: null, totalWatchTime: null, averageWatchTime: null, duration: null, averageWatchPercentage: null, completePlays: null, retention: [] });
export type SocialPublication = { id: string; companyId: string; socialAccountId: string; platform: Platform; externalPostId: string; title: string; caption: string; mediaUrl: string; thumbnailUrl: string; permalink: string; contentType: ContentType; publishedAt: string; campaignId: string | null; paid: boolean | null; capturedAt: string; metrics: Metrics; providerMetrics?: { totalInteractions?: number | null; uniqueMediaViewers?: number | null }; availability?: Record<string, { status: import("./hybrid").Availability; reason: string }> };
export type AccountMetric = { socialAccountId: string; platform: Platform; date: string; followers: number | null; gained: number | null; lost: number | null };
export type AudienceMetric = { platform: Platform; date: string; gender: { label: string; value: number }[]; age: { label: string; value: number }[]; cities: { label: string; value: number }[]; countries: { label: string; value: number }[]; followersReach: number | null; nonFollowersReach: number | null; activity: { day: number; hour: number; value: number }[] };
export type AdMetric = { platform: Platform; date: string; publicationId: string | null; spend: number | null; reach: number | null; impressions: number | null; clicks: number | null; conversions: number | null; messages: number | null; results: number | null; currency: string };
export type ReportNotes = { worked: string; improve: string; recommendations: string; version: number };
// Companies and memberships continue to use focus_companies / focus_account_companies.
export type Company = { companyId: string; name: string };
export type SocialAccount = { companyId: string; socialAccountId: string; platform: Platform };
export type PublicationMetric = { companyId: string; socialAccountId: string; platform: Platform; publicationId: string; date: string; metrics: Metrics };
export type FollowerMetric = AccountMetric & { companyId: string };
export type ReportRecommendation = { companyId: string; platform: Platform | "Todas"; startDate: string; endDate: string; source: "manual" | "ai"; body: string };
export type ReportQuery = { companyId: string; platform: Platform | "Todas"; startDate: string; endDate: string; mode: "production" | "demo" };
export type Dataset = { publications: SocialPublication[]; followers: AccountMetric[]; audience: AudienceMetric[]; ads: AdMetric[]; notes: ReportNotes; warnings: string[]; syncs?: SyncStatus[]; accountInsights?: import("./account-insights").AccountInsight[] };
export type SyncStatus = { platform: Platform; status: "success" | "error"; imported: number; capturedAt: string; startDate: string; endDate: string; warnings: string[]; error: string | null };
export const blankNotes = (): ReportNotes => ({ worked: "", improve: "", recommendations: "", version: 0 });
export function validDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= "2000-01-01" && value <= "2100-12-31" && !Number.isNaN(Date.parse(value)) && new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value; }
export function shiftDate(value: string, days: number) { return new Date(Date.parse(value + "T12:00:00Z") + days * 86400000).toISOString().slice(0, 10); }
const publicationDateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil" });
export function publicationDate(value: string) { return publicationDateFormatter.format(new Date(value)); }
export function previousPeriod(query: ReportQuery) { const days = Math.round((Date.parse(query.endDate) - Date.parse(query.startDate)) / 86400000) + 1; return { startDate: shiftDate(query.startDate, -days), endDate: shiftDate(query.startDate, -1) }; }
export function parseQuery(url: URL): ReportQuery {
  const p = url.searchParams, companyId = p.get("companyId") || "", platform = p.get("platform") || "Todas", startDate = p.get("startDate") || "", endDate = p.get("endDate") || "", mode = p.get("mode") || "production";
  if (!companyId.trim() || companyId.length > 80 || !["Todas", ...platforms].includes(platform) || !["production", "demo"].includes(mode) || !validDate(startDate) || !validDate(endDate) || endDate < startDate || Date.parse(endDate) - Date.parse(startDate) > 365 * 86400000) throw new Error("Selecciona empresa, red y fechas válidas (máximo 366 días).");
  return { companyId, platform: platform as ReportQuery["platform"], startDate, endDate, mode: mode as ReportQuery["mode"] };
}
export const numeric = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
export function sum(values: (number | null)[]): number | null { return values.length && values.every(v => v !== null) ? values.reduce<number>((total, value) => total + value!, 0) : null; }
export function interactions(m: Metrics) { return sum([m.likes, m.comments, m.shares, m.saves]); }
export function engagement(m: Metrics) { const total = interactions(m); return total === null || m.reach === null ? null : m.reach === 0 ? 0 : Math.round(total / m.reach * 10000) / 100; }
export function metric(post: SocialPublication, key: string): number | null { if (key === "engagement") return engagement(post.metrics); if (key === "interactions") return interactions(post.metrics); return numeric(post.metrics[key as keyof Metrics]); }
export function variation(current: number | null, previous: number | null) { return current === null || previous === null || previous === 0 ? null : Math.round((current - previous) / previous * 10000) / 100; }
function coverage(samples: { platform: Platform; value: number | null }[], unit: MetricCoverage["unit"]): MetricCoverage {
  const available = samples.filter(sample => sample.value !== null);
  return { availableTotal: available.length ? available.reduce((total, sample) => total + sample.value!, 0) : null, availableCount: available.length, totalCount: samples.length, complete: samples.length > 0 && available.length === samples.length, unit, platforms: platforms.filter(p => available.some(sample => sample.platform === p)), missingPlatforms: platforms.filter(p => samples.some(sample => sample.platform === p && sample.value === null)) };
}
export function buildReport(dataset: Dataset, query: ReportQuery) {
  const prior = previousPeriod(query), accepts = (platform: Platform) => query.platform === "Todas" || platform === query.platform;
  const inRange = (date: string, start: string, end: string) => date.slice(0, 10) >= start && date.slice(0, 10) <= end;
  const filtered = dataset.publications.filter(p => p.companyId === query.companyId && accepts(p.platform));
  const dates = new Map(filtered.map(p => [p, publicationDate(p.publishedAt)]));
  const current = filtered.filter(p => inRange(dates.get(p)!, query.startDate, query.endDate));
  const previous = filtered.filter(p => inRange(dates.get(p)!, prior.startDate, prior.endDate));
  const totals = (posts: SocialPublication[]) => Object.fromEntries(Object.keys(metricLabels).map(key => [key, key === "publications" ? posts.length : sum(posts.map(p => metric(p, key)))])) as Record<MetricKey, number | null>;
  const currentTotals = totals(current), previousTotals = totals(previous);
  // Strict totals remain unchanged for comparisons and derived rates. The UI
  // separately displays received subtotals with explicit coverage, so one
  // missing API value cannot hide known figures from other publications.
  const postCoverage = (posts: SocialPublication[]) => Object.fromEntries(Object.keys(metricLabels).map(key => {
    if (key === "publications") return [key, { ...coverage(posts.map(p => ({ platform: p.platform, value: 1 })), "publications"), availableTotal: posts.length, complete: true }];
    if (key === "interactions") return [key, coverage(posts.flatMap(p => (["likes", "comments", "shares", "saves"] as const).map(component => ({ platform: p.platform, value: numeric(p.metrics[component]) }))), "components")];
    return [key, coverage(posts.map(p => ({ platform: p.platform, value: metric(p, key) })), "publications")];
  })) as Record<MetricKey, MetricCoverage>;
  const followerCoverage = (start: string, end: string, platform?: Platform) => coverage(dataset.followers.filter(f => accepts(f.platform) && (!platform || f.platform === platform) && inRange(f.date, start, end)).map(f => ({ platform: f.platform, value: numeric(f.gained) })), "observations");
  const summaryCoverage = postCoverage(current), previousCoverage = postCoverage(previous);
  summaryCoverage.followersGained = followerCoverage(query.startDate, query.endDate);
  previousCoverage.followersGained = followerCoverage(prior.startDate, prior.endDate);
  currentTotals.followersGained = sum(dataset.followers.filter(f=>accepts(f.platform)&&inRange(f.date,query.startDate,query.endDate)).map(f=>f.gained));
  previousTotals.followersGained = sum(dataset.followers.filter(f=>accepts(f.platform)&&inRange(f.date,prior.startDate,prior.endDate)).map(f=>f.gained));
  const comparison = (Object.keys(metricLabels) as MetricKey[]).map(key => ({ key, label: metricLabels[key], current: currentTotals[key], previous: previousTotals[key], currentCoverage: summaryCoverage[key], previousCoverage: previousCoverage[key], change: summaryCoverage[key].complete && previousCoverage[key].complete ? variation(currentTotals[key], previousTotals[key]) : null }));
  const networkSummaries = platforms.filter(accepts).map(platform => {
    const posts = current.filter(p => p.platform === platform), summary = totals(posts), values = postCoverage(posts);
    values.followersGained = followerCoverage(query.startDate, query.endDate, platform);
    summary.followersGained = values.followersGained.complete ? values.followersGained.availableTotal : null;
    return { platform, summary, coverage: values };
  });
  const followers = platforms.filter(accepts).flatMap(platform => {
    const accounts = [...new Set(dataset.followers.filter(f => f.platform === platform).map(f => f.socialAccountId))];
    return (accounts.length ? accounts : [""]).map(socialAccountId => {
    const records = dataset.followers.filter(f => f.platform === platform && f.socialAccountId === socialAccountId).sort((a, b) => a.date.localeCompare(b.date));
    const before = records.filter(f => f.date < query.startDate).at(-1), after = records.filter(f => f.date <= query.endDate).at(-1);
    const window = records.filter(f => inRange(f.date, query.startDate, query.endDate));
    const initial = before?.followers ?? null, final = after && after.date >= query.startDate ? after.followers : null;
    return { platform, socialAccountId, initial, final, initialDate: before?.date ?? null, finalDate: after?.date ?? null, gained: sum(window.map(f => f.gained)), lost: sum(window.map(f => f.lost)), net: initial !== null && final !== null ? final - initial : null, change: variation(final, initial), series: window };
    });
  });
  const days = Math.round((Date.parse(query.endDate) - Date.parse(query.startDate)) / 86400000) + 1;
  const series = Array.from({ length: days }, (_, i) => { const date = shiftDate(query.startDate, i); return { date, networks: platforms.filter(accepts).map(platform => ({ platform, ...totals(current.filter(p => p.platform === platform && dates.get(p) === date)), followers: sum(followers.filter(f=>f.platform===platform).map(f=>f.series.find(v=>v.date===date)?.followers??null)) })) }; });
  const audience = dataset.audience.filter(a => accepts(a.platform) && inRange(a.date, query.startDate, query.endDate));
  const latestAudience = platforms.filter(accepts).flatMap(platform => audience.filter(a => a.platform === platform).sort((a,b) => b.date.localeCompare(a.date)).slice(0,1));
  const ads = dataset.ads.filter(a => accepts(a.platform) && inRange(a.date, query.startDate, query.endDate));
  const currencies = [...new Set(ads.map(a => a.currency))];
  const paid = { spend: currencies.length > 1 ? null : sum(ads.map(a => a.spend)), reach: sum(ads.map(a => a.reach)), impressions: sum(ads.map(a => a.impressions)), clicks: sum(ads.map(a => a.clicks)), conversions: sum(ads.map(a => a.conversions)), messages: sum(ads.map(a => a.messages)), results: sum(ads.map(a => a.results)), currency: currencies.length === 1 ? currencies[0] : null };
  const ratio = (a: number | null, b: number | null, scale = 1) => a !== null && b !== null && b > 0 ? a / b * scale : null;
  return { query, prior, comparison, summary: currentTotals, summaryCoverage, networkSummaries, publications: current.map(p => ({ ...p, engagementRate: engagement(p.metrics) })), formats: contentTypes.map(type => ({ type, count: current.filter(p => p.contentType === type).length })), series, followers, audience: latestAudience, ads: { ...paid, cpm: ratio(paid.spend, paid.impressions, 1000), cpc: ratio(paid.spend, paid.clicks), ctr: ratio(paid.clicks, paid.impressions, 100), costPerResult: ratio(paid.spend, paid.results), rows: ads }, organic: totals(current.filter(p => p.paid === false)), unknownDistribution: current.filter(p => p.paid === null).length, notes: dataset.notes, warnings: dataset.warnings, syncs: dataset.syncs || [] };
}
export type ContentReport = ReturnType<typeof buildReport>;
