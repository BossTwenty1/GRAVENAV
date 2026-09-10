# Use the Supabase platform

## Status

Accepted

## Context

GRAVENAV needs data access for burial and cemetery records, spatial data, administrator authentication, and gravesite/headstone media. The approved project brief specifies a Supabase-based backend platform and requires the schema to remain adaptable to authoritative Forest Lake data when it is received.

## Decision

Use Supabase PostgreSQL with PostGIS for database and spatial capabilities, Supabase Auth for administrator authentication, and Supabase Storage for gravesite/headstone photos and related media.

## Consequences

- Database, spatial, authentication, and media concerns will use the approved Supabase services.
- The data model must support sections, blocks, rows, plots, gravesites, burial records, coordinates, GPS metadata, photos, and approved status fields.
- Real Forest Lake data must replace clearly labeled mock/test data when officially received and validated.
- Production hosting remains a separate TBD decision and must support the approved Next.js/Supabase architecture.

## Alternatives Considered

The approved brief does not select an alternative database, authentication system, or storage platform. Laravel, PHP, MySQL, and XAMPP are not part of the approved main architecture unless the project team explicitly reopens that decision.
