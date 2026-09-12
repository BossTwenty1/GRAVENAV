import { isDateOnly } from "@/lib/deceased/validation";

export const INTERMENT_PAGE_SIZE = 25;
export const PICKER_RESULT_LIMIT = 12;

export type IntermentState = "active" | "archived";

export type IntermentFormValues = {
  deceasedPersonId: string;
  plotId: string;
  intermentDate: string;
  intermentType: string;
  positionSequence: string;
  permanenceStatus: string;
  state: IntermentState;
};

export type IntermentFieldErrors = Partial<Record<keyof IntermentFormValues, string>>;

export type ValidatedIntermentInput = {
  deceasedPersonId: string;
  plotId: string;
  intermentDate: string | null;
  intermentType: string | null;
  positionSequence: number | null;
  permanenceStatus: string | null;
  state: IntermentState;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function optionalText(value: string) {
  const normalized = value.trim().replace(/\s+/gu, " ").normalize("NFC");
  return normalized || null;
}

export function validateIntermentInput(values: IntermentFormValues):
  | { ok: true; data: ValidatedIntermentInput }
  | { ok: false; fieldErrors: IntermentFieldErrors } {
  const fieldErrors: IntermentFieldErrors = {};
  const intermentDate = values.intermentDate.trim();
  const intermentType = optionalText(values.intermentType);
  const permanenceStatus = optionalText(values.permanenceStatus);
  const positionText = values.positionSequence.trim();
  const positionSequence = positionText ? Number(positionText) : null;

  if (!isUuid(values.deceasedPersonId)) {
    fieldErrors.deceasedPersonId = "Select an existing deceased record.";
  }
  if (!isUuid(values.plotId)) {
    fieldErrors.plotId = "Select an existing plot.";
  }
  if (intermentDate && !isDateOnly(intermentDate)) {
    fieldErrors.intermentDate = "Enter a valid interment date.";
  }
  if (intermentType && [...intermentType].length > 100) {
    fieldErrors.intermentType = "Interment type must be 100 characters or fewer.";
  }
  if (positionText && (!Number.isSafeInteger(positionSequence) || positionSequence! < 1)) {
    fieldErrors.positionSequence = "Position sequence must be a positive whole number.";
  }
  if (permanenceStatus && [...permanenceStatus].length > 100) {
    fieldErrors.permanenceStatus = "Permanence status must be 100 characters or fewer.";
  }
  if (values.state !== "active" && values.state !== "archived") {
    fieldErrors.state = "Select a valid lifecycle state.";
  }

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  return {
    ok: true,
    data: {
      deceasedPersonId: values.deceasedPersonId,
      plotId: values.plotId,
      intermentDate: intermentDate || null,
      intermentType,
      positionSequence,
      permanenceStatus,
      state: values.state,
    },
  };
}

export function parseIntermentPage(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const page = Number(candidate);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function intermentPageRange(page: number) {
  const start = (page - 1) * INTERMENT_PAGE_SIZE;
  return { start, end: start + INTERMENT_PAGE_SIZE - 1 };
}

export function normalizeIntermentSearch(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return (candidate ?? "").trim().replace(/\s+/gu, " ").toLocaleLowerCase("en-US").slice(0, 100);
}

export function parseIntermentState(value: string | string[] | undefined): IntermentState | "all" {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "active" || candidate === "archived" ? candidate : "all";
}

export function escapeIlike(value: string) {
  return value.replace(/[\\%_]/gu, "\\$&");
}

export function intermentConfirmationKey(input: ValidatedIntermentInput, occupancyCount: number) {
  return JSON.stringify([
    input.deceasedPersonId,
    input.plotId,
    input.intermentDate,
    input.state,
    occupancyCount,
  ]);
}

export type CapacityDecision = "allowed" | "confirmation-required" | "capacity-unknown" | "capacity-reached";

export function assessActiveIntermentCapacity(
  activeIntermentCount: number,
  capacity: number | null,
  requiresCapacityCheck = true,
): CapacityDecision {
  if (!requiresCapacityCheck) return "allowed";
  if (capacity !== null && activeIntermentCount >= capacity) return "capacity-reached";
  if (activeIntermentCount === 0) return "allowed";
  if (capacity === null) return "capacity-unknown";
  return "confirmation-required";
}
