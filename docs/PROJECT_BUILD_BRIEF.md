# GRAVENAV Project Build Brief

> **Source of Truth:** This document defines the currently approved GRAVENAV scope, requirements, architecture, and technical direction. Where older planning documents conflict with this brief, this brief takes precedence unless the project team explicitly approves a change.

## 1. Define GRAVENAV's Purpose

GRAVENAV is a responsive GPS-enabled web application for gravesite location and cemetery management customized for Forest Lake Memorial Park in Legazpi City, Albay, Philippines.

The system has two connected purposes:

- **Visitor purpose:** help cemetery visitors search for a deceased person, view the correct gravesite information on an interactive cemetery map, use their device location, and receive GPS-assisted guidance toward the gravesite.
- **Administrative purpose:** give authorized Forest Lake personnel a centralized digital system for managing burial records, gravesites/plots, cemetery sections, coordinates, photos, and required reports.

GRAVENAV is a web application, not a dedicated native mobile application. The public experience is mobile-first, while the administrator experience is desktop-first but responsive.

## 2. Identify the Users

### Primary users

- Cemetery visitors who need to locate a deceased person's gravesite.
- Bereaved family members visiting the memorial park.
- Forest Lake Memorial Park staff who maintain burial and cemetery records.
- Cemetery/system administrators who manage records, locations, verification, accounts, and reports.

### Secondary beneficiaries

- Forest Lake Memorial Park management.
- Other memorial parks or cemeteries that may use the study as a reference.
- Future researchers and developers studying similar cemetery-management or gravesite-location systems.

## 3. Define the Core Problem GRAVENAV Solves

### Visitor problem

Locating a specific grave inside a large memorial park can be confusing and time-consuming, especially when a visitor does not know the cemetery layout, section, block, row, or plot location.

### Administrative problem

Burial, grave, plot, and location records need a more centralized, searchable, and efficient digital management approach instead of relying heavily on manual, fragmented, or difficult-to-search records.

GRAVENAV solves these problems by combining searchable burial records, cemetery spatial data, an interactive map, browser/device geolocation, GPS-assisted gravesite guidance, and an administrator record-management system.

## 4. List the Required Features

### Public / Visitor Interface

- Mobile-first responsive homepage and visitor navigation.
- Search for a deceased person by name as the primary search method.
- Display search results clearly and handle no-result cases.
- View a gravesite/deceased-person profile.
- Display available information such as name, birth date, death date, burial date, section, block, row, plot, grave/headstone photo, and coordinate-verification status when those fields are available.
- Interactive cemetery map using grave and cemetery spatial data.
- Select/focus the correct gravesite from search results.
- Request the visitor's current location through the Browser Geolocation API.
- Display the visitor position and the gravesite destination on the map.
- Provide GPS-assisted navigation/guidance toward the selected gravesite.
- Show GPS accuracy and coordinate-verification status when relevant.
- Handle denied location permission, unavailable GPS, weak/poor accuracy, unverified destination coordinates, loading states, empty states, and errors safely.
- Fall back to row/block/section-level guidance when exact plot-level guidance is not sufficiently reliable.

### Cemetery Administration Interface

- Secure administrator authentication.
- Protected administrator pages and session/logout handling.
- Administrator dashboard.
- Searchable/filterable burial-record management.
- Add, view, edit, archive/delete as approved, and maintain deceased-person/burial records.
- Manage cemetery sections, blocks, rows, plots, gravesites, and related location information as supported by the client data.
- Manage latitude, longitude, recorded GPS accuracy, and coordinate-verification status.
- Coordinate-verification workflow for gravesite locations.
- Upload and manage gravesite/headstone photographs.
- Display occupancy/availability information when Forest Lake provides reliable data for it.
- Reports, percentages, or graphs required by the approved study/panel, using actual available system data.
- Responsive behavior for desktop and tablet use.

## 5. Separate Must-Have, Optional, and Future Features

### Must-have for the current GRAVENAV

