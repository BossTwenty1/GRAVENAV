import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminStatusBadge, capacityLabel, occupancyLabel, recordStateLabel } from "@/components/admin-record-state";
import { AdminEmptyState, AdminPageHeader, AdminPagination } from "@/components/admin-ui";
import { getPlotFilterOptions, listPlots } from "@/lib/plots/data";
import { normalizePlotSearch, parsePlotPage, parsePlotState, parsePlotUuidFilter, PLOT_PAGE_SIZE } from "@/lib/plots/validation";

export const metadata = { title: "Plots" };

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
  const [{ records, count }, filters] = await Promise.all([listPlots(search, siteId, plotTypeId, state, page), getPlotFilterOptions()]);
  const totalPages = Math.max(1, Math.ceil(count / PLOT_PAGE_SIZE));
  if (count > 0 && page > totalPages) redirect(pageHref(totalPages, search, siteId, plotTypeId, state));
  const filtered = Boolean(search || siteId !== "all" || plotTypeId !== "all" || state !== "all");

  return <div className="grid gap-5">
    <AdminPageHeader action={<Link className="admin-button-primary w-full sm:w-auto" href="/admin/plots/new"><span aria-hidden="true">+</span> Add plot</Link>} description="Maintain physical plot identities and hierarchy while occupancy remains safely derived from active interments." icon="plot" kicker="Plots" title="Cemetery locations">
      <form action="/admin/plots" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_minmax(9rem,13rem)_minmax(9rem,13rem)_9rem_auto] xl:items-end" method="get" role="search">
        <div><label className="mb-2 block text-sm font-semibold" htmlFor="plot-search">Plot identifier</label><input autoComplete="off" className="admin-control" defaultValue={search} id="plot-search" maxLength={100} name="q" placeholder="Search verified identifier…" type="search" /></div>
        <div><label className="mb-2 block text-sm font-semibold" htmlFor="plot-site">Cemetery site</label><select className="admin-control" defaultValue={siteId} id="plot-site" name="site"><option value="all">All sites</option>{filters.sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></div>
        <div><label className="mb-2 block text-sm font-semibold" htmlFor="plot-type">Plot type</label><select className="admin-control" defaultValue={plotTypeId} id="plot-type" name="type"><option value="all">All plot types</option>{filters.plotTypes.map((type) => <option key={type.id} value={type.id}>{type.name} ({type.code})</option>)}</select></div>
        <div><label className="mb-2 block text-sm font-semibold" htmlFor="plot-state">Lifecycle</label><select className="admin-control" defaultValue={state} id="plot-state" name="state"><option value="all">All states</option><option value="active">Active</option><option value="archived">Archived</option></select></div>
        <button className="admin-button-secondary" type="submit">Apply filters</button>
      </form>
      {filtered ? <Link className="admin-text-link mt-2" href="/admin/plots">Clear all filters</Link> : null}
    </AdminPageHeader>

    <section aria-labelledby="plot-results" className="admin-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4 sm:px-6"><h2 className="font-bold tracking-tight" id="plot-results">{filtered ? "Filtered plots" : "All plots"}</h2><p className="text-sm font-medium text-muted">{count} {count === 1 ? "record" : "records"}</p></div>
      {records.length === 0 ? <AdminEmptyState description={filtered ? "Adjust the identifier or filters and try again." : "Add the first plot after confirming its existing cemetery hierarchy and plot type."} heading={filtered ? "No matching plots" : "No plots yet"} icon="plot" /> : <>
        <div className="hidden overflow-x-auto lg:block"><table className="admin-table min-w-[1080px]"><thead><tr><th className="px-6 py-3.5" scope="col">Plot</th><th className="px-4 py-3.5" scope="col">Location</th><th className="px-4 py-3.5" scope="col">Plot type</th><th className="px-4 py-3.5" scope="col">Capacity</th><th className="px-4 py-3.5" scope="col">Occupancy</th><th className="px-4 py-3.5" scope="col">State</th><th className="px-4 py-3.5" scope="col">Updated</th><th className="px-6 py-3.5 text-right" scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y">{records.map((record) => <tr key={record.id}><th className="px-6 py-4 font-bold" scope="row">{record.identifier}</th><td className="max-w-sm px-4 py-4 text-muted">{[record.siteName, record.areaName, record.sectorLabel].filter(Boolean).join(" · ")}</td><td className="px-4 py-4">{record.plotTypeName ?? "Not assigned"}</td><td className="px-4 py-4">{capacityLabel(record.capacity)}</td><td className="px-4 py-4"><AdminStatusBadge>{occupancyLabel(record.occupancyStatus)}</AdminStatusBadge><span className="ml-2 text-muted">{record.activeIntermentCount} active</span></td><td className="px-4 py-4"><AdminStatusBadge tone={record.state}>{recordStateLabel(record.state)}</AdminStatusBadge></td><td className="px-4 py-4 text-muted">{new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(record.updatedAt))}</td><td className="px-6 py-4"><div className="flex justify-end gap-4"><Link className="admin-text-link" href={`/admin/plots/${record.id}`}>View</Link><Link className="admin-text-link" href={`/admin/plots/${record.id}/edit`}>Edit</Link></div></td></tr>)}</tbody></table></div>
        <div className="divide-y lg:hidden">{records.map((record) => <article className="p-5" key={record.id}><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold leading-snug">{record.identifier}</h3><p className="mt-1 text-sm leading-6 text-muted">{[record.siteName, record.areaName, record.sectorLabel].filter(Boolean).join(" · ")}</p></div><AdminStatusBadge tone={record.state}>{recordStateLabel(record.state)}</AdminStatusBadge></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted">Plot type</dt><dd className="mt-1 font-medium">{record.plotTypeName ?? "Not assigned"}</dd></div><div><dt className="text-muted">Capacity</dt><dd className="mt-1 font-medium">{capacityLabel(record.capacity)}</dd></div><div className="col-span-2"><dt className="text-muted">Derived occupancy</dt><dd className="mt-1"><AdminStatusBadge>{occupancyLabel(record.occupancyStatus)}</AdminStatusBadge><span className="ml-2 text-muted">{record.activeIntermentCount} active</span></dd></div></dl><div className="mt-3 flex gap-5"><Link className="admin-text-link" href={`/admin/plots/${record.id}`}>View</Link><Link className="admin-text-link" href={`/admin/plots/${record.id}/edit`}>Edit</Link></div></article>)}</div>
      </>}
      {count > 0 ? <AdminPagination label="Plot pagination" nextHref={page < totalPages ? pageHref(page + 1, search, siteId, plotTypeId, state) : undefined} page={page} previousHref={page > 1 ? pageHref(page - 1, search, siteId, plotTypeId, state) : undefined} totalPages={totalPages} /> : null}
    </section>
  </div>;
}
