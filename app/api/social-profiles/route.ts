import { database } from "@/lib/database";
import { authorize } from "@/lib/tiktok";
import * as instagram from "@/lib/instagram";
import * as meta from "@/lib/meta";
import * as tiktok from "@/lib/tiktok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Profile = { name: string; username?: string; picture?: string };
type Profiles = { instagram?: Profile; facebook?: Profile; tiktok?: Profile };

// Provider picture URLs are signed and expire after hours or days, so they are re-read at most every 30 minutes.
const CACHE_MS = 30 * 60 * 1000;
const cache = new Map<string, { at: number; profiles: Profiles }>();
const https = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  try { return new URL(value).protocol === "https:" ? value : undefined; } catch { return undefined; }
};
const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim().slice(0, 120) : undefined;

/** Read-only: uses stored tokens as they are and never refreshes or writes them; a failing network is simply left out. */
async function load(company: string): Promise<Profiles> {
  const db = await database();
  const profiles: Profiles = {};
  const row = async (table: string) => {
    try { return (await db.query(`SELECT * FROM ${table} WHERE company = $1`, [company])).rows[0]; } catch { return undefined; }
  };
  await Promise.all([
    (async () => {
      const current = await row("focus_instagram_connections");
      if (!current || current.status !== "connected" || new Date(current.expires_at).getTime() <= Date.now()) return;
      const username = text(current.snapshot?.instagram?.username);
      if (username) profiles.instagram = { name: username, username };
      try {
        const me = await instagram.graph("me", instagram.unseal(current.tokens, company).access_token, "username,name,profile_picture_url");
        const handle = text(me.username) || username;
        if (handle) profiles.instagram = { name: text(me.name) || handle, username: handle, picture: https(me.profile_picture_url) };
      } catch { /* Keep the stored username. */ }
    })(),
    (async () => {
      const current = await row("focus_meta_connections");
      if (!current || (current.status && current.status !== "connected")) return;
      const snapshot = meta.publicSnapshot(current.snapshot);
      const pageId = snapshot?.selectedPage || snapshot?.accounts?.[0]?.facebook.id;
      const stored = snapshot?.accounts?.find(account => account.facebook.id === pageId)?.facebook;
      if (!pageId || !stored) return;
      profiles.facebook = { name: stored.name };
      try {
        const tokens = meta.unseal(current.tokens, company);
        if (meta.tokenExpired(tokens)) return;
        const page = tokens.pages.find(item => item.id === pageId);
        const picture = await meta.graph(`${pageId}/picture`, page?.access_token || tokens.access_token, { redirect: "0", type: "large" });
        profiles.facebook.picture = https(picture?.data?.url);
      } catch { /* Keep the stored page name. */ }
    })(),
    (async () => {
      const current = await row("focus_tiktok_connections");
      if (!current) return;
      const name = text(current.snapshot?.user?.display_name);
      if (name) profiles.tiktok = { name };
      try {
        const tokens = tiktok.unseal(current.tokens, company);
        if (tokens.expires <= Date.now()) return;
        const user = await tiktok.profile(tokens.access_token);
        const display = text(user.display_name) || name;
        if (display) profiles.tiktok = { name: display, picture: https(user.avatar_url) };
      } catch { /* Keep the stored display name. */ }
    })(),
  ]);
  // Networks without a live account fall back to the company profile: its logo and the handles typed in Empresa.
  const stored = (await row("focus_company_profiles"))?.profile;
  if (stored && typeof stored === "object") {
    const logo = typeof stored.logo === "string" && /^data:image\/(png|jpeg|webp);base64,/.test(stored.logo) ? stored.logo : undefined;
    for (const network of ["instagram", "facebook", "tiktok"] as const) {
      const handle = handleFrom(stored[network]);
      const current = profiles[network];
      if (!current && (handle || logo)) profiles[network] = { name: network === "facebook" ? text(stored.name) || company : handle || company, username: network === "facebook" ? undefined : handle, picture: logo };
      else if (current && !current.picture) current.picture = logo;
    }
  }
  return profiles;
}

/** "@marca", "marca" or "https://instagram.com/marca/" → "marca". */
function handleFrom(value: unknown) {
  const raw = text(value);
  if (!raw) return undefined;
  let handle = raw;
  try { handle = new URL(raw).pathname.split("/").filter(Boolean)[0] || ""; } catch { /* Not a URL: already a handle. */ }
  handle = handle.replace(/^@/, "");
  return /^[\w.]{1,60}$/.test(handle) ? handle : undefined;
}

export async function GET(request: Request) {
  const company = new URL(request.url).searchParams.get("company") || "";
  const denied = await authorize(request, company); if (denied) return denied;
  const hit = cache.get(company);
  if (hit && Date.now() - hit.at < CACHE_MS) return Response.json(hit.profiles, { headers: { "Cache-Control": "private, no-store" } });
  try {
    const profiles = await load(company);
    cache.set(company, { at: Date.now(), profiles });
    return Response.json(profiles, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return Response.json({ error: "No se pudieron cargar los perfiles conectados." }, { status: 503 }); }
}
