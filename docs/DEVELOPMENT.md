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
```

The reset command recreates only the local database from tracked migrations and runs the explicitly synthetic seed. Do not link or reset a remote/production project for this task. See [the database model](DATA_MODEL.md) for the entity and security decisions.

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

Run relevant automated tests, linters, formatters, builds, and security checks before declaring work complete. The specific commands will be documented with the approved Next.js/Supabase implementation scaffold.

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
