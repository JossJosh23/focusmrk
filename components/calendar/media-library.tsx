"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Upload, Search, MoreHorizontal, X, Play, Plus } from "lucide-react";
import { getMedia, allMedia, assetFromFile, deleteMedia, renameMedia, uniqueMedia, mediaBlob, MEDIA_TYPES, putMedia, type MediaAsset } from "@/lib/media";
import { type Publication } from "@/lib/calendar";
import { mediaArchive } from "@/lib/media-download";
import { downloadFile } from "@/lib/backup";

export function AssetPreview({ asset, thumbnail = false, onMetadata }: { asset: MediaAsset; thumbnail?: boolean; onMetadata?: (value: string) => void }) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const next = asset.remoteUrl || URL.createObjectURL(asset.blob);
    const timer = setTimeout(() => { setUrl(next); setFailed(false); }, 0);
    return () => { clearTimeout(timer); if (!asset.remoteUrl) URL.revokeObjectURL(next); };
  }, [asset.blob, asset.remoteUrl]);
  if (!url) return <p>Cargando archivo…</p>;
  if (failed) return <p>No se puede previsualizar este formato.{!thumbnail && <> <a href={url} download={asset.name}>Descargar archivo</a></>}</p>;
  return asset.type.startsWith("video/") ? <video onLoadedMetadata={event => { const v = event.currentTarget; onMetadata?.(`${v.videoWidth} x ${v.videoHeight} px - ${Number.isFinite(v.duration) ? Math.floor(v.duration / 60) + ":" + String(Math.floor(v.duration % 60)).padStart(2, "0") : "Duraci\u00f3n no disponible"}`); }} controls={!thumbnail} playsInline muted={thumbnail} preload="metadata" src={url} aria-label={asset.name} onError={() => setFailed(true)} /> : <Image unoptimized src={url} width={1080} height={1080} alt={asset.name} onLoad={event => onMetadata?.(`${event.currentTarget.naturalWidth} x ${event.currentTarget.naturalHeight} px`)} onError={() => setFailed(true)} />;
}

