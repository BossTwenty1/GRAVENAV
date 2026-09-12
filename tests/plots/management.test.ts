import assert from "node:assert/strict";
import { test } from "node:test";

import {
  assessPlotTypeChange,
  escapePlotIlike,
  normalizePlotIdentifier,
  normalizedPlotKey,
  normalizePlotSearch,
  parsePlotPage,
  parsePlotState,
  parsePlotUuidFilter,
  plotLocationConfirmationKey,
  plotPageRange,
  validatePlotInput,
} from "../../src/lib/plots/validation";

const siteId = "10000000-0000-4000-8000-000000000001";
const areaId = "20000000-0000-4000-8000-000000000001";
const sectorId = "30000000-0000-4000-8000-000000000001";
const plotTypeId = "40000000-0000-4000-8000-000000000001";

const validValues = { siteId, areaId, sectorId, plotTypeId, plotIdentifier: "  Synthetic   Plot A  ", state: "active" as const };

test("valid plot input preserves UUID hierarchy and deterministically normalizes identity", () => {
  const result = validatePlotInput(validValues);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.data, { siteId, areaId, sectorId, plotTypeId, plotIdentifier: "Synthetic Plot A", normalizedLotKey: "synthetic plot a", state: "active" });
});

test("normalization preserves verified display case while producing a case-insensitive key", () => {
  assert.equal(normalizePlotIdentifier("  Plot\tA-01 "), "Plot A-01");
  assert.equal(normalizedPlotKey("  Plot A-01 "), "plot a-01");
  assert.equal(normalizedPlotKey("PLOT A-01"), normalizedPlotKey("plot a-01"));
});

test("missing hierarchy, type, and identifier are rejected", () => {
  const result = validatePlotInput({ siteId: "", areaId: "", sectorId: "", plotTypeId: "", plotIdentifier: "", state: "active" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.deepEqual(Object.keys(result.fieldErrors).sort(), ["areaId", "plotIdentifier", "plotTypeId", "sectorId", "siteId"]);
});

test("plot validation exposes no occupancy, capacity, commercial, or import inputs", () => {
  const result = validatePlotInput(validValues);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(Object.keys(result.data).sort(), ["areaId", "normalizedLotKey", "plotIdentifier", "plotTypeId", "sectorId", "siteId", "state"]);
});

test("search, filters, and pagination remain bounded and literal", () => {
  assert.equal(normalizePlotSearch("  Plot   A_100% "), "plot a_100%");
  assert.equal(normalizePlotSearch("x".repeat(150)).length, 100);
  assert.equal(escapePlotIlike("plot_100%\\key"), "plot\\_100\\%\\\\key");
  assert.deepEqual(plotPageRange(3), { start: 50, end: 74 });
  assert.equal(parsePlotPage("3"), 3);
  for (const value of ["0", "-1", "1.5", "bad", undefined]) assert.equal(parsePlotPage(value), 1);
});

test("lifecycle and UUID filters reject unsupported URL values", () => {
  assert.equal(parsePlotState("active"), "active");
  assert.equal(parsePlotState("archived"), "archived");
  assert.equal(parsePlotState("deleted"), "all");
  assert.equal(parsePlotUuidFilter(siteId), siteId);
  assert.equal(parsePlotUuidFilter("not-a-uuid"), "all");
});

test("known capacity cannot be reduced below active occupancy", () => {
  assert.equal(assessPlotTypeChange(2, 1), "below-active-count");
  assert.equal(assessPlotTypeChange(2, 2), "allowed");
  assert.equal(assessPlotTypeChange(2, 3), "allowed");
});

test("unknown capacity is conservative for multiple active interments", () => {
  assert.equal(assessPlotTypeChange(0, null), "allowed");
  assert.equal(assessPlotTypeChange(1, null), "allowed");
  assert.equal(assessPlotTypeChange(2, null), "unknown-with-multiple");
});

test("location confirmation binds plot, hierarchy, normalized identity, and observed occupancy", () => {
  const result = validatePlotInput(validValues);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const key = plotLocationConfirmationKey(result.data, "50000000-0000-4000-8000-000000000001", 2);
  assert.notEqual(key, plotLocationConfirmationKey({ ...result.data, sectorId: "60000000-0000-4000-8000-000000000001" }, "50000000-0000-4000-8000-000000000001", 2));
  assert.notEqual(key, plotLocationConfirmationKey(result.data, "50000000-0000-4000-8000-000000000001", 3));
});

test("only active and archived plot lifecycle values are accepted", () => {
  const result = validatePlotInput({ ...validValues, state: "deleted" as "active" });
  assert.equal(result.ok, false);
});
