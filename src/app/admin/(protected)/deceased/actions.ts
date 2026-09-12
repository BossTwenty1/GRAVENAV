"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { findDuplicateCandidates, type DuplicateCandidate } from "@/lib/deceased/data";
import {
  duplicateConfirmationKey,
  type DeceasedFieldErrors,
  type DeceasedFormValues,
  validateDeceasedInput,
} from "@/lib/deceased/validation";
import { requireAdministrator } from "@/lib/auth/administrator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createDeceasedPersonRpc, updateDeceasedPersonRpc } from "@/lib/supabase/rpc";

export type DeceasedFormState = {
  error?: string;
  fieldErrors?: DeceasedFieldErrors;
  values?: DeceasedFormValues;
  duplicateCandidates?: DuplicateCandidate[];
  confirmationKey?: string;
};

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readValues(formData: FormData): DeceasedFormValues {
  return {
    displayName: formValue(formData, "displayName"),
    birthDate: formValue(formData, "birthDate"),
    deathDate: formValue(formData, "deathDate"),
  };
}

async function mutateDeceasedRecord(
  mode: "create" | "update",
  id: string | undefined,
  formData: FormData,
): Promise<DeceasedFormState> {
  await requireAdministrator();
  const values = readValues(formData);
  const validation = validateDeceasedInput(values);

  if (!validation.ok) {
    return { values, fieldErrors: validation.fieldErrors };
  }

  const confirmationKey = duplicateConfirmationKey(validation.data);

  try {
    const duplicateCandidates = await findDuplicateCandidates(validation.data, id);

    if (duplicateCandidates.length > 0 && formValue(formData, "duplicateConfirmation") !== confirmationKey) {
      return { values, duplicateCandidates, confirmationKey };
    }

    const supabase = await createSupabaseServerClient();
    const parameters = {
      p_source_display_name: validation.data.displayName,
      p_date_of_birth: validation.data.birthDate,
      p_date_of_death: validation.data.deathDate,
    };
    const result = mode === "create"
      ? await createDeceasedPersonRpc(supabase, parameters)
      : await updateDeceasedPersonRpc(supabase, {
          ...parameters,
          p_deceased_person_id: id!,
        });

    if (result.error || !result.data) {
      return { values, error: "The record could not be saved. Review the fields and try again." };
    }

    revalidatePath("/admin/deceased");
    revalidatePath(`/admin/deceased/${result.data}`);
    redirect(`/admin/deceased/${result.data}?${mode === "create" ? "created" : "updated"}=1`);
  } catch (error) {
    unstable_rethrow(error);
    return { values, error: "The record could not be saved. Please try again." };
  }
}

export async function createDeceasedRecord(
  _previousState: DeceasedFormState,
  formData: FormData,
) {
  return mutateDeceasedRecord("create", undefined, formData);
}

export async function updateDeceasedRecord(
  id: string,
  _previousState: DeceasedFormState,
  formData: FormData,
) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(id)) {
    return { error: "This deceased record identifier is invalid." };
  }

  return mutateDeceasedRecord("update", id, formData);
}
