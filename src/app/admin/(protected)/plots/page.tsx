import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminStatusBadge, capacityLabel, occupancyLabel, recordStateLabel } from "@/components/admin-record-state";
import { getPlotFilterOptions, listPlots } from "@/lib/plots/data";
import {
  normalizePlotSearch,
  parsePlotPage,
  parsePlotState,
  parsePlotUuidFilter,
  PLOT_PAGE_SIZE,
} from "@/lib/plots/validation";

function pageHref(page: number, search: string, siteId: string, plotTypeId: string, state: "active" | "archived" | "all") {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (siteId !== "all") params.set("site", siteId);
  if (plotTypeId !== "all") params.set("type", plotTypeId);
  if (state !== "all") params.set("state", state);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/admin/plots${query ? `?${query}` : ""}`;
}

export default async function PlotListPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; site?: string | string[]; type?: string | string[]; state?: string | string[]; page?: string | string[] }> }) {
  const parameters = await searchParams;
  const search = normalizePlotSearch(parameters.q);
  const siteId = parsePlotUuidFilter(parameters.site);
  const plotTypeId = parsePlotUuidFilter(parameters.type);
  const state = parsePlotState(parameters.state);
  const page = parsePlotPage(parameters.page);
  const [{ records, count }, filters] = await Promise.all([
    listPlots(search, siteId, plotTypeId, state, page),
    getPlotFilterOptions(),
  ]);
  const totalPages = Math.max(1, Math.ceil(count / PLOT_PAGE_SIZE));
  if (count > 0 && page > totalPages) redirect(pageHref(totalPages, search, siteId, plotTypeId, state));
  const filtered = Boolean(search || siteId !== "all" || plotTypeId !== "all" || state !== "all");

  return <div className="grid gap-6">
    <section className="rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Cemetery records</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Plots</h1><p className="mt-3 max-w-2xl leading-7 text-muted">View and carefully maintain physical plot identities while keeping occupancy derived from active interments.</p></div>
        <Link className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90" href="/admin/plots/new">Add plot</Link>
      </div>
      <form action="/admin/plots" className="mt-7 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)_minmax(10rem,14rem)_10rem_auto]" method="get" role="search">
        <div><label className="sr-only" htmlFor="plot-search">Search plot identifiers</label><input className="min-h-12 w-full rounded-lg border bg-white px-4 py-3" defaultValue={search} id="plot-search" maxLength={100} name="q" placeholder="Search plot identifier" type="search" /></div>
        <div><label className="sr-only" htmlFor="plot-site">Filter by cemetery site</label><select className="min-h-12 w-full rounded-lg border bg-white px-3" defaultValue={siteId} id="plot-site" name="site"><option value="all">All sites</option>{filters.sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></div>
        <div><label className="sr-only" htmlFor="plot-type">Filter by plot type</label><select className="min-h-12 w-full rounded-lg border bg-white px-3" defaultValue={plotTypeId} id="plot-type" name="type"><option value="all">All plot types</option>{filters.plotTypes.map((type) => <option key={type.id} value={type.id}>{type.name} ({type.code})</option>)}</select></div>
        <div><label className="sr-only" htmlFor="plot-state">Filter by lifecycle state</label><select className="min-h-12 w-full rounded-lg border bg-white px-3" defaultValue={state} id="plot-state" name="state"><option value="all">All states</option><option value="active">Active</option><option value="archived">Archived</option></select></div>
        <button className="min-h-12 rounded-lg border bg-white px-5 py-3 font-semibold hover:bg-accent" type="submit">Apply</button>
      </form>
      {filtered ? <Link className="mt-3 inline-flex font-semibold text-primary underline" href="/admin/plots">Clear filters</Link> : null}
    </section>

    <section aria-labelledby="plot-results" className="overflow-hidden rounded-2xl border bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4 sm:px-6"><h2 className="font-semibold" id="plot-results">{filtered ? "Filtered plots" : "All plots"}</h2><p className="text-sm text-muted">{count} {count === 1 ? "record" : "records"}</p></div>
      {records.length === 0 ? <div className="px-6 py-14 text-center"><h3 className="text-lg font-semibold">{filtered ? "No matching plots" : "No plots yet"}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{filtered ? "Adjust the identifier or bounded filters and try again." : "Add the first plot after confirming its existing cemetery hierarchy and plot type."}</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-[#f5f7f3] text-xs uppercase tracking-wide text-muted"><tr><th className="px-6 py-3" scope="col">Plot</th><th className="px-4 py-3" scope="col">Location</th><th className="px-4 py-3" scope="col">Plot type</th><th className="px-4 py-3" scope="col">Capacity</th><th className="px-4 py-3" scope="col">Occupancy</th><th className="px-4 py-3" scope="col">State</th><th className="px-4 py-3" scope="col">Updated</th><th className="px-6 py-3 text-right" scope="col">Actions</th></tr></thead><tbody className="divide-y">{records.map((record) => <tr key={record.id}><th className="px-6 py-4 font-semibold" scope="row">{record.identifier}</th><td className="max-w-sm px-4 py-4 text-muted">{[record.siteName, record.areaName, record.sectorLabel].filter(Boolean).join(" · ")}</td><td className="px-4 py-4">{record.plotTypeName ?? "Not assigned"}</td><td className="px-4 py-4">{capacityLabel(record.capacity)}</td><td className="px-4 py-4"><AdminStatusBadge>{occupancyLabel(record.occupancyStatus)}</AdminStatusBadge> <span className="text-muted">({record.activeIntermentCount} active)</span></td><td className="px-4 py-4"><AdminStatusBadge tone={record.state}>{recordStateLabel(record.state)}</AdminStatusBadge></td><td className="px-4 py-4 text-muted">{new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(record.updatedAt))}</td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-3"><Link className="font-semibold text-primary underline" href={`/admin/plots/${record.id}`}>View</Link><Link className="font-semibold text-primary underline" href={`/admin/plots/${record.id}/edit`}>Edit</Link></div></td></tr>)}</tbody></table></div>}
      {count > 0 ? <nav aria-label="Plot pagination" className="flex items-center justify-between gap-4 border-t px-5 py-4 sm:px-6">{page > 1 ? <Link className="rounded-lg border px-4 py-2 font-semibold hover:bg-accent" href={pageHref(page - 1, search, siteId, plotTypeId, state)}>Previous</Link> : <span />}<span className="text-sm text-muted">Page {page} of {totalPages}</span>{page < totalPages ? <Link className="rounded-lg border px-4 py-2 font-semibold hover:bg-accent" href={pageHref(page + 1, search, siteId, plotTypeId, state)}>Next</Link> : <span />}</nav> : null}
    </section>
  </div>;
}
