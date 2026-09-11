"use server";

import { redirect } from "next/navigation";

import { findApprovedAdministrator } from "@/lib/auth/administrator";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
};

const genericAccessError = "Unable to sign in to the administrator area with those credentials.";

export async function loginAdministrator(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const fieldErrors: LoginState["fieldErrors"] = {};

  if (!email || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (!password) {
    fieldErrors.password = "Enter your password.";
  } else if (password.length > 1024) {
    fieldErrors.password = "The password is too long.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    return { error: genericAccessError };
  }

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    await supabase.auth.signOut();
    return { error: genericAccessError };
  }

  const administrator = await findApprovedAdministrator(supabase, userId);

  if (!administrator) {
    redirect("/admin/forbidden");
  }

  redirect("/admin");
}
