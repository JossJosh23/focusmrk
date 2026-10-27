"use client";

import { useEffect, useState } from "react";
import { Check, Download, Sparkles } from "lucide-react";
import type { Publication } from "@/lib/calendar";
import { validCompanyProfile, type CompanyProfile } from "@/lib/company-profile";
import { brandManualUrl, type BrandManual } from "@/lib/brand-manual";
import { logoColors } from "@/lib/brand-colors";
import { postPrompt, type BrandContext } from "./prompt";

/** The brand guide from Empresa; any part that fails to load is left out rather than blocking the copy. */
export async function brandContext(company: string, server: boolean): Promise<BrandContext> {
  let profile: CompanyProfile | null = null;
  let manual: BrandManual | null = null;
  try {
    const data = server ? await (await fetch(`/api/company-profile?company=${encodeURIComponent(company)}`, { cache: "no-store" })).json()
      : JSON.parse(localStorage.getItem(`focusmrk.company-profile.${company}`) || "null");
    if (validCompanyProfile(data?.profile)) profile = data.profile;
  } catch { /* Copied without the brand profile. */ }
  if (server) try {
    const response = await fetch(brandManualUrl(company), { cache: "no-store" });
    if (response.ok) manual = (await response.json()).manual;
  } catch { /* Copied without the manual note. */ }
  let colors: string[] = [];
  if (!manual && !profile?.brandColors?.length && profile?.logo) colors = await logoColors(profile.logo).catch(() => []);
  return { profile, manualName: manual?.name || "", logoColors: colors };
}

/** Writes text that is still being prepared. ClipboardItem takes the pending text, so Safari keeps the click's permission while it loads. */
export async function copyPending(text: Promise<string>) {
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) { await navigator.clipboard.write([new ClipboardItem({ "text/plain": text.then(value => new Blob([value], { type: "text/plain" })) })]); return; }
  } catch { /* Falls back to writeText below. */ }
  await navigator.clipboard.writeText(await text);
}

/** Copies the whole publication (title, brief, copy…) with the brand guide as a prompt for an AI chat. `compact` shows only the icon. */
export function CopyPromptButton({ post, server, className, compact = false }: { post: Publication; server: boolean; className: string; compact?: boolean }) {
  const [copied, setCopied] = useState<{ state: "ok" | "error"; manual: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!copied) return; const timer = window.setTimeout(() => setCopied(null), copied.manual ? 12000 : 2000); return () => window.clearTimeout(timer); }, [copied]);
  async function copy() {
    setBusy(true);
    const company = post.brand.trim();
    const context = brandContext(company, server);
    const text = context.then(brand => postPrompt(post, brand));
    try { await copyPending(text); setCopied({ state: "ok", manual: (await context).manualName }); }
    catch { setCopied({ state: "error", manual: "" }); }
    finally { setBusy(false); }
  }
  const ok = copied?.state === "ok";
  const label = busy ? "Copiando…" : ok ? "Copiado" : copied ? "No se pudo copiar" : "Copiar para IA";
  return <>
    <button type="button" className={`${className}${ok ? " is-copied" : ""}`} aria-label={compact ? "Copiar publicación como prompt para IA" : undefined} disabled={busy}
      title="Copia la publicación y la guía de marca de Empresa para pegarlas en una IA" onClick={() => void copy()}>
      {ok ? <Check size="var(--icon-sm)" aria-hidden="true" /> : <Sparkles size="var(--icon-sm)" aria-hidden="true" />}{!compact && label}
    </button>
    {ok && copied.manual && <a className="cmp-prompt-manual" href={brandManualUrl(post.brand.trim(), true)} download title={`Adjunta «${copied.manual}» en la IA junto al texto`}><Download size="var(--icon-sm)" aria-hidden="true" />{compact ? "Manual" : "Descarga el manual y adjúntalo"}</a>}
    <span className="sr-only" role="status">{ok ? `Publicación copiada como prompt${copied.manual ? ". Adjunta el manual de marca en la IA" : ""}` : copied ? "No se pudo copiar la publicación" : ""}</span>
  </>;
}
