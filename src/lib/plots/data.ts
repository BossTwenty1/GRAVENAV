import "server-only";

import { requireAdministrator } from "@/lib/auth/administrator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

import {
  assessPlotTypeChange,
  escapePlotIlike,
  PLOT_FILTER_LIMIT,
  PLOT_PAGE_SIZE,
  PLOT_PICKER_LIMIT,
  plotPageRange,
  type PlotState,
  type ValidatedPlotInput,
} from "./validation";

type RecordState = Database["public"]["Enums"]["record_state"];

export type PlotOption = { id: string; label: string; context?: string };
export type PlotTypeOption = PlotOption & { code: string; capacity: number | null };

export type PlotSummary = {
  id: string;
  identifier: string;
  siteName: string;
  areaName: string | null;
  sectorLabel: string | null;
  plotTypeName: string | null;
  capacity: number | null;
  occupancyStatus: string;
  activeIntermentCount: number;
  state: RecordState;
  updatedAt: string;
};

export type PlotIntermentContext = {
  id: string;
  deceasedName: string;
  intermentDate: string | null;
};

export type PlotDetail = PlotSummary & {
  siteId: string;
  areaId: string | null;
  sectorId: string | null;
  lotKey: string;
  plotTypeId: string | null;
  plotTypeCode: string | null;
  sourceCommercialStatus: string | null;
  createdAt: string;
  activeInterments: PlotIntermentContext[];
};

type JoinedPlot = {
  id: string;
  cemetery_site_id: string;
  cemetery_area_id: string | null;
  sector_id: string | null;
  plot_type_id: string | null;
  normalized_plot_identifier: string;
  normalized_lot_key: string;
  source_commercial_status: string | null;
  state: RecordState;
  created_at: string;
  updated_at: string;
  cemetery_site: { name: string };
  cemetery_area: { name: string } | null;
  sector: { identifier: string; name: string | null } | null;
  plot_type: { code: string; name: string; regular_interment_capacity: number | null } | null;
};

function sectorLabel(sector: JoinedPlot["sector"]) {
  if (!sector) return null;
  return sector.name ? `${sector.identifier} — ${sector.name}` : sector.identifier;
}

function toSummary(row: JoinedPlot, occupancy?: { active_interment_count: number | null; derived_occupancy_status: string | null } | null): PlotSummary {
  return {
    id: row.id,
    identifier: row.normalized_plot_identifier,
    siteName: row.cemetery_site.name,
    areaName: row.cemetery_area?.name ?? null,
    sectorLabel: sectorLabel(row.sector),
    plotTypeName: row.plot_type?.name ?? null,
    capacity: row.plot_type?.regular_interment_capacity ?? null,
    occupancyStatus: occupancy?.derived_occupancy_status ?? "unoccupied",
    activeIntermentCount: occupancy?.active_interment_count ?? 0,
    state: row.state,
    updatedAt: row.updated_at,
  };
}

const plotSelect = `
  id, cemetery_site_id, cemetery_area_id, sector_id, plot_type_id,
  normalized_plot_identifier, normalized_lot_key, source_commercial_status,
  state, created_at, updated_at,
  cemetery_site:cemetery_sites!inner(name),
  cemetery_area:cemetery_areas(name),
  sector:sectors(identifier, name),
  plot_type:plot_types(code, name, regular_interment_capacity)
`;

export async function listPlots(search: string, siteId: string | "all", plotTypeId: string | "all", state: PlotState | "all", page: number) {
  await requireAdministrator();
  const supabase = await createSupabaseServerClient();
  const { start, end } = plotPageRange(page);
  let query = supabase
    .from("plots")
    .select(plotSelect, { count: "exact" })
    .order("updated_at", { ascending: false })
    .order("id", { ascending: true })
    .range(start, end);

  if (search) query = query.ilike("normalized_lot_key", `%${escapePlotIlike(search)}%`);
  if (siteId !== "all") query = query.eq("cemetery_site_id", siteId);
  if (plotTypeId !== "all") query = query.eq("plot_type_id", plotTypeId);
  if (state !== "all") query = query.eq("state", state);

  const { data, error, count } = await query;
  if (error) throw new Error("Unable to load plot records.");
  const rows = data as unknown as JoinedPlot[];
  const ids = rows.map((row) => row.id);
  if (ids.length === 0) return { records: [] as PlotSummary[], count: count ?? 0 };
  const occupancyResult = await supabase
    .from("plot_occupancy")
    .select("plot_id, active_interment_count, derived_occupancy_status")
    .in("plot_id", ids);
  if (occupancyResult.error) throw new Error("Unable to load plot occupancy.");
  const occupancy = new Map(occupancyResult.data.map((item) => [item.plot_id, item]));
  return { records: rows.map((row) => toSummary(row, occupancy.get(row.id))), count: count ?? 0 };
}

