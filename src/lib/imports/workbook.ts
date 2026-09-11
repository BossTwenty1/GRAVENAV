import "server-only";
import { open } from "node:fs/promises";
import { extname } from "node:path";
import { Unzip, UnzipInflate, strFromU8 } from "fflate";
import { readSheet } from "read-excel-file/node";
import { ImportError, resolveWorkbookLimits, type Cell, type WorkbookLimits } from "./model";
import { APPROVED_SHEETS } from "./adapters";
import { space } from "./normalize";

// Examine actual inflated bytes, not just attacker-controlled ZIP size fields.
// Small input chunks bound each synchronous inflation allocation.
function inspectArchiveWithLimits(bytes: Uint8Array, limits: Readonly<WorkbookLimits>): void {
  let total = 0, entries = 0, sheets = 0;
  const names = new Set<string>();
  let workbook = false;
  const unzip = new Unzip(entry => {
    if (++entries > limits.entries || names.has(entry.name)) throw new ImportError("archive_entry_limit");
    names.add(entry.name);
    if (/(?:vbaProject|externalLinks|macros)/i.test(entry.name)) throw new ImportError("unsupported_workbook_content");
    if (/^xl\/worksheets\/[^/]+\.xml$/.test(entry.name) && ++sheets > limits.sheets) throw new ImportError("worksheet_limit");
    const chunks: Uint8Array[] = [];
    entry.ondata = (error, data, final) => {
      if (error instanceof ImportError) throw error;
      if (error) throw new ImportError("workbook_read_failure");
      total += data.length;
      if (total > limits.inflatedBytes) throw new ImportError("inflated_size_limit");
      if (entry.name.endsWith(".xml") || entry.name.endsWith(".rels")) chunks.push(data);
      if (final && chunks.length) {
        const xml = strFromU8(Buffer.concat(chunks));
        if (/<!DOCTYPE|<!ENTITY|macroEnabled/i.test(xml)) throw new ImportError("unsupported_workbook_content");
        if (entry.name === "xl/workbook.xml") workbook = true;
        if (/^xl\/worksheets\/[^/]+\.xml$/.test(entry.name)) {
          // Reject encoded coordinate attributes rather than allocating sparse
          // billion-row arrays. Nonstandard OOXML is rejected, never repaired.
          for (const match of xml.matchAll(/\b(?:r|ref)\s*=\s*["']([^"']*)["']/g)) {
            if (match[1].includes("&")) throw new ImportError("invalid_cell_reference");
            for (const ref of match[1].split(/[: ]/)) {
              const cell = /^([A-Z]*)([1-9]\d*)$/.exec(ref);
              if (!cell) throw new ImportError("invalid_cell_reference");
              const column = [...cell[1]].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
              if (+cell[2] > limits.rows + 1) throw new ImportError("row_limit");
              if (column > limits.columns) throw new ImportError("column_limit");
            }
          }
          if ((xml.match(/<(?:\w+:)?row\b/g) ?? []).length > limits.rows + 1) throw new ImportError("row_limit");
          if ((xml.match(/<(?:\w+:)?c\b/g) ?? []).length > (limits.rows + 1) * limits.columns) throw new ImportError("column_limit");
        }
      }
    };
    entry.start();
  });
  unzip.register(UnzipInflate);
  for (let index = 0; index < bytes.length; index += 1024) unzip.push(bytes.subarray(index, index + 1024), index + 1024 >= bytes.length);
  if (!workbook || !sheets) throw new ImportError("empty_workbook");
}

export function inspectArchive(bytes: Uint8Array, overrides: Partial<WorkbookLimits> = {}): void {
  inspectArchiveWithLimits(bytes, resolveWorkbookLimits(overrides));
}

export async function readWorkbookBytes(bytes: Uint8Array, sheet: string, overrides: Partial<WorkbookLimits> = {}): Promise<Cell[][]> {
  const limits = resolveWorkbookLimits(overrides);
  if (bytes.length > limits.fileBytes) throw new ImportError("file_size_limit");
  if (!(Object.values(APPROVED_SHEETS).flat() as readonly string[]).includes(space(sheet).toLowerCase())) throw new ImportError("unapproved_worksheet");
  try {
    inspectArchiveWithLimits(bytes, limits);
    const rows = await readSheet(Buffer.from(bytes), sheet, { trim: false });
    if (!rows.length) throw new ImportError("empty_workbook");
    if (rows.length > limits.rows + 1) throw new ImportError("row_limit");
    if (rows.some(row => row.length > limits.columns)) throw new ImportError("column_limit");
    return rows as unknown as Cell[][];
  } catch (error) {
    if (error instanceof ImportError) throw error;
    if (error instanceof Error && error.name === "SheetNotFoundError") throw new ImportError("worksheet_missing");
    throw new ImportError("workbook_read_failure");
  }
}

export async function readWorkbook(path: string, sheet: string, overrides: Partial<WorkbookLimits> = {}): Promise<Cell[][]> {
  const limits = resolveWorkbookLimits(overrides);
  if (extname(path).toLowerCase() !== ".xlsx") throw new ImportError("unsupported_file");
  let file;
  try {
    file = await open(path, "r");
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > limits.fileBytes) throw new ImportError("file_size_limit");
    // Bounded read also protects against a file growing after stat().
    const bytes = Buffer.alloc(limits.fileBytes + 1);
    let offset = 0;
    while (offset < bytes.length) {
      const result = await file.read(bytes, offset, bytes.length - offset, offset);
      if (!result.bytesRead) break;
      offset += result.bytesRead;
    }
    return await readWorkbookBytes(bytes.subarray(0, offset), sheet, limits);
  } catch (error) {
    if (error instanceof ImportError) throw error;
    throw new ImportError("workbook_read_failure");
  } finally { await file?.close(); }
}
