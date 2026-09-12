# Development workflow

This workflow is intentionally simple. Adapt it when the technology stack and team practices are confirmed.

## Repository cloning

```bash
git clone https://github.com/BossTwenty1/GRAVENAV.git
cd GRAVENAV
```

## Local Supabase database

Task 2 tracks the local Supabase configuration and migrations in `supabase/`. The Supabase CLI is included as a project-scoped development dependency; Docker Desktop is still required for the local services. Run:

```bash
npx supabase start
npx supabase db reset
npx supabase db lint --local --level warning
npx supabase test db
```

The reset command recreates only the local database from tracked migrations and runs the explicitly synthetic seed. The pgTAP suite under `supabase/tests/` verifies anonymous denial, authenticated non-administrator denial, allowed administrator operations, protected historical-record DELETE denial, explicit DELETE behavior for rebuildable map/navigation data, privilege-escalation prevention, and audit integrity. Scope database lint to `public` and `private` when reviewing project-owned functions; full-schema lint may report diagnostics from bundled PostGIS extension functions.

Do not link or reset a remote/production project for local validation. See [the database model](DATA_MODEL.md) for the entity and security decisions.

## Local administrator validation

Task 3 does not seed Auth users or commit reusable passwords. For a local runtime test:

1. Start the local Supabase stack and reset the database.
2. Create a temporary user through trusted local Supabase administrative tooling, using a password generated for that one validation run.
3. As the local database owner, explicitly insert a matching `public.user_profiles` row with `application_role = 'administrator'` and `is_active = true`.
4. Put only the local API URL and local publishable key in an untracked `.env.local` file, run the app, and test login and logout.
5. Delete the temporary local user or reset the local database when validation is complete. Never record the password, access token, refresh token, Auth cookie, secret key, or service-role key in source, documentation, or logs.

Authenticated test users without an active Administrator profile must receive the same neutral login failure or access-denied behavior and no protected data. Public signup and anonymous sign-in are disabled in `supabase/config.toml`; production provisioning configuration must be applied separately when a hosted project is approved.

Inspect the repository and current branch before making changes:

```bash
git status
git branch --show-current
git remote -v
```

## Branches

Keep `main` stable. Use a branch for substantial development work and open a pull request before merging.

## Branch naming

Use the following prefixes with a short kebab-case name:

```text
feature/<name>
fix/<name>
docs/<name>
chore/<name>
refactor/<name>
test/<name>
```

## Git status checks

Run `git status` before starting work, before committing, and after completing a change. Review the diff and confirm that no secrets, generated files, or unrelated edits are included.

## Committing

Make small, focused commits after the relevant checks pass. Conventional-style examples:

```text
feat: add ...
fix: correct ...
docs: update ...
chore: configure ...
refactor: improve ...
test: add ...
```

Do not commit `.env`, credentials, tokens, generated files, or machine-specific files.

## Pushing

Push only the intended branch and review the remote and branch name first. Never force-push. Do not push without authorization for the work in question.

## Pull requests

Pull requests should explain the purpose, summarize the changes, identify tests or checks run, call out risks, and link relevant requirements or ADRs. Keep them focused and easy to review.

## Environment variables

Use local `.env` files for sensitive or machine-specific configuration. Keep `.env` uncommitted. Update `.env.example` only with safe comments or non-sensitive placeholders.

## Dependency management

Do not add dependencies without a clear need. Use the package manager selected with the approved technology stack, commit the appropriate lockfile when applicable, and review dependency licenses and security implications.

## Testing

Task 4 adds `npm run test:imports` using Node's built-in test runner with `tsx`, including synthetic XLSX, GRAVENAV-scale row-boundary, archive-size, privacy, duplicate and server-boundary tests. `npm run import:preview -- --adapter ... --file ... --sheet ... --site ... --label ...` is always read-only, prints counts and uses the documented default workbook limits. The CLI cannot disable or raise limits. Trusted server code may use reviewed overrides only up to immutable hard ceilings. See [DATA_IMPORT.md](DATA_IMPORT.md) for exact approved adapters, default/hard limits, persistence and local validation. Raw spreadsheets are ignored by Git and must remain outside the repository.

Run relevant automated tests, linters, formatters, builds, and security checks before declaring work complete. The specific commands will be documented with the approved Next.js/Supabase implementation scaffold.

Task 5A deceased-record validation tests run with `npm run test:deceased`. Task 5B interment validation, pagination, and confirmation tests run with `npm run test:interments`. Database-level mutation, occupancy, capacity, duplicate, audit, authorization, and no-hard-delete assertions are included in `npx supabase test db`.

## Code reviews

Review for correctness, scope, security, maintainability, tests, documentation, and unintended generated or machine-specific files. Resolve review feedback before merging.

## Documentation updates

Update documentation when behavior, setup, architecture, deployment, security, or operating procedures change. Record significant approved architecture decisions as ADRs.

## Working safely with Codex

Give Codex a focused task and require it to inspect existing files first. Review proposed changes and Git status, ask for clarification when requirements are ambiguous, and approve major architectural changes explicitly. Do not allow destructive Git operations or broad deletions without explicit approval.

## Secret protection

Never paste secrets into source files, prompts, issues, logs, or documentation. Rotate a secret immediately if it is exposed.

## Generated files

Keep generated and machine-specific files out of commits unless the project explicitly requires them. Add narrow ignore rules when appropriate rather than hiding legitimate source files.

## Keeping `main` stable

Do not develop directly on `main` for substantial work. Merge only reviewed, tested, and documented changes.
