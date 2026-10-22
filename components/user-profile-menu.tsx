"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { KeyRound, SlidersHorizontal, UserRound, X } from "lucide-react";
import { LogoutButton } from "./logout-button";

type Account = { login: string; display_name: string; role: string; company: string; canChangePassword: boolean };
type Panel = "profile" | "password";
const localKey = "focusmrk.user-profile.v1";

function initials(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : words[0]?.slice(0, 2) || "").toLocaleUpperCase("es");
}

export function UserProfileMenu({ server, onNotifications }: { server: boolean; onNotifications: () => void }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [panel, setPanel] = useState<Panel | null>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        let next: Account;
        if (server) {
          const response = await fetch("/api/me", { cache: "no-store" });
          if (!response.ok) throw new Error();
          const data = await response.json();
          if (!data.account || typeof data.account.login !== "string") throw new Error();
          next = data.account;
        } else {
          let name = "Mi perfil";
          try { const stored = JSON.parse(localStorage.getItem(localKey) || "null"); if (typeof stored?.display_name === "string") name = stored.display_name; } catch { /* A blocked storage still allows opening the local menu. */ }
          next = { login: "Modo local", display_name: name, role: "local", company: "Este navegador", canChangePassword: false };
        }
        if (active) { setAccount(next); setError(""); }
      } catch { if (active) setError("No se pudo cargar tu perfil."); }
    }
    void load();
    return () => { active = false; };
  }, [server, reload]);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !menu.current?.contains(event.target) && menu.current) menu.current.open = false; };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  function open(next: Panel) { if (menu.current) menu.current.open = false; setPanel(next); }
  function close() { setPanel(null); trigger.current?.focus(); }
  return <div className="user-profile">
    <details ref={menu} className="user-profile-disclosure" onKeyDown={event => {
      if (event.key === "Escape" && menu.current?.open) { event.preventDefault(); menu.current.open = false; trigger.current?.focus(); }
      else if (event.key === "ArrowDown" && event.target === trigger.current && menu.current) {
        event.preventDefault(); menu.current.open = true;
        menu.current.querySelector<HTMLButtonElement>(".profile-menu-action:not(:disabled)")?.focus();
      }
    }}>
      <summary ref={trigger} className="profile-trigger" aria-label={`Abrir opciones de ${account?.display_name || "mi perfil"}`} title={account?.display_name || "Mi perfil"}><span className="profile-avatar" aria-hidden="true">{initials(account?.display_name) || <UserRound size="var(--shell-nav-icon)" />}</span></summary>
      <div className="profile-dropdown" onKeyDown={event => {
        // Arrow keys move between enabled actions, wrapping at both ends.
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(".profile-menu-action:not(:disabled)"));
        if (!items.length) return;
        event.preventDefault();
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items[next].focus();
      }}>
        <div className="profile-menu-heading"><span className="profile-avatar profile-avatar-large" aria-hidden="true">{initials(account?.display_name) || <UserRound size="var(--icon-md)" />}</span><div><strong>{account?.display_name || "Mi perfil"}</strong>{account && account.login !== account.display_name && <small>{account.login}</small>}{account ? <span className="profile-role">{account.role === "marketing_manager" ? "Gestor de marketing" : account.role === "administrator" ? "Administrador" : "Perfil local"}</span> : <small>Cargando…</small>}</div></div>
        {error && <p className="profile-message" role="alert">{error} <button type="button" onClick={() => setReload(value => value + 1)}>Reintentar</button></p>}
        <button className="profile-menu-action" type="button" disabled={!account} onClick={() => open("profile")}><UserRound size="var(--icon-sm)" aria-hidden="true" />Editar perfil</button>
        <button className="profile-menu-action" type="button" disabled={!account} onClick={() => open("password")}><KeyRound size="var(--icon-sm)" aria-hidden="true" />Cambiar contraseña</button>
        <button className="profile-menu-action" type="button" onClick={() => { if (menu.current) menu.current.open = false; onNotifications(); }}><SlidersHorizontal size="var(--icon-sm)" aria-hidden="true" />Preferencias</button>
        {server && <LogoutButton className="profile-menu-action profile-logout" />}
      </div>
    </details>
    {panel && account && <ProfileDialog panel={panel} account={account} server={server} onClose={close} onSaved={display_name => setAccount(current => current ? { ...current, display_name } : current)} />}
  </div>;
}

