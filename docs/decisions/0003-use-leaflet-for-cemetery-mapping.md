# Use Leaflet for cemetery mapping

## Status

Accepted

## Context

GRAVENAV must display cemetery spatial data, focus a selected gravesite, show a visitor's device position, and support GPS-assisted guidance toward a destination. The approved project brief identifies Leaflet and React Leaflet for the interactive map interface.

## Decision

Use Leaflet with React Leaflet for the interactive cemetery map interface.

## Consequences

- Map behavior will be implemented within the approved React/Next.js web application.
- The map must support cemetery spatial data, selected gravesites, visitor position, destination display, and relevant accuracy or verification states.
- Online map tiles or other map resources are required for the normal production experience.
- Additional map layers are optional and conditional on useful Forest Lake spatial data.

## Alternatives Considered

The approved brief does not select another mapping library or map platform. Any replacement or additional mapping system requires explicit approval.
