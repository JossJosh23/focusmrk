"use client";
import { useEffect, useRef, useState } from "react";
import { readReports, validReport, type Report } from "@/lib/reports";

export function useReports(company: string, server: boolean, initial: Report) {
  const [plan, setPlan] = useState(initial);
  const [baseline, setBaseline] = useState(JSON.stringify(initial));
  const [saved, setSaved] = useState<Report[]>([]);
  const [ready, setReady] = useState(false); const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(""); const version = useRef(0); const raw = useRef<string | null>(null); const lock = useRef(false);
  const key = `focusmrk.reports.v1.${company}`;
  const dirty = ready && JSON.stringify(plan) !== baseline;
  useEffect(() => {
    let active = true;
    async function load() {
      if (!company) return;
      try {
        let data;
        if (server) { const r = await fetch(`/api/reports?company=${encodeURIComponent(company)}`, { cache: "no-store" }); data = await r.json(); if (!r.ok) throw new Error(data.error); }
        else { raw.current = localStorage.getItem(key); data = raw.current ? JSON.parse(raw.current) : { plans: [], version: 0 }; }
        const plans = readReports(data.plans);
        if (!Number.isSafeInteger(data.version) || data.version < 0) throw new Error("Versión de reportes no válida.");
        if (active) { setSaved(plans); version.current = data.version; setReady(true); }
      } catch (e) { if (active) setMessage(e instanceof Error ? e.message : "No se pudieron cargar los reportes."); }
    }
    void load(); return () => { active = false; };
  }, [company, key, server]);
  useEffect(() => {
    const navigate = (event: Event) => { if (lock.current || (dirty && !window.confirm("Tienes cambios del reporte sin guardar. ¿Quieres salir sin guardarlos?"))) event.preventDefault(); };
    const unload = (event: BeforeUnloadEvent) => { if (dirty || lock.current) event.preventDefault(); };
    window.addEventListener("focusmrk-before-navigation", navigate); window.addEventListener("beforeunload", unload);
    return () => { window.removeEventListener("focusmrk-before-navigation", navigate); window.removeEventListener("beforeunload", unload); };
  }, [dirty]);
  function open(next: Report) {
    if (dirty && !window.confirm("¿Descartar los cambios sin guardar y abrir otro reporte?")) return false;
    setPlan(next); setBaseline(JSON.stringify(next)); setMessage(""); return true;
  }
  async function save(copy = false) {
    if (!ready || lock.current || !validReport({ ...plan, id: plan.id || "new" })) return;
    lock.current = true; setSaving(true); setMessage("");
    try {
      const next = { ...plan, id: copy || !plan.id ? crypto.randomUUID() : plan.id };
      const plans = saved.some(p => p.id === next.id) ? saved.map(p => p.id === next.id ? next : p) : [...saved, next];
      readReports(plans); let nextVersion = version.current + 1;
      if (server) {
        const r = await fetch("/api/reports", { method: "PUT", headers: { "Content-Type": "application/json", "X-FocusMRK-Request": "1" }, body: JSON.stringify({ company, plans, version: version.current }) });
        const data = await r.json(); if (!r.ok) throw new Error(data.error); nextVersion = data.version;
      } else {
        if (localStorage.getItem(key) !== raw.current) throw new Error("Los reportes cambiaron en otra pestaña. Conserva tus cambios y recarga antes de guardar.");
        const nextRaw = JSON.stringify({ plans, version: nextVersion }); localStorage.setItem(key, nextRaw); raw.current = nextRaw;
      }
      version.current = nextVersion; setSaved(plans); setPlan(next); setBaseline(JSON.stringify(next)); setMessage("Cronograma guardado.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "No se pudo guardar."); }
    finally { lock.current = false; setSaving(false); }
  }
  return { plan, setPlan, saved, ready, saving, message, dirty, open, save };
}
