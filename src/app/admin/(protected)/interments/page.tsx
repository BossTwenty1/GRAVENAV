import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminStatusBadge, recordStateLabel } from "@/components/admin-record-state";
import { AdminEmptyState, AdminPageHeader, AdminPagination } from "@/components/admin-ui";
import { listInterments } from "@/lib/interments/data";
import { INTERMENT_PAGE_SIZE, normalizeIntermentSearch, parseIntermentPage, parseIntermentState } from "@/lib/interments/validation";

export const metadata = { title: "Interments" };

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function locationText(record: Awaited<ReturnType<typeof listInterments>>["records"][number]) {
  return [record.siteName, record.areaName, record.sectorLabel, record.plotIdentifier].filter(Boolean).join(" · ");
}

function pageHref(page: number, search: string, state: "active" | "archived" | "all") {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (state !== "all") params.set("state", state);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/admin/interments${query ? `?${query}` : ""}`;
}

export default async function IntermentListPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; page?: string | string[]; state?: string | string[] }> }) {
  const parameters = await searchParams;
  const search = normalizeIntermentSearch(parameters.q);
  const state = parseIntermentState(parameters.state);
  const page = parseIntermentPage(parameters.page);
  const { records, count } = await listInterments(search, state, page);
  const totalPages = Math.max(1, Math.ceil(count / INTERMENT_PAGE_SIZE));
  if (count > 0 && page > totalPages) redirect(pageHref(totalPages, search, state));
  const filtered = Boolean(search || state !== "all");

  return <div className="grid gap-5">
    <AdminPageHeader action={<Link className="admin-button-primary w-full sm:w-auto" href="/admin/interments/new"><span aria-hidden="true">+</span> Add interment</Link>} description="Manage the verified relationship between a deceased person and their plot while preserving burial history." icon="interment" kicker="Interments" title="Burial placements">
      <form action="/admin/interments" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_auto] sm:items-end" method="get" role="search">
        <div><label className="mb-2 block text-sm font-semibold" htmlFor="interment-search">Search deceased names</label><input autoComplete="off" className="admin-control" defaultValue={search} id="interment-search" maxLength={100} name="q" placeholder="Enter a full or partial name…" type="search" /></div>
        <div><label className="mb-2 block text-sm font-semibold" htmlFor="interment-state">Lifecycle state</label><select className="admin-control" defaultValue={state} id="interment-state" name="state"><option value="all">All states</option><option value="active">Active</option><option value="archived">Archived</option></select></div>
        <button className="admin-button-secondary" type="submit">Apply filters</button>
      </form>
      {filtered ? <Link className="admin-text-link mt-2" href="/admin/interments">Clear all filters</Link> : null}
    </AdminPageHeader>

    <section aria-labelledby="interment-results" className="admin-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4 sm:px-6"><h2 className="font-bold tracking-tight" id="interment-results">{search ? `Results for “${search}”` : state === "all" ? "All interments" : `${state === "active" ? "Active" : "Archived"} interments`}</h2><p className="text-sm font-medium text-muted">{count} {count === 1 ? "record" : "records"}</p></div>
      {records.length === 0 ? <AdminEmptyState description={filtered ? "Adjust the name or lifecycle filter and try again." : "Add the first interment after selecting verified deceased and plot records."} heading={filtered ? "No matching interments" : "No interments yet"} icon="interment" /> : <>
        <div className="hidden overflow-x-auto md:block"><table className="admin-table min-w-[860px]"><thead><tr><th className="px-6 py-3.5" scope="col">Deceased person</th><th className="px-4 py-3.5" scope="col">Gravesite</th><th className="px-4 py-3.5" scope="col">Interment date</th><th className="px-4 py-3.5" scope="col">State</th><th className="px-4 py-3.5" scope="col">Updated</th><th className="px-6 py-3.5 text-right" scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y">{records.map((record) => <tr key={record.id}><th className="px-6 py-4 font-bold" scope="row">{record.deceasedName}</th><td className="max-w-sm px-4 py-4 text-muted">{locationText(record)}</td><td className="px-4 py-4 text-muted">{formatDate(record.intermentDate)}</td><td className="px-4 py-4"><AdminStatusBadge tone={record.state}>{recordStateLabel(record.state)}</AdminStatusBadge></td><td className="px-4 py-4 text-muted">{new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(record.updatedAt))}</td><td className="px-6 py-4"><div className="flex justify-end gap-4"><Link className="admin-text-link" href={`/admin/interments/${record.id}`}>View</Link><Link className="admin-text-link" href={`/admin/interments/${record.id}/edit`}>Edit</Link></div></td></tr>)}</tbody></table></div>
        <div className="divide-y md:hidden">{records.map((record) => <article className="p-5" key={record.id}><div className="flex items-start justify-between gap-3"><h3 className="font-bold leading-snug">{record.deceasedName}</h3><AdminStatusBadge tone={record.state}>{recordStateLabel(record.state)}</AdminStatusBadge></div><p className="mt-3 text-sm leading-6 text-muted">{locationText(record)}</p><p className="mt-2 text-sm"><span className="text-muted">Interment date:</span> <span className="font-medium">{formatDate(record.intermentDate)}</span></p><div className="mt-3 flex gap-5"><Link className="admin-text-link" href={`/admin/interments/${record.id}`}>View</Link><Link className="admin-text-link" href={`/admin/interments/${record.id}/edit`}>Edit</Link></div></article>)}</div>
      </>}
      {count > 0 ? <AdminPagination label="Interment pagination" nextHref={page < totalPages ? pageHref(page + 1, search, state) : undefined} page={page} previousHref={page > 1 ? pageHref(page - 1, search, state) : undefined} totalPages={totalPages} /> : null}
    </section>
  </div>;
}