export async function getPlotFilterOptions() {
  await requireAdministrator();
  const supabase = await createSupabaseServerClient();
  const [sites, plotTypes] = await Promise.all([
    supabase.from("cemetery_sites").select("id, name").eq("is_active", true).order("name").limit(PLOT_FILTER_LIMIT),
    supabase.from("plot_types").select("id, code, name").eq("is_active", true).order("name").limit(PLOT_FILTER_LIMIT),
  ]);
  if (sites.error || plotTypes.error) throw new Error("Unable to load plot filters.");
  return { sites: sites.data, plotTypes: plotTypes.data };
}

export async function getPlot(id: string): Promise<PlotDetail | null> {
  await requireAdministrator();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("plots").select(plotSelect).eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load the plot record.");
  if (!data) return null;
  const row = data as unknown as JoinedPlot;
  const [occupancyResult, intermentsResult] = await Promise.all([
    supabase.from("plot_occupancy").select("active_interment_count, derived_occupancy_status").eq("plot_id", id).maybeSingle(),
    supabase
      .from("interments")
      .select("id, interment_date, deceased_person:deceased_persons!inner(display_name)")
      .eq("plot_id", id)
      .eq("state", "active")
      .order("interment_date", { ascending: true, nullsFirst: false })
      .limit(PLOT_PAGE_SIZE),
  ]);
  if (occupancyResult.error || intermentsResult.error) throw new Error("Unable to load plot context.");
  const activeInterments = (intermentsResult.data as unknown as Array<{ id: string; interment_date: string | null; deceased_person: { display_name: string | null } }>).map((item) => ({
    id: item.id,
    deceasedName: item.deceased_person.display_name ?? "Unnamed record",
    intermentDate: item.interment_date,
  }));
  return {
    ...toSummary(row, occupancyResult.data),
    siteId: row.cemetery_site_id,
    areaId: row.cemetery_area_id,
    sectorId: row.sector_id,
    lotKey: row.normalized_lot_key,
    plotTypeId: row.plot_type_id,
    plotTypeCode: row.plot_type?.code ?? null,
    sourceCommercialStatus: row.source_commercial_status,
    createdAt: row.created_at,
    activeInterments,
  };
}

function cleanPickerSearch(query: string) {
  return query.trim().replace(/\s+/gu, " ").normalize("NFC").slice(0, 100);
}

export async function searchSiteOptions(query: string): Promise<PlotOption[]> {
  await requireAdministrator();
  const supabase = await createSupabaseServerClient();
  let request = supabase.from("cemetery_sites").select("id, name, code").eq("is_active", true).order("name").limit(PLOT_PICKER_LIMIT);
  const search = cleanPickerSearch(query);
  if (search) request = request.ilike("name", `%${escapePlotIlike(search)}%`);
  const { data, error } = await request;
  if (error) throw new Error("Unable to search cemetery sites.");
  return data.map((item) => ({ id: item.id, label: item.name, context: item.code ?? undefined }));
}

export async function searchAreaOptions(siteId: string, query: string): Promise<PlotOption[]> {
  await requireAdministrator();
  const supabase = await createSupabaseServerClient();
  let request = supabase.from("cemetery_areas").select("id, name, code").eq("cemetery_site_id", siteId).eq("is_active", true).order("name").limit(PLOT_PICKER_LIMIT);
  const search = cleanPickerSearch(query);
  if (search) request = request.ilike("name", `%${escapePlotIlike(search)}%`);
  const { data, error } = await request;
  if (error) throw new Error("Unable to search cemetery areas.");
  return data.map((item) => ({ id: item.id, label: item.name, context: item.code ?? undefined }));
}

