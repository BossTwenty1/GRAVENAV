import assert from "node:assert/strict";
import { test } from "node:test";

import {
  assessActiveIntermentCapacity,
  escapeIlike,
  intermentConfirmationKey,
  intermentPageRange,
  isUuid,
  normalizeIntermentSearch,
  parseIntermentPage,
  parseIntermentState,
  validateIntermentInput,
} from "../../src/lib/interments/validation";

const deceasedId = "10000000-0000-4000-8000-000000000001";
const plotId = "20000000-0000-4000-8000-000000000001";

test("valid interment input preserves only actual schema values", () => {
  const result = validateIntermentInput({ deceasedPersonId: deceasedId, plotId, intermentDate: "2024-02-29", intermentType: "  Synthetic   type ", positionSequence: "2", permanenceStatus: " Synthetic status ", state: "active" });
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.data, { deceasedPersonId: deceasedId, plotId, intermentDate: "2024-02-29", intermentType: "Synthetic type", positionSequence: 2, permanenceStatus: "Synthetic status", state: "active" });
});

test("optional interment values remain absent", () => {
  const result = validateIntermentInput({ deceasedPersonId: deceasedId, plotId, intermentDate: "", intermentType: "", positionSequence: "", permanenceStatus: "", state: "active" });
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual([result.data.intermentDate, result.data.intermentType, result.data.positionSequence, result.data.permanenceStatus], [null, null, null, null]);
});

test("invalid relationships and calendar dates are rejected", () => {
  const result = validateIntermentInput({ deceasedPersonId: "name-only", plotId: "", intermentDate: "2023-02-29", intermentType: "", positionSequence: "", permanenceStatus: "", state: "active" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.deepEqual(Object.keys(result.fieldErrors).sort(), ["deceasedPersonId", "intermentDate", "plotId"]);
});

test("position sequence must be a positive whole number", () => {
  for (const value of ["0", "-1", "1.5", "not-a-number"]) {
    const result = validateIntermentInput({ deceasedPersonId: deceasedId, plotId, intermentDate: "", intermentType: "", positionSequence: value, permanenceStatus: "", state: "active" });
    assert.equal(result.ok, false);
  }
});

test("only the existing active and archived lifecycle values are accepted", () => {
  const result = validateIntermentInput({ deceasedPersonId: deceasedId, plotId, intermentDate: "", intermentType: "", positionSequence: "", permanenceStatus: "", state: "deleted" as "active" });
  assert.equal(result.ok, false);
});

test("search normalization and wildcard escaping keep database filtering bounded and literal", () => {
  assert.equal(normalizeIntermentSearch("  Synthetic   Person "), "synthetic person");
  assert.equal(normalizeIntermentSearch("x".repeat(150)).length, 100);
  assert.equal(escapeIlike("plot_100%\\key"), "plot\\_100\\%\\\\key");
});

test("pagination and state parsing reject invalid URL values", () => {
  assert.equal(parseIntermentPage("3"), 3);
  for (const value of ["0", "-2", "1.5", "bad", undefined]) assert.equal(parseIntermentPage(value), 1);
  assert.deepEqual(intermentPageRange(3), { start: 50, end: 74 });
  assert.equal(parseIntermentState("active"), "active");
  assert.equal(parseIntermentState("archived"), "archived");
  assert.equal(parseIntermentState("deleted"), "all");
});

test("occupied-plot confirmation is tied to relationships, date, state, and observed count", () => {
  const input = { deceasedPersonId: deceasedId, plotId, intermentDate: "2024-01-01", intermentType: null, positionSequence: null, permanenceStatus: null, state: "active" as const };
  assert.equal(intermentConfirmationKey(input, 1), `["${deceasedId}","${plotId}","2024-01-01","active",1]`);
  assert.notEqual(intermentConfirmationKey(input, 1), intermentConfirmationKey({ ...input, plotId: "30000000-0000-4000-8000-000000000001" }, 1));
  assert.notEqual(intermentConfirmationKey(input, 1), intermentConfirmationKey(input, 2));
  assert.equal(isUuid(deceasedId), true);
  assert.equal(isUuid("not-a-uuid"), false);
});

test("unknown capacity permits only the first active interment", () => {
  assert.equal(assessActiveIntermentCapacity(0, null), "allowed");
  assert.equal(assessActiveIntermentCapacity(1, null), "capacity-unknown");
  assert.equal(assessActiveIntermentCapacity(8, null), "capacity-unknown");
});

test("known capacity two warns for the second and blocks the third", () => {
  assert.equal(assessActiveIntermentCapacity(0, 2), "allowed");
  assert.equal(assessActiveIntermentCapacity(1, 2), "confirmation-required");
  assert.equal(assessActiveIntermentCapacity(2, 2), "capacity-reached");
});

test("in-place corrections do not add an active placement", () => {
  assert.equal(assessActiveIntermentCapacity(5, null, false), "allowed");
  assert.equal(assessActiveIntermentCapacity(5, 2, false), "allowed");
});
