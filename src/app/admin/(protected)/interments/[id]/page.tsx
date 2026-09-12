import Link from "next/link";
import { notFound } from "next/navigation";

import { getInterment } from "@/lib/interments/data";
import { isUuid } from "@/lib/interments/validation";

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

export default async function IntermentDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; updated?: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const record = await getInterment(id);
  if (!record) notFound();
  const status = await searchParams;
  const location = [record.siteName, record.areaName, record.sectorLabel].filter(Boolean).join(" · ");

  return (
    <div className="grid gap-4">
      <Link className="w-fit font-semibold text-primary underline" href="/admin/interments">← Back to interments</Link>
      {status.created === "1" || status.updated === "1" ? <p aria-live="polite" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-900" role="status">{status.created === "1" ? "Interment created successfully." : "Interment updated successfully."}</p> : null}
      <section className="rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Interment record</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{record.deceasedName}</h1><p className="mt-2 text-muted">{record.plotIdentifier}</p></div><Link className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90" href={`/admin/interments/${record.id}/edit`}>Edit interment</Link></div>
        <dl className="mt-8 grid gap-5 border-t pt-6 sm:grid-cols-2">
          <div><dt className="text-sm font-semibold text-muted">Deceased record</dt><dd className="mt-1 text-lg"><Link className="font-semibold text-primary underline" href={`/admin/deceased/${record.deceasedPersonId}`}>{record.deceasedName}</Link></dd><dd className="mt-1 text-sm text-muted">Born {formatDate(record.deceasedBirthDate)} · Died {formatDate(record.deceasedDeathDate)}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Interment date</dt><dd className="mt-1 text-lg">{formatDate(record.intermentDate)}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Cemetery location</dt><dd className="mt-1 text-lg">{location}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Plot</dt><dd className="mt-1 text-lg">{record.plotIdentifier}</dd><dd className="mt-1 text-sm text-muted">Lot key: {record.lotKey}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Plot occupancy</dt><dd className="mt-1 capitalize">{record.occupancyStatus.replaceAll("_", " ")} ({record.activeIntermentCount} active)</dd><dd className="mt-1 text-sm text-muted">Configured capacity: {record.capacity ?? "not configured"}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Lifecycle state</dt><dd className="mt-1 capitalize">{record.state}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Interment type</dt><dd className="mt-1">{record.intermentType ?? "Not recorded"}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Position sequence</dt><dd className="mt-1">{record.positionSequence ?? "Not recorded"}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Permanence status</dt><dd className="mt-1">{record.permanenceStatus ?? "Not recorded"}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Record timestamps</dt><dd className="mt-1 text-sm">Created {formatTimestamp(record.createdAt)}<br />Updated {formatTimestamp(record.updatedAt)}</dd></div>
        </dl>
        <p className="mt-8 rounded-lg bg-[#f5f7f3] p-4 text-sm leading-6 text-muted">Commercial status remains separate from physical occupancy. Historical interments cannot be hard-deleted through the Administrator interface.</p>
      </section>
    </div>
  );
}
