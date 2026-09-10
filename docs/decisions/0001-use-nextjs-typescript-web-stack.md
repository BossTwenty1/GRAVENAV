# Use the Next.js TypeScript web stack

## Status

Accepted

## Context

GRAVENAV is approved as a responsive web application with a mobile-first public experience and a responsive desktop-first administrator experience. The approved project brief defines a web stack for implementing the visitor and administration flows.

## Decision

Use Next.js with the App Router, React, TypeScript, Tailwind CSS, and shadcn/ui as the core web application stack.

## Consequences

- The application will be implemented as a web application rather than a dedicated native mobile application.
- The selected stack must support responsive public and administrator interfaces.
- Package versions remain a repository/package-manager concern and are not frozen by this ADR.
- Accessibility, security, and responsive behavior remain implementation requirements.

## Alternatives Considered

The approved brief does not select an alternative web framework, language, styling system, or component system. Replacing any approved technology requires explicit project-team approval.
