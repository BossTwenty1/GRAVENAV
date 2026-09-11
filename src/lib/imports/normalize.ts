import type { Cell, Lot } from "./model";

export const space = (value: string) => value.trim().replace(/\s+/gu, " ");
export const comparisonName = (value: string) => space(value).normalize("NFC").toUpperCase();
export const structural = (value: string) => space(value).toUpperCase().replace(/[\u2010-\u2015\u2212]/gu, "-").replace(/\s*([:;/])\s*/gu, "$1");
export const LOT_TYPES = { STD: "standard", PRM: "premium", SPR: "special_premium", EST: "estate" } as const;

// Only explicit labels have structural meaning. This is a synthetic/developer
// contract, not a claimed grammar for undocumented client identifiers.
export function parseLot(raw: string): Lot {
  const key = structural(raw);
  const match = /^AREA:([A-Z0-9-]+);SECTOR:([A-Z0-9-]+);LOT:([0-9]+[A-Z]?)(?:;UNIT:([A-Z0-9-]+))?;TYPE:([A-Z]+)$/.exec(key);
  const token = match?.[5] ?? key.match(/(?:^|[\s;:])(?:STD|PRM|SPR|EST|MCF)(?=$|[\s;])/u)?.[0].replace(/^[\s;:]/, "") ?? null;
  const type = token && Object.hasOwn(LOT_TYPES, token) ? LOT_TYPES[token as keyof typeof LOT_TYPES] : null;
  return { raw, key, status: match ? "resolved" : key ? "partial" : "unresolved", area: match?.[1] ?? null, sector: match?.[2] ?? null, lot: match?.[3] ?? null, unit: match?.[4] ?? null, classification: token, type };
}

export function normalizeDate(value: Cell): { value: string | null; invalid: boolean } {
  if (value === null || (typeof value === "string" && !value.trim())) return { value: null, invalid: false };
  // Numeric Excel dates are converted by the reader only when date-styled.
  // Unstyled numbers and ambiguous locale strings deliberately require review.
  const text = value instanceof Date && Number.isFinite(value.getTime()) ? value.toISOString().slice(0, 10) : typeof value === "string" ? value.trim() : "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match || +match[1] < 1) return { value: null, invalid: true };
  const date = new Date(`${text}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === text ? { value: text, invalid: false } : { value: null, invalid: true };
}
