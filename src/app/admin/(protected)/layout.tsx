import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin-shell";
import { requireAdministrator } from "@/lib/auth/administrator";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const administrator = await requireAdministrator();

  return <AdminShell displayName={administrator.displayName}>{children}</AdminShell>;
}
