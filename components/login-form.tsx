"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, Lock, User } from "lucide-react";

const step = (i: number) => ({ "--i": i }) as CSSProperties;

export function LoginForm() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [credentialsError, setCredentialsError] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setError(""); setCredentialsError(false);
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json", "x-focusmrk-request": "1" }, body: JSON.stringify({ user: data.get("user"), password: data.get("password") }) });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setError(result?.error || "No pudimos iniciar sesión. Inténtalo de nuevo.");
        setCredentialsError(response.status === 401);
        setBusy(false); return;
      }
      // Reload the document to discard any cached unauthenticated routes.
      window.location.assign(new URLSearchParams(window.location.search).get("next") === "day" ? "/?module=day" : "/");
    } catch { setError("No pudimos conectar. Revisa tu conexión e inténtalo de nuevo."); setBusy(false); }
  }
  function clearError() { if (error) { setError(""); setCredentialsError(false); } }
  const inputClass = `login-input${credentialsError ? " login-input-error" : ""}`;
  return <form className="login-form" onSubmit={submit} aria-busy={busy}>
    <div className="login-field" style={step(4)}>
      <label htmlFor="login-user">Usuario</label>
      <div className={inputClass}><User className="login-input-icon" size="var(--icon-md)" aria-hidden="true" /><input id="login-user" name="user" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="tu usuario" required disabled={busy} maxLength={200} aria-invalid={credentialsError || undefined} aria-describedby={credentialsError ? "login-error" : undefined} onChange={clearError} /></div>
    </div>
    <div className="login-field" style={step(5)}>
      <div className="login-label-row"><label htmlFor="login-password">Contraseña</label><button type="button" className="login-recovery" aria-expanded={recoveryOpen} aria-controls="login-recovery-help" onClick={() => setRecoveryOpen(!recoveryOpen)}>¿Olvidaste tu contraseña?</button></div>
      {recoveryOpen && <p id="login-recovery-help" className="login-recovery-help">Contacta al administrador de tu equipo para recuperar tu acceso.</p>}
      <div className={inputClass}><Lock className="login-input-icon" size="var(--icon-md)" aria-hidden="true" /><input id="login-password" name="password" type={visible ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" required disabled={busy} maxLength={1024} aria-invalid={credentialsError || undefined} aria-describedby={error ? "login-error" : undefined} onChange={clearError} /><button type="button" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={visible} aria-controls="login-password" disabled={busy} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size="var(--icon-md)" aria-hidden="true" /> : <Eye size="var(--icon-md)" aria-hidden="true" />}</button></div>
    </div>
    {error && <p id="login-error" className="login-field-error" role="alert">{error}</p>}
    <div className="login-field" style={step(6)}>
      <label className="login-remember"><input type="checkbox" disabled aria-describedby="login-session-help" />Mantener sesión iniciada</label>
      <p id="login-session-help" className="login-session-help">No disponible: las sesiones duran 12 horas.</p>
    </div>
    <div className="login-field" style={step(7)}>
      <button className="login-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="login-spinner" size="var(--icon-md)" aria-hidden="true" />Entrando…</> : <>Entrar al espacio<ArrowRight className="login-submit-arrow" size="var(--icon-md)" aria-hidden="true" /></>}</button>
    </div>
  </form>;
}
