import { readPublications, type Publication } from "./calendar";
import { readTemplates, type ContentTemplate } from "./templates";
import { MEDIA_TYPES, MAX_MEDIA_BYTES, mediaBlob, type MediaAsset } from "./media";

export type Backup = { format: "focusmrk-backup"; version: 1; createdAt: string; posts: Publication[]; templates: ContentTemplate[]; assets: (Omit<MediaAsset, "blob" | "remoteUrl"> & { data: string })[] };
export function parseBackup(raw: string): Backup {
  const value = JSON.parse(raw) as Partial<Backup>;
  if (!value || value.format !== "focusmrk-backup" || value.version !== 1 || !Array.isArray(value.assets) || typeof value.createdAt !== "string") throw new Error("Este archivo no es un respaldo compatible de FocusMRK.");
  const posts = readPublications(JSON.stringify(value.posts));
  const templates = readTemplates(JSON.stringify(value.templates));
  for (const a of value.assets) {
    if (!a || typeof a.id !== "string" || !a.id || a.id.length > 200 || typeof a.name !== "string" || a.name.length > 500 || typeof a.brand !== "string" || !a.brand.trim() || a.brand.length > 80 ||
      !MEDIA_TYPES.includes(a.type) || typeof a.createdAt !== "string" || !Number.isFinite(Date.parse(a.createdAt)) || !Number.isInteger(a.size) || a.size <= 0 || a.size > MAX_MEDIA_BYTES ||
      typeof a.data !== "string" || a.data.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(a.data) ||
      a.data.length / 4 * 3 - (a.data.endsWith("==") ? 2 : a.data.endsWith("=") ? 1 : 0) !== a.size) throw new Error("El respaldo contiene un archivo multimedia no válido.");
  }
  const ids = new Set(value.assets.map((a) => a.id));
  if (ids.size !== value.assets.length || posts.some((p) => p.mediaId && !ids.has(p.mediaId))) throw new Error("El respaldo contiene referencias multimedia incompletas o duplicadas.");
  return { format: "focusmrk-backup", version: 1, createdAt: value.createdAt, posts, templates, assets: value.assets.map(({ id, name, brand, type, size, createdAt, data }) => ({ id, name, brand, type, size, createdAt, data })) };
}
export async function createBackup(posts: Publication[], templates: ContentTemplate[], assets: MediaAsset[]): Promise<Backup> {
  const encoded: Backup["assets"] = [];
  if (assets.reduce((sum, a) => sum + a.size, 0) > 180 * 1024 * 1024) throw new Error("La biblioteca supera 180 MB. Descarga y retira archivos que ya no uses antes de generar un respaldo único.");
  for (const asset of assets) {
    const blob = await mediaBlob(asset);
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.onerror = () => reject(new Error("No se pudo leer un archivo.")); reader.readAsDataURL(blob);
    });
    const { blob: _blob, remoteUrl: _remoteUrl, ...metadata } = asset;
    void _blob; void _remoteUrl;
    encoded.push({ ...metadata, data });
  }
  const backup: Backup = { format: "focusmrk-backup", version: 1, createdAt: new Date().toISOString(), posts, templates, assets: encoded };
  return parseBackup(JSON.stringify(backup));
}
export function mergeBackup(backup: Backup, posts: Publication[], templates: ContentTemplate[]) {
  // Remap every imported ID so an import never replaces existing content or files.
  const ids = new Map(backup.assets.map((a) => [a.id, crypto.randomUUID()]));
  const assets = backup.assets.map(({ data, ...a }) => ({ ...a, id: ids.get(a.id)!, blob: new Blob([Uint8Array.from(atob(data), (c) => c.charCodeAt(0))], { type: a.type }) }));
  return { assets, posts: [...posts, ...backup.posts.map((p) => ({ ...p, id: crypto.randomUUID(), mediaId: p.mediaId ? ids.get(p.mediaId)! : "" }))],
    templates: [...templates, ...backup.templates.map((t) => ({ ...t, id: crypto.randomUUID() }))] };
}
export function downloadFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
