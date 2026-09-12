"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { requireAdministrator } from "@/lib/auth/administrator";
import {
  inspectIntermentSafety,
  searchDeceasedOptions,
  searchPlotOptions,
  type DeceasedPickerOption,
  type ExistingIntermentContext,
  type PlotPickerOption,
} from "@/lib/interments/data";
import {
  intermentConfirmationKey,
  isUuid,
  normalizeIntermentSearch,
  type IntermentFieldErrors,
  type IntermentFormValues,
  validateIntermentInput,
} from "@/lib/interments/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createIntermentRpc, updateIntermentRpc } from "@/lib/supabase/rpc";

export type IntermentFormState = {
  error?: string;
  fieldErrors?: IntermentFieldErrors;
  values?: IntermentFormValues;
  confirmationKey?: string;
  occupancyWarning?: {
    plot: PlotPickerOption;
    existingInterments: ExistingIntermentContext[];
    activeIntermentCount: number;
  };
  duplicate?: ExistingIntermentContext;
};

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readValues(formData: FormData): IntermentFormValues {
  const state = formValue(formData, "state");
  return {
    deceasedPersonId: formValue(formData, "deceasedPersonId"),
    plotId: formValue(formData, "plotId"),
    intermentDate: formValue(formData, "intermentDate"),
    intermentType: formValue(formData, "intermentType"),
    positionSequence: formValue(formData, "positionSequence"),
    permanenceStatus: formValue(formData, "permanenceStatus"),
    state: state === "archived" ? "archived" : "active",
  };
}

function databaseError(message: string) {
  if (message.includes("duplicate_interment")) return "An exact deceased, plot, and interment-date combination already exists. Review the existing record instead.";
  if (message.includes("interment_before_death")) return "Interment date cannot be earlier than the recorded death date.";
  if (message.includes("plot_capacity_unknown")) return "This occupied plot has no configured capacity. Configure or review its capacity before recording another active interment.";
  if (message.includes("plot_capacity_reached")) return "This plot has reached its configured capacity. The interment was not saved.";
  if (message.includes("occupied_plot_confirmation_required")) return "Plot occupancy changed before saving. Review the current interments and confirm again.";
  if (message.includes("active_deceased_person_required")) return "An active deceased record is required for an active interment.";
  if (message.includes("active_plot_required")) return "An active plot is required for an active interment.";
  return "The interment could not be saved. Review the fields and try again.";
}

async function mutateInterment(
  mode: "create" | "update",
  id: string | undefined,
  formData: FormData,
): Promise<IntermentFormState> {
  await requireAdministrator();
  const values = readValues(formData);
  const validation = validateIntermentInput(values);
  if (!validation.ok) return { values, fieldErrors: validation.fieldErrors };

  try {
    const review = await inspectIntermentSafety(validation.data, id);
    const fieldErrors: IntermentFieldErrors = {};

    if (!review.plot) fieldErrors.plotId = "Select an existing plot.";
    if (validation.data.state === "active" && review.plot?.state !== "active") fieldErrors.plotId = "Select an active plot for an active interment.";
    if (review.duplicate) {
      return {
        values,
        duplicate: review.duplicate,
        error: "This exact deceased, plot, and interment-date combination already exists. No duplicate was created.",
      };
    }
    if (review.capacityUnknownBlocked) {
      return { values, error: "This occupied plot has no configured capacity. Its capacity must be configured or reviewed before another active interment can be recorded." };
    }
    if (review.capacityReached) {
      return { values, error: `This plot has reached its configured capacity of ${review.plot?.capacity}. No interment was created.` };
    }

    const deceased = review.deceased;
    if (!deceased) fieldErrors.deceasedPersonId = "Select an existing deceased record.";
    else if (validation.data.state === "active" && deceased.state !== "active") fieldErrors.deceasedPersonId = "Select an active deceased record for an active interment.";
    else if (validation.data.intermentDate && deceased.deathDate && validation.data.intermentDate < deceased.deathDate) {
      fieldErrors.intermentDate = "Interment date cannot be earlier than the recorded death date.";
    }
    if (Object.keys(fieldErrors).length > 0) return { values, fieldErrors };

    const confirmationKey = intermentConfirmationKey(validation.data, review.activeIntermentCount);
    const confirmed = formValue(formData, "occupancyConfirmation") === confirmationKey;
    if (review.needsOccupiedConfirmation && !confirmed && review.plot) {
      return {
        values,
        confirmationKey,
        occupancyWarning: {
          plot: review.plot,
          existingInterments: review.existingInterments,
          activeIntermentCount: review.activeIntermentCount,
        },
      };
    }

    const supabase = await createSupabaseServerClient();
    const sharedParameters = {
      p_deceased_person_id: validation.data.deceasedPersonId,
      p_plot_id: validation.data.plotId,
      p_interment_date: validation.data.intermentDate,
      p_interment_type: validation.data.intermentType,
      p_position_sequence: validation.data.positionSequence,
      p_permanence_status: validation.data.permanenceStatus,
      p_confirm_occupied: confirmed,
    };
    const result = mode === "create"
      ? await createIntermentRpc(supabase, sharedParameters)
      : await updateIntermentRpc(supabase, {
          ...sharedParameters,
          p_interment_id: id!,
          p_state: validation.data.state,
        });

    if (result.error || !result.data) {
      return { values, error: databaseError(result.error?.message ?? "") };
    }

    revalidatePath("/admin/interments");
    revalidatePath(`/admin/interments/${result.data}`);
    redirect(`/admin/interments/${result.data}?${mode === "create" ? "created" : "updated"}=1`);
  } catch (error) {
    unstable_rethrow(error);
    return { values, error: "The interment could not be saved. Please try again." };
  }
}

export async function searchDeceasedPicker(query: string): Promise<{ options: DeceasedPickerOption[]; error?: string }> {
  await requireAdministrator();
  try {
    return { options: await searchDeceasedOptions(normalizeIntermentSearch(query)) };
  } catch {
    return { options: [], error: "Unable to search deceased records." };
  }
}

export async function searchPlotPicker(query: string): Promise<{ options: PlotPickerOption[]; error?: string }> {
  await requireAdministrator();
  try {
    return { options: await searchPlotOptions(normalizeIntermentSearch(query)) };
  } catch {
    return { options: [], error: "Unable to search plots." };
  }
}

export async function createInterment(_previousState: IntermentFormState, formData: FormData) {
  return mutateInterment("create", undefined, formData);
}

export async function updateInterment(id: string, _previousState: IntermentFormState, formData: FormData) {
  if (!isUuid(id)) return { error: "This interment identifier is invalid." };
  return mutateInterment("update", id, formData);
}
