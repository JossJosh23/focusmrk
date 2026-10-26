"use client";

import { useState, type ReactNode } from "react";
import { BatteryFull, Bookmark, Camera, Clapperboard, Globe, Heart, Home, ImagePlus, Inbox, MessageCircle, MoreHorizontal, Music2, Plus, Search, Send, Share2, Signal, SquarePlus, ThumbsUp, Users, Wifi, X } from "lucide-react";
import { NETWORKS, parseDate, type Publication } from "@/lib/calendar";
import { NetworkIcons } from "../content-card";
import { PostMedia } from "./media";
import { Segmented } from "./ui";
import { defaultRatio, publishedText, type Network } from "./model";

type Ratio = "1:1" | "4:5" | "9:16" | "16:9";
type Fit = "contain" | "cover";
const RATIOS: Ratio[] = ["1:1", "4:5", "9:16", "16:9"];
const cssRatio = (ratio: Ratio) => ratio.replace(":", " / ");

/** Real account data from /api/social-profiles: the connected profile, or the company profile as a fallback. */
export type SocialProfile = { name: string; username?: string; picture?: string };
export type SocialProfiles = Partial<Record<"instagram" | "facebook" | "tiktok", SocialProfile>>;

const longDate = new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "long" });
const shortDate = new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "short" });

/** Caption cut to `lines` with an inline "más" toggle (no inner scroll). */
function Caption({ brand, text, lines, more, className = "" }: { brand?: string; text: string; lines: number; more: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > lines * 42 || text.split("\n").length > lines;
  if (!text) return <div className={`cmp-mock-caption-wrap ${className}`}><p className="cmp-mock-caption is-empty">{brand && <b>{brand} </b>}El texto de tu publicación aparecerá aquí.</p></div>;
  return <div className={`cmp-mock-caption-wrap ${className}${open ? " is-open" : ""}`}>
    <p className={`cmp-mock-caption${open ? " is-open" : ""}`} style={{ WebkitLineClamp: open ? "unset" : lines }}>{brand && <b>{brand} </b>}{text}</p>
    {long && <button type="button" className="cmp-mock-more" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "menos" : more}</button>}
  </div>;
}

function Avatar({ name, picture, ring = false, size = "md" }: { name: string; picture?: string; ring?: boolean; size?: "sm" | "md" | "lg" }) {
  const [failed, setFailed] = useState(false);
  const face = picture && !failed
    // eslint-disable-next-line @next/next/no-img-element -- signed provider CDN URLs and data: logos, shown as-is.
    ? <img src={picture} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
    : (name.trim()[0] || "M").toLocaleUpperCase("es");
  return <span className={`cmp-mock-avatar is-${size}${ring ? " has-ring" : ""}`} aria-hidden="true"><span>{face}</span></span>;
}

/** Phone status bar shared by every mockup. */
function StatusBar({ dark = false }: { dark?: boolean }) {
  return <div className={`cmp-mock-status${dark ? " is-dark" : ""}`} aria-hidden="true"><b>9:41</b><span><Signal /><Wifi /><BatteryFull /></span></div>;
}

