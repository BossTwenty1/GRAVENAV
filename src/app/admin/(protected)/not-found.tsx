import Link from "next/link";

export default function AdminNotFound() {
  return (
    <section className="admin-panel p-5 sm:p-8">
      <p className="admin-kicker">Record not found</p>
      <h1 className="admin-page-title mt-3">This administration record is unavailable</h1>
      <p className="admin-page-description mt-4">The link may be incomplete, or the record may no longer be available in this view. No changes were made.</p>
      <Link className="admin-button-primary mt-6" href="/admin">Return to administration</Link>
    </section>
  );
}
