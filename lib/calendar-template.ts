import JSZip from "jszip";
import { FORMATS, NETWORKS, STATUSES } from "./calendar";
import { IMPORT_COLUMNS, IMPORT_MAX_ROWS } from "./calendar-import";

const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const letter = (index: number) => String.fromCharCode(65 + index);
// Style 1: bold header on a tint; style 2: text, so Excel keeps "2026-11-02" and "18:30" as typed instead of converting them.
const cell = (ref: string, value: string, style: number) => `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${escape(value)}</t></is></c>`;
const row = (index: number, values: string[], style: number) => `<row r="${index}">${values.map((value, column) => cell(`${letter(column)}${index}`, value, style)).join("")}</row>`;

/** Every non-empty combination of networks, so "Redes" can be a dropdown. Joined with "+": a comma separates list items in Excel. */
const networkChoices = Array.from({ length: (1 << NETWORKS.length) - 1 }, (_, index) => NETWORKS.filter((_, bit) => (index + 1) & 1 << bit).join(" + "))
  .sort((a, b) => a.split("+").length - b.split("+").length);

function validation(column: string, values: readonly string[], prompt: string) {
  const last = IMPORT_MAX_ROWS + 1;
  return `<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="1" errorTitle="Valor no válido" error="Elige un valor de la lista." promptTitle="${escape(prompt)}" prompt="Elige de la lista." sqref="${column}2:${column}${last}"><formula1>"${escape(values.join(","))}"</formula1></dataValidation>`;
}

/** Import template: sheet «Calendario» (headers, one example row, dropdowns) and sheet «Instrucciones». */
export async function calendarTemplate(): Promise<Blob> {
  const headers = IMPORT_COLUMNS.map(column => column.header);
  const columnOf = (key: string) => letter(IMPORT_COLUMNS.findIndex(column => column.key === key));
  const widths = IMPORT_COLUMNS.map(column => ["title", "objective", "production", "copy", "footer"].includes(column.key) ? 40 : ["networks", "referenceUrl", "imageUrl"].includes(column.key) ? 28 : 14);
  const calendar = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols>${widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" style="2" customWidth="1"/>`).join("")}</cols>
<sheetData>${row(1, headers, 1)}${row(2, IMPORT_COLUMNS.map(column => column.example), 2)}</sheetData>
<dataValidations count="5">${validation(columnOf("format"), FORMATS, "Formato")}${validation(columnOf("networks"), networkChoices, "Redes")}${validation(columnOf("status"), STATUSES, "Estado")}${validation(columnOf("paid"), ["Sí", "No"], "Pauta")}${validation(columnOf("important"), ["Sí", "No"], "Importante")}</dataValidations>
</worksheet>`;
  const notes = [
    ["Cómo usar esta plantilla", ""],
    ["1.", "Escribe una publicación por fila en la hoja «Calendario». Puedes borrar la fila de ejemplo."],
    ["2.", "No cambies los nombres de la primera fila. Solo «Título» es obligatorio; el resto tiene un valor por defecto."],
    ["3.", "Guarda como Excel (.xlsx) o CSV e impórtalo desde Calendario → Importar. Antes de guardar verás cada fila con sus errores."],
    ["4.", "Las imágenes y videos no se importan: súbelos después en cada publicación o usa la columna «Enlace imagen o video»."],
    ["", ""],
    ["Columna", "Qué escribir"],
    ...IMPORT_COLUMNS.map(column => [column.header + ("required" in column ? " *" : ""), column.hint]),
  ];
  const instructions = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="24" customWidth="1"/><col min="2" max="2" width="100" customWidth="1"/></cols>
<sheetData>${notes.map((values, index) => row(index + 1, values, index === 0 || index === 6 ? 1 : 2)).join("")}</sheetData></worksheet>`;
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  zip.file("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Calendario" sheetId="1" r:id="rId1"/><sheet name="Instrucciones" sheetId="2" r:id="rId2"/></sheets></workbook>`);
  zip.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  zip.file("xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2F6BFF"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="49" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1"/><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`);
  zip.file("xl/worksheets/sheet1.xml", calendar);
  zip.file("xl/worksheets/sheet2.xml", instructions);
  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
