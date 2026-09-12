import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminStatusBadge, recordStateLabel } from "@/components/admin-record-state";
import { AdminEmptyState, AdminPageHeader, AdminPagination } from "@/components/admin-ui";
import { listDeceasedRecords } from "@/lib/deceased/data";
import { DECEASED_PAGE_SIZE, normalizeSearchQuery, parsePage } from "@/lib/deceased/validation";

export const metadata = { title: "Deceased records" };

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function pageHref(page: number, search: string) {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/admin/deceased${query ? `?${query}` : ""}`;
}

export default async function DeceasedListPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> }) {
  const parameters = await searchParams;
  const search = normalizeSearchQuery(parameters.q);
  const page = parsePage(parameters.page);
  const { records, count } = await listDeceasedRecords(search, page);
  const totalPages = Math.max(1, Math.ceil(count / DECEASED_PAGE_SIZE));
  if (count > 0 && page > totalPages) redirect(pageHref(totalPages, search));

  return (
    <div className="grid gap-5">
      <AdminPageHeader
        action={<Link className="admin-button-primary w-full sm:w-auto" href="/admin/deceased/new"><span aria-hidden="true">+</span> Add deceased record</Link>}
        description="View, search, create, and carefully correct deceased-person information."
        icon="person"
        kicker="Deceased records"
        title="People remembered here"
      >
        <form action="/admin/deceased" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end" method="get" role="search">
          <div><label className="mb-2 block text-sm font-semibold" htmlFor="deceased-search">Search by deceased name</label><input autoComplete="off" className="admin-control" defaultValue={search} id="deceased-search" maxLength={100} name="q" placeholder="Enter a full or partial name…" type="search" /></div>
          <button className="admin-button-secondary" type="submit">Search records</button>
          {search ? <Link className="admin-button-quiet" href="/admin/deceased">Clear search</Link> : null}
        </form>
      </AdminPageHeader>

      <section aria-labelledby="results-heading" className="admin-panel overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b px-5 py-4 sm:px-6"><h2 className="font-bold tracking-tight" id="results-heading">{search ? `Results for “${search}”` : "All deceased records"}</h2><p className="whitespace-nowrap text-sm font-medium text-muted">{count} {count === 1 ? "record" : "records"}</p></div>
        {records.length === 0 ? (
          <AdminEmptyState description={search ? "Try a different spelling or clear the search to see every record." : "Add the first deceased record when verified information is available."} heading={search ? "No matching records" : "No deceased records yet"} icon="person" />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="admin-table min-w-[720px]">
                <thead><tr><th className="px-6 py-3.5" scope="col">Deceased person</th><th className="px-4 py-3.5" scope="col">Birth date</th><th className="px-4 py-3.5" scope="col">Death date</th><th className="px-4 py-3.5" scope="col">State</th><th className="px-4 py-3.5" scope="col">Last updated</th><th className="px-6 py-3.5 text-right" scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody className="divide-y">{records.map((record) => <tr key={record.id}><th className="px-6 py-4 font-bold" scope="row">{record.display_name}</th><td className="px-4 py-4 text-muted">{formatDate(record.date_of_birth)}</td><td className="px-4 py-4 text-muted">{formatDate(record.date_of_death)}</td><td className="px-4 py-4"><AdminStatusBadge tone={record.state}>{recordStateLabel(record.state)}</AdminStatusBadge></td><td className="px-4 py-4 text-muted">{new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(record.updated_at))}</td><td className="px-6 py-4 text-right"><Link className="admin-text-link" href={`/admin/deceased/${record.id}`}>View record</Link></td></tr>)}</tbody>
              </table>
            </div>
            <div className="divide-y md:hidden">{records.map((record) => <article className="p-5" key={record.id}><div className="flex items-start justify-between gap-3"><h3 className="font-bold leading-snug">{record.display_name}</h3><AdminStatusBadge tone={record.state}>{recordStateLabel(record.state)}</AdminStatusBadge></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted">Born</dt><dd className="mt-1 font-medium">{formatDate(record.date_of_birth)}</dd></div><div><dt className="text-muted">Died</dt><dd className="mt-1 font-medium">{formatDate(record.date_of_death)}</dd></div></dl><Link className="admin-text-link mt-3" href={`/admin/deceased/${record.id}`}>View record</Link></article>)}</div>
          </>
        )}
        {count > 0 ? <AdminPagination label="Deceased records pagination" nextHref={page < totalPages ? pageHref(page + 1, search) : undefined} page={page} previousHref={page > 1 ? pageHref(page - 1, search) : undefined} totalPages={totalPages} /> : null}
      </section>
    </div>
  );
}
