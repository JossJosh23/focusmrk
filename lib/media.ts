import { readPublications } from "./calendar";

export const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "video/mp4", "video/webm", "video/quicktime"];
export const MAX_MEDIA_BYTES = 100 * 1024 * 1024;
export type MediaAsset = { id: string; name: string; brand: string; type: string; size: number; createdAt: string; blob: Blob; remoteUrl?: string };
let remote = false;
export function configureMediaServer(enabled: boolean) { remote = enabled; }
async function mediaRequest(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, headers: { ...options?.headers, "X-FocusMRK-Request": "1" }, cache: "no-store" });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "No se pudo acceder a la biblioteca del servidor.");
  }
  return response;
}
export async function mediaBlob(asset: MediaAsset): Promise<Blob> {
  return asset.remoteUrl ? (await mediaRequest(asset.remoteUrl)).blob() : asset.blob;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("focusmrk.media.v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("assets", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("No se pudo abrir la biblioteca de este navegador."));
    request.onblocked = () => reject(new Error("Cierra otras pestañas para abrir la biblioteca."));
  });
}
export async function allMedia(): Promise<MediaAsset[]> {
  if (remote) {
    const items: Omit<MediaAsset, "blob">[] = await (await mediaRequest("/api/media")).json();
    return items.map(item => ({ ...item, blob: new Blob([], { type: item.type }), remoteUrl: `/api/media?id=${encodeURIComponent(item.id)}` }));
  }
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("assets", "readonly");
    const request = tx.objectStore("assets").getAll();
    tx.oncomplete = () => { db.close(); resolve(request.result as MediaAsset[]); };
    tx.onabort = tx.onerror = () => { db.close(); reject(new Error("No se pudo leer la biblioteca.")); };
  });
}
export async function putMedia(assets: MediaAsset[]): Promise<void> {
  if (remote) {
    for (const asset of assets) {
      const form = new FormData(); form.set("id", asset.id); form.set("brand", asset.brand); form.set("file", asset.blob, asset.name);
      await mediaRequest("/api/media", { method: "POST", body: form });
    }
    window.dispatchEvent(new Event("focusmrk-media-change")); return;
  }
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("assets", "readwrite");
    for (const asset of assets) tx.objectStore("assets").put(asset);
    tx.oncomplete = () => { db.close(); window.dispatchEvent(new Event("focusmrk-media-change")); resolve(); };
    tx.onabort = tx.onerror = () => { db.close(); reject(new Error("No se pudieron guardar los archivos. Comprueba el espacio disponible.")); };
  });
}
export async function deleteMedia(id: string): Promise<void> {
  if (remote) { await mediaRequest(`/api/media?id=${encodeURIComponent(id)}`, { method: "DELETE" }); window.dispatchEvent(new Event("focusmrk-media-change")); return; }
  if (readPublications(localStorage.getItem("focusmrk.publications.v1")).some((post) => post.mediaId === id)) throw new Error("Este archivo está asociado a una publicación y no se puede eliminar.");
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("assets", "readwrite");
    tx.objectStore("assets").delete(id);
    tx.oncomplete = () => { db.close(); window.dispatchEvent(new Event("focusmrk-media-change")); resolve(); };
    tx.onabort = tx.onerror = () => { db.close(); reject(new Error("No se pudo eliminar el archivo.")); };
  });
}
export function assetFromFile(file: File, brand: string): MediaAsset {
  if (!MEDIA_TYPES.includes(file.type) || file.size === 0 || file.size > MAX_MEDIA_BYTES) throw new Error(`${file.name}: usa una imagen o video compatible de hasta 100 MB.`);
  if (!brand.trim() || brand.trim().length > 80) throw new Error("Escribe una marca de hasta 80 caracteres.");
  return { id: crypto.randomUUID(), name: file.name, brand: brand.trim(), type: file.type, size: file.size, createdAt: new Date().toISOString(), blob: file };
}
