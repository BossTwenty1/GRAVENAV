import Link from "next/link";

export const metadata = { title: "Reserved administration section" };

export default function AdminSectionPage() {
  return (
    <div className="admin-panel p-5 sm:p-8">
      <p className="admin-kicker">Planned work</p>
      <h1 className="admin-page-title mt-3">This administration section is reserved</h1>
      <p className="admin-page-description mt-4">
        This authenticated route reserves a future administrator workflow. Deceased record, interment, and plot management are available from the main dashboard.
      </p>
      <Link className="admin-button-primary mt-6" href="/admin">
        Return to dashboard
      </Link>
    </div>
  );
}
