import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

import {
  deceasedPageRange,
  escapeIlikePattern,
  type ValidatedDeceasedInput,
} from "./validation";

export type DeceasedSummary = Pick<
  Database["public"]["Tables"]["deceased_persons"]["Row"],
  "id" | "display_name" | "date_of_birth" | "date_of_death" | "state" | "updated_at"
>;

export type DuplicateCandidate = Pick<
  Database["public"]["Tables"]["deceased_persons"]["Row"],
  "id" | "display_name" | "date_of_birth" | "date_of_death"
> & { reason: "matching-date" | "name-only" };

export type DeceasedIntermentContext = {
  id: string;
  intermentDate: string | null;
  state: Database["public"]["Enums"]["record_state"];
  plotId: string;
  plotIdentifier: string;
  siteName: string;
  areaName: string | null;
  sectorLabel: string | null;
};

export async function listDeceasedRecords(search: string, page: number) {
  const supabase = await createSupabaseServerClient();
  const { start, end } = deceasedPageRange(page);
  let query = supabase
    .from("deceased_persons")
    .select("id, display_name, date_of_birth, date_of_death, state, updated_at", { count: "exact" })
    .order("display_name", { ascending: true })
    .order("id", { ascending: true })
    .range(start, end);

  if (search) {
    query = query.ilike("normalized_search_name", `%${escapeIlikePattern(search)}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    if (error.code === "PGRST103" && page > 1) {
      let countQuery = supabase.from("deceased_persons").select("id", { count: "exact", head: true });
      if (search) countQuery = countQuery.ilike("normalized_search_name", `%${escapeIlikePattern(search)}%`);
      const countResult = await countQuery;
      if (!countResult.error) return { records: [] as DeceasedSummary[], count: countResult.count ?? 0 };
    }
    throw new Error("Unable to load deceased records.");
  }

  return { records: data, count: count ?? 0 };
}

export async function getDeceasedRecord(id: string) {
  const supabase = await createSupabaseServerClient();
  const [recordResult, intermentsResult] = await Promise.all([
    supabase
      .from("deceased_persons")
      .select("id, display_name, date_of_birth, date_of_death, state, created_at, updated_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("interments")
      .select(`
        id, interment_date, state,
        plot:plots!inner(
          id, normalized_plot_identifier,
          cemetery_site:cemetery_sites!inner(name),
          cemetery_area:cemetery_areas(name),
          sector:sectors(identifier, name)
        )
      `)
      .eq("deceased_person_id", id)
      .order("state", { ascending: true })
      .order("interment_date", { ascending: false, nullsFirst: false })
      .limit(25),
  ]);

  if (recordResult.error || intermentsResult.error) {
    throw new Error("Unable to load the deceased record.");
  }

  if (!recordResult.data) return null;

  type JoinedInterment = {
    id: string;
    interment_date: string | null;
    state: Database["public"]["Enums"]["record_state"];
    plot: {
      id: string;
      normalized_plot_identifier: string;
      cemetery_site: { name: string };
      cemetery_area: { name: string } | null;
      sector: { identifier: string; name: string | null } | null;
    };
  };
  const relatedInterments = (intermentsResult.data as unknown as JoinedInterment[]).map((item): DeceasedIntermentContext => ({
    id: item.id,
    intermentDate: item.interment_date,
    state: item.state,
    plotId: item.plot.id,
    plotIdentifier: item.plot.normalized_plot_identifier,
    siteName: item.plot.cemetery_site.name,
    areaName: item.plot.cemetery_area?.name ?? null,
    sectorLabel: item.plot.sector ? (item.plot.sector.name ? `${item.plot.sector.identifier} — ${item.plot.sector.name}` : item.plot.sector.identifier) : null,
  }));

  return { ...recordResult.data, relatedInterments };
}

export function classifyDuplicateCandidates(
  candidates: Omit<DuplicateCandidate, "reason">[],
  input: ValidatedDeceasedInput,
) {
  return candidates.flatMap<DuplicateCandidate>((candidate) => {
    const birthConflicts = Boolean(input.birthDate && candidate.date_of_birth && input.birthDate !== candidate.date_of_birth);
    const deathConflicts = Boolean(input.deathDate && candidate.date_of_death && input.deathDate !== candidate.date_of_death);

    if (birthConflicts || deathConflicts) {
      return [];
    }

    const matchingDate = Boolean(
      (input.birthDate && candidate.date_of_birth === input.birthDate) ||
      (input.deathDate && candidate.date_of_death === input.deathDate),
    );

    return [{ ...candidate, reason: matchingDate ? "matching-date" : "name-only" }];
  });
}

export async function findDuplicateCandidates(input: ValidatedDeceasedInput, excludeId?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("deceased_persons")
    .select("id, display_name, date_of_birth, date_of_death")
    .eq("normalized_search_name", input.normalizedName)
    .order("updated_at", { ascending: false })
    .limit(10);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to check for similar deceased records.");
  }

  return classifyDuplicateCandidates(data, input);
}
