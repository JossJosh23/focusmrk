import { NETWORKS, overrideKey, parseDate, postMediaIds, type Publication } from "@/lib/calendar";
import type { CompanyProfile } from "@/lib/company-profile";

const longDate = new Intl.DateTimeFormat("es-EC", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** What the prompt knows about the brand. `logoColors` is only used when there is no manual and no typed palette. */
export type BrandContext = { profile: CompanyProfile | null; manualName: string; logoColors: string[] };

const section = (title: string, text: string | undefined) => text?.trim() ? `## ${title}\n${text.trim()}` : "";
const list = (rows: [string, string | undefined][]) => rows.filter(([, value]) => value?.trim()).map(([label, value]) => `- ${label}: ${value!.trim()}`).join("\n");

/** Palette line and where it comes from: manual first, then the colours typed in Empresa, then those read from the logo. */
function palette({ profile, manualName, logoColors }: BrandContext) {
  const typed = profile?.brandColors || [];
  if (manualName) return typed.length ? `${typed.join(", ")} (y los del manual de marca adjunto, que manda)` : "los del manual de marca adjunto";
  if (typed.length) return typed.join(", ");
  if (logoColors.length) return `${logoColors.join(", ")} (detectados del logo; no hay manual de marca)`;
  return "";
}

export function brandSection(brand: BrandContext) {
  const { profile, manualName } = brand;
  const colors = palette(brand);
  const facts = list([
    ["Nombre", profile?.name],
    ["Qué hace", profile?.description],
    ["Sitio web", profile?.website],
    ["Instagram", profile?.instagram],
    ["Facebook", profile?.facebook],
    ["TikTok", profile?.tiktok],
    ["Colores de marca", colors],
    ["Tono de voz", profile?.voice],
    ["Público objetivo", profile?.audience],
    ["Productos o platos estrella", profile?.products],
    ["Qué evitar", profile?.avoid],
  ]);
  const manual = manualName ? `Te adjunto el manual de marca («${manualName}»). Síguelo en colores, tipografías, uso del logo y tono; si algo de este brief lo contradice, manda el manual.` : "";
  return [facts && `## Marca\n${facts}`, manual].filter(Boolean).join("\n\n");
}

export function rules(brand: BrandContext) {
  const colors = palette(brand);
  return `## Reglas que debes respetar
- Respeta los platos y productos originales: no inventes ni cambies platos, ingredientes, presentaciones, precios ni promociones que no estén en este brief. Si propones fotos o imágenes, el producto debe verse igual que el real.
- Respeta el logo original: no lo redibujes, deformes, recolores ni inventes otro; úsalo tal cual y con espacio a su alrededor.
- ${colors ? `Usa en cualquier propuesta visual los colores de marca indicados arriba${brand.manualName ? " y en el manual" : ""}; no inventes otros.` : "Si propones piezas visuales, pregúntame los colores de la marca antes de inventarlos."}
- Escribe en español, con el tono de la marca, y sin datos que no puedas comprobar.`;
}

const STRATEGY = `## Cómo quiero que trabajes
1. Investiga antes de proponer: revisa las redes de la marca (enlaces de arriba), a sus competidores y a referentes del mismo rubro en la zona, y lo que hoy funciona en cada red (formatos, ganchos, audios y horarios). Si no puedes navegar por internet, dímelo y básate en buenas prácticas actuales.
2. Analiza qué le falta a esta publicación para posicionar la marca, crecer en alcance y conseguir ventas.
3. Propón la mejor estrategia: gancho de los primeros segundos, mensaje, llamado a la acción, formato y horario, y adapta cada versión a cada red.
4. Justifica cada propuesta en una línea y ordénalas de la más a la menos efectiva.`;

/** Every text field of a publication, plus the brand guide and working rules, as a Markdown brief for an AI chat. */
export function postPrompt(post: Publication, brand: BrandContext = { profile: null, manualName: "", logoColors: [] }): string {
  const files = postMediaIds(post).length;
  const facts = list([
    ["Empresa", post.brand],
    ["Fecha", post.date ? `${longDate.format(parseDate(post.date))}, ${post.time}` : "Sin fecha (idea)"],
    ["Formato", post.format],
    ["Redes", post.networks.join(", ")],
    ["Estado", post.status],
    ["Distribución", post.paid ? "Con pauta pagada" : "Orgánica"],
    ["Prioridad", post.important ? "Importante" : ""],
    ["Archivos", files ? `${files} ${files === 1 ? "archivo adjunto" : "archivos adjuntos"} (no incluidos en este texto)` : ""],
  ]);
  const overrides = post.captionOverrides || {};
  const custom = NETWORKS.filter(network => overrideKey(network) in overrides)
    .map(network => section(`Copy para ${network}`, overrides[overrideKey(network)] || "(vacío a propósito)"));
  return [
    "Eres estratega de marketing digital y redes sociales. Te comparto el brief de una publicación y la guía de la marca. Úsalos como contexto para lo que te pida al final.",
    brandSection(brand),
    `# Publicación: ${post.title.trim() || "sin título"}`,
    `## Datos\n${facts}`,
    section("Objetivo", post.objective),
    section("Producción", post.production),
    section(custom.length ? "Copy general" : "Copy", post.copy),
    ...custom,
    section("Firma / pie del copy", post.footer),
    section("Referencia visual", post.referenceUrl),
    section("Enlace de imagen o video", post.imageUrl),
    rules(brand),
    STRATEGY,
    "---\nMi pedido: ",
  ].filter(Boolean).join("\n\n");
}
