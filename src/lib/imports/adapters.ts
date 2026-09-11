import { DEFAULT_LIMITS, ImportError, type Adapter, type Cell } from "./model";
import { space } from "./normalize";

// Never retain source objects or unknown column names/values in an output.
export const ADAPTERS = {
  "inventory-list": { required: ["Sector (Lot No.)", "Lot Status"], optional: [] },
  "interment-summary": { required: ["Lot Location", "Name of Deceased", "Date of Interment"], optional: ["Birthday", "Date of Death", "Site"] },
} as const;
export const APPROVED_SHEETS = {
  "inventory-list": ["inventory", "inventory list", "synthetic inventory"],
  "interment-summary": ["interment summary", "synthetic interments"],
} as const;
export type ApprovedRow = { row: number; location: Cell; status: Cell; name: Cell; birth: Cell; death: Cell; interment: Cell; site: Cell };
const header = (value: Cell) => typeof value === "string" ? space(value).toLowerCase() : "";

export function adapt(adapter: Adapter, rows: Cell[][]): { rows: ApprovedRow[]; ignored: number; missing: string[] } {
  if (!Object.hasOwn(ADAPTERS, adapter)) throw new ImportError("unsupported_adapter");
  if (rows.length > DEFAULT_LIMITS.rows + 1) throw new ImportError("row_limit");
  if (rows.some(r => r.length > DEFAULT_LIMITS.columns)) throw new ImportError("column_limit");
  const spec = ADAPTERS[adapter];
  const headers = (rows[0] ?? []).map(header);
  const allowed = [...spec.required, ...spec.optional];
  if (allowed.some(name => headers.filter(h => h === header(name)).length > 1)) throw new ImportError("duplicate_approved_header");
  const missing = spec.required.filter(name => !headers.includes(header(name)));
  if (missing.length) return { rows: [], ignored: 0, missing };
  let ignored = 0;
  const result: ApprovedRow[] = [];
  rows.slice(1).forEach((cells, index) => {
    const read = (name: string): Cell => {
      const value = cells[headers.indexOf(header(name))] ?? null;
      if (typeof value === "string" && value.length > DEFAULT_LIMITS.cellLength) throw new ImportError("approved_cell_too_long");
      return value;
    };
    const row: ApprovedRow = {
      row: index + 2, location: read(adapter === "inventory-list" ? "Sector (Lot No.)" : "Lot Location"),
      status: adapter === "inventory-list" ? read("Lot Status") : null,
      name: adapter === "interment-summary" ? read("Name of Deceased") : null,
      birth: adapter === "interment-summary" ? read("Birthday") : null,
      death: adapter === "interment-summary" ? read("Date of Death") : null,
      interment: adapter === "interment-summary" ? read("Date of Interment") : null,
      site: adapter === "interment-summary" ? read("Site") : null,
    };
    if ([row.location, row.status, row.name, row.birth, row.death, row.interment, row.site].every(v => v === null || v === "" || (typeof v === "string" && !v.trim()))) ignored++;
    else result.push(row);
  });
  return { rows: result, ignored, missing: [...missing] };
}
