import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readPublications, type Publication } from "./calendar";
import { readTemplates, type ContentTemplate } from "./templates";

let client: SupabaseClient | null = null;
export function cloudClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key);
  return client;
}
export type Workspace = {
  id: string; name: string; owner_id: string; version: number;
  posts: Publication[]; templates: ContentTemplate[];
};
export function parseWorkspace(value: unknown): Workspace {
  if (!value || typeof value !== "object") throw new Error("Espacio no válido.");
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.name !== "string" || typeof row.owner_id !== "string" ||
    typeof row.version !== "number" || !Number.isSafeInteger(row.version)) throw new Error("Espacio no válido.");
  return { id: row.id, name: row.name, owner_id: row.owner_id, version: row.version,
    posts: readPublications(JSON.stringify(row.posts)), templates: readTemplates(JSON.stringify(row.templates)) };
}
export async function loadWorkspace(id: string): Promise<Workspace> {
  const db = cloudClient();
  if (!db) throw new Error("La conexión compartida no está configurada.");
  const { data, error } = await db.from("focus_workspaces").select("*").eq("id", id).single();
  if (error) throw new Error("No se pudo abrir el espacio. Comprueba tu conexión y tus permisos.");
  return parseWorkspace(data);
}
export async function saveWorkspace(workspace: Workspace, posts: Publication[], templates: ContentTemplate[]): Promise<Workspace> {
  const db = cloudClient();
  if (!db) throw new Error("La conexión compartida no está configurada.");
  const { data, error } = await db.rpc("focus_save_workspace", {
    workspace_id: workspace.id, expected_version: workspace.version, new_posts: posts, new_templates: templates,
  });
  if (error) throw new Error(error.message.includes("CONFLICT")
    ? "Otra persona actualizó el espacio. Conserva tu texto, cierra el editor y pulsa Actualizar antes de volver a guardar."
    : "No se pudo guardar en la nube. Comprueba la conexión y tus permisos; tus cambios siguen en el editor.");
  return parseWorkspace(data);
}
