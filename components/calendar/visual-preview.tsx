"use client";

import { SelectedMedia } from "./media-library";
import { LinkMediaPreview } from "./link-media-preview";
import { useState } from "react";
import { NETWORKS, type Publication } from "@/lib/calendar";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ThumbsUp, Share2, ImagePlus, Music2 } from "lucide-react";
import { SocialPlatformIcon } from "./content-card";

export function VisualPreview({ post, onChooseMedia, disabled }: { post: Publication; onChooseMedia: () => void; disabled: boolean }) {
  const [network, setNetwork] = useState<Publication["networks"][number]>(post.networks[0] || "Instagram");
  const [ratio, setRatio] = useState("4 / 5");
  const [fit, setFit] = useState("contain");
  const url = post.imageUrl.trim() || post.referenceUrl.trim();
  const vertical = network === "TikTok" || post.format !== "Post";
  const frameRatio = vertical ? "9 / 16" : ratio;
  const brand = post.brand.trim() || "Mi marca";
  const caption = <p className="social-caption"><strong>{brand}</strong>{" "}{[post.copy, post.footer].filter(Boolean).join("\n\n") || "El texto de tu publicación aparecerá aquí."}</p>;
  return <aside className="social-preview" aria-label="Vista previa de la publicación">
    <div className="preview-heading"><strong>Vista previa</strong><span>Celular · {post.format}</span></div>
    <div className="preview-networks" aria-label="Red de la vista previa">{NETWORKS.map((item) => <button type="button" key={item} aria-pressed={network === item} onClick={() => setNetwork(item)}><SocialPlatformIcon platform={item} />{item}</button>)}</div>
    <details className="preview-adjustments"><summary>Ajustar vista previa</summary><div className="preview-settings">
      <label>Proporción<select disabled={vertical} value={frameRatio} onChange={(event) => setRatio(event.target.value)}>{vertical ? <option value="9 / 16">9:16 · Vertical</option> : <><option value="4 / 5">4:5 · Retrato</option><option value="1 / 1">1:1 · Cuadrado</option><option value="1.91 / 1">1.91:1 · Horizontal</option></>}</select></label>
      <label>Encuadre<select value={fit} onChange={(event) => setFit(event.target.value)}><option value="contain">Imagen completa</option><option value="cover">Rellenar y recortar</option></select></label>
    </div></details>
    <div className="phone-stage"><article className={`social-phone ${vertical ? "immersive" : "feed"} ${network.toLowerCase()}`} aria-label={`Simulación de ${network}`}>
      <div className="phone-status" aria-hidden="true"><span>9:41</span><span>●●● ▰</span></div>
      <div className="social-app-name">{network}{vertical && <span>{post.format === "Historia" ? "Historia" : "Para ti"}</span>}</div>
      {!vertical && <div className="social-profile"><span className="social-avatar">{brand[0].toUpperCase()}</span><div><strong>{brand}</strong>{network === "Facebook" && <small>Ahora · Público</small>}</div><MoreHorizontal size={20} /></div>}
      {!vertical && network === "Facebook" && caption}
      <div className={`social-media fit-${fit}`} style={{ aspectRatio: frameRatio }}>
        {post.mediaId ? <SelectedMedia key={post.mediaId} id={post.mediaId} /> : url ? <LinkMediaPreview key={url} url={url} title={post.title} /> : <button type="button" className="social-empty preview-empty-button" disabled={disabled} onClick={onChooseMedia}><ImagePlus size={32} /><span>Elegir imagen o video de la biblioteca</span></button>}
        {vertical && (post.mediaId || !url) && <><div className="immersive-profile"><span className="social-avatar">{brand[0].toUpperCase()}</span><strong>{brand}</strong></div><div className="immersive-actions" aria-hidden="true"><Heart /><MessageCircle /><Share2 /></div><div className="immersive-caption">{caption}<span><Music2 size={12} /> Audio original · {brand}</span></div></>}
      </div>
      {!vertical && <><div className="social-actions" aria-hidden="true">{network === "Facebook" ? <><ThumbsUp size={19} /><span>Me gusta</span><MessageCircle size={19} /><span>Comentar</span><Share2 size={19} /></> : <><Heart /><MessageCircle /><Send /><Bookmark className="social-bookmark" /></>}</div>{network === "Instagram" && caption}</>}
      <div className="phone-home" aria-hidden="true" />
    </article></div>
    <button type="button" className="secondary-button preview-library-button" disabled={disabled} onClick={onChooseMedia}><ImagePlus size={16} />{post.mediaId || url ? "Cambiar desde la biblioteca" : "Elegir de la biblioteca"}</button>
    <p className="preview-note">Simulación orientativa. El encuadre no modifica tu archivo. La apariencia final puede variar en cada red.</p>
  </aside>;
}
