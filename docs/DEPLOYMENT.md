# Deployment planning

## Deployment status

NOT CONFIGURED.

This document is planning documentation only. GRAVENAV is an online-first web application. I intend to control the hosting and deployment of GRAVENAV myself. The specific production hosting provider remains TBD and must support the approved Next.js/Supabase architecture. No provider, infrastructure, or deployment pipeline has been selected.

## Development environment

The approved implementation direction is Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, and Supabase. Exact runtime and package versions are governed by the repository/package manager and will be established when implementation begins. Development configuration must remain separate from production configuration.

## Staging environment

Whether a staging environment is needed, how it will be provisioned, and what data it may contain are TBD.

## Production environment

The production host must support the approved Next.js web application and Supabase PostgreSQL/PostGIS, Auth, and Storage architecture. Provider, region, capacity, access controls, and operational ownership are TBD.

## Online-first and offline behavior

Internet access is required for the normal production experience because GRAVENAV depends on the deployed Next.js application, Supabase services, and online map resources used by Leaflet. Full offline/PWA operation is not required for the current capstone scope and must not be claimed.

The application must handle lost or poor connectivity gracefully with clear retry and error states. Browser geolocation may work independently of some server operations, but the full search, database, map, authentication, and navigation experience is not offline-capable by default.

## Environment variables

Use environment-specific configuration outside the repository. Keep `.env` local and uncommitted, and document only safe placeholders in `.env.example`.

## Secret management

The secret-management solution, access model, rotation process, and audit requirements are TBD. Secrets must not be stored in Git, images, build logs, or documentation.

## Database migration

Database schema, PostGIS data preparation, migration tooling, migration ownership, and rollback procedures must support replacement of mock/test data with authoritative Forest Lake data without rewriting the application. Specific tooling is TBD.

## Database backups

Backup scope, frequency, retention, encryption, restore testing, and recovery objectives are TBD.

## HTTPS

HTTPS is expected for any public production service. Certificate ownership, issuance, renewal, and enforcement are TBD.

## Domain and DNS

Domain names, DNS provider, records, ownership, and change procedures are TBD.

## Logging

Log format, collection, retention, access controls, and sensitive-data filtering are TBD.

## Monitoring

Health checks, metrics, alert thresholds, on-call ownership, and notification channels are TBD.

## Error tracking

Error-tracking tooling, data handling, alerting, and retention are TBD.

## Rollback strategy

Release versioning, rollback triggers, rollback execution, and database rollback safety are TBD.

## Production configuration

Production configuration must be explicit, reviewed, securely stored, and separated from development and staging configuration. It must support the approved Next.js/Supabase architecture. The exact configuration process is TBD.

## Deployment checklist

- Confirm the target environment and approved hosting approach.
- Confirm the production provider supports the approved Next.js/Supabase architecture.
- Confirm required environment variables and secret sources.
- Confirm migrations and backup readiness.
- Run tests, build checks, and security checks.
- Verify HTTPS, domain/DNS, logging, monitoring, and error tracking.
- Record the release version and deployment changes.
- Validate health checks and critical user journeys.
- Confirm rollback steps are available.
