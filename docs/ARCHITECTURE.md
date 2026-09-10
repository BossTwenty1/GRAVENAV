# Architecture planning

## Architecture status

APPROVED DIRECTION — implementation has not started. The core web, data, authentication, storage, mapping, and geolocation choices below are approved. Specific production hosting remains TBD.

The approved stack is Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Supabase PostgreSQL, PostGIS, Supabase Auth, Supabase Storage, Leaflet, React Leaflet, Browser Geolocation API, QGIS where useful, Git, GitHub, and OpenAI Codex. The production hosting provider is not selected.

## Approved technology stack

- **Web framework:** Next.js using the App Router.
- **UI/runtime:** React.
- **Language:** TypeScript.
- **Styling:** Tailwind CSS.
- **Component system:** shadcn/ui.
- **Database:** Supabase PostgreSQL.
- **Spatial database capability:** PostGIS.
- **Authentication:** Supabase Auth.
- **File/photo storage:** Supabase Storage.
- **Interactive mapping:** Leaflet and React Leaflet.
- **Device location:** Browser Geolocation API.
- **Spatial-data preparation:** QGIS when useful for cemetery map/CAD/GIS cleaning, georeferencing, conversion, and import preparation.
- **Version control:** Git and GitHub.
- **Development/implementation assistant:** OpenAI Codex.
- **Deployment/hosting:** controlled by the project team; provider TBD, subject to support for the approved Next.js/Supabase architecture.

## High-level architecture

```text
Browser users (Visitors / Administrators)
        ↓
Next.js web application
(React + TypeScript + Tailwind CSS + shadcn/ui)
        ↓
Supabase Auth + Supabase PostgreSQL/PostGIS + Supabase Storage
        ↓
Leaflet / React Leaflet map interface
        ↓
Browser Geolocation API for visitor-device location
```

## Architectural goals

- Keep the system simple and maintainable.
- Make boundaries and responsibilities clear.
- Minimize unnecessary dependencies and operational complexity.
- Support secure handling of configuration and data.
- Leave room for validated product requirements to guide implementation.

## Major system components

The following components are approved at a high level:

- User-facing client: Next.js, React, TypeScript, Tailwind CSS, and shadcn/ui.
- Data and backend platform: Supabase PostgreSQL with PostGIS.
- Authentication: Supabase Auth.
- Media storage: Supabase Storage.
- Mapping: Leaflet and React Leaflet.
- Visitor location: Browser Geolocation API.
- Spatial-data preparation: QGIS when useful.
- Observability and operational tooling: TBD.

## Frontend considerations

The public experience is mobile-first and the administrator experience is desktop-first but responsive. Use the Next.js App Router with React and TypeScript, Tailwind CSS, and shadcn/ui. Preserve accessibility, loading states, empty states, unauthorized states, network errors, and GPS-related states. Approved Figma/design documentation is the visual source of truth when available; Stitch output is reference material, not automatically production-ready code.

## Backend considerations

Use the approved Next.js/Supabase architecture. Exact API and data-access boundaries are implementation details to be established within that architecture. Do not add another backend framework, database, or authentication system without approval.

## Database and storage considerations

Use Supabase PostgreSQL for application data, PostGIS geometry/geography fields where appropriate, and Supabase Storage for gravesite/headstone photos and related media. The schema must remain adaptable to real Forest Lake records, map/CAD files, and verified coordinates. Retention, backup, and migration operations remain TBD.

## API considerations

The exact API, protocol, versioning, and data-access boundaries are implementation details to be established within the approved Next.js/Supabase architecture. External integrations are not approved beyond the services and browser capabilities described in the Build Brief. Government and church registry integrations are out of scope.

## Authentication and authorization considerations

Use Supabase Auth for secure administrator authentication, protected pages, and session/logout handling. Detailed administrator roles and permission boundaries remain an unresolved product question and must follow the approved client workflow.

## Security considerations

- Keep secrets outside source control.
- Define trust boundaries before implementation.
- Minimize permissions and validate all external input.
- Determine privacy, compliance, audit, and data-retention obligations.
- Select security tooling and review practices after the stack is known.

Detailed threat modeling and security requirements are TBD.

## Performance considerations

Performance targets, expected load, latency objectives, scaling model, and capacity planning are TBD. The application must not overstate phone GPS precision: tree canopy, weather, hardware, satellite availability, and tightly spaced plots can affect accuracy. Exact plot-level guidance must not be promised without verification; row-, block-, or section-level fallback guidance is required when appropriate.

## Maintainability considerations

- Prefer small, cohesive components.
- Document important boundaries and decisions.
- Avoid premature abstraction and unnecessary dependencies.
- Add tests and checks appropriate to the selected stack.

## Deployment considerations

GRAVENAV is online-first. Deployment must support the approved Next.js/Supabase architecture. The specific production provider, domain, DNS, and operational process are TBD. Full offline/PWA operation is not in the current scope; lost or poor connectivity must be handled gracefully. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Observability and logging considerations

Logging format, metrics, tracing, alerting, error tracking, retention, and sensitive-data filtering are TBD.

## Backup and recovery considerations

Backup scope, frequency, retention, restore testing, recovery objectives, and disaster-recovery ownership are TBD.

## Open architecture decisions

- Specific production hosting provider and deployment pipeline.
- Exact administrator role and permission model.
- Final Forest Lake data import/migration process after authoritative data is supplied.
- Exact map-resource and tile configuration within the approved Leaflet direction.
- Observability, backup, recovery, and operational ownership.
- License.

Major decisions should be recorded as ADRs after approval.

## Architecture rules

- Do not reintroduce Laravel, PHP, MySQL, or XAMPP into the main architecture unless the project team explicitly reopens that decision.
- Do not create a second CSS framework, component library, database, or authentication system without approval.
- Do not treat Stitch-generated code as automatically production-ready.
- Use approved Figma/design documentation as the visual source of truth when available.
- Build against clearly labeled mock/test data when Forest Lake data is unavailable, while keeping interfaces and database structures import-ready.
- Do not fabricate client data or workflows.
- Do not freeze package versions in this document; the repository/package manager is authoritative for actual versions.
- Preserve accessibility, security, responsive behavior, and safe GPS error handling.
