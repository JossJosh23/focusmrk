"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Film, Search, Upload, X } from "lucide-react";
import { MAX_CAROUSEL } from "@/lib/calendar";
import { allMedia, MEDIA_TYPES, type MediaAsset } from "@/lib/media";
import { AssetPreview } from "../media-library";
import { Segmented } from "./ui";
import { formatBytes } from "./model";
import { uploadToLibrary } from "./media";

type Filter = "all" | "image" | "video";

/** Right-hand sheet (its own modal dialog, so focus stays inside) to pick the post's media from the library.
 *  With `multiple`, files are picked in click order, which becomes the carousel order. */
export function MediaLibrarySheet({ brand, selectedIds, usedIds, multiple, onClose, onPick }: {
  brand: string; selectedIds: string[]; usedIds: string[]; multiple: boolean;
  onClose: () => void; onPick: (assets: MediaAsset[]) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [chosen, setChosen] = useState<string[]>(selectedIds);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
    dialog.current?.querySelector<HTMLInputElement>("input[type=search]")?.focus();
    let active = true;
    void allMedia().then(items => { if (active) setAssets(items); }).catch(() => { if (active) { setAssets([]); setMessage("No se pudo leer la biblioteca."); } });
    return () => { active = false; };
  }, []);
  // Same scope as the Biblioteca module: the post's brand (or every file when no brand applies).
  const scoped = (assets || []).filter(asset => !brand || asset.brand === brand);
  const term = query.trim().toLocaleLowerCase("es");
  const visible = scoped.filter(asset => (filter === "all" || asset.type.startsWith(filter + "/")) && asset.name.toLocaleLowerCase("es").includes(term))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const chosenAssets = chosen.map(id => scoped.find(asset => asset.id === id)).filter((asset): asset is MediaAsset => !!asset);
  function toggle(id: string) {
    if (!multiple) { setChosen(chosen[0] === id ? [] : [id]); return; }
    if (chosen.includes(id)) setChosen(chosen.filter(item => item !== id));
    else if (chosen.length >= MAX_CAROUSEL) setMessage(`Un carrusel admite hasta ${MAX_CAROUSEL} archivos.`);
    else setChosen([...chosen, id]);
  }
  async function upload(files: File[]) {
    if (!files.length || busy) return;
    setBusy(true); setMessage("");
    try {
      const { assets: added, message: result } = await uploadToLibrary(files, brand);
      setAssets(await allMedia());
      const ids = added.map(asset => asset.id);
      if (ids.length) setChosen(multiple ? [...new Set([...chosen, ...ids])].slice(0, MAX_CAROUSEL) : ids.slice(0, 1));
      setMessage(result);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo subir el archivo."); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} className="cmp-sheet" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="cmp-sheet-inner">
      <header className="cmp-sheet-head">
        <div><h2 id={titleId}>Biblioteca</h2><p>{brand || "Todas las empresas"} · {scoped.length} {scoped.length === 1 ? "archivo" : "archivos"}{multiple ? " · elige varios en el orden del carrusel" : ""}</p></div>
        <button type="button" className="cmp-icon-button" aria-label="Cerrar biblioteca" onClick={onClose}><X size="var(--icon-md)" aria-hidden="true" /></button>
      </header>
      <div className="cmp-sheet-tools">
        <label className="cmp-search"><Search size="var(--icon-sm)" aria-hidden="true" /><input type="search" aria-label="Buscar en la biblioteca" placeholder="Buscar por nombre…" value={query} onChange={event => setQuery(event.target.value)} /></label>
        <Segmented<Filter> label="Tipo de archivo" size="sm" value={filter} onChange={setFilter} options={[{ value: "all", label: "Todos" }, { value: "image", label: "Imágenes" }, { value: "video", label: "Videos" }]} />
        <button type="button" className="cmp-button is-secondary" disabled={busy} onClick={() => input.current?.click()}><Upload size="var(--icon-sm)" aria-hidden="true" />{busy ? "Subiendo…" : "Subir"}</button>
        <input ref={input} type="file" hidden multiple accept={MEDIA_TYPES.join(",")} onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ""; void upload(files); }} />
      </div>
      {message && <p className="cmp-help cmp-sheet-message" role="status">{message}</p>}
      <div className="cmp-sheet-body">
        {assets === null ? <p className="cmp-empty-note">Cargando biblioteca…</p>
          : !visible.length ? <p className="cmp-empty-note">{scoped.length ? "Ningún archivo coincide con la búsqueda." : "Aún no hay archivos de esta empresa. Sube el primero."}</p>
          : <ul className="cmp-asset-grid">{visible.map(asset => {
            const inUse = usedIds.includes(asset.id) && !selectedIds.includes(asset.id);
            const order = chosen.indexOf(asset.id);
            return <li key={asset.id}><button type="button" className="cmp-asset" aria-pressed={order >= 0} onClick={() => toggle(asset.id)} onDoubleClick={() => !multiple && onPick([asset])}>
              <span className="cmp-asset-thumb"><AssetPreview asset={asset} thumbnail />{asset.type.startsWith("video/") && <span className="cmp-asset-kind" aria-label="Video"><Film size="var(--cal-icon)" aria-hidden="true" /></span>}{order >= 0 && <span className="cmp-asset-check" aria-hidden="true">{multiple ? order + 1 : <Check size="var(--cal-icon)" />}</span>}</span>
              <span className="cmp-asset-name" title={asset.name}>{asset.name}</span>
              <span className="cmp-asset-meta">{formatBytes(asset.size)}{inUse && <b>En uso</b>}</span>
            </button></li>;
          })}</ul>}
      </div>
      <footer className="cmp-sheet-foot">
        <span>{!chosenAssets.length ? "Ningún archivo seleccionado" : chosenAssets.length === 1 ? chosenAssets[0].name : `${chosenAssets.length} archivos seleccionados`}</span>
        <button type="button" className="cmp-button is-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="cmp-button is-primary" disabled={!chosenAssets.length} onClick={() => onPick(chosenAssets)}>{chosenAssets.length > 1 ? `Usar ${chosenAssets.length} archivos` : "Usar archivo"}</button>
      </footer>
    </div>
  </dialog>;
}
