# GRAVENAV

## Project status

Approved Phase 0 specification integrated. Application implementation has not started.

GRAVENAV is a responsive GPS-enabled web application for gravesite location and cemetery management customized for Forest Lake Memorial Park in Legazpi City, Albay, Philippines.

It helps visitors search for a deceased person, view the correct gravesite on an interactive cemetery map, use device location, and receive GPS-assisted guidance. It also gives authorized Forest Lake personnel centralized tools for burial records, gravesites, cemetery structure, coordinates, photos, and required reports.

## Project goals

- Provide a mobile-first visitor experience for gravesite discovery and guidance.
- Provide a responsive administration experience for cemetery record management.
- Keep data structures adaptable to authoritative Forest Lake records when supplied.
- Handle GPS accuracy, coordinate verification, permissions, connectivity, and other failure states safely.
- Deliver connected visitor and administrator flows suitable for the final defense.

## Current scope

The approved scope includes public deceased-person search, gravesite profiles, interactive mapping, visitor geolocation, GPS-assisted guidance, secure administration, burial and cemetery record management, coordinate verification, photo storage/display, dashboards, required reports, responsive interfaces, and relevant loading, empty, unauthorized, offline/network-error, and other failure states.

Native mobile apps, full offline/PWA operation, payments, AI memorial features, social-media memorial features, government or church registry integrations, traffic navigation outside the cemetery, biometric authentication, and unrelated smart-cemetery features are outside the current scope.

## Approved technology direction

- Next.js App Router, React, and TypeScript.
- Tailwind CSS and shadcn/ui.
- Supabase PostgreSQL with PostGIS.
- Supabase Auth and Supabase Storage.
- Leaflet and React Leaflet.
- Browser Geolocation API.
- QGIS when useful for spatial-data preparation.
- Git, GitHub, and OpenAI Codex.
- Project-controlled hosting; the specific production provider is TBD.

## Current development phase

Task 1 established the Next.js application foundation. Task 2 adds the local Supabase/PostgreSQL/PostGIS schema foundation, reproducible migrations, deny-by-default RLS posture, and explicitly synthetic development seed data. Public search, authentication, CRUD workflows, map rendering, field GPS capture, and routing remain deferred.

## Repository structure

```text
GRAVENAV/
├── README.md
├── AGENTS.md
├── .gitignore
├── .gitattributes
├── .editorconfig
├── .env.example
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   └── seed.sql
└── docs/
    ├── PROJECT_BUILD_BRIEF.md
    ├── PROJECT_OVERVIEW.md
    ├── REQUIREMENTS.md
    ├── ARCHITECTURE.md
    ├── DEVELOPMENT.md
    ├── DEPLOYMENT.md
    └── decisions/
        ├── README.md
        ├── 0001-use-nextjs-typescript-web-stack.md
        ├── 0002-use-supabase-platform.md
        ├── 0003-use-leaflet-for-cemetery-mapping.md
        └── 0004-use-browser-geolocation-for-visitor-location.md
```

## Prerequisites

- Git.
- Node.js and a compatible package manager; exact versions are TBD.
- A modern browser for visitor and administrator testing.
- QGIS when cemetery map/CAD/GIS preparation is needed.

## Installation and setup

Clone the repository and enter its directory:

```bash
git clone https://github.com/BossTwenty1/GRAVENAV.git
cd GRAVENAV
```

Install the existing application dependencies and use the available checks:

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

For the local database workflow, see [the database model](docs/DATA_MODEL.md). Do not claim or use Forest Lake data until it is officially supplied and validated. Clearly labeled mock/test data may be used during development.

Copy `.env.example` to `.env` only when local configuration is needed. Real secrets belong in `.env` or an approved secret-management system; `.env` must never be committed.

## Development workflow

Read [AGENTS.md](AGENTS.md), [the Project Build Brief](docs/PROJECT_BUILD_BRIEF.md), and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) before making significant changes. Keep `main` stable, use focused branches, preserve accessibility and security, and update documentation when behavior or architecture changes.

## Documentation

- [Project overview](docs/PROJECT_OVERVIEW.md)
- [Requirements](docs/REQUIREMENTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Development workflow](docs/DEVELOPMENT.md)
- [Database data model](docs/DATA_MODEL.md)
- [GPS and navigation foundation](docs/GPS_NAVIGATION.md)
- [Deployment planning](docs/DEPLOYMENT.md)
- [Architecture Decision Records](docs/decisions/README.md)

## Environment and security notes

Never expose secrets, credentials, tokens, passwords, or private configuration. Never fabricate Forest Lake section names, plot numbers, burial records, coordinates, occupancy figures, or client workflows. GPS claims must match tested accuracy, and mock/test data must always be clearly labeled.

## Deployment status

NOT CONFIGURED. GRAVENAV is online-first. Production hosting is controlled by the project team and remains TBD; any selected host must support the approved Next.js/Supabase architecture. Full offline/PWA operation is not in the current scope.

## License status

TBD. No license has been selected or added yet.