- Public deceased-person search.
- Search results and gravesite profile.
- Interactive cemetery map.
- Visitor geolocation with permission/error handling.
- GPS-assisted gravesite guidance/navigation.
- Verified/unverified destination handling and GPS accuracy warnings.
- Secure administrator login and protected administration area.
- Burial/deceased-record management.
- Cemetery/gravesite/plot/location management needed by the approved scope.
- Coordinate storage and verification workflow.
- Headstone/gravesite photo storage and display where available.
- Administrator dashboard and required reports/graphs.
- Responsive public and administrator interfaces.
- Loading, empty, unauthorized, offline/network-error, and other relevant failure states.

### Optional / conditional features

These may be implemented only when supported by the approved requirements, available client data, and project schedule:

- Search by plot number or burial date in addition to name search.
- Plot occupancy/availability management when reliable occupancy data exists.
- More detailed analytics beyond the minimum reports required for the study.
- Audit-log interface if explicitly approved for the final implementation.
- Additional cemetery-map layers if Forest Lake provides useful spatial data.

### Future / not in the current approved scope

Do not implement these unless the project team explicitly approves a future scope change:

- Dedicated native Android/iOS application.
- Full offline/PWA mode.
- Payment or burial-service payment processing.
- AI recommendations or AI memorial features.
- Social-media memorial features.
- Government civil-registry integration.
- Church burial-record integration.
- Traffic/road navigation outside the cemetery.
- Biometric authentication such as facial recognition or fingerprint login.
- Unrelated smart-cemetery features added only because other cemetery systems have them.

## 6. Define What Data the System Stores

The database should be designed so real Forest Lake data can replace temporary mock/test data without rewriting the application.

### Core data categories

- Administrator/user profile references needed for authorized administration.
- Deceased-person information: name, birth date, death date, and other approved public fields.
- Burial information: burial date and related burial record details.
- Cemetery structure: sections, blocks, rows, plots, and gravesite identifiers as provided by Forest Lake.
- Gravesite/plot relationships linking a deceased person to the correct location.
- Spatial data: latitude, longitude, and PostGIS geometry/geography fields where appropriate.
- GPS metadata: recorded accuracy in meters and coordinate-verification status.
- Gravesite/headstone photos and file metadata.
- Record status and publication/visibility status where required.
- Created/updated timestamps.
- Occupancy/availability data only when supported by reliable client records.
- Audit information only when the approved implementation includes it.

### Important data rule

Forest Lake has not yet supplied all authoritative requirements, cemetery map/CAD files, burial records, or verified grave coordinates. Development may use clearly labeled mock/test data, but mock data must never be presented as actual Forest Lake data. The final database schema must remain adaptable to the real client dataset.

## 7. Define Whether Hardware Is Involved

GRAVENAV does not require dedicated custom hardware.

The system uses ordinary user devices:

- Visitor smartphone or tablet with a modern web browser.
- Device location services/GPS exposed through the Browser Geolocation API.
- Administrator desktop/laptop/tablet with a modern web browser.

No microcontroller, RFID system, QR-scanner hardware, GPS tracker, kiosk hardware, biometric device, or other custom physical system is currently required.

Phone GPS must not be treated as centimeter-accurate. Accuracy can be affected by phone hardware, tree canopy, weather, satellite availability, and tightly spaced cemetery plots. The application must therefore display and handle accuracy and coordinate-verification states instead of pretending every latitude/longitude is exact.

## 8. Define Internet / Offline Requirements

GRAVENAV is currently an online-first web application.

Internet access is required for the normal production experience because the application depends on:

- The deployed Next.js web application.
- Supabase PostgreSQL/PostGIS data access.
- Supabase Auth for administrator authentication.
- Supabase Storage for gravesite/headstone media.
- Online map tiles or other map resources used by the Leaflet implementation.

The Browser Geolocation API may obtain the device's current location independently of some server operations, but the full GRAVENAV search, database, map, authentication, and navigation experience should not be claimed as offline-capable.

### Current offline requirement

- Full offline mode is **not required** for the present capstone scope.
- The application must handle lost/poor connectivity gracefully with clear retry/error states.
- Offline/PWA support may only be considered later as a separately approved future feature.

