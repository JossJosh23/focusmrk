"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Palette, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { BRAND_COLORS_MAX, BRAND_TEXT_MAX, type CompanyProfile } from "@/lib/company-profile";
import { BRAND_MANUAL_MAX_BYTES, BRAND_MANUAL_TYPES, brandManualUrl, type BrandManual } from "@/lib/brand-manual";
import { logoColors } from "@/lib/brand-colors";

const TEXTS = [
  ["voice", "Tono de voz", "Ej. cercano, alegre, costeño; tutea al cliente y usa emojis con moderación"],
  ["audience", "Público objetivo", "Ej. familias y jóvenes de Manta y Portoviejo que buscan comida típica"],
  ["products", "Productos o platos estrella", "Nombres exactos y cómo se presentan, para que la IA no los cambie"],
  ["avoid", "Qué evitar", "Ej. no prometer envíos gratis, no usar fotos de stock, no hablar de política"],
] as const;
const uploaded = new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "short", year: "numeric" });

/** Brand guide used by "Copiar para IA": manual (saved at once, server only) plus palette and texts (saved with the form). */
export function BrandGuide({ company, server, profile, disabled, onChange }: {
  company: string; server: boolean; profile: CompanyProfile; disabled: boolean;
  onChange: (patch: Partial<CompanyProfile>) => void;
}) {
  const [manual, setManual] = useState<{ company: string; value: BrandManual | null } | null>(null);
  const [manualBusy, setManualBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [picker, setPicker] = useState("#2F6BFF");
  const colors = profile.brandColors || [];
  const current = manual?.company === company ? manual.value : null;

  useEffect(() => {
    if (!server) return;
    let active = true;
    fetch(brandManualUrl(company), { cache: "no-store" })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => { if (active) setManual({ company, value: data.manual }); })
      .catch(() => { if (active) setMessage("No se pudo comprobar el manual de marca."); });
    return () => { active = false; };
  }, [company, server]);

  async function upload(file: File) {
    if (!BRAND_MANUAL_TYPES.includes(file.type) || file.size > BRAND_MANUAL_MAX_BYTES) { setMessage("Sube un PDF, PNG, JPG o WebP de hasta 25 MB."); return; }
    setManualBusy(true); setMessage("");
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch(brandManualUrl(company), { method: "POST", headers: { "X-FocusMRK-Request": "1" }, body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error);
      setManual({ company, value: data.manual }); setMessage("Manual de marca guardado.");
    } catch (error) { setMessage(error instanceof Error && error.message ? error.message : "No se pudo subir el manual."); }
    finally { setManualBusy(false); }
  }
  async function remove() {
    if (!window.confirm("¿Quitar el manual de marca de esta empresa?")) return;
    setManualBusy(true); setMessage("");
    try {
      const response = await fetch(brandManualUrl(company), { method: "DELETE", headers: { "X-FocusMRK-Request": "1" } });
      if (!response.ok) throw new Error();
      setManual({ company, value: null }); setMessage("Manual quitado. La IA usará los colores de la marca o del logo.");
    } catch { setMessage("No se pudo quitar el manual."); }
    finally { setManualBusy(false); }
  }
  async function detect() {
    if (!profile.logo) return;
    try {
      const found = await logoColors(profile.logo);
      if (!found.length) { setMessage("No se encontraron colores en el logo."); return; }
      onChange({ brandColors: [...new Set([...colors, ...found])].slice(0, BRAND_COLORS_MAX) }); setMessage("Colores detectados del logo. Revisa y guarda los cambios.");
    } catch { setMessage("No se pudo leer el logo."); }
  }
  const addColor = (color: string) => { const value = color.toUpperCase(); if (!colors.includes(value) && colors.length < BRAND_COLORS_MAX) onChange({ brandColors: [...colors, value] }); };

  return <fieldset disabled={disabled} className="company-brand">
    <h2><Sparkles size="var(--icon-md)" />Guía de marca</h2>
    <p className="company-brand-intro">Se incluye al pulsar «Copiar para IA» en cada publicación, para que la IA respete la marca.</p>
    <div className="company-brand-grid">
      <div className="company-brand-block">
        <h3><FileText size="var(--icon-sm)" />Manual de marca</h3>
        {!server ? <p className="company-brand-note">Disponible al usar el panel con el servidor.</p>
          : current ? <div className="company-manual">
            <FileText size="var(--icon-lg)" aria-hidden="true" />
            <span><strong>{current.name}</strong><small>{(current.size / 1024 / 1024).toFixed(1)} MB · subido el {uploaded.format(new Date(current.uploadedAt))}</small></span>
            <a href={brandManualUrl(company, true)} download aria-label="Descargar manual"><Download size="var(--icon-sm)" /></a>
            <button type="button" className="company-brand-icon" disabled={manualBusy} aria-label="Quitar manual" onClick={() => void remove()}><Trash2 size="var(--icon-sm)" /></button>
          </div>
          : <p className="company-brand-note">Sin manual: la IA usará los colores de abajo o, si no hay, los del logo.</p>}
        {server && <label className="company-logo-upload"><Upload size="var(--icon-sm)" />{manualBusy ? "Subiendo…" : current ? "Reemplazar manual" : "Subir manual"}<input type="file" accept={BRAND_MANUAL_TYPES.join(",")} disabled={manualBusy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void upload(file); }} /></label>}
        {server && <small className="company-brand-note">PDF, PNG, JPG o WebP · Hasta 25 MB · Se guarda al subirlo. Al copiar el prompt te recordamos adjuntarlo en la IA.</small>}
      </div>
      <div className="company-brand-block">
        <h3><Palette size="var(--icon-sm)" />Colores de marca</h3>
        <ul className="company-colors">{colors.map(color => <li key={color}><span className="company-swatch" style={{ background: color }} aria-hidden="true" />{color}<button type="button" className="company-brand-icon" aria-label={`Quitar ${color}`} onClick={() => onChange({ brandColors: colors.filter(item => item !== color) })}><X size="var(--icon-sm)" /></button></li>)}</ul>
        <div className="company-color-actions">
          <input type="color" aria-label="Elegir color" value={picker} onChange={event => setPicker(event.target.value)} />
          <button type="button" className="secondary-button" disabled={colors.length >= BRAND_COLORS_MAX} onClick={() => addColor(picker)}><Plus size="var(--icon-sm)" />Añadir</button>
          <button type="button" className="secondary-button" disabled={!profile.logo || colors.length >= BRAND_COLORS_MAX} title={profile.logo ? undefined : "Sube primero el logo"} onClick={() => void detect()}><Sparkles size="var(--icon-sm)" />Detectar del logo</button>
        </div>
        <small className="company-brand-note">{colors.length ? `${colors.length} de ${BRAND_COLORS_MAX} colores.` : profile.logo ? "Sin colores: al copiar se usarán los detectados del logo." : "Sube el logo o añade los colores a mano."}</small>
      </div>
    </div>
    <div className="company-brand-texts">{TEXTS.map(([key, label, placeholder]) => <label key={key}>{label}<textarea rows={3} maxLength={BRAND_TEXT_MAX} value={profile[key] || ""} placeholder={placeholder} onChange={event => onChange({ [key]: event.target.value })} /></label>)}</div>
    {message && <p className="company-brand-note" role="status">{message}</p>}
  </fieldset>;
}
