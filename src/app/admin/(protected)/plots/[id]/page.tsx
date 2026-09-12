import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminStatusBadge, capacityLabel, occupancyLabel, recordStateLabel } from "@/components/admin-record-state";
import { getPlot } from "@/lib/plots/data";
import { isPlotUuid, PLOT_PAGE_SIZE } from "@/lib/plots/validation";

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

export default async function PlotDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; updated?: string }> }) {
  const { id } = await params;
  if (!isPlotUuid(id)) notFound();
  const plot = await getPlot(id);
  if (!plot) notFound();
  const status = await searchParams;

  return <div className="grid gap-4">
    <Link className="w-fit font-semibold text-primary underline" href="/admin/plots">← Back to plots</Link>
    {status.created === "1" || status.updated === "1" ? <p aria-live="polite" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-900" role="status">{status.created === "1" ? "Plot created successfully." : "Plot updated successfully."}</p> : null}
    <section className="rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Plot record</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{plot.identifier}</h1><p className="mt-2 text-muted">{[plot.siteName, plot.areaName, plot.sectorLabel].filter(Boolean).join(" · ")}</p></div><Link className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90" href={`/admin/plots/${plot.id}/edit`}>Edit plot</Link></div>
      <dl className="mt-8 grid gap-5 border-t pt-6 sm:grid-cols-2 lg:grid-cols-3">
        <div><dt className="text-sm font-semibold text-muted">Cemetery site</dt><dd className="mt-1 text-lg">{plot.siteName}</dd></div>
        <div><dt className="text-sm font-semibold text-muted">Area or garden</dt><dd className="mt-1 text-lg">{plot.areaName ?? "Not assigned"}</dd></div>
        <div><dt className="text-sm font-semibold text-muted">Sector</dt><dd className="mt-1 text-lg">{plot.sectorLabel ?? "Not assigned"}</dd></div>
        <div><dt className="text-sm font-semibold text-muted">Plot type</dt><dd className="mt-1 text-lg">{plot.plotTypeName ?? "Not assigned"}</dd><dd className="mt-1 text-sm text-muted">{plot.plotTypeCode ? `Code: ${plot.plotTypeCode}` : "No configured type"}</dd></div>
        <div><dt className="text-sm font-semibold text-muted">Inherited capacity</dt><dd className="mt-1 text-lg">{capacityLabel(plot.capacity)}</dd></div>
        <div><dt className="text-sm font-semibold text-muted">Derived occupancy</dt><dd className="mt-1"><AdminStatusBadge>{occupancyLabel(plot.occupancyStatus)}</AdminStatusBadge></dd><dd className="mt-1 text-sm text-muted">{plot.activeIntermentCount} active {plot.activeIntermentCount === 1 ? "interment" : "interments"}</dd></div>
        <div><dt className="text-sm font-semibold text-muted">Lifecycle state</dt><dd className="mt-1"><AdminStatusBadge tone={plot.state}>{recordStateLabel(plot.state)}</AdminStatusBadge></dd></div>
        <div><dt className="text-sm font-semibold text-muted">Source commercial metadata</dt><dd className="mt-1 text-lg">{plot.sourceCommercialStatus ?? "Not recorded"}</dd><dd className="mt-1 text-sm text-muted">Not used to determine physical occupancy.</dd></div>
        <div><dt className="text-sm font-semibold text-muted">Record timestamps</dt><dd className="mt-1 text-sm">Created {formatTimestamp(plot.createdAt)}<br />Updated {formatTimestamp(plot.updatedAt)}</dd></div>
      </dl>
    </section>

    <section className="rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Active interments</h2><p className="mt-1 text-sm text-muted">Read-only context; use the interment workflow for corrections.</p></div><Link className="font-semibold text-primary underline" href="/admin/interments">Open interment management</Link></div>
      {plot.activeInterments.length === 0 ? <p className="mt-6 rounded-lg bg-[#f5f7f3] p-4 text-sm text-muted">No active interments are attached to this plot.</p> : <ul className="mt-6 divide-y rounded-xl border">{plot.activeInterments.map((interment) => <li className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" key={interment.id}><span><strong>{interment.deceasedName}</strong><span className="mt-1 block text-sm text-muted">Interment date: {formatDate(interment.intermentDate)}</span></span><span className="flex flex-wrap gap-3"><Link className="font-semibold text-primary underline" href={`/admin/interments/${interment.id}`}>View interment</Link><Link className="font-semibold text-primary underline" href={`/admin/deceased/${interment.deceasedPersonId}`}>View deceased record</Link></span></li>)}</ul>}
      {plot.activeIntermentCount > PLOT_PAGE_SIZE ? <p className="mt-3 text-sm text-muted">Showing the first {PLOT_PAGE_SIZE} active interments.</p> : null}
    </section>
    <p className="rounded-lg bg-[#f5f7f3] p-4 text-sm leading-6 text-muted">Occupancy is read-only and derived from active interments. Plot history is corrected or archived; no hard-delete control is available.</p>
  </div>;
}