/** VISTA PREVIA column: network tabs, ratio/fit chips, a phone mockup per network and an optional checklist below. */
export function PostPreview({ post, disabled, profiles = {}, onAddMedia, onRatio, children }: {
  post: Publication; disabled: boolean; profiles?: SocialProfiles;
  onAddMedia: () => void; onRatio: (ratio: number | null) => void; children?: ReactNode;
}) {
  const [tab, setTab] = useState<Network>(post.networks[0] || "Instagram");
  const network: Network = post.networks.includes(tab) ? tab : post.networks[0] || "Instagram";
  const choiceKey = `${post.format}-${network}`;
  const [ratioChoice, setRatioChoice] = useState<{ key: string; value: Ratio } | null>(null);
  const [fit, setFit] = useState<Fit>("contain");
  const ratio: Ratio = ratioChoice?.key === choiceKey ? ratioChoice.value : defaultRatio(post.format, network) as Ratio;
  const brand = post.brand.trim() || "Mi marca";
  const fallbackHandle = brand.toLocaleLowerCase("es").normalize("NFD").replace(/[^a-z0-9._]+/g, "");
  const profile = profiles[network.toLowerCase() as keyof SocialProfiles];
  // Instagram and TikTok show the @handle; Facebook shows the page name.
  const handle = profile?.username || (network === "Facebook" ? undefined : network === "TikTok" && profile ? undefined : fallbackHandle);
  const display = network === "Facebook" ? profile?.name || brand : handle || profile?.name || brand;
  const picture = profile?.picture;
  const text = publishedText(post, network);
  const hasMedia = !!post.mediaId || !!(post.imageUrl.trim() || post.referenceUrl.trim());
  const immersive = network === "TikTok" || post.format === "Reel";
  const story = post.format === "Historia";
  const day = parseDate(post.date);
  const sponsored = post.paid;

  const media = <div className={`cmp-mock-media fit-${fit}`} style={{ aspectRatio: immersive || story ? undefined : cssRatio(ratio) }}>
    {hasMedia ? <PostMedia post={post} thumbnail onRatio={onRatio} /> : <div className="cmp-mock-empty"><span>Sin medio</span><button type="button" className="cmp-button is-secondary" disabled={disabled} onClick={onAddMedia}><ImagePlus size="var(--icon-sm)" aria-hidden="true" />Añadir medio</button></div>}
  </div>;

  let mock: ReactNode;
  if (story) mock = <div className="cmp-mock is-immersive" style={{ aspectRatio: cssRatio(ratio) }}>
    {media}
    <StatusBar dark />
    <div className="cmp-mock-story-bar" aria-hidden="true"><i /></div>
    <div className="cmp-mock-story-head"><Avatar name={display} picture={picture} size="sm" /><b>{display}</b><span>{sponsored ? "Publicidad" : "1 h"}</span><X className="cmp-mock-story-close" aria-hidden="true" /></div>
    <div className="cmp-mock-story-reply" aria-hidden="true"><span>Enviar mensaje</span><Heart /><Send /></div>
  </div>;
  else if (network === "TikTok") mock = <div className="cmp-mock is-immersive is-tiktok" style={{ aspectRatio: cssRatio(ratio) }}>
    {media}
    <StatusBar dark />
    <div className="cmp-mock-feed-tabs" aria-hidden="true"><span>Siguiendo</span><b>Para ti</b><Search /></div>
    <div className="cmp-mock-rail" aria-hidden="true">
      <span className="cmp-mock-follow"><Avatar name={display} picture={picture} /><i><Plus /></i></span>
      <span><Heart />0</span><span><MessageCircle />0</span><span><Bookmark />0</span><span><Share2 />0</span>
      <span className="cmp-mock-disc"><Avatar name={display} picture={picture} size="sm" /></span>
    </div>
    <div className="cmp-mock-overlay">
      <b>{handle ? `@${handle}` : display}</b>
      <Caption text={text} lines={2} more="… más" />
      <span className="cmp-mock-audio"><Music2 size="var(--cal-icon)" aria-hidden="true" /><span>sonido original - {profile?.name || display}</span></span>
    </div>
    <nav className="cmp-mock-nav is-dark" aria-hidden="true"><span><Home />Inicio</span><span><Users />Amigos</span><span className="cmp-mock-create"><Plus /></span><span><Inbox />Bandeja</span><span><Avatar name={display} picture={picture} size="sm" />Perfil</span></nav>
  </div>;
  else if (immersive) mock = <div className="cmp-mock is-immersive" style={{ aspectRatio: cssRatio(ratio) }}>
    {media}
    <StatusBar dark />
    <div className="cmp-mock-feed-tabs is-reels" aria-hidden="true"><b>Reels</b><Camera /></div>
    <div className="cmp-mock-rail" aria-hidden="true">
      <span><Heart />0</span><span><MessageCircle />0</span><span><Send /></span><span><MoreHorizontal /></span>
      <span className="cmp-mock-disc is-square"><Avatar name={display} picture={picture} size="sm" /></span>
    </div>
    <div className="cmp-mock-overlay">
      <span className="cmp-mock-reel-author"><Avatar name={display} picture={picture} size="sm" /><b>{display}</b><span className="cmp-mock-follow-chip">Seguir</span></span>
      <Caption text={text} lines={2} more="… más" />
      <span className="cmp-mock-audio"><Music2 size="var(--cal-icon)" aria-hidden="true" /><span>{display} · Audio original</span></span>
    </div>
  </div>;
  else if (network === "Facebook") mock = <div className="cmp-mock is-feed is-facebook">
    <StatusBar />
    <div className="cmp-mock-appbar" aria-hidden="true"><b className="cmp-mock-wordmark is-facebook">facebook</b><span><SquarePlus /><Search /><MessageCircle /></span></div>
    <div className="cmp-mock-head"><Avatar name={display} picture={picture} /><span className="cmp-mock-id"><b>{display}</b><small>{sponsored ? "Publicidad" : `${shortDate.format(day).replace(".", "")} a las ${post.time}`} · <Globe size="var(--cal-glyph)" aria-label="Público" /></small></span><MoreHorizontal size="var(--icon-md)" aria-hidden="true" /><X size="var(--icon-md)" aria-hidden="true" /></div>
    <Caption text={text} lines={3} more="… Ver más" className="is-facebook" />
    {media}
    <div className="cmp-mock-fb-count" aria-hidden="true"><span className="cmp-mock-reaction"><ThumbsUp /></span>Sé el primero en reaccionar</div>
    <div className="cmp-mock-fb-bar" aria-hidden="true"><span><ThumbsUp size="var(--icon-sm)" />Me gusta</span><span><MessageCircle size="var(--icon-sm)" />Comentar</span><span><Share2 size="var(--icon-sm)" />Compartir</span></div>
  </div>;
  else mock = <div className="cmp-mock is-feed is-instagram">
    <StatusBar />
    <div className="cmp-mock-appbar" aria-hidden="true"><b className="cmp-mock-wordmark">Instagram</b><span><Heart /><Send /></span></div>
    <div className="cmp-mock-head"><Avatar name={display} picture={picture} ring /><span className="cmp-mock-id"><b>{display}</b>{sponsored && <small>Publicidad</small>}</span><MoreHorizontal size="var(--icon-md)" aria-hidden="true" /></div>
    {media}
    {sponsored && <div className="cmp-mock-cta" aria-hidden="true">Más información<span>›</span></div>}
    <div className="cmp-mock-actions" aria-hidden="true"><Heart size="var(--icon-md)" /><MessageCircle size="var(--icon-md)" /><Send size="var(--icon-md)" /><Bookmark size="var(--icon-md)" className="cmp-mock-save" /></div>
    <p className="cmp-mock-likes">Sé el primero en indicar que te gusta</p>
    <Caption brand={display} text={text} lines={2} more="… más" />
    <p className="cmp-mock-date">{longDate.format(day)}</p>
    <nav className="cmp-mock-nav" aria-hidden="true"><Home /><Search /><SquarePlus /><Clapperboard /><Avatar name={display} picture={picture} size="sm" /></nav>
  </div>;

  return <aside className="cmp-preview" aria-label="Vista previa">
    <div className="cmp-preview-tabs" role="group" aria-label="Red de la vista previa">
      {NETWORKS.map(item => <button type="button" key={item} aria-pressed={network === item} disabled={!post.networks.includes(item)} title={post.networks.includes(item) ? item : `${item} no está seleccionada`} onClick={() => setTab(item)}><NetworkIcons networks={[item]} size="var(--cal-icon)" />{item}</button>)}
    </div>
    <div className="cmp-preview-options">
      <Segmented<Ratio> label="Proporción de la vista previa" size="sm" value={ratio} onChange={value => setRatioChoice({ key: choiceKey, value })} options={RATIOS.map(value => ({ value, label: value }))} />
      <Segmented<Fit> label="Encuadre" size="sm" value={fit} onChange={setFit} options={[{ value: "contain", label: "Completa" }, { value: "cover", label: "Rellenar" }]} />
    </div>
    <div className="cmp-phone">{mock}</div>
    <p className="cmp-preview-account">{profile ? <>Cuenta: <b>{handle ? `@${handle}` : display}</b></> : <>Sin cuenta de {network} conectada · se usa el nombre de la empresa</>}</p>
    {children}
    <p className="cmp-preview-note">Simulación orientativa. El encuadre no modifica tu archivo y la apariencia final puede variar en cada red.</p>
  </aside>;
}
