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
    throw new Error("Unable to load deceased records.");
  }

  return { records: data, count: count ?? 0 };
}

export async function getDeceasedRecord(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("deceased_persons")
    .select("id, display_name, date_of_birth, date_of_death, state, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load the deceased record.");
  }

  return data;
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
