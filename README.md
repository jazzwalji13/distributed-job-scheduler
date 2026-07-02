# Distributed Job Scheduler

Production-inspired distributed job scheduler with Node.js, Express, PostgreSQL, Prisma, JWT auth, Socket.IO live updates, workers, retries, dead-letter handling, and a React dashboard.

## Layout

- `backend/` - API server, scheduler, worker process, Prisma schema, and tests
- `frontend/` - React dashboard with charts, auth screens, and resource views
- `docs/` - architecture, ER diagram, API, design decisions, and setup notes

## Quick Start

1. Copy `backend/.env.example` to `backend/.env` and fill in your PostgreSQL and JWT values.
2. Install dependencies with `npm install`.
3. Generate and migrate the Prisma schema from `backend/`.
4. Start the API, scheduler, worker, and frontend in separate terminals.

## Scripts

- `npm run dev:backend`
- `npm run dev:worker`
- `npm run dev:scheduler`
- `npm run dev:frontend`
- `npm run test:backend`

## Documentation

- [Architecture](docs/Architecture.md)
- [ER Diagram](docs/ERDiagram.md)
- [API](docs/API.md)
- [Design Decisions](docs/DesignDecisions.md)
- [Setup](docs/Setup.md)