export function MediaLibrary({ usedIds, company = "", posts = [], onOpenPost, selectedId = "", onSelect, revision = 0, standalone = false, pickerOnly = false }: {
  usedIds: string[]; company?: string; posts?: Publication[]; onOpenPost?: (post: Publication) => void; selectedId?: string; onSelect?: (asset: MediaAsset) => void; revision?: number; standalone?: boolean; pickerOnly?: boolean;
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [preview, setPreview] = useState<MediaAsset | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [usage, setUsage] = useState<MediaAsset | null>(null);
  const [renaming, setRenaming] = useState<MediaAsset | null>(null);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const uploading = useRef(false);
  async function upload(files: File[]) {
    if (!files.length || uploading.current || busy) return;
    uploading.current = true; setBusy(true); setMessage("");
    try {
      const next = files.map(file => assetFromFile(file, company || "Mi marca"));
      const { accepted, duplicates } = await uniqueMedia(next, (await allMedia()).filter(asset => asset.brand === (company || "Mi marca")));
      await putMedia(accepted); setAssets(await allMedia());
      setMessage(`${accepted.length} archivo(s) guardado(s). ${duplicates.length ? `Duplicados omitidos (${duplicates.length}): ${duplicates.join(", ")}` : ""}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo subir."); }
    finally { uploading.current = false; setBusy(false); }
  }
  useEffect(() => {
    let active = true;
    const refresh = () => { void allMedia().then((items) => { if (active) setAssets(items); }).catch((e: Error) => { if (active) setMessage(e.message); }); };
    refresh(); window.addEventListener("focusmrk-media-change", refresh); window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("focusmrk-media-change", refresh); window.removeEventListener("focus", refresh); };
  }, [revision]);
  const scopedAssets = company ? assets.filter(asset => asset.brand === company) : assets;
  const chosen = scopedAssets.filter(asset => selected.includes(asset.id));
  async function bulk(remove: boolean) {
    if (busy || !chosen.length) return;
    const targets = chosen.filter(asset => !usedIds.includes(asset.id) && asset.id !== selectedId);
    if (remove && (!targets.length || !window.confirm(`Eliminar ${targets.length} archivo(s) definitivamente. Los archivos en uso se conservan.`))) return;
    setBusy(true); let count = 0;
    try {
      if (!remove) { downloadFile(await mediaArchive(chosen), "focusmrk-archivos.zip"); setMessage("Descarga ZIP preparada."); }
      else {
        for (const asset of targets) { await deleteMedia(asset.id); count++; setSelected(ids => ids.filter(id => id !== asset.id)); }
        setMessage(`${count} archivo(s) eliminados. ${chosen.length - targets.length} en uso conservados.`);
      }
    } catch (error) { setMessage(`${remove ? count + " eliminados. " : ""}${error instanceof Error ? error.message : "No se pudo completar la operaci\u00f3n."}`); }
    finally { try { setAssets(await allMedia()); } catch { setMessage("Recarga la biblioteca para actualizar los archivos."); } setBusy(false); }
  }
  const visible = scopedAssets.filter((a) => (!kind || a.type.startsWith(kind)) && a.name.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return <section className={`media-library gallery-library ${standalone ? "media-library-module" : ""} ${dragging ? "is-dragging" : ""}`} aria-label="Biblioteca de archivos"
    onDragOver={event => { if (!pickerOnly && event.dataTransfer.types.includes("Files")) { event.preventDefault(); setDragging(true); } }}
    onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
    onDrop={event => { if (pickerOnly) return; event.preventDefault(); setDragging(false); void upload(Array.from(event.dataTransfer.files)); }}>
    <div className="gallery-header"><div><h2>Tus archivos</h2><p>{scopedAssets.length} {scopedAssets.length === 1 ? "archivo" : "archivos"} <span aria-hidden="true">·</span> {(scopedAssets.reduce((total, asset) => total + asset.size, 0) / 1024 / 1024).toFixed(1)} MB</p></div>
      {!pickerOnly && <><input ref={input} type="file" hidden multiple accept={MEDIA_TYPES.join(",")} disabled={busy} onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ""; void upload(files); }} /><button type="button" className="primary-button" disabled={busy} onClick={() => input.current?.click()}><Upload size={17} />{busy ? "Subiendo..." : "Subir archivos"}</button></>}
    </div>
    <div className="gallery-toolbar"><label className="gallery-search"><Search size={17} /><input type="search" aria-label="Buscar archivo" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar archivo..." /></label><div className="gallery-filters" role="group" aria-label="Tipo de archivo">{[["", "Todos"], ["image/", "Imágenes"], ["video/", "Videos"]].map(([value, label]) => <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)}>{label}</button>)}</div></div>
    {!pickerOnly && <p className="gallery-drop-hint"><Upload size={14} />{dragging ? "Suelta los archivos para subirlos" : "Arrastra tus archivos aquí o usa Subir archivos"}<span>Hasta 100 MB por archivo</span></p>}
    {message && <p className="gallery-message" role="status">{message}</p>}
    {!pickerOnly && scopedAssets.length > 0 && <div className="gallery-bulk"><label><input type="checkbox" disabled={busy || !visible.length} checked={visible.length > 0 && visible.every(asset => selected.includes(asset.id))} onChange={event => setSelected(ids => event.target.checked ? Array.from(new Set([...ids, ...visible.map(asset => asset.id)])) : ids.filter(id => !visible.some(asset => asset.id === id)))} />Seleccionar visibles</label><span>{chosen.length} seleccionados</span>{chosen.length > 0 && <><button type="button" className="secondary-button" disabled={busy} onClick={() => void bulk(false)}>Descargar ZIP</button><button type="button" className="danger-button" disabled={busy || chosen.every(asset => usedIds.includes(asset.id) || asset.id === selectedId)} onClick={() => void bulk(true)}>Eliminar disponibles</button><button type="button" className="secondary-button" disabled={busy} onClick={() => setSelected([])}>Limpiar</button></>}</div>}
    <div className="media-grid">{visible.map(asset => <article className={`media-item ${selectedId === asset.id ? "selected" : ""}`} key={asset.id}>
      {!pickerOnly && <label className="gallery-selection"><input type="checkbox" aria-label={`Seleccionar ${asset.name}`} disabled={busy} checked={selected.includes(asset.id)} onChange={event => setSelected(ids => event.target.checked ? [...ids, asset.id] : ids.filter(id => id !== asset.id))} /></label>}
      <button type="button" className="gallery-thumbnail" aria-label={`Ver ${asset.name}`} onClick={() => setPreview(asset)}><AssetPreview asset={asset} thumbnail /><span className="gallery-type">{asset.type.startsWith("video/") ? <><Play size={12} />Video</> : "Imagen"}</span></button>
      <div className="gallery-card-info"><strong title={asset.name}>{asset.name}</strong><div className="gallery-meta"><small>{(asset.size / 1024 / 1024).toFixed(1)} MB</small><button type="button" className={usedIds.includes(asset.id) ? "asset-in-use" : "asset-available"} disabled={!usedIds.includes(asset.id)} onClick={() => setUsage(asset)}>{usedIds.includes(asset.id) ? "En uso" : "Disponible"}</button></div>
      <div className="gallery-card-actions">{onSelect && <button type="button" className="secondary-button" onClick={() => onSelect(asset)}><Plus size={15} />{selectedId === asset.id ? "Seleccionado" : standalone ? "Crear post" : "Usar en el post"}</button>}
        {!pickerOnly && <details className="gallery-menu"><summary aria-label={`Opciones de ${asset.name}`}><MoreHorizontal size={20} /></summary><div><button type="button" disabled={busy} onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); setRenaming(asset); }}>Renombrar</button><button type="button" onClick={async event => { event.currentTarget.closest("details")?.removeAttribute("open"); try { downloadFile(await mediaBlob(asset), asset.name); } catch { setMessage("No se pudo descargar el archivo."); } }}>Descargar</button><button type="button" className="gallery-delete" disabled={busy || usedIds.includes(asset.id) || selectedId === asset.id} title={usedIds.includes(asset.id) ? "Este archivo está asociado a una publicación" : "Eliminar archivo"} onClick={async () => {
          if (!window.confirm(`¿Eliminar ${asset.name} de la biblioteca?`)) return;
          setBusy(true); try { await deleteMedia(asset.id); setAssets(await allMedia()); } catch { setMessage("No se pudo eliminar el archivo."); } finally { setBusy(false); }
        }}>Eliminar</button></div></details>}
      </div></div>
    </article>)}</div>
    {!scopedAssets.length && <div className="gallery-empty"><Upload size={32} /><strong>Tu contenido empieza aquí</strong><p>{pickerOnly ? "Añade archivos desde la Biblioteca para usarlos en tus posts." : "Sube o arrastra tu primera imagen o video."}</p></div>}
    {scopedAssets.length > 0 && !visible.length && <div className="gallery-empty" role="status"><Search size={28} /><strong>No encontramos archivos</strong><p>Prueba otro nombre o cambia el filtro.</p><button type="button" className="secondary-button" onClick={() => { setQuery(""); setKind(""); }}>Limpiar filtros</button></div>}
    {renaming && <RenameAsset asset={renaming} onClose={() => setRenaming(null)} onSaved={async () => { setAssets(await allMedia()); setRenaming(null); setMessage("Nombre actualizado."); }} />}
    {usage && <UsageViewer asset={usage} posts={posts.filter(post => post.mediaId === usage.id)} onClose={() => setUsage(null)} onOpen={onOpenPost} />}
    {preview && <MediaViewer asset={preview} onClose={() => setPreview(null)} onSelect={onSelect ? () => { onSelect(preview); setPreview(null); } : undefined} />}
  </section>;
}

function MediaViewer({ asset, onClose, onSelect }: { asset: MediaAsset; onClose: () => void; onSelect?: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [metadata, setMetadata] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="gallery-viewer" aria-label={asset.name} onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}>
    <header><strong>{asset.name}</strong><button type="button" className="icon-button" aria-label="Cerrar vista ampliada" onClick={onClose}><X size={21} /></button></header>
    <div className="gallery-viewer-media"><AssetPreview asset={asset} onMetadata={setMetadata} /></div>
    <footer><span>{asset.type.startsWith("video/") ? "Video" : "Imagen"} · {(asset.size / 1024 / 1024).toFixed(1)} MB {metadata && ` - ${metadata}`}</span>{onSelect && <button type="button" className="primary-button" onClick={onSelect}><Plus size={16} />Usar en un post</button>}</footer>
  </dialog>;
}

function RenameAsset({ asset, onClose, onSaved }: { asset: MediaAsset; onClose: () => void; onSaved: () => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const extension = asset.name.match(/\.[a-z0-9]{1,10}$/i)?.[0] || "";
  const [name, setName] = useState(extension ? asset.name.slice(0, -extension.length) : asset.name);
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="gallery-viewer gallery-small-dialog" aria-label="Renombrar archivo" onCancel={event => { event.preventDefault(); event.stopPropagation(); if (!saving) onClose(); }}>
    <form onSubmit={async event => { event.preventDefault(); if (saving) return; setSaving(true); setError(""); try { await renameMedia(asset.id, name.trim() + extension); await onSaved(); } catch (error) { setError(error instanceof Error ? error.message : "No se pudo renombrar."); } finally { setSaving(false); } }}>
      <header><strong>Renombrar archivo</strong><button type="button" className="icon-button" disabled={saving} aria-label="Cerrar" onClick={onClose}><X size={20} /></button></header>
      <label className="gallery-name-field">Nombre<input autoFocus required maxLength={500 - extension.length} value={name} onChange={event => setName(event.target.value)} disabled={saving} /><small>Se conserva la extensión {extension || "del archivo"}.</small></label>
      {error && <p role="alert" className="gallery-message">{error}</p>}<footer><button type="button" className="secondary-button" disabled={saving} onClick={onClose}>Cancelar</button><button type="submit" className="primary-button" disabled={saving || !name.trim()}>{saving ? "Guardando…" : "Guardar nombre"}</button></footer>
    </form>
  </dialog>;
}

function UsageViewer({ asset, posts, onClose, onOpen }: { asset: MediaAsset; posts: Publication[]; onClose: () => void; onOpen?: (post: Publication) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="gallery-viewer gallery-small-dialog" aria-label="Publicaciones asociadas" onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}>
    <header><strong>Dónde se usa</strong><button type="button" className="icon-button" aria-label="Cerrar" onClick={onClose}><X size={20} /></button></header>
    <div className="gallery-usage"><p>{asset.name}</p>{posts.length ? [...posts].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).map(post => <article key={post.id}><strong>{post.title}</strong><p>{post.date.split("-").reverse().join("/")} · {post.time} · {post.status}</p><small>{post.networks.join(", ")}</small>{onOpen && <button type="button" className="secondary-button" onClick={() => { onClose(); onOpen(post); }}>Abrir publicación</button>}</article>) : <p>Las publicaciones cambiaron. Recarga para actualizar las asociaciones.</p>}</div>
  </dialog>;
}

export function SelectedMedia({ id }: { id: string }) {
  const [asset, setAsset] = useState<MediaAsset | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let active = true;
    void getMedia(id).then((found) => { if (active) { setAsset(found || null); setMissing(!found); } }).catch(() => { if (active) setMissing(true); });
    return () => { active = false; };
  }, [id]);
  return asset && asset.id === id ? <AssetPreview asset={asset} /> : <p>{missing ? "El archivo no está en este navegador. Importa el respaldo que lo contiene o selecciona otro." : "Cargando archivo…"}</p>;
}
