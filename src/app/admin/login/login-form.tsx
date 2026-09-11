"use client";

import { useActionState } from "react";

import { loginAdministrator, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAdministrator, initialState);

  return (
    <form action={formAction} className="mt-8 grid gap-5" noValidate>
      <div>
        <label className="block text-sm font-semibold" htmlFor="email">
          Email address
        </label>
        <input
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoComplete="username"
          className="mt-2 w-full rounded-lg border bg-white px-3 py-3 text-base"
          disabled={pending}
          id="email"
          maxLength={254}
          name="email"
          required
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
          className="mt-2 w-full rounded-lg border bg-white px-3 py-3 text-base"
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
        <p aria-live="polite" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
