import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { readWorkbook, readWorkbookBytes } from "../../src/lib/imports/workbook";
import { preview } from "../../src/lib/imports/preview";
import { DEFAULT_LIMITS, HARD_LIMITS, resolveWorkbookLimits } from "../../src/lib/imports/model";
import { syntheticWorkbook } from "./synthetic-workbook";

const lot = "AREA:TEST;SECTOR:TEST;LOT:001;TYPE:STD";
const rows = [["Sector (Lot No.)", "Lot Status", "Customer Name"], [lot, "BOOKED", "SYNTHETIC-PRIVATE-CANARY"]];
const sheet = "Synthetic Inventory";
const inventoryRows = (count: number) => [
  ["Sector (Lot No.)", "Lot Status"],
  ...Array.from({ length: count }, (_, index) => [`AREA:TEST;SECTOR:TEST;LOT:${String(index + 1).padStart(5, "0")};TYPE:STD`, "AVAILABLE"]),
];
test("XLSX inventory reader and adapter discard unapproved values", async () => {
  const data = await readWorkbookBytes(syntheticWorkbook(rows), sheet);
  const result = preview({ adapter: "inventory-list", siteId: "00000000-0000-4000-8000-000000000001", fileLabel: "synthetic", sheet }, data);
  assert.equal(result.summary.newPlots, 1); assert.ok(!JSON.stringify(result).includes("SYNTHETIC-PRIVATE-CANARY"));
});
test("XLSX interment reader preserves multiple interments and row gaps", async () => {
  const data = await readWorkbookBytes(syntheticWorkbook([["Lot Location", "Name of Deceased", "Date of Interment"], [lot, "Synthetic Alpha", "2020-01-01"], [], [lot, "Synthetic Beta", null]], { sheet: "Synthetic Interments" }), "Synthetic Interments");
  const result = preview({ adapter: "interment-summary", siteId: "00000000-0000-4000-8000-000000000001", fileLabel: "synthetic", sheet: "Synthetic Interments" }, data);
  assert.equal(result.summary.intermentsProposed, 2); assert.equal(result.records[1].row, 4);
});
test("formulas use cached values only", async () => {
  const data = await readWorkbookBytes(syntheticWorkbook([], { sheetXml: '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1"><f>1+1</f><v>999</v></c></row></sheetData></worksheet>' }), sheet);
  assert.equal(data[0][0], 999);
});
test("Excel date styles and 1900/1904 workbook epochs", async () => {
  for (const epoch1904 of [false, true]) {
    const data = await readWorkbookBytes(syntheticWorkbook([], {
      epoch1904,
      extra: { "xl/styles.xml": '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cellXfs count="1"><xf numFmtId="14"/></cellXfs></styleSheet>' },
      sheetXml: `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" s="0"><v>${epoch1904 ? 42369 : 43831}</v></c></row></sheetData></worksheet>`,
    }), sheet);
    assert.ok(data[0][0] instanceof Date); assert.equal(data[0][0].toISOString().slice(0, 10), "2020-01-01");
  }
});
test("workbook below the default row limit is accepted", async () => {
  const data = await readWorkbookBytes(syntheticWorkbook(inventoryRows(100)), sheet);
  assert.equal(data.length, 101);
});
test("GRAVENAV-scale workbook above 5,000 rows is accepted and previewed", async () => {
  const data = await readWorkbookBytes(syntheticWorkbook(inventoryRows(6_001)), sheet);
  const result = preview({ adapter: "inventory-list", siteId: "00000000-0000-4000-8000-000000000001", fileLabel: "synthetic-scale", sheet }, data);
  assert.equal(data.length, 6_002);
  assert.equal(result.summary.totalRows, 6_001);
  assert.equal(result.summary.validRows, 6_001);
});
test("default and hard row ceilings reject oversized workbooks cleanly", async () => {
  await assert.rejects(readWorkbookBytes(syntheticWorkbook(inventoryRows(DEFAULT_LIMITS.rows + 1)), sheet), /row_limit/);
  await assert.rejects(readWorkbookBytes(syntheticWorkbook(inventoryRows(HARD_LIMITS.rows + 1)), sheet, { rows: HARD_LIMITS.rows }), /row_limit/);
});
test("trusted overrides cannot disable or exceed hard safety ceilings", () => {
  assert.equal(resolveWorkbookLimits({ rows: 15_000 }).rows, 15_000);
  for (const rows of [0, HARD_LIMITS.rows + 1, Number.POSITIVE_INFINITY]) assert.throws(() => resolveWorkbookLimits({ rows }), /workbook_limit_exceeds_hard_ceiling/);
  assert.throws(() => resolveWorkbookLimits({ fileBytes: HARD_LIMITS.fileBytes + 1 }), /workbook_limit_exceeds_hard_ceiling/);
  assert.throws(() => resolveWorkbookLimits({ inflatedBytes: HARD_LIMITS.inflatedBytes + 1 }), /workbook_limit_exceeds_hard_ceiling/);
  assert.ok(Object.isFrozen(DEFAULT_LIMITS));
  assert.ok(Object.isFrozen(HARD_LIMITS));
});
test("file, inflation, sheet, sparse row/column, macros and external-link guards", async () => {
  await assert.rejects(readWorkbookBytes(new Uint8Array(DEFAULT_LIMITS.fileBytes + 1), sheet), /file_size_limit/);
  await assert.rejects(readWorkbookBytes(new Uint8Array([1, 2]), sheet), /empty_workbook|workbook_read_failure/);
  await assert.rejects(readWorkbookBytes(syntheticWorkbook(rows), "Inventory"), /worksheet_missing/);
  await assert.rejects(readWorkbookBytes(syntheticWorkbook(rows), "FINAL"), /unapproved_worksheet/);
  const hostileEntries: Record<string, string>[] = [{ "xl/vbaProject.bin": "fake" }, { "xl/externalLinks/link.xml": "fake" }];
  for (const extra of hostileEntries) await assert.rejects(readWorkbookBytes(syntheticWorkbook(rows, { extra }), sheet), /unsupported_workbook_content/);
  await assert.rejects(readWorkbookBytes(syntheticWorkbook(rows, { extra: { "oversized.xml": "x".repeat(4_096) } }), sheet, { inflatedBytes: 2_048 }), /inflated_size_limit/);
  for (const [reference, error] of [["A99999999", /row_limit/], ["BM1", /column_limit/], ["A&#49;000000", /invalid_cell_reference/]] as const) await assert.rejects(readWorkbookBytes(syntheticWorkbook([], { sheetXml: `<worksheet><sheetData><row r="1"><c r="${reference}"><v>1</v></c></row></sheetData></worksheet>` }), sheet), error);
  const extra = Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`xl/worksheets/extra${i}.xml`, "<worksheet/>"]));
  await assert.rejects(readWorkbookBytes(syntheticWorkbook(rows, { extra }), sheet), /worksheet_limit/);
});
test("local file reader and default dry-run CLI emit only counts", async () => {
  const directory = await mkdtemp(join(tmpdir(), "gravenav-synthetic-"));
  try {
    const file = join(directory, "synthetic.xlsx"); await writeFile(file, syntheticWorkbook(rows));
    assert.equal((await readWorkbook(file, sheet)).length, 2);
    await assert.rejects(readWorkbook(join(directory, "fake.xlsm"), sheet), /unsupported_file/);
    const output = execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "scripts/import-preview.ts", "--adapter", "inventory-list", "--file", file, "--sheet", sheet, "--site", "00000000-0000-4000-8000-000000000001", "--label", "synthetic-test"], { encoding: "utf8" });
    assert.equal(JSON.parse(output).mode, "dry-run"); assert.ok(!output.includes("CANARY")); assert.ok(!output.includes(lot));
  } finally { await rm(directory, { recursive: true, force: true }); }
});
