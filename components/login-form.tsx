"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound } from "lucide-react";

export function LoginForm() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json", "x-focusmrk-request": "1" }, body: JSON.stringify({ user: data.get("user"), password: data.get("password") }) });
      if (!response.ok) { const result = await response.json(); setError(result.error || "No pudimos iniciar sesión. Inténtalo de nuevo."); setBusy(false); return; }
      // Reload the document to discard any cached unauthenticated routes.
      window.location.assign(new URLSearchParams(window.location.search).get("next") === "day" ? "/?module=day" : "/");
    } catch { setError("No pudimos conectar. Revisa tu conexión e inténtalo de nuevo."); setBusy(false); }
  }
  return <form className="login-form" onSubmit={submit}>
    <label htmlFor="login-user">Usuario</label><div className="login-input"><UserRound size="var(--icon-md)" /><input id="login-user" name="user" autoComplete="username" placeholder="Tu usuario" required disabled={busy} maxLength={200} /></div>
    <label htmlFor="login-password">Contraseña</label><div className="login-input"><LockKeyhole size="var(--icon-md)" /><input id="login-password" name="password" type={visible ? "text" : "password"} autoComplete="current-password" placeholder="Tu contraseña" required disabled={busy} maxLength={1024} /><button type="button" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size="var(--icon-md)" /> : <Eye size="var(--icon-md)" />}</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="login-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle size="var(--icon-md)" />Entrando…</> : <>Entrar a mi espacio<ArrowRight size="var(--icon-md)" /></>}</button>
    <p className="login-security"><LockKeyhole size="var(--icon-sm)" /> Tu sesión es privada y segura.</p>
  </form>;
}
