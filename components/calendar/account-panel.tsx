"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { cloudClient, type Workspace } from "@/lib/cloud";

type Member = { user_id: string; email: string; role: string };
type Space = { id: string; name: string };
export function AccountPanel({ workspace, locked, onOpen, onLocal, onRefresh, onImport }: {
  workspace: Workspace | null; locked: boolean;
  onOpen: (id: string) => Promise<void>; onLocal: () => void;
  onRefresh: () => Promise<void>; onImport: () => Promise<void>;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const db = cloudClient();

  useEffect(() => {
    if (!db) return;
    const { data } = db.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); });
    return () => data.subscription.unsubscribe();
  }, [db]);

  useEffect(() => {
    if (!db || !user) return;
    let alive = true;
    void db.from("focus_workspaces").select("id,name").order("name").then(({ data, error }) => {
      if (!alive) return;
      if (error) setMessage("No se pudieron cargar tus espacios. Comprueba la conexión y la configuración de la base de datos.");
      else setSpaces(data || []);
    });
    return () => { alive = false; };
  }, [db, user, workspace?.id]);

  async function action(work: () => Promise<void>) {
    if (busy || locked) return;
    setBusy(true); setMessage("");
    try { await work(); } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo completar la operación."); }
    finally { setBusy(false); }
  }
  async function loadMembers() {
    if (!db || !workspace) return;
    const { data, error } = await db.from("focus_members").select("user_id,email,role").eq("workspace_id", workspace.id);
    if (error) throw new Error("No se pudieron cargar los miembros.");
    setMembers(data || []);
  }
  return <details className="account-panel">
    <summary>{workspace ? `Espacio compartido · ${workspace.name}` : "Cuenta y colaboración"}</summary>
    {!db ? <p>El trabajo compartido aún no está conectado. Puedes seguir usando el calendario local. El administrador debe configurar el servicio de cuentas para habilitar esta sección.</p> : <>
      <p className="account-mode">{workspace ? "Los cambios se guardan en la nube. Se comprueban novedades cada 15 segundos mientras el editor está cerrado." : "Estás trabajando en este navegador. Abre un espacio para trabajar en la nube."}</p>
      {!user ? <form onSubmit={(event) => { event.preventDefault(); void action(async () => {
        const { error } = await db.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw new Error("No se pudo iniciar sesión. Comprueba el correo, la contraseña y la confirmación de tu cuenta.");
        setPassword("");
      }); }}>
        <fieldset disabled={busy || locked} className="account-fields">
          <label>Correo<input type="email" required value={email} autoComplete="email" onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Contraseña<input type="password" required minLength={8} value={password} autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} /></label>
          <div className="template-actions"><button className="primary-button" type="submit">Iniciar sesión</button><button className="secondary-button" type="button" onClick={() => void action(async () => {
            if (!email.trim() || password.length < 8) throw new Error("Introduce un correo válido y una contraseña de al menos 8 caracteres.");
            const { error } = await db.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } });
            if (error) throw new Error("No se pudo crear la cuenta. Comprueba tus datos o vuelve a intentarlo más tarde.");
            setPassword(""); setMessage("Revisa tu correo y confirma la cuenta antes de iniciar sesión.");
          })}>Crear cuenta</button></div>
        </fieldset>
      </form> : <fieldset disabled={busy || locked} className="account-fields">
        <div className="template-actions"><span>{user.email}</span><button type="button" className="secondary-button" onClick={() => void action(async () => {
          const { error } = await db.auth.signOut(); if (error) throw error; onLocal(); setSpaces([]); setMembers([]);
        })}>Cerrar sesión</button></div>
        <label>Mis espacios<select value={workspace?.id || ""} onChange={(e) => { const id = e.target.value; if (id) void action(() => onOpen(id)); else onLocal(); }}>
          <option value="">Calendario local</option>{spaces.map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}
        </select></label>
        <div className="template-actions"><button type="button" className="secondary-button" onClick={() => void action(async () => {
          const { data, error } = await db.from("focus_workspaces").select("id,name").order("name"); if (error) throw error; setSpaces(data || []);
          if (workspace) await onRefresh(); setMessage("Lista de espacios actualizada.");
        })}>Actualizar</button>{workspace && workspace.owner_id === user.id && <button type="button" className="secondary-button" onClick={() => { if (window.confirm("Se copiarán las publicaciones y plantillas locales a este espacio vacío. La copia local se conservará. ¿Continuar?")) void action(onImport); }}>Importar calendario local</button>}</div>
        <label>Nuevo espacio de marca<input maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la marca" /></label>
        <button type="button" className="secondary-button" onClick={() => void action(async () => {
          if (!name.trim()) throw new Error("Escribe el nombre de la marca.");
          const { data, error } = await db.rpc("focus_create_workspace", { workspace_name: name.trim() });
          if (error) throw new Error(error.message); await onOpen(data as string); setName("");
        })}>Crear espacio</button>
        {workspace?.owner_id === user.id && <details className="member-panel"><summary>Gestionar colaboradores</summary>
          <p>La persona debe registrarse y confirmar su correo en esta aplicación. No se envía una invitación automática.</p>
          <label>Correo del colaborador<input type="email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} /></label>
          <label>Permiso<select value={role} onChange={(e) => setRole(e.target.value)}><option value="viewer">Cliente · solo lectura</option><option value="editor">Editor · puede modificar contenido</option></select></label>
          <div className="template-actions"><button type="button" className="secondary-button" onClick={() => void action(async () => {
            const { error } = await db.rpc("focus_add_member", { workspace_id: workspace.id, member_email: memberEmail.trim(), member_role: role });
            if (error) throw new Error(error.message); setMemberEmail(""); await loadMembers(); setMessage("Acceso actualizado. El colaborador puede pulsar Actualizar para ver el espacio.");
          })}>Dar acceso</button><button type="button" className="secondary-button" onClick={() => void action(loadMembers)}>Ver miembros</button></div>
          <ul>{members.map((member) => <li key={member.user_id}>{member.email} · {member.role === "owner" ? "Propietario" : member.role === "editor" ? "Editor" : "Solo lectura"}{member.role !== "owner" && <button type="button" className="danger-button" onClick={() => {
            if (!window.confirm(`¿Retirar el acceso de ${member.email}?`)) return;
            void action(async () => { const { error } = await db.rpc("focus_remove_member", { workspace_id: workspace.id, member_id: member.user_id }); if (error) throw error; await loadMembers(); });
          }}>Retirar acceso</button>}</li>)}</ul>
        </details>}
      </fieldset>}
      {busy && <p role="status">Procesando…</p>}
      {message && <p role="status" className="account-message">{message}</p>}
    </>}
  </details>;
}
