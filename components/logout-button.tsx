"use client";
import { useState } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return <div className="session-actions"><button className="secondary-button" disabled={busy} onClick={async () => {
    setBusy(true); setError(false);
    try {
      const response = await fetch("/api/auth", { method: "DELETE", headers: { "x-focusmrk-request": "1" } });
      if (!response.ok) throw new Error("logout");
      // Discard in-memory private workspace data when the session ends.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    } catch { setError(true); setBusy(false); }
  }}><LogOut size={15} />{busy ? "Saliendo…" : "Cerrar sesión"}</button>{error && <span role="alert">No se pudo cerrar la sesión. Inténtalo de nuevo.</span>}</div>;
}
