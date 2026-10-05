import { createHmac } from "node:crypto";
import { settings as instagramSettings } from "../instagram";
import { settings as facebookSettings } from "../meta";
import { numeric, type Platform, type SocialPublication, type AccountMetric } from "./model";
export type CollectorResult = { platform: Platform; accountId: string; publications: SocialPublication[]; follower: AccountMetric | null; warnings: string[] };
export class SocialProviderError extends Error {
  readonly status: number;
  readonly code: number | null;
  constructor(message: string, status = 502, code: number | null = null) { super(message); this.status = status; this.code = code; }
}
export function safeMessage(value: unknown, token = "") {
  let text = typeof value === "string" ? value : "El proveedor no devolvió un mensaje de error.";
  for (const secret of [token, process.env.INSTAGRAM_APP_SECRET, process.env.META_APP_SECRET, process.env.INSTAGRAM_TOKEN_KEY, process.env.META_TOKEN_KEY]) {
    if (secret) for (const encoded of [secret, encodeURIComponent(secret)]) text = text.split(encoded).join("[REDACTED]");
  }
  return text.replace(/https?:\/\/\S+/gi,"[URL REDACTED]").replace(/\b(?:IG|EAA)[a-zA-Z0-9_-]{20,}\b/g,"[REDACTED]").replace(/[\x00-\x1f]/g," ").slice(0,600);
}
export async function graphRequest(platform: Platform, path: string, token: string, params: Record<string,string> = {}) {
  if (platform === "TikTok" || !/^[a-zA-Z0-9_/-]+$/.test(path) || path.startsWith("/") || path.includes("..")) throw new SocialProviderError("Ruta de consulta inválida.",400);
  const config = platform === "Instagram" ? instagramSettings() : facebookSettings();
  const url = new URL(`https://${platform === "Instagram" ? "graph.instagram.com" : "graph.facebook.com"}/${config.version}/${path}`);
  for (const [key,value] of Object.entries(params)) { if (["access_token","client_secret","appsecret_proof"].includes(key)) throw new SocialProviderError("Parámetro de consulta inválido.",400); url.searchParams.set(key,value); }
  if (platform === "Facebook") url.searchParams.set("appsecret_proof",createHmac("sha256",config.secret).update(token).digest("hex"));
  let response: Response;
  try { response = await fetch(url,{headers:{Authorization:`Bearer ${token}`},cache:"no-store",signal:AbortSignal.timeout(20000)}); }
  catch { throw new SocialProviderError(`${platform}: no se pudo contactar con la API. Intenta nuevamente.`,504); }
  let result;
  try {
    result = JSON.parse(await response.text(), (key:string,value:unknown,context?:{source?:string}) => {
      if (["id","user_id"].includes(key) && typeof value === "number") {
        if (context?.source && /^\d+$/.test(context.source)) return context.source;
        if (Number.isSafeInteger(value) && value >= 0) return String(value);
        throw new Error("id_precision");
      }
      return value;
    });
  } catch { throw new SocialProviderError(`${platform}: respuesta inválida de la API (HTTP ${response.status}).`,response.status); }
  if (!response.ok || result?.error) {
    const code = typeof result?.error?.code === "number" ? result.error.code : null;
    const detail = safeMessage(result?.error?.message || result?.error_message,token);
    throw new SocialProviderError(`${platform} HTTP ${response.status}${code !== null ? ` · código ${code}` : ""}: ${detail}`,response.status,code);
  }
  if (!result || typeof result !== "object" || Array.isArray(result)) throw new SocialProviderError(`${platform}: formato de respuesta no válido.`,502);
  return result;
}
export async function collectPages(platform: Platform, path: string, token: string, params: Record<string,string> = {}) {
  const rows: Record<string,unknown>[] = [], seen = new Set<string>();
  let after = "";
  for (let page=0;page<100;page++) {
    const result = await graphRequest(platform,path,token,{limit:"100",...params,...(after?{after}:{})});
    if (!Array.isArray(result.data)) throw new SocialProviderError(`${platform}: la lista de publicaciones no es válida.`,502);
    rows.push(...result.data);
    if (rows.length > 10000) throw new SocialProviderError(`${platform}: el período contiene demasiadas publicaciones. Acorta el rango.`,422);
    if (!result.paging?.next) return rows;
    const cursor = result.paging?.cursors?.after;
    // The provider's paging URL is never fetched: only reuse a validated cursor
    // on our configured endpoint with the token remaining in an auth header.
    if (typeof cursor !== "string" || !cursor || cursor.length > 4096 || seen.has(cursor)) throw new SocialProviderError(`${platform}: no se pudo completar la paginación. Acorta el rango y vuelve a consultar.`,502);
    seen.add(cursor); after = cursor;
  }
  throw new SocialProviderError(`${platform}: se alcanzó el límite de paginación. Acorta el período.`,422);
}
export function metricValue(response: {data?:unknown}, name: string): number | null {
  if (!Array.isArray(response?.data)) return null;
  const entry = response.data.find(item=>item?.name===name);
  if (!entry) return null;
  const direct = numeric(entry.total_value?.value);
  if (direct !== null) return direct;
  // Lifetime post insights expose one scalar value; do not sum unique audiences
  // or invent a number from demographic/interval breakdown objects.
  return Array.isArray(entry.values) && entry.values.length===1 ? numeric(entry.values[0]?.value) : null;
}
