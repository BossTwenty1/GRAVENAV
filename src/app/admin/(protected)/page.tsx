import Link from "next/link";

const sections = [
  ["Deceased records", "View, search, add, and correct deceased-person records.", "/admin/deceased"],
  ["Interments", "View, search, add, and correct deceased-to-plot interment records.", "/admin/interments"],
  ["Plots", "Future cemetery areas, plots, and gravesite relationships.", "/admin/plots"],
  ["Map", "Future spatial-data and map-layer preparation.", "/admin/map"],
  ["Coordinates", "Future coordinate capture and verification workflows.", "/admin/coordinates"],
  ["Reports", "Future reports and study-required summaries.", "/admin/reports"],
] as const;

export default function AdminDashboardPage() {
  return (
    <div className="rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Administrator</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Administration</h1>
      <p className="mt-4 max-w-2xl leading-7 text-muted">
        You are signed in with an approved administrator account. Deceased-person and interment record management are available; other workflows remain reserved for later tasks.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {sections.map(([title, description, href]) => (
          <Link className="rounded-xl border p-5 hover:border-primary hover:bg-accent" href={href} key={href}>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
