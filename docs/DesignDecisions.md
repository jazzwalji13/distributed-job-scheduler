# Design Decisions

- MVC is used to keep route handling, domain logic, and persistence concerns separated.
- Prisma is the ORM because it provides type-safe schema management and a strong migration story for PostgreSQL.
- Workers run in a separate process so job throughput can scale independently from the HTTP API.
- Jobs are claimed with database-level locking to reduce duplicate processing.
- Retry behavior is policy-driven so different queues can use fixed, linear, or exponential backoff.
- Dead-letter handling is explicit so permanent failures are never silently dropped.
- Socket.IO is used for live dashboard updates because job state changes are operationally useful in real time.
- A dummy AI summary is included for failure triage without introducing an external dependency.
- A lightweight in-memory rate limiter is attached to the API surface to prevent bursty access patterns from overwhelming the scheduler.
- A database-backed lock table is used to keep the scheduler process leader-aware without introducing another infrastructure dependency.
