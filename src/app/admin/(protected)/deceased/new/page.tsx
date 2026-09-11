import Link from "next/link";

import { createDeceasedRecord } from "../actions";
import { DeceasedForm } from "../deceased-form";

export default function NewDeceasedPage() {
  return (
    <div className="grid gap-4">
      <Link className="w-fit font-semibold text-primary underline" href="/admin/deceased">← Back to deceased records</Link>
      <section className="rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">New record</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Add deceased record</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">Use only verified information. Optional dates may be left blank and can be corrected later.</p>
        <div className="mt-8"><DeceasedForm action={createDeceasedRecord} initialValues={{ displayName: "", birthDate: "", deathDate: "" }} submitLabel="Add deceased record" /></div>
      </section>
    </div>
  );
}
