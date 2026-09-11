# GRAVENAV project overview

## Project name

GRAVENAV.

## Current status

Task 1 established the Next.js application foundation. Task 2 established the normalized local Supabase/PostgreSQL/PostGIS schema, migration workflow, synthetic development seed, and deny-by-default database security posture. Task 3 adds Supabase email/password sign-in, explicit active Administrator authorization, protected administrator routes, sign-out, and administrator-only RLS policies. Data-management and public visitor workflows remain deferred.

## Project purpose

GRAVENAV is a responsive GPS-enabled web application for gravesite location and cemetery management customized for Forest Lake Memorial Park in Legazpi City, Albay, Philippines.

The visitor experience helps people search for a deceased person, find the correct gravesite on an interactive cemetery map, use device location, and receive GPS-assisted guidance. The administrative experience gives authorized Forest Lake personnel a centralized system for burial records, gravesites/plots, cemetery sections, coordinates, photos, and required reports.

## Problems addressed

### Visitor problem

Locating a specific grave inside a large memorial park can be confusing and time-consuming when a visitor does not know the cemetery layout, section, block, row, or plot location.

### Administrative problem

Burial, grave, plot, and location records need a more centralized, searchable, and efficient digital management approach instead of relying heavily on manual, fragmented, or difficult-to-search records.

## Primary users

- Cemetery visitors locating a deceased person's gravesite.
- Bereaved family members visiting the memorial park.
- Forest Lake Memorial Park staff maintaining burial and cemetery records.
- Cemetery/system administrators managing records, locations, verification, accounts, and reports.

## Secondary beneficiaries

- Forest Lake Memorial Park management.
- Other memorial parks or cemeteries that may use the study as a reference.
- Future researchers and developers studying similar cemetery-management or gravesite-location systems.

## High-level objectives

- Combine searchable burial records with cemetery spatial data and an interactive map.
- Provide browser/device geolocation and GPS-assisted gravesite guidance with honest accuracy handling.
- Provide secure administration for records, locations, coordinate verification, photos, dashboards, and required reports.
- Keep the data model adaptable to real Forest Lake records, map/CAD files, and verified coordinates when supplied.
- Deliver connected, responsive visitor and administrator flows suitable for final defense.

## Major capabilities

### Visitor capabilities

- Mobile-first responsive navigation.
- Deceased-person search by name.
- Search results and no-result handling.
- Deceased-person/gravesite profile with available approved fields.
- Interactive cemetery map and selected-gravesite focus.
- Visitor location through the Browser Geolocation API.
- Destination display and GPS-assisted guidance.
- GPS accuracy and coordinate-verification information.
- Row-, block-, or section-level fallback guidance when exact plot-level guidance is not reliable.

### Administration capabilities

- Secure administrator authentication and protected pages.
- Dashboard.
- Searchable/filterable burial-record management.
- Deceased-person, burial, cemetery, plot, gravesite, and location management as supported by client data.
- Latitude, longitude, recorded accuracy, and coordinate-verification workflow.
- Gravesite/headstone photo management.
- Occupancy/availability when reliable Forest Lake data exists.
- Required reports, percentages, or graphs using actual available system data.

## Scope

### In scope for Phase 0

- Repository guidance.
- Initial planning and requirements documentation.
- Architecture and deployment planning.
- Basic cross-platform development configuration.

### Future scope

Optional features are conditional on approved requirements, available client data, and schedule. These include plot-number or burial-date search, occupancy management, additional analytics, an audit-log interface, and additional map layers.

## Non-goals

- Dedicated native Android/iOS applications.
- Full offline/PWA mode.
- Payment or burial-service payment processing.
- AI recommendations or AI memorial features.
- Social-media memorial features.
- Government civil-registry or church burial-record integration.
- Traffic/road navigation outside the cemetery.
- Biometric authentication.
- Unrelated smart-cemetery features.
- Dedicated custom hardware.

## Current development phase

Phase 0 specification integration is complete. The next implementation phase is pending project-team approval.

## Final-defense expectations

### Visitor flow

The defense version must demonstrate opening the deployed application, searching for a deceased person, viewing results and the gravesite profile, showing the gravesite on the map, requesting and displaying visitor location, displaying GPS-assisted guidance, showing accuracy/verification information, and demonstrating at least one failure state.

### Administrator flow

The defense version must demonstrate secure sign-in, the protected dashboard, searching/viewing records, adding or editing a record, managing its gravesite/plot and coordinate information, coordinate verification, photo upload/display where supported, required dashboard statistics/reports, sign-out, and protection of administrator pages after sign-out.

The application should work on representative mobile and desktop sizes, use connected flows rather than disconnected mockups, pass production build/type/lint/test checks, and use only clearly labeled mock/test data until official Forest Lake data is received and validated.

## Unresolved product questions

- Which authoritative Forest Lake burial records, cemetery map/CAD/GIS files, and verified grave coordinates will be supplied, and when?
- Which public deceased-person fields and visibility rules will Forest Lake approve?
- Which reports, percentages, or graphs are specifically required by the study/panel?
- What roles and permission boundaries, if any, will be required beyond the approved single Administrator MVP role?
- What production hosting provider, domain, DNS, and operational ownership will be selected?
- What license will be used?
