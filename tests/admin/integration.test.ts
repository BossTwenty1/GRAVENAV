import assert from "node:assert/strict";
import { test } from "node:test";

import { capacityLabel, occupancyLabel, recordStateLabel } from "../../src/components/admin-record-state";

test("Administrator record states use consistent user-facing labels", () => {
  assert.equal(recordStateLabel("active"), "Active");
  assert.equal(recordStateLabel("archived"), "Archived");
  assert.equal(occupancyLabel("unoccupied"), "Unoccupied");
  assert.equal(occupancyLabel("occupied"), "Occupied");
  assert.equal(occupancyLabel("multiple_interments"), "Multiple Interments");
  assert.equal(occupancyLabel("unexpected"), "Occupancy Unknown");
});

test("capacity is displayed as configured or explicitly unknown", () => {
  assert.equal(capacityLabel(0), "0");
  assert.equal(capacityLabel(2), "2");
  assert.equal(capacityLabel(null), "Capacity Unknown");
});
