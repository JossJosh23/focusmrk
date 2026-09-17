import { Megaphone, Paperclip } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";
import type { Publication } from "@/lib/calendar";
import { PostThumbnail } from "./post-thumbnail";

const socialIcons = { Instagram: FaInstagram, TikTok: FaTiktok, Facebook: FaFacebookF };

export function SocialPlatformIcon({ platform, size = "var(--icon-sm)", active = false }: {
  platform: Publication["networks"][number]; size?: number | string; active?: boolean;
}) {
  const Icon = socialIcons[platform];
  return <span className={`social-icon tooltip ${active ? "active" : ""}`} data-tooltip={platform} role="img" aria-label={platform}>
    <Icon size={size} aria-hidden="true" />
  </span>;
}

export function StatusBadge({ status }: { status: Publication["status"] }) {
  return <span className="workflow-status" data-status={status}><span className="status-dot" />{status}</span>;
}

export function ContentCard({ post, onEdit, agenda = false, draggable = false }: {
  post: Publication; onEdit: (post: Publication) => void; agenda?: boolean; draggable?: boolean;
}) {
  return <article data-status={post.status} className={agenda ? "agenda-post" : "content-item"}>
    <button type="button" draggable={draggable} onDragStart={(event) => { event.dataTransfer.setData("application/x-focusmrk-post", post.id); event.dataTransfer.effectAllowed = "move"; }} className={`post-card ${agenda ? "agenda-card" : ""}`} onClick={() => onEdit(post)} aria-label={`Editar ${post.title}`}>
      <span className="post-top"><span className="post-networks">{post.networks.map((platform) => <SocialPlatformIcon key={platform} platform={platform} />)}</span><time dateTime={`${post.date}T${post.time}`}>{post.time}</time></span>
      <span className="post-title-row"><PostThumbnail key={post.mediaId || post.imageUrl} mediaId={post.mediaId} imageUrl={post.imageUrl} title={post.title} /><strong title={post.title}>{post.title}</strong></span>
      <span className="post-details"><span>{post.format}</span><span aria-hidden="true">·</span>{post.paid ? <span className="paid-icon tooltip" role="img" aria-label="Publicación con pauta" data-tooltip="Publicación con pauta"><Megaphone size="var(--icon-sm)" aria-hidden="true" /></span> : <span>Orgánico</span>}{(post.referenceUrl || post.mediaId) && <span className="tooltip attachment-icon" role="img" aria-label="Referencia visual adjunta" data-tooltip="Referencia visual adjunta"><Paperclip size="var(--icon-sm)" aria-hidden="true" /></span>}</span>
      <StatusBadge status={post.status} />
    </button>
    {agenda && post.referenceUrl && <a className="reference-link" href={post.referenceUrl} target="_blank" rel="noopener noreferrer">Abrir referencia visual ↗</a>}
  </article>;
}
