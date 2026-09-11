import assert from "node:assert/strict";
import { test } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database.types";
import { persistImportPlan } from "../../src/lib/imports/persistence";
import { preview } from "../../src/lib/imports/preview";

function fakeClient(options: { authorized?: boolean; databaseError?: boolean; truncated?: boolean } = {}) {
  const calls: unknown[] = [];
  const client = {
    auth: { getClaims: async () => ({ data: { claims: { sub: "synthetic-user" } }, error: null }) },
    from: (table: string) => {
      const builder = {
        select: () => builder, eq: () => builder,
        maybeSingle: async () => ({ data: options.authorized === false ? null : { id: "synthetic-user" }, error: null }),
        then: (resolve: (value: unknown) => unknown) => resolve({ data: [], error: null, count: options.truncated && table === "plots" ? 1 : 0 }),
      }; return builder;
    },
    rpc: async (name: string, payload: unknown) => { calls.push({ name, payload }); return options.databaseError ? { data: null, error: { message: "PRIVATE-DATABASE-DETAIL" } } : { data: "synthetic-batch-id", error: null }; },
  } as unknown as SupabaseClient<Database>;
  return { client, calls };
}
function plan(location = "AREA:TEST;SECTOR:TEST;LOT:001;TYPE:STD") {
  return preview({ adapter: "inventory-list", siteId: "00000000-0000-4000-8000-000000000001", fileLabel: "synthetic", sheet: "Inventory" }, [["Sector (Lot No.)", "Lot Status"], [location, "BOOKED"]]);
}
test("persistence authorizes before writes", async () => {
  const fake = fakeClient({ authorized: false });
  await assert.rejects(persistImportPlan(fake.client, plan(), true), /administrator_required/); assert.equal(fake.calls.length, 0);
});
test("persistence revalidates instead of trusting caller state and summary", async () => {
  const fake = fakeClient(); const input = plan("unknown location");
  input.records[0].state = "valid"; input.records[0].issues = []; input.issues = []; input.summary.reviewRows = 0;
  await assert.rejects(persistImportPlan(fake.client, input, true), /import_requires_review/); assert.equal(fake.calls.length, 0);
});
test("persistence projects the domain payload and excludes arbitrary caller fields", async () => {
  const fake = fakeClient(); const input = plan();
  Object.assign(input.records[0], { customer: "SYNTHETIC-PRIVATE-CANARY" });
  assert.equal(await persistImportPlan(fake.client, input, true), "synthetic-batch-id");
  assert.equal(fake.calls.length, 1); assert.ok(!JSON.stringify(fake.calls).includes("CANARY")); assert.ok(!JSON.stringify(fake.calls).includes("occupancy"));
});
test("persistence fails closed on a truncated database snapshot", async () => {
  const fake = fakeClient({ truncated: true });
  await assert.rejects(persistImportPlan(fake.client, plan(), true), /snapshot_limit_requires_pagination/); assert.equal(fake.calls.length, 0);
});
test("database failure never reports success or logs database details", async () => {
  const fake = fakeClient({ databaseError: true });
  await assert.rejects(persistImportPlan(fake.client, plan(), true), error => error instanceof Error && error.message === "persistence_failed_repreview");
});
