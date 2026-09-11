import assert from "node:assert/strict";
import { test } from "node:test";

import { classifyDuplicateCandidates } from "../../src/lib/deceased/data";
import {
  duplicateConfirmationKey,
  deceasedPageRange,
  escapeIlikePattern,
  normalizeDisplayName,
  normalizeSearchQuery,
  parsePage,
  validateDeceasedInput,
} from "../../src/lib/deceased/validation";

test("valid deceased input preserves meaning while normalizing whitespace", () => {
  const result = validateDeceasedInput({
    displayName: "  Synthetic  D'Example-Sample Jr.  ",
    birthDate: "1940-02-29",
    deathDate: "2020-03-01",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.displayName, "Synthetic D'Example-Sample Jr.");
    assert.equal(result.data.normalizedName, "synthetic d'example-sample jr.");
  }
});

test("optional dates remain absent", () => {
  const result = validateDeceasedInput({ displayName: "Synthetic Optional", birthDate: "", deathDate: "" });
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual([result.data.birthDate, result.data.deathDate], [null, null]);
});

test("invalid calendar dates are rejected", () => {
  const result = validateDeceasedInput({ displayName: "Synthetic Invalid", birthDate: "2023-02-29", deathDate: "" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.fieldErrors.birthDate ?? "", /valid birth date/);
});

test("birth after death is rejected", () => {
  const result = validateDeceasedInput({ displayName: "Synthetic Reversed", birthDate: "2020-01-02", deathDate: "2020-01-01" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.fieldErrors.deathDate ?? "", /earlier than birth/);
});

test("search normalization and ILIKE escaping keep filtering database-safe", () => {
  assert.equal(normalizeSearchQuery("  Synthetic   Name "), "synthetic name");
  assert.equal(escapeIlikePattern("synthetic_100%\\name"), "synthetic\\_100\\%\\\\name");
});

test("pagination accepts positive pages and rejects invalid input", () => {
  assert.equal(parsePage("3"), 3);
  for (const value of ["0", "-1", "1.5", "not-a-page", undefined]) assert.equal(parsePage(value), 1);
  assert.deepEqual(deceasedPageRange(1), { start: 0, end: 24 });
  assert.deepEqual(deceasedPageRange(3), { start: 50, end: 74 });
});

test("duplicate awareness distinguishes matching dates from name-only context", () => {
  const input = {
    displayName: "Synthetic Similar",
    normalizedName: "synthetic similar",
    birthDate: "1940-01-01",
    deathDate: null,
  };
  const candidates = classifyDuplicateCandidates([
    { id: "1", display_name: "Synthetic Similar", date_of_birth: "1940-01-01", date_of_death: null },
    { id: "2", display_name: "Synthetic Similar", date_of_birth: null, date_of_death: null },
    { id: "3", display_name: "Synthetic Similar", date_of_birth: "1950-01-01", date_of_death: null },
  ], input);

  assert.deepEqual(candidates.map(({ id, reason }) => ({ id, reason })), [
    { id: "1", reason: "matching-date" },
    { id: "2", reason: "name-only" },
  ]);
  assert.equal(duplicateConfirmationKey(input), '["synthetic similar","1940-01-01",null]');
});

test("display-name normalization never invents name parts", () => {
  assert.equal(normalizeDisplayName(" Synthetic María-Luz III "), "Synthetic María-Luz III");
});
