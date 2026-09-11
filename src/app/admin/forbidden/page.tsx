import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAdministrator } from "@/app/admin/actions";
import { getAdministratorAuthorization } from "@/lib/auth/administrator";

export default async function AdminForbiddenPage() {
  const authorization = await getAdministratorAuthorization();

  if (authorization.status === "authorized") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-[#eef3ee] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-xl rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Administrator</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Access denied</h1>
        <p className="mt-4 leading-7 text-muted">
          This account does not have active administrator access. Contact the project team if you believe this is an error.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {authorization.status === "forbidden" ? (
            <form action={signOutAdministrator}>
              <button className="rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90" type="submit">
                Sign out
              </button>
            </form>
          ) : (
            <Link className="rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90" href="/admin/login">
              Administrator sign in
            </Link>
          )}
          <Link className="rounded-lg border px-4 py-3 font-semibold hover:bg-accent" href="/">
            Public site
          </Link>
        </div>
      </div>
    </div>
  );
}
