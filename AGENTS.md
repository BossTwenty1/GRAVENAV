# Codex instructions for GRAVENAV

## General rules

- Inspect existing files and repository state before modifying anything.
- Understand the requested task and its scope before coding.
- Make small, focused, maintainable changes.
- Preserve the existing architecture unless explicitly authorized to change it.
- Avoid unnecessary dependencies and configuration.
- Follow repository conventions established by the project.
- Run relevant tests and checks before declaring work complete.
- Update documentation when behavior or architecture changes.
- Never expose secrets, credentials, tokens, passwords, or private configuration.
- Never commit `.env`; use `.env.example` only for non-sensitive placeholders.
- Never force-push.
- Never rewrite Git history without explicit permission.
- Never delete large amounts of project content without approval.
- Never commit generated or machine-specific files.
- Report significant architectural decisions.
- Ask for approval before making major architectural changes.
- Keep `main` stable.
- Use branches for substantial development work.

## Branch naming

Use one of these prefixes, followed by a short kebab-case description:

```text
feature/<name>
fix/<name>
docs/<name>
chore/<name>
refactor/<name>
test/<name>
```

## Working with Codex

Before editing, inspect the relevant files and confirm the requested outcome. Prefer reversible, focused changes. Explain important assumptions, surface unresolved decisions as TBD, and stop for approval when a request would materially change the architecture, data model, deployment model, or security posture.

Do not create `SKILLS.md` unless a real technical need arises that cannot reasonably be handled by this file.
