export const DECEASED_PAGE_SIZE = 25;

export type DeceasedFormValues = {
  displayName: string;
  birthDate: string;
  deathDate: string;
};

export type DeceasedFieldErrors = Partial<Record<keyof DeceasedFormValues, string>>;

export type ValidatedDeceasedInput = {
  displayName: string;
  birthDate: string | null;
  deathDate: string | null;
  normalizedName: string;
};

export function normalizeDisplayName(value: string) {
  return value.trim().replace(/\s+/gu, " ").normalize("NFC");
}

export function normalizeSearchName(value: string) {
  return normalizeDisplayName(value).toLocaleLowerCase("en-US");
}

export function isDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match || Number(match[1]) < 1) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateDeceasedInput(values: DeceasedFormValues):
  | { ok: true; data: ValidatedDeceasedInput }
  | { ok: false; fieldErrors: DeceasedFieldErrors } {
  const displayName = normalizeDisplayName(values.displayName);
  const birthDate = values.birthDate.trim();
  const deathDate = values.deathDate.trim();
  const fieldErrors: DeceasedFieldErrors = {};

  if (!displayName) {
    fieldErrors.displayName = "Enter the deceased person's full display name.";
  } else if ([...displayName].length > 200) {
    fieldErrors.displayName = "The display name must be 200 characters or fewer.";
  }

  if (birthDate && !isDateOnly(birthDate)) {
    fieldErrors.birthDate = "Enter a valid birth date.";
  }

  if (deathDate && !isDateOnly(deathDate)) {
    fieldErrors.deathDate = "Enter a valid death date.";
  }

  if (!fieldErrors.birthDate && !fieldErrors.deathDate && birthDate && deathDate && birthDate > deathDate) {
    fieldErrors.deathDate = "Death date cannot be earlier than birth date.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    data: {
      displayName,
      birthDate: birthDate || null,
      deathDate: deathDate || null,
      normalizedName: normalizeSearchName(displayName),
    },
  };
}

export function parsePage(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const page = Number(candidate);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function deceasedPageRange(page: number) {
  const start = (page - 1) * DECEASED_PAGE_SIZE;
  return { start, end: start + DECEASED_PAGE_SIZE - 1 };
}

export function normalizeSearchQuery(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return normalizeSearchName((candidate ?? "").slice(0, 100));
}

export function escapeIlikePattern(value: string) {
  return value.replace(/[\\%_]/gu, "\\$&");
}

export function duplicateConfirmationKey(input: ValidatedDeceasedInput) {
  return JSON.stringify([input.normalizedName, input.birthDate, input.deathDate]);
}
