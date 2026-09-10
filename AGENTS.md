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

## GRAVENAV Source of Truth

Before making significant product, architecture, database, mapping, authentication, or feature-scope changes, read [docs/PROJECT_BUILD_BRIEF.md](docs/PROJECT_BUILD_BRIEF.md).

- The Build Brief overrides older conflicting planning notes.
- Do not invent Forest Lake data, including section names, plot numbers, burial records, coordinates, occupancy figures, or client workflows.
- Mock/test data must always be clearly labeled and must never be presented as official Forest Lake data.
- Do not overstate GPS accuracy or promise exact plot-level precision without verification.
- Do not reintroduce rejected or out-of-scope technologies and features without explicit project-team approval.
- Approved Figma/design documentation becomes the visual source of truth when available.
- Stitch output is reference material, not automatically production-ready code.
- Preserve the approved Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Supabase, PostGIS, Leaflet, React Leaflet, and Browser Geolocation direction unless explicitly changed.

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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
