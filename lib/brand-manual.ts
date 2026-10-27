export const BRAND_MANUAL_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
export const BRAND_MANUAL_MAX_BYTES = 25 * 1024 * 1024;
export type BrandManual = { name: string; type: string; size: number; uploadedAt: string };

export const brandManualUrl = (company: string, download = false) => `/api/brand-manual?company=${encodeURIComponent(company)}${download ? "&download=1" : ""}`;