## 9. Define What Must Be Demonstrable During the Final Defense

The defense version must demonstrate a complete end-to-end visitor flow and administrator flow.

### Visitor demonstration

1. Open the deployed GRAVENAV web application.
2. Search for a deceased person.
3. Display correct search results.
4. Open the selected gravesite profile.
5. Show the gravesite on the cemetery map.
6. Request and display the visitor's current location.
7. Generate/display GPS-assisted guidance or a route toward the gravesite.
8. Show appropriate coordinate-verification/GPS-accuracy information.
9. Demonstrate at least one failure state such as denied geolocation, unavailable GPS, poor accuracy, or no search result.

### Administrator demonstration

1. Sign in through the secure administrator login.
2. Open the protected dashboard.
3. Search/view existing burial records.
4. Add or edit a burial/deceased record.
5. Manage the gravesite/plot and coordinate information connected to that record.
6. Demonstrate coordinate verification.
7. Upload/display a gravesite or headstone photo where supported.
8. Show dashboard statistics/reports required by the study.
9. Sign out and confirm protected pages are no longer accessible without authentication.

### Defense-readiness requirements

- The application should work on representative mobile and desktop screen sizes.
- Search, map, authentication, database, photo, and administration flows must be connected rather than being disconnected mockup screens.
- Loading, empty, error, permission-denied, and network-failure states must be handled.
- The production build, type checking, linting, and required tests should pass.
- Real Forest Lake data should be integrated when officially received and validated.
- If official data is still unavailable for any demonstration item, only clearly labeled mock/test data may be used; the team must not claim mock data is official client data.
- GPS/navigation claims must match actual tested accuracy. Do not promise exact plot-level precision when it has not been verified.

## 10. Choose the Tech Stack and Architecture

The project scope above is fixed first. The technology exists to implement that scope; technology must not redefine the project.

### Design and implementation workflow

Requirements / approved capstone scope → Google Stitch → Figma → OpenAI Codex → production implementation → testing/refinement

### Core runtime stack

- Web framework: Next.js using the App Router.
- UI/runtime: React.
- Programming language: TypeScript.
- Styling: Tailwind CSS.
- Component system: shadcn/ui.
- Database: Supabase PostgreSQL.
- Spatial database capability: PostGIS.
- Authentication: Supabase Auth.
- File/photo storage: Supabase Storage.
- Interactive mapping: Leaflet + React Leaflet.
- Device location: Browser Geolocation API.
- Supporting spatial-data preparation: QGIS when useful for cemetery map/CAD/GIS cleaning, georeferencing, conversion, and import preparation.
- Version control: Git + GitHub.
- Development/implementation assistant: OpenAI Codex.
- Deployment/hosting: controlled by the project team; the specific production host may be selected separately and must support the approved Next.js/Supabase architecture.

### High-level architecture

```text
Browser users (Visitors / Administrators)
        ↓
Next.js web application (React + TypeScript + Tailwind CSS + shadcn/ui)
        ↓
Supabase Auth + Supabase PostgreSQL/PostGIS + Supabase Storage
        ↓
Leaflet / React Leaflet map interface
        ↓
Browser Geolocation API for visitor-device location
```

### Important architecture rules for Codex

- Do not reintroduce Laravel, PHP, MySQL, or XAMPP into the main architecture unless the project team explicitly reopens that decision.
- Do not create a second CSS framework, component library, database, or authentication system without approval.
- Treat Stitch-generated code as visual reference, not automatically production-ready architecture.
- Use the approved Figma/design documentation as the visual source of truth when available.
- Build against mock/test data when Forest Lake data is unavailable, but keep interfaces and database structures import-ready for the real dataset.
- Do not fabricate Forest Lake section names, plot numbers, burial records, coordinates, occupancy figures, or client workflows.
- Do not freeze package-version numbers in this brief. The repository/package manager is the source of truth for actual implementation versions.
- Preserve accessibility, security, responsive behavior, and safe GPS error handling even when matching the approved design.
