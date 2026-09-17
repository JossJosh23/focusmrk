export type CompanyProfile = { name: string; logo: string; website: string; instagram: string; facebook: string; tiktok: string; description: string };
export const emptyCompanyProfile = (name: string): CompanyProfile => ({ name, logo: "", website: "", instagram: "", facebook: "", tiktok: "", description: "" });
export function validCompanyProfile(value: unknown): value is CompanyProfile {
  if (!value || typeof value !== "object") return false;
  const p = value as CompanyProfile;
  if (typeof p.name !== "string" || !p.name.trim() || p.name.length > 80 || typeof p.description !== "string" || p.description.length > 1000 || typeof p.logo !== "string" || p.logo.length > 700000 || (p.logo !== "" && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(p.logo))) return false;
  return (["website", "instagram", "facebook", "tiktok"] as const).every(key => {
    if (typeof p[key] !== "string" || p[key].length > 2000) return false;
    if (!p[key]) return true;
    try { const url = new URL(p[key]); if (url.protocol !== "https:" || url.username || url.password) return false;
      const host = url.hostname.toLowerCase();
      return key === "website" || host === `${key}.com` || host.endsWith(`.${key}.com`);
    } catch { return false; }
  });
}
