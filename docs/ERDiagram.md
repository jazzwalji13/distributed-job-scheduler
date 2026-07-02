# ER Diagram

## Core Tables

- `User`
- `Organization`
- `OrganizationMember`
- `Project`
- `Queue`
- `RetryPolicy`
- `Job`
- `ScheduledJob`
- `JobExecution`
- `JobLog`
- `Worker`
- `WorkerHeartbeat`
- `DeadLetterQueue`
- `DistributedLock`

## Relationship Summary

- A user can own organizations and belong to many organizations through `OrganizationMember`.
- An organization contains many projects and queues.
- A project contains many queues and jobs.
- A queue contains many jobs and may reference a retry policy.
- A job may have many executions and logs.
- A scheduled job references a job template and a queue.
- A worker records many heartbeats and many job executions.
- A failed terminal job is mirrored into the dead-letter queue.

## Design Goals

- Primary keys are opaque string IDs for portability.
- Foreign keys cascade where tenant data should be removed together.
- Indexes cover queue/job lookup, execution history, and worker liveness checks.
- The schema is normalized enough to keep policy, execution, and log concerns separate.
