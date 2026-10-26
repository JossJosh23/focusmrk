"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Upload, Search, MoreHorizontal, X, Play, Plus, ImageIcon, ChevronLeft, ChevronRight, Download, Trash2, LayoutGrid, Grid3x3, CheckSquare, Maximize2, LoaderCircle } from "lucide-react";
import { getMedia, allMedia, assetFromFile, deleteMedia, renameMedia, uniqueMedia, mediaBlob, MEDIA_TYPES, putMedia, type MediaAsset } from "@/lib/media";
import { type Publication } from "@/lib/calendar";
import { mediaArchive } from "@/lib/media-download";
import { downloadFile } from "@/lib/backup";

// Server images have a small WebP thumbnail; the original is only downloaded for full-size views.
const thumbnailUrl = (asset: MediaAsset) => asset.remoteUrl && asset.type.startsWith("image/") ? `${asset.remoteUrl}&thumb=1` : "";

export function AssetPreview({ asset, thumbnail = false, onMetadata }: { asset: MediaAsset; thumbnail?: boolean; onMetadata?: (value: string) => void }) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const remote = (thumbnail && thumbnailUrl(asset)) || asset.remoteUrl;
  useEffect(() => {
    const next = remote || URL.createObjectURL(asset.blob);
    const timer = setTimeout(() => { setUrl(next); setFailed(false); }, 0);
    return () => { clearTimeout(timer); if (!remote) URL.revokeObjectURL(next); };
  }, [asset.blob, remote]);
  if (!url) return <p>Cargando archivo…</p>;
  if (failed) return <p>No se puede previsualizar este formato.{!thumbnail && <> <a href={url} download={asset.name}>Descargar archivo</a></>}</p>;
  return asset.type.startsWith("video/") ? <video onLoadedMetadata={event => { const v = event.currentTarget; onMetadata?.(`${v.videoWidth} x ${v.videoHeight} px - ${Number.isFinite(v.duration) ? Math.floor(v.duration / 60) + ":" + String(Math.floor(v.duration % 60)).padStart(2, "0") : "Duración no disponible"}`); }} controls={!thumbnail} playsInline muted={thumbnail} preload="metadata" src={url} aria-label={asset.name} onError={() => setFailed(true)} /> : <Image unoptimized src={url} width={1080} height={1080} alt={asset.name} onLoad={event => onMetadata?.(`${event.currentTarget.naturalWidth} x ${event.currentTarget.naturalHeight} px`)} onError={() => setFailed(true)} />;
}

