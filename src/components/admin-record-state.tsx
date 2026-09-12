export function recordStateLabel(state: "active" | "archived") {
  return state === "active" ? "Active" : "Archived";
}

export function occupancyLabel(status: string) {
  if (status === "unoccupied") return "Unoccupied";
  if (status === "occupied") return "Occupied";
  if (status === "multiple_interments") return "Multiple Interments";
  return "Occupancy Unknown";
}

export function capacityLabel(capacity: number | null) {
  return capacity === null ? "Capacity Unknown" : String(capacity);
}

export function AdminStatusBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "active" | "archived" }) {
  const toneClass = tone === "active" ? "border-green-200 bg-green-50 text-green-900" : tone === "archived" ? "border-slate-300 bg-slate-100 text-slate-800" : "border-stone-300 bg-stone-50 text-stone-800";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass}`}>{children}</span>;
}
