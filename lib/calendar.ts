export const NETWORKS = ["Instagram", "TikTok", "Facebook"] as const;
export const FORMATS = ["Post", "Reel", "Historia"] as const;
export const STATUSES = ["Borrador", "En revisión", "Aprobado", "Publicado"] as const;

export type Publication = {
  id: string;
  date: string;
  time: string;
  title: string;
  objective: string;
  production: string;
  networks: (typeof NETWORKS)[number][];
  format: (typeof FORMATS)[number];
  status: (typeof STATUSES)[number];
  paid: boolean;
  copy: string;
  footer: string;
  referenceUrl: string;
  imageUrl: string;
  mediaId: string;
  brand: string;
};

export function dateKey(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  return date;
}

export function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= "0100-01-01" && value <= "9999-12-31" && dateKey(parseDate(value)) === value;
}

export function monthDays(month: Date): Date[] {
  const start = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const offset = (start.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) =>
    new Date(month.getFullYear(), month.getMonth(), index - offset + 1, 12),
  );
}

export function emptyPublication(date: string): Publication {
  return { id: "", date, time: "09:00", title: "", objective: "", production: "", networks: ["Instagram"], format: "Post", status: "Borrador", paid: false, copy: "", footer: "", referenceUrl: "", imageUrl: "", mediaId: "", brand: "Mi marca" };
}

export function validReferenceUrl(value: string): boolean {
  if (value === "") return true;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

export function comparePublications(a: Publication, b: Publication): number {
  return a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.title.localeCompare(b.title, "es");
}

export function isPublication(value: unknown): value is Publication {
  if (!value || typeof value !== "object") return false;
  const post = value as Record<string, unknown>;
  return typeof post.id === "string" && post.id.length > 0 &&
    typeof post.date === "string" && validDate(post.date) &&
    typeof post.time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(post.time) &&
    typeof post.title === "string" && post.title.trim().length > 0 && post.title.length <= 160 &&
    typeof post.objective === "string" && typeof post.production === "string" &&
    Array.isArray(post.networks) && post.networks.length > 0 &&
    post.networks.every((network) => NETWORKS.includes(network)) &&
    new Set(post.networks).size === post.networks.length &&
    FORMATS.some((format) => format === post.format) &&
    STATUSES.some((status) => status === post.status) &&
    typeof post.paid === "boolean" && typeof post.copy === "string" && typeof post.footer === "string" &&
    typeof post.referenceUrl === "string" && validReferenceUrl(post.referenceUrl) &&
    typeof post.imageUrl === "string" && validReferenceUrl(post.imageUrl) &&
    typeof post.mediaId === "string" && typeof post.brand === "string" && post.brand.trim().length > 0 && post.brand.length <= 80;
}

export function readPublications(raw: string | null): Publication[] {
  if (raw === null) return [];
  const parsed: unknown = JSON.parse(raw);
  const data = Array.isArray(parsed) ? parsed.map((post: unknown) => {
    if (!post || typeof post !== "object") return post;
    const record = post as Record<string, unknown>;
    return { ...record, status: record.status === "Listo" ? "Aprobado" : record.status,
      objective: record.objective === undefined ? "" : record.objective,
      production: record.production === undefined ? "" : record.production,
      referenceUrl: record.referenceUrl === undefined ? "" : record.referenceUrl,
      imageUrl: record.imageUrl === undefined ? "" : record.imageUrl,
      mediaId: record.mediaId === undefined ? "" : record.mediaId,
      brand: record.brand === undefined ? "Mi marca" : record.brand };
  }) : parsed;
  if (!Array.isArray(data) || !data.every(isPublication) || new Set(data.map((post) => post.id)).size !== data.length) {
    throw new Error("El calendario guardado no tiene un formato válido.");
  }
  return data;
}
