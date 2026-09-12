import Link from "next/link";

import { createInterment } from "../actions";
import { IntermentForm } from "../interment-form";

export default function NewIntermentPage() {
  return (
    <div className="grid gap-4">
      <Link className="w-fit font-semibold text-primary underline" href="/admin/interments">← Back to interments</Link>
      <section className="rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">New record</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Add interment</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">Select existing records only. The form never creates a deceased person or plot as a side effect.</p>
        <div className="mt-8"><IntermentForm action={createInterment} initialValues={{ deceasedPersonId: "", plotId: "", intermentDate: "", intermentType: "", positionSequence: "", permanenceStatus: "", state: "active" }} submitLabel="Add interment" /></div>
      </section>
    </div>
  );
}
