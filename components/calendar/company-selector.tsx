"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Building2, Plus, X, ChevronDown, Check, Search, Layers } from "lucide-react";

export function CompanySelector({ server, known, value, onChange, canCreate = true }: { server: boolean; known: string[]; value: string; onChange: (value: string) => void; canCreate?: boolean }) {
  const [displayName, setDisplayName] = useState("");
  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try { const data = server && value ? await (await fetch("/api/company-profile?company=" + encodeURIComponent(value))).json() : value ? JSON.parse(localStorage.getItem("focusmrk.company-profile." + value) || "null") : null; if (active) setDisplayName(data?.profile?.name || value); } catch { if (active) setDisplayName(value); }
    }
    const refresh = () => { void loadProfile(); };
    refresh(); window.addEventListener("focusmrk-company-profile-change", refresh);
    return () => { active = false; window.removeEventListener("focusmrk-company-profile-change", refresh); };
  }, [value, server]);
  const menu = useRef<HTMLDetailsElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  function closeMenu() { if (menu.current) { menu.current.open = false; menu.current.querySelector("summary")?.focus(); } }
  function choose(company: string) { onChange(company); closeMenu(); setQuery(""); }
  useEffect(() => {
    function outside(event: PointerEvent) { if (menu.current && !menu.current.contains(event.target as Node)) menu.current.open = false; }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  const [companies, setCompanies] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        let data;
        if (server) { const response = await fetch("/api/companies", { cache: "no-store" }); if (!response.ok) throw new Error(); data = await response.json(); }
        else data = JSON.parse(localStorage.getItem("focusmrk.companies.v1") || "[]");
        if (!Array.isArray(data) || !data.every(item => typeof item === "string")) throw new Error();
        if (active) { setCompanies(data); setReady(true); }
      } catch { if (active) setError("No se pudo cargar la lista. Recarga para intentar de nuevo."); }
    }
    void load(); return () => { active = false; };
  }, [server]);
  const options = Array.from(new Set([...companies, ...known, ...(value ? [value] : [])])).sort((a, b) => a.localeCompare(b, "es"));
  const matches = options.filter(company => company.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")));
  return <div className="company-selector company-switcher">
    <details ref={menu} className="company-menu" onToggle={event => { if (event.currentTarget.open) { setQuery(""); searchInput.current?.focus(); } }} onKeyDown={event => { if (event.key === "Escape" && menu.current?.open) { event.preventDefault(); event.stopPropagation(); closeMenu(); } }}>
      <summary aria-label={`Cambiar empresa: ${value || "Todas las empresas"}`}><span className="company-avatar">{value ? value.slice(0, 2).toLocaleUpperCase("es") : <Layers size="var(--icon-md)" />}</span><span className="company-trigger-text"><small>Empresa</small><strong title={value || "Todas las empresas"}>{displayName || value || "Todas las empresas"}</strong></span><ChevronDown size="var(--icon-sm)" className="company-chevron" /></summary>
      <div className="company-dropdown"><div className="company-dropdown-heading"><strong>Tus empresas</strong><span>{options.length}</span></div><label className="company-search"><Search size="var(--icon-sm)" /><input ref={searchInput} type="search" aria-label="Buscar empresa" placeholder="Buscar empresa..." value={query} onChange={event => setQuery(event.target.value)} aria-controls={listId} /></label>
        <div id={listId} className="company-options"><button type="button" className={value === "" ? "is-current" : ""} aria-pressed={value === ""} onClick={() => choose("")}><span className="company-option-icon"><Layers size="var(--icon-sm)" /></span><span>Todas las empresas<small>Vista general</small></span>{value === "" && <Check size="var(--icon-sm)" />}</button>
          {matches.map(company => <button type="button" key={company} className={value === company ? "is-current" : ""} aria-pressed={value === company} onClick={() => choose(company)}><span className="company-option-icon"><Building2 size="var(--icon-sm)" /></span><span title={company}>{company}</span>{value === company && <Check size="var(--icon-sm)" />}</button>)}
          {!matches.length && <p className="company-no-results">{query ? "No encontramos esa empresa." : "Añade tu primera empresa."}</p>}
        </div>{canCreate && <button type="button" className="company-create" disabled={!ready || busy} onClick={() => { closeMenu(); setAdding(true); }}><Plus size="var(--icon-sm)" />Añadir empresa</button>}
      </div>
    </details>
    {!adding ? null : <form onSubmit={async event => {
      event.preventDefault(); if (busy || !name.trim()) return; setBusy(true); setError("");
      const nextName = options.find(item => item.toLocaleLowerCase("es") === name.trim().toLocaleLowerCase("es")) || name.trim();
      try {
        let next = Array.from(new Set([...companies, nextName]));
        if (server) { const response = await fetch("/api/companies", { method: "POST", headers: { "Content-Type": "application/json", "X-FocusMRK-Request": "1" }, body: JSON.stringify({ name: nextName }) }); if (!response.ok) throw new Error(); }
        else { const latest = JSON.parse(localStorage.getItem("focusmrk.companies.v1") || "[]"); if (!Array.isArray(latest) || !latest.every(item => typeof item === "string")) throw new Error(); next = Array.from(new Set([...latest, ...next])); localStorage.setItem("focusmrk.companies.v1", JSON.stringify(next)); }
        setCompanies(next); onChange(nextName); setAdding(false); setName("");
      } catch { setError("No se pudo guardar la empresa. Inténtalo de nuevo."); } finally { setBusy(false); }
    }}><input autoFocus aria-label="Nombre de la empresa" placeholder="Nombre de la empresa" required maxLength={80} value={name} disabled={busy} onChange={event => setName(event.target.value)} /><div><button type="submit" disabled={busy || !name.trim()}>Guardar</button><button type="button" disabled={busy} aria-label="Cancelar" onClick={() => setAdding(false)}><X size="var(--icon-sm)" /></button></div></form>}{error && <p role="alert">{error}</p>}
  </div>;
}
