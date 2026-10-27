export type CompanyProfile = {
  name: string; logo: string; website: string; instagram: string; facebook: string; tiktok: string; description: string;
  /** Brand guide for the AI prompt; absent on profiles saved before it existed. */
  brandColors?: string[]; voice?: string; audience?: string; products?: string; avoid?: string;
};
export const BRAND_TEXT_FIELDS = ["voice", "audience", "products", "avoid"] as const;
export const BRAND_TEXT_MAX = 2000;
export const BRAND_COLORS_MAX = 8;
export const HEX_COLOR = /^#[0-9A-F]{6}$/;
export const emptyCompanyProfile = (name: string): CompanyProfile => ({ name, logo: "", website: "", instagram: "", facebook: "", tiktok: "", description: "" });
export function validCompanyProfile(value: unknown): value is CompanyProfile {
  if (!value || typeof value !== "object") return false;
  const p = value as CompanyProfile;
  if (typeof p.name !== "string" || !p.name.trim() || p.name.length > 80 || typeof p.description !== "string" || p.description.length > 1000 || typeof p.logo !== "string" || p.logo.length > 700000 || (p.logo !== "" && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(p.logo))) return false;
  if (p.brandColors !== undefined && (!Array.isArray(p.brandColors) || p.brandColors.length > BRAND_COLORS_MAX || !p.brandColors.every(color => typeof color === "string" && HEX_COLOR.test(color)))) return false;
  if (!BRAND_TEXT_FIELDS.every(key => p[key] === undefined || (typeof p[key] === "string" && p[key].length <= BRAND_TEXT_MAX))) return false;
  return (["website", "instagram", "facebook", "tiktok"] as const).every(key => {
    if (typeof p[key] !== "string" || p[key].length > 2000) return false;
    if (!p[key]) return true;
    try { const url = new URL(p[key]); if (url.protocol !== "https:" || url.username || url.password) return false;
      const host = url.hostname.toLowerCase();
      return key === "website" || host === `${key}.com` || host.endsWith(`.${key}.com`);
    } catch { return false; }
  });
}
