"use client";

import { useEffect, useRef, useState } from "react";
import { AtSign, Check, Copy, Hash, Smile } from "lucide-react";
import { NETWORKS, overrideKey, type Publication } from "@/lib/calendar";
import { AutoTextarea, Popover, Segmented, Switch } from "./ui";
import { captionFor, counter, publishedText, type Network } from "./model";

const EMOJIS = ["😀", "😂", "😍", "🥳", "😎", "🤩", "😋", "🤤", "🙌", "👏", "💪", "🙏", "👉", "👇", "✅", "✨", "🔥", "⭐", "💥", "🎉", "🎁", "❤️", "💙", "💚", "📍", "📅", "⏰", "📣", "📸", "🎥", "🛒", "💸", "🍽️", "🍹", "☕", "🌮", "🦐", "🐚", "🌊", "☀️", "🌴", "🇪🇨"];
const SHORT: Record<Network, string> = { Instagram: "IG", TikTok: "TT", Facebook: "FB" };

/** TEXTO DE PUBLICACIÓN card: base text plus optional per-network overrides, live counters and the brand signature. */
export function CaptionEditor({ post, disabled, onChange, onEditSignature }: {
  post: Publication; disabled: boolean;
  onChange: (patch: Partial<Publication>) => void;
  onEditSignature: () => void;
}) {
  const [selected, setTarget] = useState<"all" | Network>("all");
  // A network that was deselected while being edited falls back to the base text.
  const target = selected !== "all" && !post.networks.includes(selected) ? "all" : selected;
  const stashedFooter = useRef("");
  const overrides = post.captionOverrides || {};
  const personalized = target !== "all" && overrideKey(target) in overrides;
  const editable = target === "all" || personalized;
  const value = captionFor(post, target);
  function write(text: string) {
    if (target === "all") onChange({ copy: text });
    else onChange({ captionOverrides: { ...overrides, [overrideKey(target)]: text } });
  }
  function personalize(on: boolean) {
    if (target === "all") return;
    const next = { ...overrides };
    if (on) next[overrideKey(target)] = post.copy; else delete next[overrideKey(target)];
    onChange({ captionOverrides: Object.keys(next).length ? next : undefined });
  }
  /** Inserts at the caret of the caption field and keeps the caret after the inserted text. */
  function insert(text: string) {
    if (!editable || disabled) return;
    const field = document.getElementById("cmp-caption") as HTMLTextAreaElement | null;
    const start = field?.selectionStart ?? value.length;
    const end = field?.selectionEnd ?? value.length;
    write(value.slice(0, start) + text + value.slice(end));
    requestAnimationFrame(() => { field?.focus(); field?.setSelectionRange(start + text.length, start + text.length); });
  }
  const signature = !!post.footer.trim();
  // Copies exactly what gets published: this tab's text plus the brand signature.
  const [copied, setCopied] = useState<"ok" | "error" | null>(null);
  useEffect(() => { if (!copied) return; const timer = window.setTimeout(() => setCopied(null), 2000); return () => window.clearTimeout(timer); }, [copied]);
  const copyText = target === "all" ? [post.copy, post.footer].filter(Boolean).join("\n\n") : publishedText(post, target);
  async function copy() {
    try { await navigator.clipboard.writeText(copyText); setCopied("ok"); } catch { setCopied("error"); }
  }
  return <section id="cmp-caption-card" className="cmp-card" aria-labelledby="cmp-caption-title">
    <div className="cmp-card-head">
      <h3 id="cmp-caption-title" className="cmp-card-title">Texto de publicación</h3>
      <Segmented<"all" | Network> label="Red del texto" size="sm" value={target} onChange={setTarget}
        options={[{ value: "all", label: "Todas" }, ...NETWORKS.map(network => ({ value: network, label: <>{network}{overrideKey(network) in overrides ? <i className="cmp-dot" aria-label=" (personalizado)" /> : null}</>, disabled: !post.networks.includes(network), title: post.networks.includes(network) ? undefined : "Red no seleccionada" }))]} />
    </div>
    {target !== "all" && <Switch checked={personalized} disabled={disabled} onChange={personalize} label={`Personalizar para ${target}`} description={personalized ? `${target} usará este texto en lugar del texto base.` : "Ahora se usa el texto base. Actívalo para escribir uno distinto."} />}
    <div className={`cmp-caption${editable ? "" : " is-readonly"}`}>
      <AutoTextarea id="cmp-caption" minRows={6} maxRows={16} value={value} readOnly={!editable} disabled={disabled}
        aria-label={target === "all" ? "Texto base de la publicación" : `Texto para ${target}`}
        placeholder="Escribe el copy, la llamada a la acción y los hashtags…" onChange={event => write(event.target.value)} />
      <div className="cmp-caption-bar">
        <Popover label="Emojis" trigger={({ open, toggle, triggerRef, panelId }) => <button ref={triggerRef} type="button" className="cmp-icon-button" aria-label="Insertar emoji" title="Emoji" aria-expanded={open} aria-controls={panelId} disabled={disabled || !editable} onClick={toggle}><Smile size="var(--icon-sm)" aria-hidden="true" /></button>}>
          {close => <div className="cmp-emoji-grid">{EMOJIS.map(emoji => <button type="button" key={emoji} aria-label={`Insertar ${emoji}`} onClick={() => { insert(emoji); close(); }}>{emoji}</button>)}</div>}
        </Popover>
        <button type="button" className="cmp-icon-button" aria-label="Insertar hashtag" title="Hashtag" disabled={disabled || !editable} onClick={() => insert("#")}><Hash size="var(--icon-sm)" aria-hidden="true" /></button>
        <button type="button" className="cmp-icon-button" aria-label="Insertar mención" title="Mención" disabled={disabled || !editable} onClick={() => insert("@")}><AtSign size="var(--icon-sm)" aria-hidden="true" /></button>
        <button type="button" className={`cmp-icon-button cmp-copy-button${copied === "ok" ? " is-copied" : ""}`} aria-label={signature ? "Copiar texto con la firma" : "Copiar texto"} title={copied === "ok" ? "¡Copiado!" : copied === "error" ? "No se pudo copiar" : signature ? "Copiar texto (incluye la firma)" : "Copiar texto"} disabled={!copyText.trim()} onClick={() => void copy()}>
          {copied === "ok" ? <Check size="var(--icon-sm)" aria-hidden="true" /> : <Copy size="var(--icon-sm)" aria-hidden="true" />}<span className="cmp-copy-label">{copied === "ok" ? "Copiado" : copied === "error" ? "Error" : "Copiar"}</span>
        </button>
        <span className="cmp-sr" role="status">{copied === "ok" ? "Texto copiado" : copied === "error" ? "No se pudo copiar el texto" : ""}</span>
        <ul className="cmp-counters" aria-label="Caracteres por red">
          {post.networks.map(network => { const c = counter(post, network); return <li key={network} className={`is-${c.level}`} title={`${network}: ${c.length} de ${c.limit} caracteres (incluye la firma)`}>{SHORT[network]} {c.length.toLocaleString("es")}/{c.limit.toLocaleString("es")}</li>; })}
        </ul>
      </div>
    </div>
    <div className="cmp-signature">
      <Switch checked={signature} disabled={disabled} label="Añadir firma de la marca"
        description={signature ? `Se añade al final: “${post.footer.trim().split("\n")[0].slice(0, 60)}${post.footer.trim().length > 60 ? "…" : ""}”` : "Usa el campo Firma o contacto del Brief creativo."}
        onChange={on => {
          if (!on) { stashedFooter.current = post.footer; onChange({ footer: "" }); return; }
          if (stashedFooter.current.trim()) onChange({ footer: stashedFooter.current }); else onEditSignature();
        }} />
      <button type="button" className="cmp-link" onClick={onEditSignature}>Editar firma</button>
    </div>
  </section>;
}
