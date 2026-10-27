import { CAPTION_LIMITS, MAX_CAROUSEL, overrideKey, postMediaIds, validReferenceUrl, type NETWORKS, type Publication } from "@/lib/calendar";

export type Network = (typeof NETWORKS)[number];
export type ComposerTab = "post" | "brief" | "ads";
/** Fields the checklist can send the user to. */
export type FieldTarget = "title" | "media" | "caption" | "networks" | "date" | "imageUrl" | "referenceUrl";

/** Patch that sets the post's library files in order. A second file turns a Post into a Carrusel; files replace any link. */
export function withMedia(post: Publication, ids: string[]): Partial<Publication> {
  const unique = [...new Set(ids.filter(Boolean))].slice(0, MAX_CAROUSEL);
  return {
    mediaId: unique[0] || "",
    mediaIds: unique.length > 1 ? unique : undefined,
    ...(unique.length ? { imageUrl: "" } : {}),
    ...(unique.length > 1 && post.format === "Post" ? { format: "Carrusel" as const } : {}),
  };
}

/** Whether the format takes several files (a Reel is a single video). */
export const allowsMany = (format: Publication["format"]) => format !== "Reel";

/** Base text, or the network override when one exists (an empty override is still an override). */
export function captionFor(post: Publication, network: Network | "all") {
  if (network === "all") return post.copy;
  const overrides = post.captionOverrides || {};
  const key = overrideKey(network);
  return key in overrides ? overrides[key] ?? "" : post.copy;
}

/** What each network publishes: caption plus the brand signature, as the old preview composed it. */
export function publishedText(post: Publication, network: Network) {
  return [captionFor(post, network), post.footer].filter(Boolean).join("\n\n");
}

export function counter(post: Publication, network: Network) {
  const length = [...publishedText(post, network)].length;
  const limit = CAPTION_LIMITS[network];
  return { length, limit, level: length > limit ? "over" : length >= limit * 0.9 ? "near" : "ok" } as const;
}

/** Same rules and messages the previous editor enforced before saving. */
export function blockingError(post: Publication): { message: string; target: FieldTarget } | null {
  if (!post.title.trim()) return { message: "Escribe un título para la publicación.", target: "title" };
  if (!post.networks.length) return { message: "Selecciona al menos una red social.", target: "networks" };
  if (!validReferenceUrl(post.imageUrl.trim())) return { message: "Usa un enlace http o https para la imagen o video.", target: "imageUrl" };
  if (!validReferenceUrl(post.referenceUrl.trim())) return { message: "Usa un enlace http o https válido para la referencia visual.", target: "referenceUrl" };
  return null;
}

export type CheckItem = { id: string; label: string; state: "ok" | "warn" | "error"; target?: FieldTarget };

/** Publication readiness. Errors block saving (they mirror blockingError); warnings only inform. */
export function readiness(post: Publication, mediaRatio: number | null, now: Date): CheckItem[] {
  const items: CheckItem[] = [];
  items.push(post.title.trim() ? { id: "title", label: "Tiene título", state: "ok" } : { id: "title", label: "Falta el título", state: "error", target: "title" });
  const files = postMediaIds(post);
  const hasMedia = files.length > 0 || !!post.imageUrl.trim();
  items.push(hasMedia ? { id: "media", label: files.length > 1 ? `Tiene ${files.length} archivos` : "Tiene imagen o video", state: "ok" } : { id: "media", label: "Añade una imagen o video", state: "warn", target: "media" });
  if (post.format === "Carrusel" && files.length < 2) items.push({ id: "carousel", label: "Un carrusel necesita al menos 2 imágenes o videos", state: "warn", target: "media" });
  if (post.format === "Reel" && files.length > 1) items.push({ id: "carousel", label: "Un Reel lleva un solo video: se usará el primero", state: "warn", target: "media" });
  if (!post.networks.length) items.push({ id: "networks", label: "Elige al menos una red", state: "error", target: "networks" });
  else {
    const over = post.networks.filter(network => counter(post, network).level === "over");
    const empty = post.networks.filter(network => !captionFor(post, network).trim());
    items.push({ id: "networks", label: `${post.networks.length} ${post.networks.length === 1 ? "red seleccionada" : "redes seleccionadas"}`, state: "ok" });
    items.push(over.length ? { id: "caption", label: `El texto supera el límite en ${over.join(", ")}`, state: "warn", target: "caption" }
      : empty.length ? { id: "caption", label: `Falta el texto${post.networks.length > 1 ? ` en ${empty.join(", ")}` : ""}`, state: "warn", target: "caption" }
      : { id: "caption", label: "Texto dentro del límite de cada red", state: "ok" });
  }
  const scheduled = new Date(`${post.date}T${post.time}:00`);
  items.push(post.status === "Publicado" || scheduled.getTime() > now.getTime()
    ? { id: "date", label: post.status === "Publicado" ? "Marcada como publicada" : "Fecha y hora en el futuro", state: "ok" }
    : { id: "date", label: "La fecha y hora ya pasaron", state: "warn", target: "date" });
  if (mediaRatio !== null) {
    const vertical = post.format === "Reel";
    const ok = vertical ? mediaRatio <= 0.8 : mediaRatio >= 0.75 && mediaRatio <= 1.95;
    items.push(ok ? { id: "ratio", label: "Proporción adecuada para el formato", state: "ok" }
      : { id: "ratio", label: vertical ? "Un Reel necesita un medio vertical (9:16)" : `El medio es muy vertical para un ${post.format === "Carrusel" ? "carrusel" : "post"} (se recortará)`, state: "warn", target: "media" });
  }
  if (!validReferenceUrl(post.imageUrl.trim())) items.push({ id: "imageUrl", label: "El enlace de imagen o video no es válido", state: "error", target: "imageUrl" });
  if (!validReferenceUrl(post.referenceUrl.trim())) items.push({ id: "referenceUrl", label: "El enlace de referencia no es válido", state: "error", target: "referenceUrl" });
  return items;
}

/** Default preview ratio for a format on a network (Reels and TikTok are vertical; IG/FB feed 4:5). */
export function defaultRatio(format: Publication["format"], network: Network) {
  return format === "Reel" || network === "TikTok" ? "9:16" : "4:5";
}

export function formatBytes(size: number) {
  return size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`;
}

/** "1080 x 1350 px - 0:12" (AssetPreview metadata) → width / height. */
export function ratioFromMetadata(value: string) {
  const match = value.match(/(\d+)\s*x\s*(\d+)/);
  return match && Number(match[2]) ? Number(match[1]) / Number(match[2]) : null;
}
