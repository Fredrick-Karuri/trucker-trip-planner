# Trucker Trip Planner

FMCSA-compliant HOS simulation engine. Converts raw trip inputs into legally
valid driver timelines and printable ELD log sheets.

## Stack

- **Backend:** Django + DRF, Celery, Redis, PostgreSQL
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **External:** OpenRouteService API (HGV profile)
- **Infra:** Docker Compose → Vercel (frontend) + Railway (backend)

## Quick Start

```bash
cp .env.example .env   # set DJANGO_SECRET_KEY and ORS_API_KEY at minimum
make build
make up
make migrate
curl http://localhost:8000/api/health/  # → {"status": "ok"}
```

See [setup.md](./setup.md) for full environment variables, frontend dev server, and deployment.

## Developer Commands

```bash
make up        # Start all 5 services (api, worker, web, redis, postgres)
make down      # Stop all services
make logs      # Tail all logs
make shell     # Django shell inside api container
make migrate   # Run database migrations
make test      # Run pytest suite
make seed      # Seed development data
```

## Services

| Service    | Port | Purpose                        |
|------------|------|--------------------------------|
| `api`      | 8000 | Django REST API                |
| `worker`   | —    | Celery HOS simulation worker   |
| `web`      | 5173 | React frontend (Vite dev)      |
| `redis`    | 6379 | Message broker + geocode cache |
| `postgres` | 5432 | Persistent storage             |

## API

| Method | Path                    | Description                          |
|--------|-------------------------|--------------------------------------|
| `GET`  | `/api/health/`          | Health check                         |
| `POST` | `/api/trip/plan/`       | Enqueue simulation → `202 {task_id}` |
| `GET`  | `/api/trip/status/:id/` | Poll task → `{status, result?}`      |

Error codes: `400` bad input · `422` no HGV route · `503` ORS unavailable

## HOS Rules Reference

| Rule          | Limit                        | Engine Action           |
|---------------|------------------------------|-------------------------|
| 11-Hour       | Max 11h driving/shift        | Inject 10h OFF_DUTY     |
| 14-Hour       | No driving after 14h on-duty | Inject 10h OFF_DUTY     |
| 30-Min Break  | Required after 8h driving    | Inject 30min OFF_DUTY   |
| 10-Hour Rest  | Min 10h consecutive off-duty | Resets 11h + 14h clocks |
| 70-Hour Cycle | Max 70h on-duty / 8 days     | Inject 34h restart      |

Rule conflict priority: **34-hr restart › 10-hr rest › 30-min break**
Speed constant: **55 mph**. All times **UTC** internally; local offset at render only.

## System Design

See [`system-design.md`](./system-design.md) for full architecture, DB schema, and API contract.