# Trucker Trip Planner

FMCSA-compliant HOS trip simulation engine. Converts raw trip inputs into legally valid driver timelines and ELD log sheets.

## Stack

- **Backend:** Django 4.2 + DRF, Celery, Redis, PostgreSQL
- **Frontend:** React + TypeScript + Vite + Tailwind CSS _(upcoming)_
- **External:** OpenRouteService API (HGV profile)
- **Infra:** Docker Compose → Vercel (frontend) + Railway (backend)

## Quick Start

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env — set SECRET_KEY and ORS_API_KEY at minimum

# 2. Build and start all 4 services
make build
make up

# 3. Run migrations
make migrate

# 4. Verify
curl http://localhost:8000/api/health/
# → {"status": "ok"}
```

## Services

| Service    | Port  | Purpose                              |
|------------|-------|--------------------------------------|
| `api`      | 8000  | Django REST API                      |
| `worker`   | —     | Celery HOS simulation worker         |
| `redis`    | 6379  | Message broker + geocode cache       |
| `postgres` | 5432  | Persistent storage                   |

## Developer Commands

```bash
make up        # Start all services
make down      # Stop all services
make logs      # Tail all logs
make shell     # Django shell inside api container
make migrate   # Run database migrations
make test      # Run pytest suite
make seed      # Seed development data
```

## HOS Rules Reference

| Rule          | Limit                        | Engine Action              |
|---------------|------------------------------|----------------------------|
| 11-Hour       | Max 11h driving/shift        | Inject 10h OFF_DUTY        |
| 14-Hour       | No driving after 14h on-duty | Inject 10h OFF_DUTY        |
| 30-Min Break  | Required after 8h driving    | Inject 30min OFF_DUTY      |
| 10-Hour Rest  | Min 10h consecutive off-duty | Resets 11h + 14h counters  |
| 70-Hour Cycle | Max 70h on-duty / 8 days     | Inject 34h restart         |

Speed constant: **55 mph**. All times in **UTC** internally; local offset applied at render only.

## System Design

See `system_design.pdf` for full architecture, HOS business rules, DB schema, and API contract.