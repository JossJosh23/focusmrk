import { FORMATS, NETWORKS, STATUSES } from "@/lib/calendar";
import { IMPORT_COLUMNS } from "@/lib/calendar-import";
import { brandSection, rules, type BrandContext } from "./composer/prompt";

const today = new Intl.DateTimeFormat("es-EC", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** Exact rule per column for the AI: stricter than the importer accepts, so the answer imports without errors. */
const COLUMN_RULES: Record<(typeof IMPORT_COLUMNS)[number]["key"], string> = {
  date: "AAAA-MM-DD (por ejemplo 2026-11-02). Vacía solo si es una idea sin fecha.",
  time: "HH:MM en 24 horas (por ejemplo 18:30), en el mejor horario para cada red.",
  title: "Obligatorio. Tema corto de la publicación, máximo 160 caracteres.",
  format: `Exactamente uno de: ${FORMATS.join(", ")}.`,
  networks: `Una o varias de: ${NETWORKS.join(", ")}, separadas por coma (por ejemplo: Instagram, TikTok).`,
  status: `Borrador (o uno de: ${STATUSES.join(", ")}).`,
  paid: "Sí o No: si conviene invertir en pauta.",
  important: "Sí o No: Sí en fechas clave o publicaciones de venta.",
  objective: "Qué busca la publicación (alcance, interacción, visitas, ventas…) y cómo se medirá.",
  production: "Qué hay que grabar o diseñar: escenas, tomas, texto en pantalla, audio sugerido.",
  copy: "Texto final listo para publicar, con gancho al inicio y llamado a la acción.",
  footer: "Hashtags (5 a 10) o pie fijo de la marca.",
  referenceUrl: "Vacía, o un enlace https de referencia visual que exista.",
  imageUrl: "Vacía.",
  brand: "Vacía.",
};

const csvField = (value: string) => /[;"\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

/** Prompt that asks an AI for a content calendar as CSV in the import format, with the brand guide and rules. */
export function calendarPrompt(company: string, brand: BrandContext, now = new Date()): string {
  const header = IMPORT_COLUMNS.map(column => column.header).join(";");
  const example = IMPORT_COLUMNS.map(column => csvField(column.key === "networks" ? "Instagram, TikTok" : column.example)).join(";");
  return [
    `Eres estratega de marketing digital y redes sociales. Vas a crear el calendario de contenido de «${company || "mi marca"}». Hoy es ${today.format(now)}.`,
    brandSection(brand),
    rules(brand),
    `## Cómo quiero que trabajes
1. Investiga antes de proponer: revisa las redes de la marca (enlaces de arriba), a sus competidores y a referentes del mismo rubro en la zona, y lo que hoy funciona en cada red (formatos, ganchos, audios, días y horarios). Si no puedes navegar por internet, dímelo en una línea antes del CSV y básate en buenas prácticas actuales.
2. Arma la mejor estrategia para posicionar la marca, crecer en alcance y conseguir ventas: mezcla Reels, Carruseles y Posts, alterna contenido de valor, de comunidad y de venta, y aprovecha las fechas especiales del periodo.
3. Cada publicación debe tener un objetivo claro y un llamado a la acción.`,
    `## Formato de respuesta (obligatorio)
Responde con un único bloque de código CSV para importarlo tal cual en mi calendario:
- Separador: punto y coma (;).
- Primera fila exactamente: ${header}
- Una publicación por fila, en orden de fecha.
- Si un texto lleva punto y coma, comillas o saltos de línea, enciérralo entre comillas dobles y duplica las comillas internas.
- No agregues columnas ni cambies sus nombres.

Columnas:
${IMPORT_COLUMNS.map(column => `- ${column.header}: ${COLUMN_RULES[column.key]}`).join("\n")}

Ejemplo de una fila:
\`\`\`csv
${header}
${example}
\`\`\``,
    "---\nMi pedido (cuántas publicaciones, qué periodo y qué quieres destacar): ",
  ].filter(Boolean).join("\n\n");
}

/** CSV pasted from an AI answer: the content of the first ``` block if there is one, else the whole text. */
export function pastedCsv(text: string): string {
  const fenced = text.match(/```[^\n]*\n([\s\S]*?)```/);
  return (fenced ? fenced[1] : text).trim();
}
