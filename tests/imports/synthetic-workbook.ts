import { strToU8, zipSync } from "fflate";

// Tiny OOXML fixtures are generated in memory. No binary files or client data.
// Hand-authored XML also lets reader tests cover malformed and hostile inputs.
export const escapeXml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
export function syntheticWorkbook(rows: (string | number | null)[][], options: { sheet?: string; extra?: Record<string, string>; sheetXml?: string; epoch1904?: boolean } = {}) {
  const sheet = options.sheet ?? "Synthetic Inventory";
  const xml = options.sheetXml ?? `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((row, i) => `<row r="${i + 1}">${row.map((value, j) => value === null ? "" : `<c r="${String.fromCharCode(65 + j)}${i + 1}"${typeof value === "number" ? "" : ' t="inlineStr"'}>${typeof value === "number" ? `<v>${value}</v>` : `<is><t>${escapeXml(value)}</t></is>`}</c>`).join("")}</row>`).join("")}</sheetData></worksheet>`;
  return zipSync(Object.fromEntries(Object.entries({
    "[Content_Types].xml": '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    "_rels/.rels": '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml": `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><workbookPr date1904="${options.epoch1904 ? 1 : 0}"/><sheets><sheet name="${escapeXml(sheet)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/worksheets/sheet1.xml": xml,
    ...options.extra,
  }).map(([key, value]) => [key, strToU8(value)])));
}
