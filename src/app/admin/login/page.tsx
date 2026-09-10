import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Administrator</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Login foundation</h1>
      <p className="mt-4 leading-7 text-muted">
        Secure administrator authentication will be implemented in a later task using the approved Supabase Auth architecture. This page does not collect or validate credentials.
      </p>
      <Link className="mt-6 inline-flex rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90" href="/admin">
        Return to admin shell
      </Link>
    </div>
  );
}
