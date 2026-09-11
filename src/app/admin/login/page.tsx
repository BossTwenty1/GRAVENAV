import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdministratorAuthorization } from "@/lib/auth/administrator";

import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  const authorization = await getAdministratorAuthorization();

  if (authorization.status === "authorized") {
    redirect("/admin");
  }

  if (authorization.status === "forbidden") {
    redirect("/admin/forbidden");
  }

  return (
    <div className="min-h-screen bg-[#eef3ee] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-xl rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Administrator</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-4 leading-7 text-muted">
          Use an approved GRAVENAV administrator account. Accounts are provisioned by the project team; public registration is not available.
        </p>
        <LoginForm />
        <Link className="mt-6 inline-flex rounded-lg px-2 py-2 text-sm font-semibold text-primary hover:bg-accent" href="/">
          Return to public site
        </Link>
      </div>
    </div>
  );
}
