import Link from "next/link";
import { notFound } from "next/navigation";

import { getDeceasedRecord } from "@/lib/deceased/data";

import { updateDeceasedRecord } from "../../actions";
import { DeceasedForm } from "../../deceased-form";

export const metadata = { title: "Edit deceased record" };

export default async function EditDeceasedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(id)) notFound();

  const record = await getDeceasedRecord(id);
  if (!record) notFound();
  const action = updateDeceasedRecord.bind(null, record.id);

  return (
    <div className="grid gap-4">
      <Link className="admin-text-link w-fit" href={`/admin/deceased/${record.id}`}>← Back to record</Link>
      <section className="admin-panel p-5 sm:p-8">
        <p className="admin-kicker">Record correction</p>
        <h1 className="admin-page-title mt-2">Edit deceased record</h1>
        <p className="admin-page-description mt-3">Correct this record without changing its identity. Saving creates a concise audit-history event.</p>
        <div className="mt-8"><DeceasedForm action={action} cancelHref={`/admin/deceased/${record.id}`} initialValues={{ displayName: record.display_name ?? "", birthDate: record.date_of_birth ?? "", deathDate: record.date_of_death ?? "" }} submitLabel="Save corrections" /></div>
      </section>
    </div>
  );
}
