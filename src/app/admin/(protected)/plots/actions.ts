"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { requireAdministrator } from "@/lib/auth/administrator";
import {
  inspectPlotSafety,
  searchAreaOptions,
  searchPlotTypeOptions,
  searchSectorOptions,
  searchSiteOptions,
  type PlotOption,
  type PlotTypeOption,
} from "@/lib/plots/data";
import {
  isPlotUuid,
  plotLocationConfirmationKey,
  type PlotFieldErrors,
  type PlotFormValues,
  validatePlotInput,
} from "@/lib/plots/validation";
import { createPlotRpc, updatePlotRpc } from "@/lib/supabase/rpc";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PlotFormState = {
  error?: string;
  fieldErrors?: PlotFieldErrors;
  values?: PlotFormValues;
  duplicate?: { id: string; identifier: string };
  confirmationKey?: string;
  locationWarning?: { identifier: string; activeIntermentCount: number };
};

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readValues(formData: FormData): PlotFormValues {
  const state = formValue(formData, "state");
  return {
    siteId: formValue(formData, "siteId"),
    areaId: formValue(formData, "areaId"),
    sectorId: formValue(formData, "sectorId"),
    plotTypeId: formValue(formData, "plotTypeId"),
    plotIdentifier: formValue(formData, "plotIdentifier"),
    state: state === "archived" ? "archived" : "active",
  };
}

function databaseError(message: string) {
  if (message.includes("duplicate_plot")) return "A plot with this normalized identifier already exists at the selected cemetery site.";
  if (message.includes("invalid_plot_identifier")) return "Enter a valid plot identifier of 100 characters or fewer.";
  if (message.includes("invalid_plot_hierarchy")) return "Select an active site, area, and sector that belong to the same hierarchy.";
  if (message.includes("active_plot_type_required")) return "Select an active existing plot type.";
  if (message.includes("plot_type_capacity_below_active_count")) return "The selected plot type capacity is below this plot's active interment count.";
  if (message.includes("plot_type_capacity_unknown_for_multiple")) return "The selected plot type has unknown capacity, so compatibility with multiple active interments cannot be confirmed.";
  if (message.includes("active_interments_prevent_plot_archive")) return "A plot with active interments cannot be archived.";
  if (message.includes("occupied_plot_location_confirmation_required")) return "Plot occupancy changed before saving. Review and confirm the location correction again.";
  return "The plot could not be saved. Review the fields and try again.";
}

async function mutatePlot(mode: "create" | "update", id: string | undefined, formData: FormData): Promise<PlotFormState> {
  await requireAdministrator();
  const values = readValues(formData);
  const validation = validatePlotInput(values);
  if (!validation.ok) return { values, fieldErrors: validation.fieldErrors };

  try {
    const review = await inspectPlotSafety(validation.data, id);
    const fieldErrors: PlotFieldErrors = {};
    if (!review.hierarchyValid) fieldErrors.areaId = "Select an active site, area, and sector from the same hierarchy.";
    if (!review.plotType) fieldErrors.plotTypeId = "Select an active existing plot type.";
    if (mode === "update" && !review.current) return { values, error: "This plot no longer exists." };
    if (Object.keys(fieldErrors).length > 0) return { values, fieldErrors };
    if (review.duplicate) {
      return { values, duplicate: review.duplicate, error: "This normalized physical plot location already exists. No plot was created or merged." };
    }
    if (review.typeChangeDecision === "below-active-count") {
      return { values, error: `The selected capacity of ${review.plotType?.capacity} is below the current ${review.activeIntermentCount} active interments.` };
    }
    if (review.typeChangeDecision === "unknown-with-multiple") {
      return { values, error: "The selected plot type has unknown capacity, so compatibility with multiple active interments cannot be confirmed." };
    }
    if (validation.data.state === "archived" && review.activeIntermentCount > 0) {
      return { values, error: "A plot with active interments cannot be archived." };
    }

    const confirmationKey = id ? plotLocationConfirmationKey(validation.data, id, review.activeIntermentCount) : "";
    const confirmed = Boolean(id) && formValue(formData, "locationConfirmation") === confirmationKey;
    if (review.locationChanged && review.activeIntermentCount > 0 && !confirmed && review.current) {
      return {
        values,
        confirmationKey,
        locationWarning: { identifier: review.current.identifier, activeIntermentCount: review.activeIntermentCount },
      };
    }

    const supabase = await createSupabaseServerClient();
    const sharedParameters = {
      p_cemetery_site_id: validation.data.siteId,
      p_cemetery_area_id: validation.data.areaId,
      p_sector_id: validation.data.sectorId,
      p_plot_identifier: validation.data.plotIdentifier,
      p_plot_type_id: validation.data.plotTypeId,
    };
    const result = mode === "create"
      ? await createPlotRpc(supabase, sharedParameters)
      : await updatePlotRpc(supabase, {
          ...sharedParameters,
          p_plot_id: id!,
          p_state: validation.data.state,
          p_confirm_occupied_location_change: confirmed,
        });
    if (result.error || !result.data) return { values, error: databaseError(result.error?.message ?? "") };

    revalidatePath("/admin/plots");
    revalidatePath(`/admin/plots/${result.data}`);
    redirect(`/admin/plots/${result.data}?${mode === "create" ? "created" : "updated"}=1`);
  } catch (error) {
    unstable_rethrow(error);
    return { values, error: "The plot could not be saved. Please try again." };
  }
}

async function pickerResult<T>(operation: () => Promise<T[]>, message: string): Promise<{ options: T[]; error?: string }> {
  await requireAdministrator();
  try {
    return { options: await operation() };
  } catch {
    return { options: [], error: message };
  }
}

export async function searchSites(query: string): Promise<{ options: PlotOption[]; error?: string }> {
  return pickerResult(() => searchSiteOptions(query), "Unable to search cemetery sites.");
}

export async function searchAreas(siteId: string, query: string): Promise<{ options: PlotOption[]; error?: string }> {
  if (!isPlotUuid(siteId)) return { options: [], error: "Select a cemetery site first." };
  return pickerResult(() => searchAreaOptions(siteId, query), "Unable to search cemetery areas.");
}

export async function searchSectors(areaId: string, query: string): Promise<{ options: PlotOption[]; error?: string }> {
  if (!isPlotUuid(areaId)) return { options: [], error: "Select an area or garden first." };
  return pickerResult(() => searchSectorOptions(areaId, query), "Unable to search sectors.");
}

export async function searchPlotTypes(query: string): Promise<{ options: PlotTypeOption[]; error?: string }> {
  return pickerResult(() => searchPlotTypeOptions(query), "Unable to search plot types.");
}

export async function createPlot(_previousState: PlotFormState, formData: FormData) {
  return mutatePlot("create", undefined, formData);
}

export async function updatePlot(id: string, _previousState: PlotFormState, formData: FormData) {
  if (!isPlotUuid(id)) return { error: "This plot identifier is invalid." };
  return mutatePlot("update", id, formData);
}
