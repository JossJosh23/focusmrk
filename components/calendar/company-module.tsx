"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Building2, Globe, Save, Upload, ExternalLink } from "lucide-react";
import { emptyCompanyProfile, validCompanyProfile, type CompanyProfile } from "@/lib/company-profile";
import { CompanySelector } from "./company-selector";
import { SocialPlatformIcon } from "./content-card";

export function CompanyModule({ company, known, server, onChange }: { company: string; known: string[]; server: boolean; onChange: (company: string) => void }) {
  return <section className="company-module"><div className="page-heading"><div><span className="eyebrow">TU CLIENTE, EN UN SOLO LUGAR</span><h1>Empresa<span>.</span></h1><p>Gestiona su identidad, sitio web y presencia en redes.</p></div></div>
    <div className="company-module-selector"><CompanySelector server={server} known={known} value={company} onChange={onChange} /></div>
    {company ? <CompanyForm key={company} company={company} server={server} /> : <div className="company-empty"><Building2 size="var(--icon-display)" /><h2>Elige la empresa que vas a gestionar</h2><p>Usa el selector para elegir una empresa o añadir tu primer cliente.</p></div>}
  </section>;
}

function CompanyForm({ company, server }: { company: string; server: boolean }) {
  const [profile, setProfile] = useState<CompanyProfile>(emptyCompanyProfile(company));
  const [original, setOriginal] = useState(""); const [version, setVersion] = useState(0);
  const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const key = `focusmrk.company-profile.${company}`;
  const dirty = ready && JSON.stringify(profile) !== original;
  useEffect(() => {
    const navigate = (event: Event) => { if (busy || (dirty && !window.confirm("Tienes cambios de empresa sin guardar. ¿Quieres descartarlos?"))) event.preventDefault(); };
    window.addEventListener("focusmrk-before-navigation", navigate);
    return () => window.removeEventListener("focusmrk-before-navigation", navigate);
  }, [dirty, busy]);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        let data;
        if (server) { const response = await fetch(`/api/company-profile?company=${encodeURIComponent(company)}`, { cache: "no-store" }); data = await response.json(); if (!response.ok) throw new Error(data.error); }
        else data = JSON.parse(localStorage.getItem(key) || "null") || { profile: emptyCompanyProfile(company), version: 0 };
        if (!validCompanyProfile(data.profile)) throw new Error("La ficha guardada no es válida.");
        if (active) { setProfile(data.profile); setOriginal(JSON.stringify(data.profile)); setVersion(data.version); setReady(true); }
      } catch (error) { if (active) setMessage(error instanceof Error ? error.message : "No se pudo cargar la empresa."); }
    }
    void load(); return () => { active = false; };
  }, [company, key, server]);
  useEffect(() => { if (!dirty) return; const leave = (event: BeforeUnloadEvent) => event.preventDefault(); window.addEventListener("beforeunload", leave); return () => window.removeEventListener("beforeunload", leave); }, [dirty]);
  function field(key: keyof CompanyProfile, value: string) { setProfile(current => ({ ...current, [key]: value })); }
  return <form className="company-profile-form" onSubmit={async event => {
    event.preventDefault(); if (busy || !ready) return;
    const clean = { ...profile, name: profile.name.trim(), website: profile.website.trim(), instagram: profile.instagram.trim(), facebook: profile.facebook.trim(), tiktok: profile.tiktok.trim() };
    if (!validCompanyProfile(clean)) { setMessage("Revisa los enlaces: usa HTTPS y el dominio de la red correspondiente."); return; }
    setBusy(true); setMessage("");
    try {
      let nextVersion = version + 1;
      if (server) { const response = await fetch("/api/company-profile", { method: "PUT", headers: { "Content-Type": "application/json", "X-FocusMRK-Request": "1" }, body: JSON.stringify({ company, profile: clean, version }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); nextVersion = data.version; }
      else { const current = JSON.parse(localStorage.getItem(key) || "null"); if ((current?.version || 0) !== version) throw new Error("La ficha cambió en otra pestaña. Recarga antes de guardar."); localStorage.setItem(key, JSON.stringify({ profile: clean, version: nextVersion })); }
      setVersion(nextVersion); setProfile(clean); setOriginal(JSON.stringify(clean)); setMessage("Empresa guardada."); window.dispatchEvent(new CustomEvent("focusmrk-company-profile-change", { detail: { company, profile: clean } }));
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar."); } finally { setBusy(false); }
  }}>
    <fieldset disabled={!ready || busy} className="company-identity"><h2><Building2 size="var(--icon-md)" />Identidad de la empresa</h2><div className="company-logo-row"><div className="company-logo">{profile.logo ? <Image unoptimized src={profile.logo} alt="Logo de la empresa" width={96} height={96} /> : <Building2 size="var(--icon-xl)" />}</div><div><label className="company-logo-upload"><Upload size="var(--icon-sm)" />Subir logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={async event => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 500000) { setMessage("Usa un logo PNG, JPG o WebP de hasta 500 KB."); return; } try { const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); }); field("logo", data); } catch { setMessage("No se pudo leer el logo."); } }} /></label><small>PNG, JPG o WebP · Hasta 500 KB</small>{profile.logo && <button type="button" className="company-remove-logo" onClick={() => field("logo", "")}>Quitar logo</button>}</div></div>
    <label>Nombre de la empresa<input required maxLength={80} value={profile.name} onChange={event => field("name", event.target.value)} /></label><label>Descripción<textarea rows={3} maxLength={1000} value={profile.description} onChange={event => field("description", event.target.value)} placeholder="Qué hace la empresa y cómo se comunica" /></label><label><span><Globe size="var(--icon-sm)" />Página web</span><input type="url" placeholder="https://tuempresa.com" value={profile.website} onChange={event => field("website", event.target.value)} /></label>{profile.website.startsWith("https://") && <a href={profile.website} target="_blank" rel="noopener noreferrer">Visitar sitio web <ExternalLink size="var(--icon-sm)" /></a>}</fieldset>
    <fieldset disabled={!ready || busy} className="company-socials"><h2>Redes sociales</h2><p>Guarda los perfiles oficiales de esta empresa.</p>{([['instagram', 'Instagram'], ['facebook', 'Facebook'], ['tiktok', 'TikTok']] as const).map(([key, label]) => <div className="company-social-card" key={key}><div><span className={`company-social-icon ${key}`}><SocialPlatformIcon platform={label} size="var(--icon-lg)" /></span><strong>{label}</strong><span className="company-link-status">{profile[key] ? "Enlace añadido" : "Sin enlace"}</span></div><label>Enlace del perfil<input type="url" value={profile[key]} placeholder={`https://www.${key}.com/...`} onChange={event => field(key, event.target.value)} /></label>{profile[key] && validCompanyProfile({ ...emptyCompanyProfile(company), [key]: profile[key] }) && <a href={profile[key]} target="_blank" rel="noopener noreferrer">Abrir perfil <ExternalLink size="var(--icon-sm)" /></a>}<small>Sin conexión autorizada · Métricas y publicación no disponibles</small></div>)}<div className="company-connection-note"><strong>Conexión de cuentas</strong><p>Guardar un perfil no autoriza el acceso a la cuenta. La conexión para obtener métricas y publicar se habilitará después de configurar las integraciones.</p></div></fieldset>
    <div className="company-save-bar"><span role="status">{message || (!ready ? "Cargando empresa…" : dirty ? "Cambios sin guardar" : "Ficha actualizada")}</span><button type="submit" className="primary-button" disabled={!ready || busy || !dirty}><Save size="var(--icon-sm)" />{busy ? "Guardando…" : "Guardar cambios"}</button></div>
  </form>;
}