export async function searchSectorOptions(areaId: string, query: string): Promise<PlotOption[]> {
  await requireAdministrator();
  const supabase = await createSupabaseServerClient();
  let request = supabase.from("sectors").select("id, identifier, name").eq("cemetery_area_id", areaId).eq("is_active", true).order("identifier").limit(PLOT_PICKER_LIMIT);
  const search = cleanPickerSearch(query);
  if (search) request = request.ilike("identifier", `%${escapePlotIlike(search)}%`);
  const { data, error } = await request;
  if (error) throw new Error("Unable to search sectors.");
  return data.map((item) => ({ id: item.id, label: item.identifier, context: item.name ?? undefined }));
}

export async function searchPlotTypeOptions(query: string): Promise<PlotTypeOption[]> {
  await requireAdministrator();
  const supabase = await createSupabaseServerClient();
  const search = cleanPickerSearch(query);
  const base = () => supabase.from("plot_types").select("id, code, name, regular_interment_capacity").eq("is_active", true).order("name").limit(PLOT_PICKER_LIMIT);
  const results = search
    ? await Promise.all([base().ilike("name", `%${escapePlotIlike(search)}%`), base().ilike("code", `%${escapePlotIlike(search)}%`)])
    : [await base()];
  if (results.some((result) => result.error)) throw new Error("Unable to search plot types.");
  const unique = new Map<string, PlotTypeOption>();
  for (const result of results) {
    for (const item of result.data ?? []) {
      unique.set(item.id, { id: item.id, label: item.name, code: item.code, capacity: item.regular_interment_capacity, context: item.code });
    }
  }
  return [...unique.values()].slice(0, PLOT_PICKER_LIMIT);
}

export type PlotSafetyReview = {
  current: PlotDetail | null;
  duplicate: { id: string; identifier: string } | null;
  hierarchyValid: boolean;
  plotType: PlotTypeOption | null;
  activeIntermentCount: number;
  typeChanged: boolean;
  typeChangeDecision: ReturnType<typeof assessPlotTypeChange>;
  locationChanged: boolean;
};

export async function inspectPlotSafety(input: ValidatedPlotInput, currentId?: string): Promise<PlotSafetyReview> {
  await requireAdministrator();
  const supabase = await createSupabaseServerClient();
  const [site, area, sector, plotType, duplicate, current] = await Promise.all([
    supabase.from("cemetery_sites").select("id").eq("id", input.siteId).eq("is_active", true).maybeSingle(),
    supabase.from("cemetery_areas").select("id").eq("id", input.areaId).eq("cemetery_site_id", input.siteId).eq("is_active", true).maybeSingle(),
    supabase.from("sectors").select("id").eq("id", input.sectorId).eq("cemetery_area_id", input.areaId).eq("is_active", true).maybeSingle(),
    supabase.from("plot_types").select("id, code, name, regular_interment_capacity").eq("id", input.plotTypeId).eq("is_active", true).maybeSingle(),
    supabase.from("plots").select("id, normalized_plot_identifier").eq("cemetery_site_id", input.siteId).eq("normalized_lot_key", input.normalizedLotKey).neq("id", currentId ?? "00000000-0000-0000-0000-000000000000").limit(1),
    currentId ? getPlot(currentId) : Promise.resolve(null),
  ]);
  if (site.error || area.error || sector.error || plotType.error || duplicate.error) throw new Error("Unable to validate plot relationships.");
  const selectedType = plotType.data ? {
    id: plotType.data.id,
    label: plotType.data.name,
    code: plotType.data.code,
    capacity: plotType.data.regular_interment_capacity,
    context: plotType.data.code,
  } : null;
  const activeIntermentCount = current?.activeIntermentCount ?? 0;
  const typeChanged = Boolean(current && current.plotTypeId !== input.plotTypeId);
  const locationChanged = Boolean(current && (
    current.siteId !== input.siteId
    || current.areaId !== input.areaId
    || current.sectorId !== input.sectorId
    || current.lotKey !== input.normalizedLotKey
  ));
  return {
    current,
    duplicate: duplicate.data?.[0] ? { id: duplicate.data[0].id, identifier: duplicate.data[0].normalized_plot_identifier } : null,
    hierarchyValid: Boolean(site.data && area.data && sector.data),
    plotType: selectedType,
    activeIntermentCount,
    typeChanged,
    typeChangeDecision: selectedType && typeChanged ? assessPlotTypeChange(activeIntermentCount, selectedType.capacity) : "allowed",
    locationChanged,
  };
}
