import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import { DEFAULT_LIMITS, ImportError, type Cell, type Preview, type Snapshot } from "./model";
import { preview } from "./preview";

async function authorize(client: SupabaseClient<Database>) {
  const { data: claims, error: authError } = await client.auth.getClaims();
  if (authError || typeof claims?.claims?.sub !== "string") throw new ImportError("administrator_required");
  const { data, error } = await client.from("user_profiles").select("id").eq("id", claims.claims.sub).eq("application_role", "administrator").eq("is_active", true).maybeSingle();
  if (error || !data) throw new ImportError("administrator_required");
}

export async function readImportSnapshot(client: SupabaseClient<Database>, siteId: string): Promise<Snapshot> {
  await authorize(client);
  const results = await Promise.all([
    client.from("plots").select("id, normalized_lot_key, plot_type_id, source_commercial_status", { count: "exact" }).eq("cemetery_site_id", siteId),
    client.from("plot_types").select("id, code, regular_interment_capacity", { count: "exact" }),
    client.from("plot_occupancy").select("plot_id, active_interment_count", { count: "exact" }).eq("cemetery_site_id", siteId),
    client.from("deceased_persons").select("normalized_search_name, date_of_birth, date_of_death", { count: "exact" }),
    client.from("import_batches").select("validated_records", { count: "exact" }).eq("status", "completed"),
  ]);
  for (const result of results) {
    if (result.error || !result.data) throw new ImportError("snapshot_read_failed");
    // Fail closed if PostgREST truncated a result; no incomplete duplicate scan.
    if (result.count !== result.data.length) throw new ImportError("snapshot_limit_requires_pagination");
  }
  const [plots, types, occupancy, people, batches] = results;
  return {
    plotTypes: types.data!.map(t => ({ code: t.code, capacity: t.regular_interment_capacity })),
    plots: plots.data!.map(p => {
      const type = types.data!.find(t => t.id === p.plot_type_id);
      return { id: p.id, key: p.normalized_lot_key, classification: type?.code ?? null, commercialStatus: p.source_commercial_status, capacity: type?.regular_interment_capacity ?? null, activeInterments: occupancy.data!.find(o => o.plot_id === p.id)?.active_interment_count ?? 0 };
    }),
    people: people.data!.map(p => ({ name: p.normalized_search_name ?? "", birth: p.date_of_birth, death: p.date_of_death })),
    fingerprints: batches.data!.flatMap(batch => Array.isArray(batch.validated_records) ? batch.validated_records.flatMap(row => row && typeof row === "object" && !Array.isArray(row) && typeof row.fingerprint === "string" ? [row.fingerprint] : []) : []),
  };
}

// Accept only a domain preview, then rebuild/revalidate its allowlisted values.
// Never trust caller-provided states, summary counts, issues or extra keys.
export async function persistImportPlan(client: SupabaseClient<Database>, plan: Preview, synthetic: boolean): Promise<string> {
  await authorize(client);
  if (!plan.records.length || plan.records.length > DEFAULT_LIMITS.rows || plan.issues.some(i => i.severity === "error")) throw new ImportError("unvalidated_import_plan");
  const cells: Cell[][] = [plan.context.adapter === "inventory-list" ? ["Sector (Lot No.)", "Lot Status"] : ["Lot Location", "Name of Deceased", "Date of Interment", "Birthday", "Date of Death", "Site"]];
  for (const record of plan.records) {
    if (!Number.isInteger(record.row) || record.row < 2 || record.row > DEFAULT_LIMITS.rows + 1 || cells[record.row - 1]) throw new ImportError("invalid_source_row");
    cells[record.row - 1] = plan.context.adapter === "inventory-list" ? [record.lot.raw, record.commercialStatus] : [record.lot.raw, record.displayName, record.interment, record.birth, record.death, record.sourceSite];
  }
  for (let i = 1; i < cells.length; i++) cells[i] ??= [];
  const checked = preview(plan.context, cells, await readImportSnapshot(client, plan.context.siteId));
  if (checked.records.some(r => ["needs_review", "rejected"].includes(r.state)) || checked.issues.some(i => i.severity === "error")) throw new ImportError("import_requires_review");
  const records: Json[] = checked.records.filter(r => !r.duplicate).map(r => ({ row: r.row, state: r.state, fingerprint: r.fingerprint, key: r.lot.key, raw_location: r.lot.raw, classification: r.lot.classification, commercial_status: r.commercialStatus, display_name: r.displayName, birth: r.birth, death: r.death, interment: r.interment }));
  if (!records.length) throw new ImportError("no_new_records");
  const { data, error } = await client.rpc("persist_import_plan", { p_site_id: checked.context.siteId, p_adapter: checked.context.adapter, p_label: checked.context.fileLabel, p_sheet: checked.context.sheet, p_records: records, p_synthetic: synthetic });
  if (error || !data) throw new ImportError("persistence_failed_repreview");
  return data;
}
