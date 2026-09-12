"use client";

import { useActionState } from "react";

import { useFocusFirstError } from "@/hooks/use-focus-first-error";

import { loginAdministrator, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAdministrator, initialState);
  const formRef = useFocusFirstError(state.fieldErrors);

  return (
    <form action={formAction} className="mt-8 grid gap-5" noValidate ref={formRef}>
      <div>
        <label className="block text-sm font-semibold" htmlFor="email">
          Email address
        </label>
        <input
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoComplete="username"
          className="admin-control mt-2"
          disabled={pending}
          id="email"
          maxLength={254}
          name="email"
          required
          spellCheck={false}
          type="email"
        />
        {state.fieldErrors?.email ? (
          <p className="mt-2 text-sm text-red-700" id="email-error">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-semibold" htmlFor="password">
          Password
        </label>
        <input
          aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
          aria-invalid={Boolean(state.fieldErrors?.password)}
          autoComplete="current-password"
          className="admin-control mt-2"
          disabled={pending}
          id="password"
          name="password"
          required
          type="password"
        />
        {state.fieldErrors?.password ? (
          <p className="mt-2 text-sm text-red-700" id="password-error">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      {state.error ? (
        <p aria-live="polite" className="admin-alert-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        className="admin-button-primary w-full"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
