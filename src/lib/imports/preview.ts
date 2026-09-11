import "server-only";
import { createHash } from "node:crypto";
import { adapt, APPROVED_SHEETS } from "./adapters";
import { comparisonName, normalizeDate, parseLot, space } from "./normalize";
import { ImportError, type Cell, type Context, type Issue, type Preview, type RecordPlan, type Snapshot } from "./model";

export const fingerprint = (values: unknown[]) => createHash("sha256").update(JSON.stringify(["gravenav-import-v1", ...values])).digest("hex");
export const emptySnapshot = (): Snapshot => ({ plots: [], people: [], fingerprints: [], plotTypes: [] });
const text = (cell: Cell) => typeof cell === "string" ? cell : "";

export function preview(context: Context, cells: Cell[][], snapshot = emptySnapshot()): Preview {
  if (!/^[0-9a-f-]{36}$/i.test(context.siteId) || !/^[A-Za-z0-9 _.-]{1,80}$/.test(context.fileLabel) || !context.sheet || context.sheet.length > 80) throw new ImportError("invalid_source_context");
  const source = adapt(context.adapter, cells);
  if (!(APPROVED_SHEETS[context.adapter] as readonly string[]).includes(space(context.sheet).toLowerCase())) throw new ImportError("unapproved_worksheet");
  const issues: Issue[] = source.missing.map(field => ({ code: "missing_required_header", severity: "error", adapter: context.adapter, row: 1, field, description: "Required approved column is missing.", resolution: "Select the approved worksheet and verify its header row." }));
  const records: RecordPlan[] = source.rows.map(row => {
    const record: RecordPlan = { row: row.row, state: "valid", duplicate: false, fingerprint: "", lot: parseLot(text(row.location)), commercialStatus: space(text(row.status)).toUpperCase() || null, displayName: text(row.name) || null, normalizedName: text(row.name).trim() ? comparisonName(text(row.name)) : null, sourceSite: text(row.site) || null, birth: null, death: null, interment: null, issues: [] };
    const add = (code: string, field: string, state: "needs_review" | "rejected" | "valid_with_warnings", description: string) => addIssue(record, context, code, field, state, description);
    if (!record.lot.key) add("missing_lot_location", "location", "rejected", "A text lot location is required.");
    else if (record.lot.status !== "resolved") add("lot_parse_partial", "location", "needs_review", "Unrecognized location grammar. Raw text and all tokens are retained.");
    if (record.lot.classification === "MCF") add("unresolved_source_modifier", "classification", "needs_review", "MCF remains unresolved; no plot type is assigned.");
    else if (!record.lot.type) add("unknown_lot_type", "classification", "needs_review", "A source classification requires mapping review.");
    else if (record.lot.type === "estate") add("estate_inference", "classification", "valid_with_warnings", "EST to estate is a project inference, not a verified client classification.");
    if (context.adapter === "inventory-list" && row.status !== null && typeof row.status !== "string") add("invalid_cell_type", "commercial_status", "rejected", "Commercial status must be text.");
    if (record.commercialStatus && !["BOOKED", "AVAILABLE", "HOLD"].includes(record.commercialStatus)) add("unknown_commercial_status", "commercial_status", "needs_review", "Unknown commercial status is retained for review and is not occupancy.");
    if (context.adapter === "interment-summary") {
      if (row.site !== null && row.site !== "") add("unresolved_site_indicator", "site", "needs_review", "Source site indicator requires an approved mapping to the target cemetery UUID.");
      if (!record.normalizedName) add("missing_deceased_name", "name", "rejected", "A deceased display name is required.");
      for (const field of ["birth", "death", "interment"] as const) {
        const result = normalizeDate(row[field]);
        record[field] = result.value;
        if (result.invalid) add(`invalid_${field}_date`, field, "rejected", "Use an Excel date cell or an unambiguous YYYY-MM-DD date. Missing dates are allowed.");
      }
      if ((record.birth && record.death && record.birth > record.death) || (record.death && record.interment && record.death > record.interment) || (record.birth && record.interment && record.birth > record.interment)) add("suspicious_date_sequence", "dates", "needs_review", "Parseable dates have an inconsistent sequence; verify the source.");
    }
    record.fingerprint = fingerprint([context.adapter, context.siteId, record.lot.key, record.commercialStatus, record.normalizedName, record.birth, record.death, record.interment, record.sourceSite]);
    return record;
  });

  const seen = new Set(snapshot.fingerprints);
  for (const record of records) {
    if (record.state === "rejected") continue;
    if (seen.has(record.fingerprint)) {
      record.duplicate = true;
      record.issues.push({ code: "duplicate_source_row", severity: "info", adapter: context.adapter, row: record.row, field: "fingerprint", description: "Exact sanitized logical input already exists; skipped without merging identities.", resolution: "No insertion. Review the original record if a correction is intended." });
    } else seen.add(record.fingerprint);
  }

  const activeRecords = records.filter(record => !record.duplicate);
  const recordsByLot = groupBy(activeRecords, record => record.lot.key);
  const snapshotPlotsByLot = groupBy(snapshot.plots, plot => plot.key);
  const physicalVariants = new Map<string, Set<string>>();
  for (const key of [...snapshot.plots.map(plot => plot.key), ...activeRecords.map(record => record.lot.key)]) {
    const physicalKey = key.replace(/;TYPE:[A-Z]+$/, "");
    const variants = physicalVariants.get(physicalKey) ?? new Set<string>();
    variants.add(key);
    physicalVariants.set(physicalKey, variants);
  }
  const peopleByName = new Map<string, { record: RecordPlan | null; birth: string | null; death: string | null }[]>();
  for (const person of snapshot.people) {
    const name = comparisonName(person.name);
    const matches = peopleByName.get(name) ?? [];
    matches.push({ record: null, birth: person.birth, death: person.death });
    peopleByName.set(name, matches);
  }
  for (const record of activeRecords) {
    if (!record.normalizedName) continue;
    const matches = peopleByName.get(record.normalizedName) ?? [];
    matches.push({ record, birth: record.birth, death: record.death });
    peopleByName.set(record.normalizedName, matches);
  }
  const proposedByLot = new Map<string, number>();
  for (const record of activeRecords) {
    if (record.normalizedName) proposedByLot.set(record.lot.key, (proposedByLot.get(record.lot.key) ?? 0) + 1);
  }
  const capacities = new Map(snapshot.plotTypes.map(type => [type.code, type.capacity]));

  for (const record of activeRecords) {
    const physicalKey = record.lot.key.replace(/;TYPE:[A-Z]+$/, "");
    if (record.lot.status === "resolved" && (physicalVariants.get(physicalKey)?.size ?? 0) > 1) addIssue(record, context, "ambiguous_plot_match", "location", "needs_review", "One explicit physical location has conflicting type tokens; do not merge or create separate plots automatically.");
    const matches = snapshotPlotsByLot.get(record.lot.key) ?? [];
    if (matches.length > 1) addIssue(record, context, "ambiguous_plot_match", "location", "needs_review", "Multiple existing plot matches require review.");
    if (matches.some(p => (record.commercialStatus !== null && p.commercialStatus !== record.commercialStatus) || p.classification !== record.lot.classification)) addIssue(record, context, "duplicate_plot_candidate", "location", "needs_review", "Existing plot metadata differs. Import never overwrites it automatically.");
    if (context.adapter === "inventory-list" && (recordsByLot.get(record.lot.key)?.length ?? 0) > 1) addIssue(record, context, "duplicate_plot_candidate", "location", "needs_review", "Different source records describe one plot; resolve the conflict.");
    if (record.normalizedName) {
      const people = peopleByName.get(record.normalizedName) ?? [];
      if (people.some(person => person.record !== record && !(person.birth && record.birth && person.birth !== record.birth) && !(person.death && record.death && person.death !== record.death))) addIssue(record, context, "ambiguous_deceased_match", "name", "needs_review", "A compatible name/date candidate exists. Identity is not automatically merged.");
      const proposed = proposedByLot.get(record.lot.key) ?? 0;
      const newCapacity = record.lot.classification ? capacities.get(record.lot.classification) : undefined;
      if (matches.some(p => p.capacity !== null && p.activeInterments + proposed > p.capacity) || (!matches.length && newCapacity != null && proposed > newCapacity)) addIssue(record, context, "capacity_review_required", "location", "needs_review", "Proposed active interments exceed configured capacity.");
    }
  }
  issues.push(...records.flatMap(r => r.issues));
  const eligible = records.filter(r => !r.duplicate && ["valid", "valid_with_warnings"].includes(r.state));
  const known = new Set(snapshot.plots.map(p => p.key));
  const count = (state: string) => records.filter(r => r.state === state).length;
  const counts = (key: "code" | "severity") => Object.fromEntries([...new Set(issues.map(i => i[key]))].sort().map(value => [value, issues.filter(i => i[key] === value).length]));
  return { context: { adapter: context.adapter, siteId: context.siteId, fileLabel: context.fileLabel, sheet: context.sheet }, records, issues, summary: {
    totalRows: Math.max(0, cells.length - 1), ignoredRows: source.ignored, validRows: count("valid"), warningRows: count("valid_with_warnings"), reviewRows: count("needs_review"), rejectedRows: count("rejected"),
    newPlots: new Set(eligible.filter(r => !known.has(r.lot.key)).map(r => r.lot.key)).size,
    existingPlotMatches: new Set(eligible.filter(r => known.has(r.lot.key)).map(r => r.lot.key)).size,
    newDeceasedCandidates: eligible.filter(r => r.normalizedName).length, possibleDeceasedMatches: issues.filter(i => i.code === "ambiguous_deceased_match").length,
    intermentsProposed: eligible.filter(r => r.normalizedName).length, duplicatesSkipped: records.filter(r => r.duplicate).length,
    issuesByCode: counts("code"), issuesBySeverity: counts("severity"), unknownClassifications: [...new Set(records.filter(r => !r.lot.type).map(r => r.lot.classification ?? r.lot.key))].sort(),
  } };
}

function groupBy<T>(values: T[], keyFor: (value: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const value of values) {
    const key = keyFor(value);
    const group = groups.get(key) ?? [];
    group.push(value);
    groups.set(key, group);
  }
  return groups;
}

function addIssue(record: RecordPlan, context: Context, code: string, field: string, state: "needs_review" | "rejected" | "valid_with_warnings", description: string) {
  const rank = { valid: 0, valid_with_warnings: 1, needs_review: 2, rejected: 3 };
  if (rank[state] > rank[record.state]) record.state = state;
  record.issues.push({ code, severity: state === "rejected" ? "error" : "warning", adapter: context.adapter, row: record.row, field, description, resolution: state === "valid_with_warnings" ? "Review the documented project assumption." : "Correct or explicitly resolve the source mapping and preview again." });
}
