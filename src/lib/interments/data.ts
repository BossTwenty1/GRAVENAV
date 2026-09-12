import "server-only";

import { requireAdministrator } from "@/lib/auth/administrator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

import {
  assessActiveIntermentCapacity,
  escapeIlike,
  intermentPageRange,
  PICKER_RESULT_LIMIT,
  type IntermentState,
  type ValidatedIntermentInput,
} from "./validation";

type RecordState = Database["public"]["Enums"]["record_state"];

export type DeceasedPickerOption = {
  id: string;
  displayName: string;
  birthDate: string | null;
  deathDate: string | null;
  state: RecordState;
};

export type PlotPickerOption = {
  id: string;
  identifier: string;
  lotKey: string;
  siteName: string;
  areaName: string | null;
  sectorLabel: string | null;
  capacity: number | null;
  activeIntermentCount: number;
  occupancyStatus: string;
  state: RecordState;
};

export type IntermentSummary = {
  id: string;
  deceasedName: string;
  plotIdentifier: string;
  siteName: string;
  areaName: string | null;
  sectorLabel: string | null;
  intermentDate: string | null;
  state: RecordState;
  updatedAt: string;
};

export type IntermentDetail = IntermentSummary & {
  deceasedPersonId: string;
  deceasedState: RecordState;
  deceasedBirthDate: string | null;
  deceasedDeathDate: string | null;
  plotId: string;
  plotState: RecordState;
  lotKey: string;
  capacity: number | null;
  activeIntermentCount: number;
  occupancyStatus: string;
  intermentType: string | null;
  positionSequence: number | null;
  permanenceStatus: string | null;
  createdAt: string;
};

export type ExistingIntermentContext = {
  id: string;
  deceasedName: string;
  intermentDate: string | null;
};

export type IntermentSafetyReview = {
  duplicate: ExistingIntermentContext | null;
  deceased: DeceasedPickerOption | null;
  plot: PlotPickerOption | null;
  existingInterments: ExistingIntermentContext[];
  activeIntermentCount: number;
  capacityUnknownBlocked: boolean;
  capacityReached: boolean;
  needsOccupiedConfirmation: boolean;
};

type JoinedInterment = {
  id: string;
  interment_date: string | null;
  interment_type?: string | null;
  permanence_status?: string | null;
  position_sequence?: number | null;
  state: RecordState;
  created_at?: string;
  updated_at: string;
  deceased_person_id?: string;
  plot_id?: string;
  deceased_person: { id: string; display_name: string | null; date_of_birth?: string | null; date_of_death?: string | null; state?: RecordState };
  plot: {
    id: string;
    normalized_plot_identifier: string;
    normalized_lot_key?: string;
    state?: RecordState;
    cemetery_site: { name: string };
    cemetery_area: { name: string } | null;
    sector: { identifier: string; name: string | null } | null;
    plot_type?: { regular_interment_capacity: number | null } | null;
  };
};

function sectorLabel(sector: { identifier: string; name: string | null } | null) {
  if (!sector) return null;
  return sector.name ? `${sector.identifier} — ${sector.name}` : sector.identifier;
}

function toSummary(row: JoinedInterment): IntermentSummary {
  return {
    id: row.id,
    deceasedName: row.deceased_person.display_name ?? "Unnamed record",
    plotIdentifier: row.plot.normalized_plot_identifier,
    siteName: row.plot.cemetery_site.name,
    areaName: row.plot.cemetery_area?.name ?? null,
    sectorLabel: sectorLabel(row.plot.sector),
    intermentDate: row.interment_date,
    state: row.state,
    updatedAt: row.updated_at,
  };
}

function toPlotOption(row: {
  id: string;
  normalized_plot_identifier: string;
  normalized_lot_key: string;
  state: RecordState;
  cemetery_site: { name: string };
  cemetery_area: { name: string } | null;
  sector: { identifier: string; name: string | null } | null;
  plot_type: { regular_interment_capacity: number | null } | null;
}, occupancy?: { active_interment_count: number | null; derived_occupancy_status: string | null } | null): PlotPickerOption {
  return {
    id: row.id,
    identifier: row.normalized_plot_identifier,
    lotKey: row.normalized_lot_key,
    siteName: row.cemetery_site.name,
    areaName: row.cemetery_area?.name ?? null,
    sectorLabel: sectorLabel(row.sector),
    capacity: row.plot_type?.regular_interment_capacity ?? null,
    activeIntermentCount: occupancy?.active_interment_count ?? 0,
    occupancyStatus: occupancy?.derived_occupancy_status ?? "unoccupied",
    state: row.state,
  };
}

