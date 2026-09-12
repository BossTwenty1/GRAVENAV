"use client";

import Link from "next/link";
import { useActionState } from "react";

import { useFocusFirstError } from "@/hooks/use-focus-first-error";
import type { DeceasedFormValues } from "@/lib/deceased/validation";

import type { DeceasedFormState } from "./actions";

type DeceasedAction = (state: DeceasedFormState, formData: FormData) => Promise<DeceasedFormState>;

const initialState: DeceasedFormState = {};

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

export function DeceasedForm({
  action,
  initialValues,
  submitLabel,
  cancelHref = "/admin/deceased",
}: {
  action: DeceasedAction;
  initialValues: DeceasedFormValues;
  submitLabel: string;
  cancelHref?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const values = state.values ?? initialValues;
  const formRef = useFocusFirstError(state.fieldErrors);

  return (
    <form action={formAction} className="grid gap-7" noValidate ref={formRef}>
      <div>
        <label className="block text-sm font-semibold" htmlFor="displayName">
          Full display name <span className="text-red-700">(required)</span>
        </label>
        <p className="mt-1 text-sm text-muted" id="displayName-help">
          Enter the name as it should be respectfully displayed. The system will not split or rewrite it.
        </p>
        <input
          aria-describedby={state.fieldErrors?.displayName ? "displayName-help displayName-error" : "displayName-help"}
          aria-invalid={Boolean(state.fieldErrors?.displayName)}
          autoComplete="off"
          className="admin-control mt-2"
          defaultValue={values.displayName}
          disabled={pending}
          id="displayName"
          maxLength={200}
          name="displayName"
          required
          type="text"
        />
        {state.fieldErrors?.displayName ? <p className="mt-2 text-sm text-red-700" id="displayName-error">{state.fieldErrors.displayName}</p> : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold" htmlFor="birthDate">Date of birth <span className="font-normal text-muted">(optional)</span></label>
          <input
            aria-describedby={state.fieldErrors?.birthDate ? "birthDate-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.birthDate)}
            autoComplete="off"
            className="admin-control mt-2"
            defaultValue={values.birthDate}
            disabled={pending}
            id="birthDate"
            name="birthDate"
            type="date"
          />
          {state.fieldErrors?.birthDate ? <p className="mt-2 text-sm text-red-700" id="birthDate-error">{state.fieldErrors.birthDate}</p> : null}
        </div>
        <div>
          <label className="block text-sm font-semibold" htmlFor="deathDate">Date of death <span className="font-normal text-muted">(optional)</span></label>
          <input
            aria-describedby={state.fieldErrors?.deathDate ? "deathDate-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.deathDate)}
            autoComplete="off"
            className="admin-control mt-2"
            defaultValue={values.deathDate}
            disabled={pending}
            id="deathDate"
            name="deathDate"
            type="date"
          />
          {state.fieldErrors?.deathDate ? <p className="mt-2 text-sm text-red-700" id="deathDate-error">{state.fieldErrors.deathDate}</p> : null}
        </div>
      </div>

      {state.duplicateCandidates?.length ? (
        <section aria-labelledby="duplicate-heading" className="admin-alert-warning" role="alert">
          <h2 className="font-semibold text-amber-950" id="duplicate-heading">Review similar records before saving</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            A matching name is not proof of the same person. Compare the available dates, then review an existing record or continue only if this is a different person.
          </p>
          <ul className="mt-3 grid gap-2">
            {state.duplicateCandidates.map((candidate) => (
              <li className="rounded-lg border border-amber-200 bg-white p-3 text-sm" key={candidate.id}>
                <span className="font-semibold">{candidate.display_name}</span>
                <span className="mt-1 block text-muted">Born {formatDate(candidate.date_of_birth)} · Died {formatDate(candidate.date_of_death)}</span>
                <span className="mt-1 block text-amber-900">{candidate.reason === "matching-date" ? "Name and at least one date match." : "Name matches; dates do not establish identity."}</span>
                <Link className="admin-text-link mt-2" href={`/admin/deceased/${candidate.id}`} rel="noopener noreferrer" target="_blank">Review record</Link>
              </li>
            ))}
          </ul>
          <input name="duplicateConfirmation" type="hidden" value={state.confirmationKey} />
        </section>
      ) : null}

      {state.error ? <p aria-live="polite" className="admin-alert-error" role="alert">{state.error}</p> : null}

      <div className="flex flex-wrap gap-3 border-t pt-5">
        <button className="admin-button-primary" disabled={pending} type="submit">
          {pending ? "Saving…" : state.duplicateCandidates?.length ? "Save as a different person" : submitLabel}
        </button>
        <Link className="admin-button-secondary" href={cancelHref}>Cancel</Link>
      </div>
    </form>
  );
}