function ProfileDialog({ panel, account, server, onClose, onSaved }: {
  panel: Panel; account: Account; server: boolean; onClose: () => void; onSaved: (name: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const saved = useRef(false);
  const titleId = useId();
  const [name, setName] = useState(account.display_name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const editable = panel === "profile" || account.canChangePassword;
  const dirty = panel === "profile" ? name !== account.display_name : !!(currentPassword || password || confirmation);
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    if (!dirty) return;
    const prevent = (event: BeforeUnloadEvent) => { if (!saved.current) event.preventDefault(); };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  function close() { if (!busy && (!dirty || window.confirm("¿Descartar los cambios sin guardar?"))) onClose(); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !editable) return;
    if (panel === "profile" && !name.trim()) { setError("Escribe tu nombre."); return; }
    if (panel === "password" && password !== confirmation) { setError("Las contraseñas nuevas no coinciden."); return; }
    setBusy(true); setError("");
    try {
      if (panel === "profile" && !server) localStorage.setItem(localKey, JSON.stringify({ display_name: name.trim() }));
      else {
        const response = await fetch("/api/me", {
          method: panel === "profile" ? "PUT" : "PATCH",
          headers: { "Content-Type": "application/json", "x-focusmrk-request": "1" },
          body: JSON.stringify(panel === "profile" ? { display_name: name.trim() } : { currentPassword, newPassword: password }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error || "No se pudo guardar. Vuelve a intentarlo.");
      }
      if (panel === "password") {
        saved.current = true;
        // Drop private in-memory data after revoking all account sessions.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/login");
      } else { onSaved(name.trim()); onClose(); }
    } catch (error) { setError(error instanceof Error ? error.message : "No se pudo guardar."); setBusy(false); }
  }
  return <dialog ref={dialog} className="profile-dialog" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); close(); }}>
    <header><h2 id={titleId}>{panel === "profile" ? "Editar perfil" : "Cambiar contraseña"}</h2><button type="button" className="icon-button" disabled={busy} aria-label="Cerrar" onClick={close}><X size="var(--icon-md)" /></button></header>
    <form onSubmit={submit}>
      <div className="profile-dialog-body">
        {panel === "profile" ? <><label>Nombre visible<input autoFocus autoComplete="name" maxLength={80} required disabled={busy} value={name} onChange={event => setName(event.target.value)} /></label><p>Así aparecerá tu nombre en Kromaiso. Tu usuario de acceso no cambia.</p><dl><dt>Usuario</dt><dd>{account.login}</dd><dt>Empresas</dt><dd>{account.company || "Sin empresas asignadas"}</dd></dl>{!server && <p>Este perfil se guarda solo en este navegador.</p>}</> : account.canChangePassword ? <><p>Usa al menos 16 caracteres. Al guardar, se cerrarán tus sesiones y tendrás que volver a entrar.</p><label>Contraseña actual<input autoFocus required type="password" autoComplete="current-password" maxLength={1024} disabled={busy} value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} /></label><label>Nueva contraseña<input required type="password" autoComplete="new-password" minLength={16} maxLength={1024} disabled={busy} value={password} onChange={event => setPassword(event.target.value)} /></label><label>Confirmar nueva contraseña<input required type="password" autoComplete="new-password" minLength={16} maxLength={1024} disabled={busy} value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label></> : <p>{server ? "La contraseña de administrador se gestiona en la configuración de acceso del servidor. Solicita el cambio a quien administra Kromaiso." : "Este espacio local no utiliza una contraseña de cuenta."}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      <footer><button type="button" className="secondary-button" disabled={busy} onClick={close}>{editable ? "Cancelar" : "Cerrar"}</button>{editable && <button className="primary-button" type="submit" disabled={busy || !dirty}>{busy ? "Guardando…" : "Guardar cambios"}</button>}</footer>
    </form>
  </dialog>;
}