type Sort = "recent" | "oldest" | "name" | "size";
type Usage = "" | "used" | "free";
const SORTS: [Sort, string][] = [["recent", "Recientes"], ["oldest", "Antiguos"], ["name", "Nombre A-Z"], ["size", "Más pesados"]];
const DENSITY_KEY = "focusmrk.library.density";

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const extension = (name: string) => name.match(/\.([a-z0-9]{1,10})$/i)?.[1].toUpperCase() || "";
const baseName = (name: string) => name.replace(/\.[a-z0-9]{1,10}$/i, "");
function shortDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("es", { day: "numeric", month: "short", ...(date.getFullYear() !== new Date().getFullYear() && { year: "numeric" }) });
}
function monthLabel(iso: string) {
  const label = new Date(iso).toLocaleDateString("es", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function MediaLibrary({ usedIds, company = "", posts = [], onOpenPost, selectedId = "", onSelect, revision = 0, standalone = false, pickerOnly = false }: {
  usedIds: string[]; company?: string; posts?: Publication[]; onOpenPost?: (post: Publication) => void; selectedId?: string; onSelect?: (asset: MediaAsset) => void; revision?: number; standalone?: boolean; pickerOnly?: boolean;
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [usageFilter, setUsageFilter] = useState<Usage>("");
  const [sort, setSort] = useState<Sort>("recent");
  const [compact, setCompact] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [usage, setUsage] = useState<MediaAsset | null>(null);
  const [renaming, setRenaming] = useState<MediaAsset | null>(null);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const uploading = useRef(false);
  // Anchor for shift-click range selection.
  const lastPicked = useRef<string | null>(null);
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
    const refresh = () => { void allMedia().then((items) => { if (active) { setAssets(items); setLoaded(true); } }).catch((e: Error) => { if (active) { setMessage(e.message); setLoaded(true); } }); };
    refresh(); window.addEventListener("focusmrk-media-change", refresh); window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("focusmrk-media-change", refresh); window.removeEventListener("focus", refresh); };
  }, [revision]);
  useEffect(() => {
    const timer = setTimeout(() => { try { setCompact(localStorage.getItem(DENSITY_KEY) === "compact"); } catch {} }, 0);
    return () => clearTimeout(timer);
  }, []);
  function changeDensity(next: boolean) { setCompact(next); try { localStorage.setItem(DENSITY_KEY, next ? "compact" : "comfortable"); } catch {} }

  const usageCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const id of usedIds) if (id) counts.set(id, (counts.get(id) || 0) + 1);
    return counts;
  }, [usedIds]);
  const inUse = (asset: MediaAsset) => usageCount.has(asset.id) || asset.id === selectedId;
  const scopedAssets = company ? assets.filter(asset => asset.brand === company) : assets;
  const totals = { images: scopedAssets.filter(a => a.type.startsWith("image/")).length, videos: scopedAssets.filter(a => a.type.startsWith("video/")).length, used: scopedAssets.filter(a => usageCount.has(a.id)).length, bytes: scopedAssets.reduce((total, a) => total + a.size, 0) };
  const chosen = scopedAssets.filter(asset => selected.includes(asset.id));
  const needle = query.trim().toLocaleLowerCase("es");
  const visible = scopedAssets
    .filter(a => (!kind || a.type.startsWith(kind)) && (!usageFilter || (usageFilter === "used") === usageCount.has(a.id)) && a.name.toLocaleLowerCase("es").includes(needle))
    .sort((a, b) => sort === "oldest" ? a.createdAt.localeCompare(b.createdAt) : sort === "name" ? a.name.localeCompare(b.name, "es", { numeric: true }) : sort === "size" ? b.size - a.size : b.createdAt.localeCompare(a.createdAt));
  // Date sorts read better grouped by month; other sorts are one continuous grid.
  const groups = sort === "recent" || sort === "oldest"
    ? visible.reduce<{ label: string; items: MediaAsset[] }[]>((list, asset) => { const label = monthLabel(asset.createdAt); if (list.at(-1)?.label === label) list.at(-1)!.items.push(asset); else list.push({ label, items: [asset] }); return list; }, [])
    : [{ label: "", items: visible }];
  const filtered = Boolean(needle || kind || usageFilter);
  const previewIndex = preview ? visible.findIndex(asset => asset.id === preview) : -1;

  function toggle(asset: MediaAsset, event: MouseEvent<HTMLInputElement>) {
    const checked = event.currentTarget.checked;
    const anchor = lastPicked.current ? visible.findIndex(a => a.id === lastPicked.current) : -1;
    const index = visible.findIndex(a => a.id === asset.id);
    const range = event.shiftKey && anchor >= 0 ? visible.slice(Math.min(anchor, index), Math.max(anchor, index) + 1).map(a => a.id) : [asset.id];
    setSelected(ids => checked ? Array.from(new Set([...ids, ...range])) : ids.filter(id => !range.includes(id)));
    lastPicked.current = asset.id;
  }
  async function bulk(remove: boolean) {
    if (busy || !chosen.length) return;
    const targets = chosen.filter(asset => !inUse(asset));
    if (remove && (!targets.length || !window.confirm(`Eliminar ${targets.length} archivo(s) definitivamente. Los archivos en uso se conservan.`))) return;
    setBusy(true); let count = 0;
    try {
      if (!remove) { downloadFile(await mediaArchive(chosen), "kromaiso-archivos.zip"); setMessage("Descarga ZIP preparada."); }
      else {
        for (const asset of targets) { await deleteMedia(asset.id); count++; setSelected(ids => ids.filter(id => id !== asset.id)); }
        setMessage(`${count} archivo(s) eliminados. ${chosen.length - targets.length} en uso conservados.`);
      }
    } catch (error) { setMessage(`${remove ? count + " eliminados. " : ""}${error instanceof Error ? error.message : "No se pudo completar la operación."}`); }
    finally { try { setAssets(await allMedia()); } catch { setMessage("Recarga la biblioteca para actualizar los archivos."); } setBusy(false); }
  }
  async function download(asset: MediaAsset) {
    try { downloadFile(await mediaBlob(asset), asset.name); } catch { setMessage("No se pudo descargar el archivo."); }
  }
  async function remove(asset: MediaAsset) {
    if (!window.confirm(`¿Eliminar ${asset.name} de la biblioteca?`)) return;
    setBusy(true);
    try { await deleteMedia(asset.id); setSelected(ids => ids.filter(id => id !== asset.id)); setAssets(await allMedia()); }
    catch { setMessage("No se pudo eliminar el archivo."); }
    finally { setBusy(false); }
  }
  const closeMenu = (event: MouseEvent<HTMLElement>) => event.currentTarget.closest("details")?.removeAttribute("open");

  return <section className={`library${standalone ? " library-standalone" : ""}${compact ? " is-compact" : ""}${dragging ? " is-dragging" : ""}`} aria-label="Biblioteca de archivos" aria-busy={busy || !loaded}
    onDragOver={event => { if (!pickerOnly && event.dataTransfer.types.includes("Files")) { event.preventDefault(); setDragging(true); } }}
    onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
    onDrop={event => { if (pickerOnly) return; event.preventDefault(); setDragging(false); void upload(Array.from(event.dataTransfer.files)); }}>
    <header className="library-header">
      <ul className="library-stats" aria-label="Resumen de la biblioteca">
        <li><b>{scopedAssets.length}</b>{scopedAssets.length === 1 ? "archivo" : "archivos"}</li>
        <li><ImageIcon size="var(--icon-sm)" aria-hidden="true" /><b>{totals.images}</b>{totals.images === 1 ? "imagen" : "imágenes"}</li>
        <li><Play size="var(--icon-sm)" aria-hidden="true" /><b>{totals.videos}</b>{totals.videos === 1 ? "video" : "videos"}</li>
        <li><span className="library-dot is-used" aria-hidden="true" /><b>{totals.used}</b>en uso</li>
        <li><b>{megabytes(totals.bytes)}</b>en total</li>
      </ul>
      {!pickerOnly && <><input ref={input} type="file" hidden multiple accept={MEDIA_TYPES.join(",")} disabled={busy} onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ""; void upload(files); }} /><button type="button" className="primary-button" disabled={busy} onClick={() => input.current?.click()}><Upload size="var(--icon-md)" aria-hidden="true" />{busy ? "Procesando…" : "Subir archivos"}</button></>}
    </header>

    <div className="library-toolbar">
      <label className="library-search"><Search size="var(--icon-md)" aria-hidden="true" /><input type="search" aria-label="Buscar archivo" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por nombre…" />{query && <button type="button" aria-label="Borrar búsqueda" onClick={() => setQuery("")}><X size="var(--icon-sm)" /></button>}</label>
      <div className="library-segment" role="group" aria-label="Tipo de archivo">{([["", "Todos", scopedAssets.length], ["image/", "Imágenes", totals.images], ["video/", "Videos", totals.videos]] as const).map(([value, label, count]) => <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)}>{label}<span>{count}</span></button>)}</div>
      <label className="library-select"><span className="sr-only">Estado</span><select value={usageFilter} onChange={event => setUsageFilter(event.target.value as Usage)}><option value="">Estado</option><option value="used">En uso</option><option value="free">Disponibles</option></select></label>
      <label className="library-select"><span className="sr-only">Ordenar</span><select value={sort} onChange={event => setSort(event.target.value as Sort)}>{SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <div className="library-segment library-density" role="group" aria-label="Tamaño de vista">
        <button type="button" aria-pressed={!compact} aria-label="Vista amplia" title="Vista amplia" onClick={() => changeDensity(false)}><LayoutGrid size="var(--icon-sm)" /></button>
        <button type="button" aria-pressed={compact} aria-label="Vista compacta" title="Vista compacta" onClick={() => changeDensity(true)}><Grid3x3 size="var(--icon-sm)" /></button>
      </div>
    </div>

    {message && <p className="library-message" role="status"><span>{message}</span><button type="button" aria-label="Cerrar mensaje" onClick={() => setMessage("")}><X size="var(--icon-sm)" /></button></p>}
    {filtered && visible.length > 0 && <p className="library-result">{visible.length} de {scopedAssets.length} archivos <button type="button" onClick={() => { setQuery(""); setKind(""); setUsageFilter(""); }}>Limpiar filtros</button></p>}

    {!loaded && <div className="library-grid" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <div key={i} className="library-card library-skeleton"><span /><i /><i /></div>)}</div>}

    {groups.map(group => visible.length > 0 && <div className="library-group" key={group.label || "all"}>
      {group.label && <h3 className="library-group-title">{group.label}<span>{group.items.length}</span></h3>}
      <div className="library-grid">{group.items.map(asset => {
        const count = usageCount.get(asset.id) || 0;
        const isChecked = selected.includes(asset.id);
        const isVideo = asset.type.startsWith("video/");
        return <article className={`library-card${isChecked ? " is-checked" : ""}${selectedId === asset.id ? " is-current" : ""}`} key={asset.id}>
          <div className="library-thumb">
            <button type="button" className="library-open" aria-label={`Ver ${asset.name}`} onClick={() => setPreview(asset.id)}><AssetPreview asset={asset} thumbnail /></button>
            <span className="library-kind" title={isVideo ? "Video" : "Imagen"}>{isVideo ? <Play size="var(--icon-sm)" aria-label="Video" /> : <ImageIcon size="var(--icon-sm)" aria-label="Imagen" />}</span>
            {!pickerOnly && <label className={`library-check${selected.length ? " is-visible" : ""}`} title="Mayús + clic para seleccionar un rango"><input type="checkbox" aria-label={`Seleccionar ${asset.name}`} disabled={busy} checked={isChecked} onClick={event => toggle(asset, event)} onChange={() => {}} /></label>}
            <div className="library-hover">
              <button type="button" className="library-hover-icon" aria-label={`Ampliar ${asset.name}`} tabIndex={-1} onClick={() => setPreview(asset.id)}><Maximize2 size="var(--icon-sm)" /></button>
              {onSelect && <button type="button" className="library-hover-action" onClick={() => onSelect(asset)}><Plus size="var(--icon-sm)" aria-hidden="true" />{selectedId === asset.id ? "Seleccionado" : standalone ? "Crear post" : "Usar en el post"}</button>}
            </div>
          </div>
          <div className="library-info">
            <strong title={asset.name}>{baseName(asset.name)}</strong>
            <p className="library-meta">{[extension(asset.name), megabytes(asset.size), shortDate(asset.createdAt)].filter(Boolean).join(" · ")}</p>
            <div className="library-row">
              {count ? <button type="button" className="library-usage is-used" onClick={() => setUsage(asset)}><span className="library-dot is-used" aria-hidden="true" />En uso · {count}</button> : <span className="library-usage"><span className="library-dot" aria-hidden="true" />Disponible</span>}
              {!pickerOnly && <details className="library-menu"><summary aria-label={`Opciones de ${asset.name}`}><MoreHorizontal size="var(--icon-md)" /></summary><div>
                {onSelect && <button type="button" onClick={event => { closeMenu(event); onSelect(asset); }}><Plus size="var(--icon-sm)" aria-hidden="true" />{standalone ? "Crear post" : "Usar en el post"}</button>}
                <button type="button" disabled={busy} onClick={event => { closeMenu(event); setRenaming(asset); }}>Renombrar</button>
                <button type="button" onClick={event => { closeMenu(event); void download(asset); }}><Download size="var(--icon-sm)" aria-hidden="true" />Descargar</button>
                <button type="button" className="library-delete" disabled={busy || inUse(asset)} title={inUse(asset) ? "Este archivo está asociado a una publicación" : "Eliminar archivo"} onClick={event => { closeMenu(event); void remove(asset); }}><Trash2 size="var(--icon-sm)" aria-hidden="true" />Eliminar</button>
              </div></details>}
            </div>
          </div>
        </article>;
      })}</div>
    </div>)}

    {loaded && !scopedAssets.length && <button type="button" className="library-empty library-dropzone" disabled={pickerOnly || busy} onClick={() => input.current?.click()}><span className="library-empty-icon"><Upload size="var(--icon-lg)" aria-hidden="true" /></span><strong>Tu contenido empieza aquí</strong><span>{pickerOnly ? "Añade archivos desde la Biblioteca para usarlos en tus posts." : "Arrastra imágenes o videos aquí, o haz clic para elegirlos. Hasta 100 MB por archivo."}</span></button>}
    {loaded && scopedAssets.length > 0 && !visible.length && <div className="library-empty" role="status"><span className="library-empty-icon"><Search size="var(--icon-lg)" aria-hidden="true" /></span><strong>No encontramos archivos</strong><span>Prueba otro nombre o cambia los filtros.</span><button type="button" className="secondary-button" onClick={() => { setQuery(""); setKind(""); setUsageFilter(""); }}>Limpiar filtros</button></div>}
    {!pickerOnly && loaded && scopedAssets.length > 0 && <p className="library-hint"><Upload size="var(--icon-sm)" aria-hidden="true" />Arrastra archivos a esta página para subirlos · Hasta 100 MB por archivo</p>}

    {dragging && <div className="library-drop-overlay" aria-hidden="true"><span><Upload size="var(--icon-xl)" /></span><strong>Suelta para subir</strong><small>Imágenes y videos de hasta 100 MB</small></div>}

    {!pickerOnly && chosen.length > 0 && <div className="library-bulk" role="region" aria-label="Acciones de selección">
      <strong>{chosen.length} {chosen.length === 1 ? "seleccionado" : "seleccionados"}</strong>
      <button type="button" className="library-bulk-link" disabled={busy || visible.every(asset => selected.includes(asset.id))} onClick={() => setSelected(ids => Array.from(new Set([...ids, ...visible.map(asset => asset.id)])))}><CheckSquare size="var(--icon-sm)" aria-hidden="true" />Seleccionar visibles ({visible.length})</button>
      <span className="library-bulk-actions">
        <button type="button" className="secondary-button" disabled={busy} onClick={() => void bulk(false)}><Download size="var(--icon-sm)" aria-hidden="true" />Descargar ZIP</button>
        <button type="button" className="danger-button" disabled={busy || chosen.every(inUse)} onClick={() => void bulk(true)}><Trash2 size="var(--icon-sm)" aria-hidden="true" />Eliminar disponibles</button>
        <button type="button" className="icon-button" aria-label="Quitar selección" disabled={busy} onClick={() => { setSelected([]); lastPicked.current = null; }}><X size="var(--icon-md)" /></button>
      </span>
    </div>}

    {renaming && <RenameAsset asset={renaming} onClose={() => setRenaming(null)} onSaved={async () => { setAssets(await allMedia()); setRenaming(null); setMessage("Nombre actualizado."); }} />}
    {usage && <UsageViewer asset={usage} posts={posts.filter(post => post.mediaId === usage.id)} onClose={() => setUsage(null)} onOpen={onOpenPost} />}
    {previewIndex >= 0 && <MediaViewer key={visible[previewIndex].id} asset={visible[previewIndex]} position={`${previewIndex + 1} de ${visible.length}`} uses={usageCount.get(visible[previewIndex].id) || 0}
      onPrevious={previewIndex > 0 ? () => setPreview(visible[previewIndex - 1].id) : undefined}
      onNext={previewIndex < visible.length - 1 ? () => setPreview(visible[previewIndex + 1].id) : undefined}
      onDownload={() => void download(visible[previewIndex])} onClose={() => setPreview(null)}
      onSelect={onSelect ? () => { onSelect(visible[previewIndex]); setPreview(null); } : undefined} />}
  </section>;
}

