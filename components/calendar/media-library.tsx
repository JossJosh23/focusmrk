"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { allMedia, assetFromFile, deleteMedia, mediaBlob, MEDIA_TYPES, putMedia, type MediaAsset } from "@/lib/media";
import { downloadFile } from "@/lib/backup";

export function AssetPreview({ asset }: { asset: MediaAsset }) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const next = asset.remoteUrl || URL.createObjectURL(asset.blob);
    const timer = setTimeout(() => { setUrl(next); setFailed(false); }, 0);
    return () => { clearTimeout(timer); if (!asset.remoteUrl) URL.revokeObjectURL(next); };
  }, [asset.blob, asset.remoteUrl]);
  if (!url) return <p>Cargando archivo…</p>;
  if (failed) return <p>No se puede previsualizar este formato. <a href={url} download={asset.name}>Descargar archivo</a></p>;
  return asset.type.startsWith("video/") ? <video controls preload="metadata" src={url} aria-label={asset.name} onError={() => setFailed(true)} /> : <Image unoptimized src={url} width={360} height={260} alt={asset.name} onError={() => setFailed(true)} />;
}

export function MediaLibrary({ usedIds, selectedId = "", initialBrand = "Mi marca", onSelect, revision = 0, standalone = false, pickerOnly = false }: {
  usedIds: string[]; selectedId?: string; initialBrand?: string; onSelect?: (asset: MediaAsset) => void; revision?: number; standalone?: boolean; pickerOnly?: boolean;
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [brand, setBrand] = useState(initialBrand);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  useEffect(() => {
    let active = true;
    const refresh = () => { void allMedia().then((items) => { if (active) setAssets(items); }).catch((e: Error) => { if (active) setMessage(e.message); }); };
    refresh(); window.addEventListener("focusmrk-media-change", refresh); window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("focusmrk-media-change", refresh); window.removeEventListener("focus", refresh); };
  }, [revision]);
  const brands = Array.from(new Set(assets.map((a) => a.brand))).sort();
  const visible = assets.filter((a) => (!filter || a.brand === filter) && (!kind || a.type.startsWith(kind)) && `${a.name} ${a.brand}`.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return <section className={`media-library ${standalone ? "media-library-module" : ""}`} aria-label="Biblioteca de imágenes y videos">
    {standalone && <div className="library-summary"><span><strong>{assets.length}</strong> archivos</span><span><strong>{brands.length}</strong> marcas</span><span><strong>{(assets.reduce((total, a) => total + a.size, 0) / 1024 / 1024).toFixed(1)}</strong> MB guardados</span></div>}
    {!pickerOnly && <div className="media-controls"><label>Marca para los archivos<input maxLength={80} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Nombre de la marca" /></label>
      <label>Subir imágenes o videos<input disabled={busy} type="file" multiple accept={MEDIA_TYPES.join(",")} onChange={async (e) => {
        const files = Array.from(e.target.files || []); e.target.value = "";
        if (!files.length) return;
        setBusy(true); setMessage("");
        try { const next = files.map((file) => assetFromFile(file, brand)); await putMedia(next); setAssets(await allMedia()); setMessage(`${next.length} archivo(s) guardado(s).`); }
        catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo subir."); }
        finally { setBusy(false); }
      }} /></label>
      <label>Filtrar biblioteca por marca<select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">Todas las marcas</option>{brands.map((b) => <option key={b}>{b}</option>)}</select></label></div>}
    {pickerOnly && <label className="picker-brand">Marca<select value={filter} onChange={e => setFilter(e.target.value)}><option value="">Todas las marcas</option>{brands.map(b => <option key={b}>{b}</option>)}</select></label>}
    <div className="library-search"><label>Buscar archivo<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nombre del archivo o marca" /></label><label>Tipo de archivo<select value={kind} onChange={(e) => setKind(e.target.value)}><option value="">Imágenes y videos</option><option value="image/">Imágenes</option><option value="video/">Videos</option></select></label></div>
    <small>Imágenes y videos de hasta 100 MB por archivo.</small>
    {message && <p role="status">{message}</p>}
    <div className="media-grid">{visible.map((asset) => <article className={`media-item ${selectedId === asset.id ? "selected" : ""}`} key={asset.id}>
      <AssetPreview asset={asset} /><strong>{asset.name}</strong><small>{asset.brand} · {(asset.size / 1024 / 1024).toFixed(1)} MB</small>
      <div className="template-actions">{onSelect && <button type="button" className="secondary-button" onClick={() => onSelect(asset)}>{selectedId === asset.id ? "Seleccionado" : standalone ? "Crear publicación" : "Usar en el post"}</button>}
        {!pickerOnly && <button type="button" className="secondary-button" onClick={async () => { try { downloadFile(await mediaBlob(asset), asset.name); } catch { setMessage("No se pudo descargar el archivo."); } }}>Descargar</button>}
        {!pickerOnly && <button type="button" className="danger-button" disabled={busy || usedIds.includes(asset.id) || selectedId === asset.id} title={usedIds.includes(asset.id) ? "Este archivo está asociado a una publicación" : "Eliminar archivo"} onClick={async () => {
          if (!window.confirm(`¿Eliminar ${asset.name} de la biblioteca?`)) return;
          setBusy(true); try { await deleteMedia(asset.id); setAssets(await allMedia()); } catch { setMessage("No se pudo eliminar el archivo."); } finally { setBusy(false); }
        }}>Eliminar</button>}</div>
    </article>)}</div>
    {!assets.length && <p>{pickerOnly ? "No hay archivos todavía. Añádelos desde el módulo Biblioteca." : "Sube tu primera imagen o video para comenzar."}</p>}
    {assets.length > 0 && !visible.length && <p role="status">No hay archivos que coincidan con los filtros.</p>}
  </section>;
}

export function SelectedMedia({ id }: { id: string }) {
  const [asset, setAsset] = useState<MediaAsset | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let active = true;
    void allMedia().then((items) => { if (active) { const found = items.find((a) => a.id === id); setAsset(found || null); setMissing(!found); } }).catch(() => { if (active) setMissing(true); });
    return () => { active = false; };
  }, [id]);
  return asset && asset.id === id ? <AssetPreview asset={asset} /> : <p>{missing ? "El archivo no está en este navegador. Importa el respaldo que lo contiene o selecciona otro." : "Cargando archivo…"}</p>;
}
