"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { allMedia, assetFromFile, deleteMedia, MEDIA_TYPES, putMedia, type MediaAsset } from "@/lib/media";
import { downloadFile } from "@/lib/backup";

export function AssetPreview({ asset }: { asset: MediaAsset }) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const next = URL.createObjectURL(asset.blob);
    const timer = setTimeout(() => { setUrl(next); setFailed(false); }, 0);
    return () => { clearTimeout(timer); URL.revokeObjectURL(next); };
  }, [asset.blob]);
  if (!url) return <p>Cargando archivo…</p>;
  if (failed) return <p>No se puede previsualizar este formato. <a href={url} download={asset.name}>Descargar archivo</a></p>;
  return asset.type.startsWith("video/") ? <video controls preload="metadata" src={url} aria-label={asset.name} onError={() => setFailed(true)} /> : <Image unoptimized src={url} width={360} height={260} alt={asset.name} onError={() => setFailed(true)} />;
}

export function MediaLibrary({ usedIds, selectedId = "", initialBrand = "Mi marca", onSelect, revision = 0 }: {
  usedIds: string[]; selectedId?: string; initialBrand?: string; onSelect?: (asset: MediaAsset) => void; revision?: number;
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [brand, setBrand] = useState(initialBrand);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const refresh = () => { void allMedia().then((items) => { if (active) setAssets(items); }).catch((e: Error) => { if (active) setMessage(e.message); }); };
    refresh(); window.addEventListener("focusmrk-media-change", refresh); window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("focusmrk-media-change", refresh); window.removeEventListener("focus", refresh); };
  }, [revision]);
  const brands = Array.from(new Set(assets.map((a) => a.brand))).sort();
  return <section className="media-library" aria-label="Biblioteca de imágenes y videos">
    <div className="media-controls"><label>Marca para los archivos<input maxLength={80} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Nombre de la marca" /></label>
      <label>Subir imágenes o videos<input disabled={busy} type="file" multiple accept={MEDIA_TYPES.join(",")} onChange={async (e) => {
        const files = Array.from(e.target.files || []); e.target.value = "";
        if (!files.length) return;
        setBusy(true); setMessage("");
        try { const next = files.map((file) => assetFromFile(file, brand)); await putMedia(next); setAssets(await allMedia()); setMessage(`${next.length} archivo(s) guardado(s).`); }
        catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo subir."); }
        finally { setBusy(false); }
      }} /></label>
      <label>Filtrar biblioteca por marca<select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">Todas las marcas</option>{brands.map((b) => <option key={b}>{b}</option>)}</select></label></div>
    <small>Archivos guardados en este navegador. Hasta 100 MB por archivo. Inclúyelos en tus respaldos para conservarlos.</small>
    {message && <p role="status">{message}</p>}
    <div className="media-grid">{assets.filter((a) => !filter || a.brand === filter).map((asset) => <article className={`media-item ${selectedId === asset.id ? "selected" : ""}`} key={asset.id}>
      <AssetPreview asset={asset} /><strong>{asset.name}</strong><small>{asset.brand} · {(asset.size / 1024 / 1024).toFixed(1)} MB</small>
      <div className="template-actions">{onSelect && <button type="button" className="secondary-button" onClick={() => onSelect(asset)}>{selectedId === asset.id ? "Seleccionado" : "Usar en el post"}</button>}
        <button type="button" className="secondary-button" onClick={() => downloadFile(asset.blob, asset.name)}>Descargar</button>
        <button type="button" className="danger-button" disabled={busy || usedIds.includes(asset.id) || selectedId === asset.id} title={usedIds.includes(asset.id) ? "Este archivo está asociado a una publicación" : "Eliminar archivo"} onClick={async () => {
          if (!window.confirm(`¿Eliminar ${asset.name} de la biblioteca?`)) return;
          setBusy(true); try { await deleteMedia(asset.id); setAssets(await allMedia()); } catch { setMessage("No se pudo eliminar el archivo."); } finally { setBusy(false); }
        }}>Eliminar</button></div>
    </article>)}</div>
    {!assets.length && <p>Sube tu primera imagen o video para comenzar.</p>}
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
