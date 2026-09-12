import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAdministrator } from "@/app/admin/actions";
import { AdminAccessShell } from "@/components/admin-access-shell";
import { getAdministratorAuthorization } from "@/lib/auth/administrator";

export const metadata = { title: "Administrator access denied" };

export default async function AdminForbiddenPage() {
  const authorization = await getAdministratorAuthorization();

  if (authorization.status === "authorized") {
    redirect("/admin");
  }

  return (
    <AdminAccessShell description="This account does not have active administrator access. Contact the project team if you believe this is an error." title="Access denied">
        <p className="admin-alert-neutral mt-7">Protected cemetery records remain unavailable until access is approved and active.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {authorization.status === "forbidden" ? (
            <form action={signOutAdministrator}>
              <button className="admin-button-primary" type="submit">
                Sign out
              </button>
            </form>
          ) : (
            <Link className="admin-button-primary" href="/admin/login">
              Administrator sign in
            </Link>
          )}
          <Link className="admin-button-secondary" href="/">
            Public site
          </Link>
        </div>
    </AdminAccessShell>
  );
}
