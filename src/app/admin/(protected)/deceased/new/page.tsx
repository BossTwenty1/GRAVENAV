import Link from "next/link";

import { createDeceasedRecord } from "../actions";
import { DeceasedForm } from "../deceased-form";

export const metadata = { title: "Add deceased record" };

export default function NewDeceasedPage() {
  return (
    <div className="grid gap-4">
      <Link className="admin-text-link w-fit" href="/admin/deceased">← Back to deceased records</Link>
      <section className="admin-panel p-5 sm:p-8">
        <p className="admin-kicker">New deceased record</p>
        <h1 className="admin-page-title mt-2">Add a deceased person</h1>
        <p className="admin-page-description mt-3">Use only verified information. Optional dates may be left blank and corrected later.</p>
        <div className="mt-8"><DeceasedForm action={createDeceasedRecord} initialValues={{ displayName: "", birthDate: "", deathDate: "" }} submitLabel="Add deceased record" /></div>
      </section>
    </div>
  );
}