function MediaViewer({ asset, position, uses, onPrevious, onNext, onDownload, onClose, onSelect }: { asset: MediaAsset; position: string; uses: number; onPrevious?: () => void; onNext?: () => void; onDownload: () => void; onClose: () => void; onSelect?: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [metadata, setMetadata] = useState("");
  const placeholder = thumbnailUrl(asset);
  useEffect(() => { if (!dialog.current?.open) dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="gallery-viewer library-viewer" aria-label={asset.name}
    onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}
    onKeyDown={event => { if ((event.target as HTMLElement).tagName === "VIDEO") return; if (event.key === "ArrowLeft") onPrevious?.(); if (event.key === "ArrowRight") onNext?.(); }}>
    <header><div><strong>{asset.name}</strong><small>{position}</small></div><button type="button" className="icon-button" aria-label="Cerrar vista ampliada" onClick={onClose}><X size="var(--icon-md)" /></button></header>
    <div className={`gallery-viewer-media${metadata ? "" : " is-loading"}`}>
      {/* The grid already cached the thumbnail, so it shows at once while the original downloads on top of it. */}
      {placeholder && !metadata && <Image unoptimized className="library-viewer-placeholder" src={placeholder} width={480} height={600} alt="" aria-hidden="true" />}
      <AssetPreview asset={asset} onMetadata={setMetadata} />
      {!metadata && <span className="library-viewer-loading" role="status"><LoaderCircle size="var(--icon-md)" aria-hidden="true" />Cargando original…</span>}
      {onPrevious && <button type="button" className="library-nav library-nav-previous" aria-label="Archivo anterior" onClick={onPrevious}><ChevronLeft size="var(--icon-lg)" /></button>}
      {onNext && <button type="button" className="library-nav library-nav-next" aria-label="Archivo siguiente" onClick={onNext}><ChevronRight size="var(--icon-lg)" /></button>}
    </div>
    <footer>
      <dl className="library-details">
        <div><dt>Tipo</dt><dd>{asset.type.startsWith("video/") ? "Video" : "Imagen"} {extension(asset.name)}</dd></div>
        <div><dt>Tamaño</dt><dd>{megabytes(asset.size)}</dd></div>
        {metadata && <div><dt>Medidas</dt><dd>{metadata}</dd></div>}
        <div><dt>Subido</dt><dd>{shortDate(asset.createdAt)}</dd></div>
        <div><dt>Uso</dt><dd>{uses ? `${uses} ${uses === 1 ? "publicación" : "publicaciones"}` : "Disponible"}</dd></div>
      </dl>
      <span className="library-viewer-actions">
        <button type="button" className="secondary-button" onClick={onDownload}><Download size="var(--icon-sm)" aria-hidden="true" />Descargar</button>
        {onSelect && <button type="button" className="primary-button" onClick={onSelect}><Plus size="var(--icon-sm)" aria-hidden="true" />Usar en un post</button>}
      </span>
    </footer>
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
      <header><strong>Renombrar archivo</strong><button type="button" className="icon-button" disabled={saving} aria-label="Cerrar" onClick={onClose}><X size="var(--icon-md)" /></button></header>
      <label className="gallery-name-field">Nombre<input autoFocus required maxLength={500 - extension.length} value={name} onChange={event => setName(event.target.value)} disabled={saving} /><small>Se conserva la extensión {extension || "del archivo"}.</small></label>
      {error && <p role="alert" className="library-message">{error}</p>}<footer><button type="button" className="secondary-button" disabled={saving} onClick={onClose}>Cancelar</button><button type="submit" className="primary-button" disabled={saving || !name.trim()}>{saving ? "Guardando…" : "Guardar nombre"}</button></footer>
    </form>
  </dialog>;
}

function UsageViewer({ asset, posts, onClose, onOpen }: { asset: MediaAsset; posts: Publication[]; onClose: () => void; onOpen?: (post: Publication) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="gallery-viewer gallery-small-dialog" aria-label="Publicaciones asociadas" onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}>
    <header><strong>Dónde se usa</strong><button type="button" className="icon-button" aria-label="Cerrar" onClick={onClose}><X size="var(--icon-md)" /></button></header>
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
