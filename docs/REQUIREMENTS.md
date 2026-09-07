# Requirements

This document separates confirmed information from proposals, assumptions, and open questions. Items remain TBD until explicitly confirmed.

## Confirmed Requirements

- The project is named GRAVENAV.
- The repository is a brand-new project with no prior application implementation.
- Phase 0 is limited to establishing the project foundation and planning documentation.
- No final technology stack has been approved.
- No application dependencies should be installed during this foundation step.
- No secrets, credentials, tokens, or passwords may be stored in the repository.

## Proposed Requirements

No product or technical proposals have been approved. TBD.

## Functional Requirements

No functional requirements have been confirmed. TBD.

## Non-Functional Requirements

The following repository-level expectations are confirmed for the foundation:

- The project should remain simple, maintainable, and documented.
- Development guidance should support safe, focused changes.
- Secrets must be protected from source control.
- Architecture and deployment choices must remain explicit and reviewable.

Application-level performance, availability, accessibility, compatibility, and scalability requirements are TBD.

## Constraints

- Do not invent product functionality or requirements.
- Do not finalize the technology stack without approval.
- Do not install application dependencies during Phase 0 foundation work.
- Do not commit or push unapproved changes.

## Assumptions

- Git is the source-control system.
- `main` is intended to remain stable.
- Additional project assumptions are TBD and must not be treated as confirmed requirements.

## Unresolved Questions

- What is the product purpose and primary user problem?
- Who are the intended users and stakeholders?
- What are the prioritized use cases and acceptance criteria?
- What platforms and client experiences are required?
- What data must be stored, processed, or integrated?
- What security, privacy, compliance, and retention requirements apply?
- What environments and operational targets are needed?
- What technology stack should be approved?

## Acceptance Criteria

### Phase 0 foundation

- The requested foundation files exist.
- Documentation clearly labels unknown decisions as TBD.
- No application feature code or application dependencies are introduced.
- No secrets or credentials are present.
- `.env` is ignored and `.env.example` remains trackable.
- The repository remains uncommitted and unpushed until explicitly approved.
