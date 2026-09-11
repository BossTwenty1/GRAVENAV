import assert from "node:assert/strict";
import { test } from "node:test";
import { adapt } from "../../src/lib/imports/adapters";
import { normalizeDate, parseLot } from "../../src/lib/imports/normalize";
import { emptySnapshot, preview } from "../../src/lib/imports/preview";
import type { Cell, Context } from "../../src/lib/imports/model";

export const siteId = "00000000-0000-4000-8000-000000000001";
const context: Context = { adapter: "inventory-list", siteId, fileLabel: "synthetic-test", sheet: "Inventory" };
export const location = (type = "STD", lot = "001") => `AREA:TEST;SECTOR:TEST;LOT:${lot};TYPE:${type}`;
const inventory = (rows: Cell[][]) => preview(context, [["Sector (Lot No.)", "Lot Status"], ...rows]);
const interment = (rows: Cell[][]) => preview({ ...context, adapter: "interment-summary", sheet: "Interment Summary" }, [["Lot Location", "Name of Deceased", "Date of Interment", "Birthday", "Date of Death"], ...rows]);

test("headers: exact, normalized, missing, and duplicate", () => {
  assert.equal(adapt("inventory-list", [["  sector   (lot no.) ", " LOT STATUS "], [location(), "BOOKED"]]).rows.length, 1);
  assert.deepEqual(adapt("inventory-list", [["Customer Name"]]).missing, ["Sector (Lot No.)", "Lot Status"]);
  assert.throws(() => adapt("inventory-list", [["Sector (Lot No.)", "Lot Status", "lot status"]]), /duplicate_approved_header/);
  assert.equal(preview(context, [["unrelated"]]).issues[0].code, "missing_required_header");
});
test("privacy allowlist omits every excluded column and its values even on rejection", () => {
  for (const adapter of ["inventory-list", "interment-summary"] as const) {
    const required = adapter === "inventory-list" ? ["Sector (Lot No.)", "Lot Status"] : ["Lot Location", "Name of Deceased", "Date of Interment"];
    const excluded = ["Customer Name", "Address", "Contact", "NCP", "Equity Paid", "Collections", "Interest", "AR", "% Paid", "PA No.", "PA Number", "I.O. #", "Time", "Cause of Death"];
    const rows: Cell[][] = [[...required, ...excluded], [...required.map(() => null), ...excluded.map(() => "SYNTHETIC-PRIVATE-CANARY")], ["???", ...required.slice(1).map(() => null), ...excluded.map(() => "SYNTHETIC-PRIVATE-CANARY")]];
    const result = preview({ ...context, adapter, sheet: adapter === "inventory-list" ? "Inventory" : "Interment Summary" }, rows);
    const serialized = JSON.stringify(result);
    assert.ok(!serialized.includes("SYNTHETIC-PRIVATE-CANARY"));
    for (const field of excluded) assert.ok(!serialized.includes(field));
    assert.equal(result.summary.ignoredRows, 1);
  }
});
for (const [code, type] of [["STD", "standard"], ["PRM", "premium"], ["SPR", "special_premium"], ["EST", "estate"]]) {
  test(`lot type ${code}`, () => { assert.equal(parseLot(location(code)).type, type); });
}
test("EST warns, MCF and unknown classifications remain unresolved", () => {
  assert.equal(inventory([[location("EST"), "HOLD"]]).records[0].state, "valid_with_warnings");
  for (const code of ["MCF", "UNKNOWN"]) {
    const record = inventory([[location(code), "AVAILABLE"]]).records[0];
    assert.equal(record.lot.classification, code); assert.equal(record.lot.type, null); assert.equal(record.state, "needs_review");
  }
});
test("lot normalization retains leading zeros, suffixes, units, unknown and slash tokens", () => {
  assert.equal(parseLot(" area : TEST ; sector : TEST ; lot : 001A ; unit : B–2 ; type : STD ").key, "AREA:TEST;SECTOR:TEST;LOT:001A;UNIT:B-2;TYPE:STD");
  assert.notEqual(parseLot(location("STD", "001")).key, parseLot(location("STD", "1")).key);
  assert.equal(parseLot("STD   UNKNOWN / 001").key, "STD UNKNOWN/001");
  assert.equal(parseLot("STD   UNKNOWN / 001").status, "partial");
  assert.equal(parseLot("garbage").status, "partial");
  assert.equal(inventory([[null, "BOOKED"]]).records[0].state, "rejected");
});
for (const status of ["BOOKED", "AVAILABLE", "HOLD"]) {
  test(`commercial ${status} never produces occupancy or interments`, () => {
    const result = inventory([[location(), status]]);
    assert.equal(result.records[0].commercialStatus, status);
    assert.equal(result.summary.intermentsProposed, 0);
    assert.ok(!Object.hasOwn(result.records[0], "occupancy"));
  });
}
test("unknown commercial status retained and flagged", () => {
  const record = inventory([[location(), "SYNTHETIC-UNKNOWN"]]).records[0];
  assert.equal(record.commercialStatus, "SYNTHETIC-UNKNOWN"); assert.equal(record.state, "needs_review");
});
test("full name punctuation, suffix and whitespace survive; optional dates remain absent", () => {
  const name = " Synthetic  D'Example-Sample Jr. ";
  const record = interment([[location(), name, null]]).records[0];
  assert.equal(record.displayName, name); assert.equal(record.normalizedName, "SYNTHETIC D'EXAMPLE-SAMPLE JR.");
  assert.equal(record.birth, null); assert.equal(record.state, "valid");
  assert.equal(interment([[location(), null, null]]).records[0].state, "rejected");
});
test("dates distinguish valid, invalid and suspicious", () => {
  for (const value of ["2024-02-29", new Date("2024-02-29T00:00:00Z"), null]) assert.equal(normalizeDate(value).invalid, false);
  for (const value of ["2023-02-29", "02/03/2020", 45000, "0000-01-01", new Date(NaN)]) assert.equal(normalizeDate(value).invalid, true);
  assert.equal(interment([[location(), "Synthetic Invalid", "bad"]]).records[0].state, "rejected");
  const suspicious = interment([[location(), "Synthetic Dates", "2019-01-01", "2021-01-01", "2020-01-01"]]);
  assert.equal(suspicious.records[0].state, "needs_review"); assert.equal(suspicious.records[0].birth, "2021-01-01");
});
test("multiple distinct people on a plot remain independent interments", () => {
  const result = interment([[location(), "Synthetic Alpha", null], [location(), "Synthetic Beta", null]]);
  assert.equal(result.summary.intermentsProposed, 2); assert.equal(result.summary.newPlots, 1);
});
test("fingerprints ignore row/file/worksheet and disallowed data, but include site and type", () => {
  const a = inventory([[location(), "BOOKED"]]);
  const b = preview({ ...context, fileLabel: "renamed", sheet: "Inventory List" }, [["Sector (Lot No.)", "Lot Status", "PA No."], [], [location().toLowerCase(), " booked ", "PRIVATE"]]);
  assert.equal(a.records[0].fingerprint, b.records[0].fingerprint);
  assert.notEqual(a.records[0].fingerprint, preview({ ...context, siteId: "00000000-0000-4000-8000-000000000002" }, [["Sector (Lot No.)", "Lot Status"], [location(), "BOOKED"]]).records[0].fingerprint);
});
test("exact duplicates skipped; conflicting plot rows both require review", () => {
  assert.equal(inventory([[location(), "BOOKED"], [location(), "BOOKED"]]).summary.duplicatesSkipped, 1);
  assert.equal(inventory([[location(), "BOOKED"], [location(), "HOLD"]]).summary.reviewRows, 2);
  assert.equal(interment([[location(), "Synthetic Same", null], [location(), "Synthetic Same", null]]).summary.duplicatesSkipped, 1);
});
test("same name with different dates remains distinct; ambiguous identities never merge", () => {
  assert.equal(interment([[location(), "Synthetic Same", null, "1940-01-01"], [location("STD", "002"), "Synthetic Same", null, "1950-01-01"]]).summary.newDeceasedCandidates, 2);
  assert.equal(interment([[location(), "Synthetic Same", null], [location("STD", "002"), "Synthetic Same", null]]).summary.reviewRows, 2);
});
test("database snapshot handles exact duplicates, ambiguity and configured capacity", () => {
  const cells = [["Lot Location", "Name of Deceased", "Date of Interment"], [location(), "Synthetic Snapshot", null]];
  const ctx: Context = { ...context, adapter: "interment-summary", sheet: "Interment Summary" };
  const initial = preview(ctx, cells);
  const snapshot = emptySnapshot(); snapshot.fingerprints.push(initial.records[0].fingerprint);
  assert.equal(preview(ctx, cells, snapshot).summary.duplicatesSkipped, 1);
  snapshot.fingerprints = []; snapshot.plots.push({ id: siteId, key: location(), classification: "STD", commercialStatus: "BOOKED", activeInterments: 2, capacity: 2 });
  assert.ok(preview(ctx, cells, snapshot).issues.some(i => i.code === "capacity_review_required"));
  snapshot.plots.push(snapshot.plots[0]);
  assert.ok(preview(ctx, cells, snapshot).issues.some(i => i.code === "ambiguous_plot_match"));
});
test("physical plot classification conflicts are reviewed without merging", () => {
  assert.equal(inventory([[location("STD"), "BOOKED"], [location("PRM"), "BOOKED"]]).summary.reviewRows, 2);
});
test("source site indicators are preserved and require an explicit mapping", () => {
  const result = preview({ ...context, adapter: "interment-summary", sheet: "Interment Summary" }, [["Lot Location", "Name of Deceased", "Date of Interment", "Site"], [location(), "Synthetic Site Test", null, "SYNTH-SITE-B"]]);
  assert.equal(result.records[0].sourceSite, "SYNTH-SITE-B"); assert.equal(result.records[0].state, "needs_review");
});
