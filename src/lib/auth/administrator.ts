import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type AdministratorProfile = {
  id: string;
  displayName: string | null;
};

export type AdministratorAuthorization =
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "authorized"; profile: AdministratorProfile };

export async function findApprovedAdministrator(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AdministratorProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, display_name")
    .eq("id", userId)
    .eq("application_role", "administrator")
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return { id: data.id, displayName: data.display_name };
}

export async function getAdministratorAuthorization(): Promise<AdministratorAuthorization> {
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || typeof userId !== "string") {
    return { status: "unauthenticated" };
  }

  const profile = await findApprovedAdministrator(supabase, userId);

  if (!profile) {
    return { status: "forbidden" };
  }

  return { status: "authorized", profile };
}

export async function requireAdministrator() {
  const authorization = await getAdministratorAuthorization();

  if (authorization.status === "unauthenticated") {
    redirect("/admin/login");
  }

  if (authorization.status === "forbidden") {
    redirect("/admin/forbidden");
  }

  return authorization.profile;
}
