"use client";

import { useEffect, useState } from "react";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";

const networks = [
  { id: "instagram", label: "Instagram", icon: FaInstagram },
  { id: "facebook", label: "Facebook", icon: FaFacebookF },
  { id: "tiktok", label: "TikTok", icon: FaTiktok },
] as const;
type Connections = Partial<Record<typeof networks[number]["id"], boolean>>;

/** Sidebar row with the company's connected networks; each icon opens Empresa, where the connections live. */
export function ConnectedNetworks({ company, server, refresh, onOpen }: { company: string; server: boolean; refresh: unknown; onOpen: () => void }) {
  // Keyed by company so switching companies never shows the previous one's networks.
  const [loaded, setLoaded] = useState<{ company: string; connections: Connections } | null>(null);
  useEffect(() => {
    if (!server || !company) return;
    const controller = new AbortController();
    fetch(`/api/social-connections?company=${encodeURIComponent(company)}`, { signal: controller.signal, cache: "no-store" })
      .then(response => response.ok ? response.json() : {})
      .then(data => setLoaded({ company, connections: data && typeof data === "object" ? data : {} }))
      .catch(() => { if (!controller.signal.aborted) setLoaded({ company, connections: {} }); });
    return () => controller.abort();
  }, [company, server, refresh]);
  const connections = server && company && loaded?.company === company ? loaded.connections : {};
  const connected = networks.filter(({ id }) => connections[id]);
  if (!connected.length) return null;
  return <div className="connected-networks">
    <span className="module-section-label">REDES CONECTADAS</span>
    <ul aria-label="Redes conectadas">{connected.map(({ id, label, icon: Icon }) => <li key={id}>
      <button type="button" className={`connected-network connected-network-${id}`} aria-label={`${label} conectado. Abrir Empresa`} title={`${label} conectado`} onClick={onOpen}>
        <Icon aria-hidden="true" />
      </button>
    </li>)}</ul>
  </div>;
}
