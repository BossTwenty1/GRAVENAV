import Link from "next/link";
import { notFound } from "next/navigation";

import { getDeceasedRecord } from "@/lib/deceased/data";

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export default async function DeceasedDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; updated?: string }> }) {
  const { id } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(id)) notFound();

  const record = await getDeceasedRecord(id);
  if (!record) notFound();
  const status = await searchParams;

  return (
    <div className="grid gap-4">
      <Link className="w-fit font-semibold text-primary underline" href="/admin/deceased">← Back to deceased records</Link>
      {status.created === "1" || status.updated === "1" ? <p aria-live="polite" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-900" role="status">{status.created === "1" ? "Deceased record created successfully." : "Deceased record updated successfully."}</p> : null}
      <section className="rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Deceased record</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{record.display_name}</h1></div>
          <Link className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90" href={`/admin/deceased/${record.id}/edit`}>Edit record</Link>
        </div>
        <dl className="mt-8 grid gap-5 border-t pt-6 sm:grid-cols-2">
          <div><dt className="text-sm font-semibold text-muted">Date of birth</dt><dd className="mt-1 text-lg">{formatDate(record.date_of_birth)}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Date of death</dt><dd className="mt-1 text-lg">{formatDate(record.date_of_death)}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Record state</dt><dd className="mt-1 capitalize">{record.state}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Last updated</dt><dd className="mt-1">{new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeStyle: "short" }).format(new Date(record.updated_at))}</dd></div>
        </dl>
        <p className="mt-8 rounded-lg bg-[#f5f7f3] p-4 text-sm leading-6 text-muted">Historical deceased records cannot be hard-deleted through the Administrator interface.</p>
      </section>
    </div>
  );
}
