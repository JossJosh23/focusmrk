import { Star, Ellipsis, Clapperboard, GalleryHorizontalEnd, Image as ImageIcon } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";
import { STATUSES, parseDate, type Publication } from "@/lib/calendar";

const socialIcons = { Instagram: FaInstagram, TikTok: FaTiktok, Facebook: FaFacebookF };
const longDate = new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "long" });

export function SocialPlatformIcon({ platform, size = "var(--icon-sm)", active = false }: {
  platform: Publication["networks"][number]; size?: number | string; active?: boolean;
}) {
  const Icon = socialIcons[platform];
  return <span className={`social-icon tooltip ${active ? "active" : ""}`} data-tooltip={platform} role="img" aria-label={platform}>
    <Icon size={size} aria-hidden="true" />
  </span>;
}

const formatIcons = { Post: ImageIcon, Reel: Clapperboard, Carrusel: GalleryHorizontalEnd };

/** Format glyph in the format colour (see [data-format] in globals.css); with `label`, also its name. Decorative unless labelled. */
export function FormatTag({ format, label = false }: { format: Publication["format"]; label?: boolean }) {
  const Icon = formatIcons[format];
  return <span className={`cal-format${label ? " is-labelled" : ""}`} data-format={format} aria-hidden={label ? undefined : true}><Icon size="var(--cal-glyph)" aria-hidden="true" />{label && format}</span>;
}

/** Up to `max` network glyphs plus a "+N" counter; decorative, the parent carries the label. */
export function NetworkIcons({ networks, max = 2, size = "var(--cal-glyph)" }: { networks: Publication["networks"]; max?: number; size?: string }) {
  return <span className="cal-networks" aria-hidden="true">
    {networks.slice(0, max).map(platform => { const Icon = socialIcons[platform]; return <Icon key={platform} size={size} />; })}
    {networks.length > max && <span className="cal-networks-more">+{networks.length - max}</span>}
  </span>;
}

export function StatusBadge({ status, overdue = false }: { status: Publication["status"]; overdue?: boolean }) {
  return overdue ? <span className="workflow-status is-overdue"><span className="status-dot" />Atrasada</span> : <span className="workflow-status" data-status={status}><span className="status-dot" />{status}</span>;
}

/** Screen-reader summary, e.g. "TIKTOK HUMOR #2, Reel, 21 de octubre 09:00, Borrador". */
export function postLabel(post: Publication, overdue: boolean) {
  const date = post.date ? `${longDate.format(parseDate(post.date))} ${post.time}` : "idea sin fecha";
  return [post.title, post.format, date, post.status, overdue && "atrasada", post.paid && "con pauta", post.important && "importante"].filter(Boolean).join(", ");
}

/** Star and quick-status menu; hidden until hover/focus, except a starred post keeps its star. */
export function PostActions({ post, disabled, onToggleImportant, onQuickAction }: {
  post: Publication; disabled: boolean;
  onToggleImportant: (post: Publication) => void;
  onQuickAction: (post: Publication, action: Publication["status"] | "duplicate") => void;
}) {
  return <span className="cal-actions">
    <button type="button" className="cal-star" disabled={disabled} aria-pressed={!!post.important} aria-label={`${post.important ? "Quitar marca de importante" : "Marcar como importante"}: ${post.title}`} onClick={() => onToggleImportant(post)}><Star size="var(--cal-icon)" fill={post.important ? "currentColor" : "none"} aria-hidden="true" /></button>
    <details className="post-quick-actions cal-menu"><summary aria-label={`Acciones de ${post.title}`}><Ellipsis size="var(--cal-icon)" aria-hidden="true" /></summary><div className="post-quick-menu"><span>Cambiar estado</span>{STATUSES.map(status => <button type="button" key={status} disabled={disabled || post.status === status} onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); onQuickAction(post, status); }}>{status}{post.status === status ? " ✓" : ""}</button>)}<button type="button" disabled={disabled} onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); onQuickAction(post, "duplicate"); }}>Duplicar como borrador</button></div></details>
  </span>;
}
