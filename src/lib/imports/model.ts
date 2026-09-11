export type Adapter = "inventory-list" | "interment-summary";
export type State = "valid" | "valid_with_warnings" | "needs_review" | "rejected";
export type Severity = "info" | "warning" | "error";
export type Cell = string | number | boolean | Date | null;
export type Context = { adapter: Adapter; siteId: string; fileLabel: string; sheet: string };
export type Issue = {
  code: string; severity: Severity; adapter: Adapter; row: number;
  field: string; description: string; resolution: string;
};
export type Lot = {
  raw: string; key: string; status: "resolved" | "partial" | "unresolved";
  area: string | null; sector: string | null; lot: string | null; unit: string | null;
  classification: string | null;
  type: "standard" | "premium" | "special_premium" | "estate" | null;
};
export type RecordPlan = {
  row: number; state: State; duplicate: boolean; fingerprint: string;
  lot: Lot; commercialStatus: string | null;
  displayName: string | null; normalizedName: string | null;
  sourceSite: string | null;
  birth: string | null; death: string | null; interment: string | null;
  issues: Issue[];
};
export type Snapshot = {
  plotTypes: { code: string; capacity: number | null }[];
  plots: { id: string; key: string; classification: string | null; commercialStatus: string | null; activeInterments: number; capacity: number | null }[];
  people: { name: string; birth: string | null; death: string | null }[];
  fingerprints: string[];
};
export type Preview = {
  context: Context; records: RecordPlan[]; issues: Issue[];
  summary: {
    totalRows: number; ignoredRows: number; validRows: number; warningRows: number;
    reviewRows: number; rejectedRows: number; newPlots: number; existingPlotMatches: number;
    newDeceasedCandidates: number; possibleDeceasedMatches: number; intermentsProposed: number;
    duplicatesSkipped: number; issuesByCode: Record<string, number>; issuesBySeverity: Record<string, number>;
    unknownClassifications: string[];
  };
};
export type WorkbookLimits = {
  fileBytes: number;
  inflatedBytes: number;
  entries: number;
  sheets: number;
  rows: number;
  columns: number;
  cellLength: number;
};

// Defaults cover the known GRAVENAV inventory scale while remaining bounded.
// Trusted server code may lower them or raise them only as far as HARD_LIMITS.
export const DEFAULT_LIMITS: Readonly<WorkbookLimits> = Object.freeze({
  fileBytes: 10 * 1024 * 1024,
  inflatedBytes: 64 * 1024 * 1024,
  entries: 100,
  sheets: 10,
  rows: 10_000,
  columns: 64,
  cellLength: 512,
});
export const HARD_LIMITS: Readonly<WorkbookLimits> = Object.freeze({
  fileBytes: 20 * 1024 * 1024,
  inflatedBytes: 128 * 1024 * 1024,
  entries: 200,
  sheets: 20,
  rows: 20_000,
  columns: 128,
  cellLength: 2_048,
});

export function resolveWorkbookLimits(overrides: Partial<WorkbookLimits> = {}): Readonly<WorkbookLimits> {
  const resolved = { ...DEFAULT_LIMITS, ...overrides };
  for (const key of Object.keys(HARD_LIMITS) as (keyof WorkbookLimits)[]) {
    if (!Number.isSafeInteger(resolved[key]) || resolved[key] < 1 || resolved[key] > HARD_LIMITS[key]) {
      throw new ImportError("workbook_limit_exceeds_hard_ceiling");
    }
  }
  return Object.freeze(resolved);
}
export class ImportError extends Error {
  constructor(public readonly code: string) { super(code); this.name = "ImportError"; }
}
