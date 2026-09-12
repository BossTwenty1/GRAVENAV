import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdministratorAuthorization } from "@/lib/auth/administrator";
import { AdminAccessShell } from "@/components/admin-access-shell";

import { LoginForm } from "./login-form";

export const metadata = { title: "Administrator sign in" };

export default async function AdminLoginPage() {
  const authorization = await getAdministratorAuthorization();

  if (authorization.status === "authorized") {
    redirect("/admin");
  }

  if (authorization.status === "forbidden") {
    redirect("/admin/forbidden");
  }

  return (
    <AdminAccessShell description="Use an approved GRAVENAV administrator account. Accounts are provisioned by the project team; public registration is not available." title="Sign in to continue">
        <LoginForm />
        <Link className="admin-text-link mt-5" href="/">
          Return to public site
        </Link>
    </AdminAccessShell>
  );
}