export async function listInterments(search: string, state: IntermentState | "all", page: number) {
  await requireAdministrator();
  const supabase = await createSupabaseServerClient();
  const { start, end } = intermentPageRange(page);
  let query = supabase
    .from("interments")
    .select(`
      id, interment_date, state, updated_at,
      deceased_person:deceased_persons!inner(id, display_name, normalized_search_name),
      plot:plots!inner(
        id, normalized_plot_identifier,
        cemetery_site:cemetery_sites!inner(name),
        cemetery_area:cemetery_areas(name),
        sector:sectors(identifier, name)
      )
    `, { count: "exact" })
    .order("updated_at", { ascending: false })
    .order("id", { ascending: true })
    .range(start, end);

  if (search) query = query.ilike("deceased_person.normalized_search_name", `%${escapeIlike(search)}%`);
  if (state !== "all") query = query.eq("state", state);

  const { data, error, count } = await query;
  if (error) throw new Error("Unable to load interment records.");
  return { records: (data as unknown as JoinedInterment[]).map(toSummary), count: count ?? 0 };
}

export async function getInterment(id: string): Promise<IntermentDetail | null> {
  await requireAdministrator();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("interments")
    .select(`
      id, deceased_person_id, plot_id, interment_date, interment_type,
      position_sequence, permanence_status, state, created_at, updated_at,
      deceased_person:deceased_persons!inner(id, display_name, date_of_birth, date_of_death, state),
      plot:plots!inner(
        id, normalized_plot_identifier, normalized_lot_key, state,
        cemetery_site:cemetery_sites!inner(name),
        cemetery_area:cemetery_areas(name),
        sector:sectors(identifier, name),
        plot_type:plot_types(regular_interment_capacity)
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("Unable to load the interment record.");
  if (!data) return null;
  const row = data as unknown as JoinedInterment;
  const occupancyResult = await supabase
    .from("plot_occupancy")
    .select("active_interment_count, derived_occupancy_status")
    .eq("plot_id", row.plot_id!)
    .maybeSingle();
  if (occupancyResult.error) throw new Error("Unable to load plot occupancy.");
  const summary = toSummary(row);
  return {
    ...summary,
    deceasedPersonId: row.deceased_person_id!,
    deceasedState: row.deceased_person.state!,
    deceasedBirthDate: row.deceased_person.date_of_birth ?? null,
    deceasedDeathDate: row.deceased_person.date_of_death ?? null,
    plotId: row.plot_id!,
    plotState: row.plot.state!,
    lotKey: row.plot.normalized_lot_key!,
    capacity: row.plot.plot_type?.regular_interment_capacity ?? null,
    activeIntermentCount: occupancyResult.data?.active_interment_count ?? 0,
    occupancyStatus: occupancyResult.data?.derived_occupancy_status ?? "unoccupied",
    intermentType: row.interment_type ?? null,
    positionSequence: row.position_sequence ?? null,
    permanenceStatus: row.permanence_status ?? null,
    createdAt: row.created_at!,
  };
}

export async function searchDeceasedOptions(query: string) {
  await requireAdministrator();
  const supabase = await createSupabaseServerClient();
  let request = supabase
    .from("deceased_persons")
    .select("id, display_name, date_of_birth, date_of_death, state")
    .order("display_name", { ascending: true })
    .limit(PICKER_RESULT_LIMIT);

  if (query) request = request.ilike("normalized_search_name", `%${escapeIlike(query)}%`);
  request = request.eq("state", "active");

  const { data, error } = await request;
  if (error) throw new Error("Unable to search deceased records.");
  return data.map((row) => ({
    id: row.id,
    displayName: row.display_name ?? "Unnamed record",
    birthDate: row.date_of_birth,
    deathDate: row.date_of_death,
    state: row.state,
  }));
}

export async function searchPlotOptions(query: string) {
  await requireAdministrator();
  const supabase = await createSupabaseServerClient();
  let request = supabase
    .from("plots")
    .select(`
      id, normalized_plot_identifier, normalized_lot_key, state,
      cemetery_site:cemetery_sites!inner(name),
      cemetery_area:cemetery_areas(name),
      sector:sectors(identifier, name),
      plot_type:plot_types(regular_interment_capacity)
    `)
    .order("normalized_plot_identifier", { ascending: true })
    .limit(PICKER_RESULT_LIMIT);

  if (query) request = request.ilike("normalized_lot_key", `%${escapeIlike(query)}%`);
  request = request.eq("state", "active");

  const { data, error } = await request;
  if (error) throw new Error("Unable to search plots.");
  const rows = data as unknown as Parameters<typeof toPlotOption>[0][];
  const ids = rows.map((row) => row.id);
  if (ids.length === 0) return [];
  const occupancyResult = await supabase
    .from("plot_occupancy")
    .select("plot_id, active_interment_count, derived_occupancy_status")
    .in("plot_id", ids);
  if (occupancyResult.error) throw new Error("Unable to load plot occupancy.");
  const occupancy = new Map(occupancyResult.data.map((item) => [item.plot_id, item]));
  return rows.map((row) => toPlotOption(row, occupancy.get(row.id)));
}

export async function inspectIntermentSafety(
  input: ValidatedIntermentInput,
  currentId?: string,
): Promise<IntermentSafetyReview> {
  await requireAdministrator();
  const supabase = await createSupabaseServerClient();
  const [plotResult, deceasedResult, occupancyResult] = await Promise.all([
    supabase
      .from("plots")
      .select(`
        id, normalized_plot_identifier, normalized_lot_key, state,
        cemetery_site:cemetery_sites!inner(name),
        cemetery_area:cemetery_areas(name),
        sector:sectors(identifier, name),
        plot_type:plot_types(regular_interment_capacity)
      `)
      .eq("id", input.plotId)
      .maybeSingle(),
    supabase
      .from("deceased_persons")
      .select("id, display_name, date_of_birth, date_of_death, state")
      .eq("id", input.deceasedPersonId)
      .maybeSingle(),
    supabase
      .from("plot_occupancy")
      .select("active_interment_count, derived_occupancy_status")
      .eq("plot_id", input.plotId)
      .maybeSingle(),
  ]);
  if (plotResult.error || deceasedResult.error || occupancyResult.error) throw new Error("Unable to validate the selected relationships.");
  const plot = plotResult.data
    ? toPlotOption(plotResult.data as unknown as Parameters<typeof toPlotOption>[0], occupancyResult.data)
    : null;
  const person = deceasedResult.data
    ? {
        id: deceasedResult.data.id,
        displayName: deceasedResult.data.display_name ?? "Unnamed record",
        birthDate: deceasedResult.data.date_of_birth,
        deathDate: deceasedResult.data.date_of_death,
        state: deceasedResult.data.state,
      }
    : null;

  if (!plot || !person) {
    return { duplicate: null, deceased: person, plot, existingInterments: [], activeIntermentCount: 0, capacityUnknownBlocked: false, capacityReached: false, needsOccupiedConfirmation: false };
  }
  if (input.state === "active" && (plot.state !== "active" || person.state !== "active")) {
    return { duplicate: null, deceased: person, plot, existingInterments: [], activeIntermentCount: 0, capacityUnknownBlocked: false, capacityReached: false, needsOccupiedConfirmation: false };
  }

  let duplicateQuery = supabase
    .from("interments")
    .select("id, interment_date, deceased_person:deceased_persons!inner(display_name)")
    .eq("deceased_person_id", input.deceasedPersonId)
    .eq("plot_id", input.plotId)
    .limit(1);
  duplicateQuery = input.intermentDate
    ? duplicateQuery.eq("interment_date", input.intermentDate)
    : duplicateQuery.is("interment_date", null);
  if (currentId) duplicateQuery = duplicateQuery.neq("id", currentId);

  let existingQuery = supabase
    .from("interments")
    .select("id, interment_date, deceased_person:deceased_persons!inner(display_name)")
    .eq("plot_id", input.plotId)
    .eq("state", "active")
    .order("interment_date", { ascending: true, nullsFirst: false })
    .limit(5);
  if (currentId) existingQuery = existingQuery.neq("id", currentId);

  const [duplicateResult, existingResult, currentResult] = await Promise.all([
    duplicateQuery,
    existingQuery,
    currentId
      ? supabase.from("interments").select("plot_id, state").eq("id", currentId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (duplicateResult.error || existingResult.error || currentResult.error) {
    throw new Error("Unable to validate the interment relationships.");
  }

  const context = (row: { id: string; interment_date: string | null; deceased_person: { display_name: string | null } }) => ({
    id: row.id,
    deceasedName: row.deceased_person.display_name ?? "Unnamed record",
    intermentDate: row.interment_date,
  });
  const duplicate = duplicateResult.data?.[0]
    ? context(duplicateResult.data[0] as unknown as Parameters<typeof context>[0])
    : null;
  const existingInterments = (existingResult.data as unknown as Parameters<typeof context>[0][]).map(context);
  const current = currentResult.data as { plot_id: string; state: RecordState } | null;
  const requiresCapacityCheck = input.state === "active"
    && (!current || current.state !== "active" || current.plot_id !== input.plotId);
  const activeIntermentCount = plot.activeIntermentCount - (current?.state === "active" && current.plot_id === input.plotId ? 1 : 0);
  const capacityDecision = assessActiveIntermentCapacity(activeIntermentCount, plot.capacity, requiresCapacityCheck);

  return {
    duplicate,
    deceased: person,
    plot,
    existingInterments,
    activeIntermentCount,
    capacityUnknownBlocked: capacityDecision === "capacity-unknown",
    capacityReached: capacityDecision === "capacity-reached",
    needsOccupiedConfirmation: capacityDecision === "confirmation-required",
  };
}
