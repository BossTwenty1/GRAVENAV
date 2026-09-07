# GRAVENAV

## Project status

Phase 0 — project foundation in progress.

GRAVENAV is a brand-new software project. Its product purpose, user experience, feature set, and technology stack have not yet been finalized.

## Project goals

- Establish a clean, maintainable project foundation.
- Document confirmed information separately from proposals and open questions.
- Make future technical and product decisions explicit and reviewable.
- Keep the repository safe to extend without introducing unnecessary dependencies or secrets.

## Current development phase

The project is in Phase 0. This phase establishes repository guidance and planning documentation only. No application features or runtime dependencies have been implemented.

## Repository structure

```text
GRAVENAV/
├── README.md
├── AGENTS.md
├── .gitignore
├── .gitattributes
├── .editorconfig
├── .env.example
└── docs/
    ├── PROJECT_OVERVIEW.md
    ├── REQUIREMENTS.md
    ├── ARCHITECTURE.md
    ├── DEVELOPMENT.md
    ├── DEPLOYMENT.md
    └── decisions/
        └── README.md
```

## Prerequisites

- Git.
- A development runtime and package manager: TBD.
- Any additional services or tools: TBD.

## Installation and setup

Clone the repository and enter its directory:

```bash
git clone https://github.com/BossTwenty1/GRAVENAV.git
cd GRAVENAV
```

Copy `.env.example` to `.env` only when local configuration is needed. Do not add `.env` to Git. Application dependencies and runtime setup are TBD and should not be installed until the technology stack is approved.

## Development workflow

Read [AGENTS.md](AGENTS.md) and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) before making changes. Keep work focused, use branches for substantial changes, run relevant checks, and update documentation when behavior or architecture changes.

## Documentation

- [Project overview](docs/PROJECT_OVERVIEW.md)
- [Requirements](docs/REQUIREMENTS.md)
- [Architecture planning](docs/ARCHITECTURE.md)
- [Development workflow](docs/DEVELOPMENT.md)
- [Deployment planning](docs/DEPLOYMENT.md)
- [Architecture Decision Records](docs/decisions/README.md)

## Environment and security notes

Real secrets, credentials, tokens, passwords, and machine-specific values belong in the uncommitted `.env` file or an approved secret-management system. Use `.env.example` only for comments and non-sensitive placeholders. Never commit `.env` or expose secrets in source code, documentation, logs, or issues.

## Deployment status

NOT CONFIGURED. Hosting, deployment tooling, environments, and production configuration are TBD.

## License status

TBD. No license has been selected or added yet.
