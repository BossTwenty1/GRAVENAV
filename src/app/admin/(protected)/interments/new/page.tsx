import Link from "next/link";

import { createInterment } from "../actions";
import { IntermentForm } from "../interment-form";

export const metadata = { title: "Add interment" };

export default function NewIntermentPage() {
  return (
    <div className="grid gap-4">
      <Link className="admin-text-link w-fit" href="/admin/interments">← Back to interments</Link>
      <section className="admin-panel p-5 sm:p-8">
        <p className="admin-kicker">New interment</p>
        <h1 className="admin-page-title mt-2">Record a burial placement</h1>
        <p className="admin-page-description mt-3">Select existing records only. The form never creates a deceased person or plot as a side effect.</p>
        <div className="mt-8"><IntermentForm action={createInterment} initialValues={{ deceasedPersonId: "", plotId: "", intermentDate: "", intermentType: "", positionSequence: "", permanenceStatus: "", state: "active" }} submitLabel="Add interment" /></div>
      </section>
    </div>
  );
}
