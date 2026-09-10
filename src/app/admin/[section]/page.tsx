import Link from "next/link";

export default function AdminSectionPage() {
  return (
    <div className="rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Administrator</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Temporary administration section</h1>
      <p className="mt-4 max-w-2xl leading-7 text-muted">
        This dynamic route temporarily reserves the interments, plots, map, coordinates, and reports sections. Each section can receive a dedicated route when its approved workflow is implemented.
      </p>
      <Link className="mt-6 inline-flex rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90" href="/admin">
        Return to dashboard shell
      </Link>
    </div>
  );
}
