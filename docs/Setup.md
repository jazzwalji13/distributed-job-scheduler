# Setup

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm 9+

## Environment

Copy `backend/.env.example` to `backend/.env` and fill in the values.

## Install

```bash
npm install
```

## Database

```bash
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate
```

## Start Services

```bash
npm run dev:backend
npm run dev:worker
npm run dev:scheduler
npm run dev:frontend
```

## Testing

```bash
npm run test:backend
```

## Notes

- The API server exposes `/health` for liveness checks.
- The worker process should be run on separate machines or containers in production.
- The scheduler process should run as a single active instance unless you add a leader election layer.
