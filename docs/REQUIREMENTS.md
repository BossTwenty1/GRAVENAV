# Requirements

This document organizes the approved [GRAVENAV Project Build Brief](PROJECT_BUILD_BRIEF.md) into implementation-oriented requirements. Items remain TBD only when the brief does not decide them.

## Confirmed Requirements

- The project is named GRAVENAV.
- The repository is a brand-new project with no prior application implementation.
- Phase 0 is limited to establishing the project foundation and planning documentation.
- The technology stack and high-level architecture are approved as defined in the Build Brief.
- No application dependencies were installed during Phase 0 foundation work.
- No secrets, credentials, tokens, or passwords may be stored in the repository.
- The approved stack is Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Supabase PostgreSQL, PostGIS, Supabase Auth, Supabase Storage, Leaflet, React Leaflet, Browser Geolocation API, QGIS where useful, Git, GitHub, and OpenAI Codex.

## Proposed Requirements

No additional product or technical proposals are approved beyond the Build Brief.

## Functional Requirements

The functional requirements in the Build Brief and the sections below are confirmed.

## Non-Functional Requirements

The following expectations are confirmed:

- The project should remain simple, maintainable, and documented.
- Development guidance should support safe, focused changes.
- Secrets must be protected from source control.
- Architecture and deployment choices must remain explicit and reviewable.
- The public experience is mobile-first and the administrator experience is desktop-first while responsive.
- The normal production experience is online-first, with graceful handling of lost or poor connectivity.
- GPS claims must match tested accuracy.
- The defense version should pass production build, type checking, linting, and required tests.

## Constraints

- Do not invent product functionality or requirements.
- Do not reintroduce Laravel, PHP, MySQL, or XAMPP into the main architecture without explicit approval.
- Do not add another CSS framework, component library, database, or authentication system without approval.
- Do not fabricate Forest Lake data, client workflows, coordinates, or occupancy figures.
- Do not commit or push unapproved changes.

## Assumptions

- Git and GitHub are the approved version-control direction.
- `main` is intended to remain stable.
- Mock/test data may be used only when clearly labeled and must never be presented as official Forest Lake data.

## Unresolved Questions

- Which authoritative Forest Lake records, cemetery map/CAD/GIS files, and verified grave coordinates will be supplied, and when?
- Which public deceased-person fields and visibility rules will Forest Lake approve?
- Which exact reports, percentages, or graphs are required by the study/panel?
- What administrator roles and permission boundaries are required?
- What production hosting provider, domain, DNS, and deployment operations will be selected?
- What secret-management, backup/recovery, and observability operations will be used?
- What license will be selected?

## Acceptance Criteria

### Approved implementation

- The requested foundation files exist.
- The approved visitor and administrator flows are connected and demonstrable.
- Search, profiles, map, geolocation, guidance, administration, records, coordinates, photos, dashboard, reports, and sign-out work within the approved scope.
- Required loading, empty, unauthorized, permission, GPS, coordinate, and network failure states are handled.
- Mock/test data is clearly labeled until official Forest Lake data is received and validated.
- GPS claims match tested accuracy.
- The approved architecture is preserved without unapproved substitute technologies.
- Build, type-checking, linting, and required tests pass for the defense version.

## Must-have requirements

- Public deceased-person search by name.
- Search results and a gravesite/deceased-person profile.
- Interactive cemetery map.
- Visitor geolocation with permission and error handling.
- GPS-assisted gravesite guidance/navigation.
- Verified/unverified destination handling and GPS accuracy warnings.
- Secure administrator login and protected administration area.
- Burial/deceased-record management.
- Cemetery, gravesite, plot, and location management required by the approved scope.
- Coordinate storage and verification workflow.
- Headstone/gravesite photo storage and display where available.
- Administrator dashboard and required reports/graphs.
- Responsive public and administrator interfaces.
- Loading, empty, unauthorized, offline/network-error, and other relevant failure states.

## Optional / conditional requirements

- Search by plot number or burial date in addition to name search.
- Plot occupancy/availability management when reliable occupancy data exists.
- More detailed analytics beyond the minimum reports required by the study.
- Audit-log interface if explicitly approved for the final implementation.
- Additional cemetery-map layers if Forest Lake provides useful spatial data.

## Future / out-of-scope requirements

- Dedicated native Android/iOS application.
- Full offline/PWA mode.
- Payment or burial-service payment processing.
- AI recommendations or AI memorial features.
- Social-media memorial features.
- Government civil-registry or church burial-record integration.
- Traffic/road navigation outside the cemetery.
- Biometric authentication.
- Unrelated smart-cemetery features.

## Data requirements

The data model should support administrator references, deceased-person information, burial details, sections, blocks, rows, plots, gravesite identifiers, gravesite relationships, latitude/longitude, PostGIS geometry/geography where appropriate, GPS accuracy, coordinate-verification status, photos and metadata, record visibility/status, timestamps, and occupancy or audit information only when approved and supported by reliable client data.

## GPS/geolocation requirements

- Use the Browser Geolocation API for visitor-device location.
- Handle denied permission, unavailable GPS, weak/poor accuracy, loading, empty, and error states.
- Display GPS accuracy and coordinate-verification information when relevant.
- Do not treat phone GPS as centimeter-accurate or promise exact plot-level precision without verification.
- Fall back to row-, block-, or section-level guidance when exact guidance is not sufficiently reliable.

## Security requirements

- Provide secure administrator authentication and protected pages.
- Treat authentication and authorization separately: a signed-in account requires an explicitly approved, active Administrator profile.
- Support one privileged MVP application role, `administrator`; additional roles remain deferred.
- Do not provide public signup. Administrator accounts are explicitly provisioned.
- Keep anonymous access to protected base application tables denied until a separately designed public data layer is approved.
- Prevent authenticated users from changing role or active authorization fields through normal application access.
- Keep audit history append-only for normal administrator application access.
- Do not grant normal Administrator hard-delete access to core cemetery records, burial history, import provenance, gravesite-photo metadata, or coordinate collection and verification history; use existing lifecycle and supersession fields to preserve traceability.
- Permit hard deletion only for clearly rebuildable application structures where there is an operational need and referential integrity remains enforced.
- Keep secrets, credentials, tokens, and passwords outside the repository.
- Never commit `.env`.
- Validate external input and safely handle record, photo, location, and authentication data.
- Define visibility/publication rules and administrator permissions with Forest Lake approval.

## Responsive-design requirements

- The visitor interface shall be mobile-first.
- The administrator interface shall be desktop-first but responsive for tablet use.
- The defense version shall work on representative mobile and desktop screen sizes.
- Failure and loading states shall remain usable across supported screen sizes.

## Failure/error-state requirements

The application shall safely handle no search results, loading, empty, unauthorized access, denied location permission, unavailable GPS, weak or poor GPS accuracy, unverified destination coordinates, lost or poor network connectivity, and relevant map, database, authentication, photo, and navigation errors.

## Defense-readiness requirements

The defense version must demonstrate connected visitor and administrator flows, not disconnected mockups. It must demonstrate search, map, authentication, database, photo, record management, coordinate verification, dashboard/report, sign-out, and at least one failure state. Official Forest Lake data must be used when received and validated; otherwise demonstrations must use clearly labeled mock/test data.
