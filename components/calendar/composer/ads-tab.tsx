"use client";

import { Megaphone } from "lucide-react";
import { type Publication } from "@/lib/calendar";
import { Switch } from "./ui";

/** PAUTA tab. The model only records whether the post is promoted (`paid`), so there is no budget or dates to edit. */
export function AdsTab({ post, disabled, onChange }: { post: Publication; disabled: boolean; onChange: (patch: Partial<Publication>) => void }) {
  return <section className={`cmp-card cmp-ads${post.paid ? " is-on" : ""}`} aria-labelledby="cmp-ads-title">
    <h3 id="cmp-ads-title" className="cmp-card-title">Pauta</h3>
    <div className="cmp-ads-row">
      <span className="cmp-ads-icon" aria-hidden="true"><Megaphone size="var(--icon-md)" /></span>
      <Switch size="lg" checked={post.paid} disabled={disabled} onChange={paid => onChange({ paid })} label="Promocionar con pauta"
        description={post.paid ? "Esta publicación aparecerá marcada con pauta en el calendario y en los filtros." : "Marca este post para publicidad pagada. Podrás filtrarlo en el calendario."} />
    </div>
  </section>;
}
