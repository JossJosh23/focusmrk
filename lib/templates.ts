export type ContentTemplate = { id: string; name: string; copy: string; hashtags: string; footer: string };

export function readTemplates(raw: string | null): ContentTemplate[] {
  if (raw === null) return [];
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data) || !data.every((item: unknown) => {
    if (!item || typeof item !== "object") return false;
    const t = item as Record<string, unknown>;
    return typeof t.id === "string" && t.id.length > 0 && typeof t.name === "string" &&
      t.name.trim().length > 0 && t.name.length <= 80 &&
      typeof t.copy === "string" && typeof t.hashtags === "string" && typeof t.footer === "string";
  }) || new Set(data.map((t) => t.id)).size !== data.length) throw new Error("Las plantillas guardadas no son válidas. No se sobrescribirán.");
  return data;
}

export function templateCopy(template: ContentTemplate): string {
  return [template.copy.trim(), template.hashtags.trim()].filter(Boolean).join("\n\n");
}
