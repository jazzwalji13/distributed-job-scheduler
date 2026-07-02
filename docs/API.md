# API

## Authentication

All protected endpoints require a bearer token.

```http
Authorization: Bearer <token>
```

## Auth Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

## Organization Routes

- `GET /api/organizations`
- `POST /api/organizations`
- `PUT /api/organizations/:organizationId`
- `DELETE /api/organizations/:organizationId`
- `POST /api/organizations/:organizationId/members`
- `PATCH /api/organizations/:organizationId/members`
- `DELETE /api/organizations/:organizationId/members`

## Project Routes

- `GET /api/projects`
- `POST /api/projects`
- `PUT /api/projects/:projectId`
- `DELETE /api/projects/:projectId`

## Queue Routes

- `GET /api/queues`
- `POST /api/queues`
- `PUT /api/queues/:queueId`
- `DELETE /api/queues/:queueId`
- `POST /api/queues/:queueId/pause`
- `POST /api/queues/:queueId/resume`
- `GET /api/queues/:queueId/stats`

## Job Routes

- `GET /api/jobs`
- `POST /api/jobs`
- `POST /api/jobs/claim`
- `GET /api/jobs/:jobId`
- `GET /api/jobs/:jobId/logs`
- `POST /api/jobs/:jobId/requeue`

## Worker Routes

- `GET /api/workers`
- `POST /api/workers/register`
- `POST /api/workers/heartbeat`
- `PATCH /api/workers/:workerId/status`

## Dashboard and Logs

- `GET /api/dashboard/metrics?organizationId=...`
- `GET /api/logs`
- `GET /api/dead-letter`
- `POST /api/dead-letter/:jobId/requeue`

## Response Pattern

All responses use a consistent envelope.

```json
{
  "success": true,
  "data": {}
}
```

Validation failures and operational errors return structured error codes and HTTP status values.
