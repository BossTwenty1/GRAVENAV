import Link from "next/link";
import { notFound } from "next/navigation";

import { getDeceasedRecord } from "@/lib/deceased/data";

import { updateDeceasedRecord } from "../../actions";
import { DeceasedForm } from "../../deceased-form";

export default async function EditDeceasedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(id)) notFound();

  const record = await getDeceasedRecord(id);
  if (!record) notFound();
  const action = updateDeceasedRecord.bind(null, record.id);

  return (
    <div className="grid gap-4">
      <Link className="w-fit font-semibold text-primary underline" href={`/admin/deceased/${record.id}`}>← Back to record</Link>
      <section className="rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Correction</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Edit deceased record</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">Correct this record without changing its identity. Saving creates a concise audit-history event.</p>
        <div className="mt-8"><DeceasedForm action={action} cancelHref={`/admin/deceased/${record.id}`} initialValues={{ displayName: record.display_name ?? "", birthDate: record.date_of_birth ?? "", deathDate: record.date_of_death ?? "" }} submitLabel="Save corrections" /></div>
      </section>
    </div>
  );
}
