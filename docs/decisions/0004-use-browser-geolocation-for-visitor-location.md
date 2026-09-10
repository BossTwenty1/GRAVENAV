# Use the Browser Geolocation API for visitor location

## Status

Accepted

## Context

Visitors need to see their current location and receive GPS-assisted guidance toward a selected gravesite using ordinary smartphones or tablets. GRAVENAV is an online-first web application and does not require dedicated custom hardware or a native mobile application.

## Decision

Use the Browser Geolocation API to request and display visitor-device location in the web application.

## Consequences

- The application must handle permission denial, unavailable GPS, weak or poor accuracy, loading, empty, and error states.
- GPS accuracy and coordinate-verification status must be shown when relevant.
- The system must not claim centimeter-level or unverified plot-level precision.
- When exact plot-level guidance is not sufficiently reliable, the application must fall back to row-, block-, or section-level guidance.

## Alternatives Considered

Dedicated native Android/iOS applications and custom location hardware are outside the current approved scope. Any future change to that scope requires explicit project-team approval.
