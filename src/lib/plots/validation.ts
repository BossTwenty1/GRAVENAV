export const PLOT_PAGE_SIZE = 25;
export const PLOT_PICKER_LIMIT = 12;
export const PLOT_FILTER_LIMIT = 50;

export type PlotState = "active" | "archived";

export type PlotFormValues = {
  siteId: string;
  areaId: string;
  sectorId: string;
  plotTypeId: string;
  plotIdentifier: string;
  state: PlotState;
};

export type PlotFieldErrors = Partial<Record<keyof PlotFormValues, string>>;

export type ValidatedPlotInput = {
  siteId: string;
  areaId: string;
  sectorId: string;
  plotTypeId: string;
  plotIdentifier: string;
  normalizedLotKey: string;
  state: PlotState;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export function isPlotUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function normalizePlotIdentifier(value: string) {
  return value.trim().replace(/\s+/gu, " ").normalize("NFC");
}

export function normalizedPlotKey(value: string) {
  return normalizePlotIdentifier(value).toLocaleLowerCase("en-US");
}

export function validatePlotInput(values: PlotFormValues):
  | { ok: true; data: ValidatedPlotInput }
  | { ok: false; fieldErrors: PlotFieldErrors } {
  const fieldErrors: PlotFieldErrors = {};
  const plotIdentifier = normalizePlotIdentifier(values.plotIdentifier);

  if (!isPlotUuid(values.siteId)) fieldErrors.siteId = "Select an existing cemetery site.";
  if (!isPlotUuid(values.areaId)) fieldErrors.areaId = "Select an existing area or garden.";
  if (!isPlotUuid(values.sectorId)) fieldErrors.sectorId = "Select an existing sector.";
  if (!isPlotUuid(values.plotTypeId)) fieldErrors.plotTypeId = "Select an existing plot type.";
  if (!plotIdentifier) fieldErrors.plotIdentifier = "Enter a plot identifier.";
  else if ([...plotIdentifier].length > 100) fieldErrors.plotIdentifier = "Plot identifier must be 100 characters or fewer.";
  if (values.state !== "active" && values.state !== "archived") fieldErrors.state = "Select a valid lifecycle state.";

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return {
    ok: true,
    data: {
      siteId: values.siteId,
      areaId: values.areaId,
      sectorId: values.sectorId,
      plotTypeId: values.plotTypeId,
      plotIdentifier,
      normalizedLotKey: normalizedPlotKey(plotIdentifier),
      state: values.state,
    },
  };
}

export function parsePlotPage(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const page = Number(candidate);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function plotPageRange(page: number) {
  const start = (page - 1) * PLOT_PAGE_SIZE;
  return { start, end: start + PLOT_PAGE_SIZE - 1 };
}

export function normalizePlotSearch(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return normalizedPlotKey(candidate ?? "").slice(0, 100);
}

export function parsePlotState(value: string | string[] | undefined): PlotState | "all" {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "active" || candidate === "archived" ? candidate : "all";
}

export function parsePlotUuidFilter(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && isPlotUuid(candidate) ? candidate : "all";
}

export function escapePlotIlike(value: string) {
  return value.replace(/[\\%_]/gu, "\\$&");
}

export type PlotTypeChangeDecision = "allowed" | "below-active-count" | "unknown-with-multiple";

export function assessPlotTypeChange(activeIntermentCount: number, capacity: number | null): PlotTypeChangeDecision {
  if (capacity !== null && capacity < activeIntermentCount) return "below-active-count";
  if (capacity === null && activeIntermentCount > 1) return "unknown-with-multiple";
  return "allowed";
}

export function plotLocationConfirmationKey(input: ValidatedPlotInput, plotId: string, activeIntermentCount: number) {
  return JSON.stringify([
    plotId,
    input.siteId,
    input.areaId,
    input.sectorId,
    input.normalizedLotKey,
    activeIntermentCount,
  ]);
}
