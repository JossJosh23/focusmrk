"use client";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [account, setAccount] = useState<{ login: string; company: string; role: string } | null>(null);
  useEffect(() => {
    let active = true;
    void fetch("/api/me", { cache: "no-store" }).then(async response => { if (response.ok) { const data = await response.json(); if (active) setAccount(data.account); } }).catch(() => {});
    return () => { active = false; };
  }, []);
  return <div className="session-actions">{account && <div className="session-identity"><strong>{account.login}</strong><small>{account.role === "marketing_manager" ? "Gestor de marketing" : "Administrador"} · {account.company}</small></div>}<button className="secondary-button" disabled={busy} onClick={async () => {
    setBusy(true); setError(false);
    try {
      const response = await fetch("/api/auth", { method: "DELETE", headers: { "x-focusmrk-request": "1" } });
      if (!response.ok) throw new Error("logout");
      // Discard in-memory private workspace data when the session ends.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    } catch { setError(true); setBusy(false); }
  }}><LogOut size="var(--icon-sm)" />{busy ? "Saliendo…" : "Cerrar sesión"}</button>{error && <span role="alert">No se pudo cerrar la sesión. Inténtalo de nuevo.</span>}</div>;
}
