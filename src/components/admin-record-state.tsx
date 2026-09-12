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
  const toneClass = tone === "active" ? "border-[#b8cdbb] bg-[#edf4eb] text-[#214d32]" : tone === "archived" ? "border-[#c9ceca] bg-[#eef0ed] text-[#4b5750]" : "border-[#d1c9b9] bg-[#f5f1e7] text-[#60543e]";
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{children}</span>;
}
