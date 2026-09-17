import JSZip from "jszip";
import { mediaBlob, type MediaAsset } from "./media";

export async function mediaArchive(assets: MediaAsset[]): Promise<Blob> {
  const zip = new JSZip(); const names = new Set<string>();
  for (const asset of assets) {
    const base = asset.name.replace(/[\\/\x00-\x1f]/g, "_") || "archivo";
    let name = base; let index = 2;
    while (names.has(name.toLowerCase())) name = `${index++}-${base}`;
    names.add(name.toLowerCase());
    zip.file(name, await (await mediaBlob(asset)).arrayBuffer());
  }
  return zip.generateAsync({ type: "blob", compression: "STORE" });
}
