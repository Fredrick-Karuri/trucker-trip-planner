# Setup Guide

## Prerequisites

- Docker + Docker Compose
- Node 20+ (for running frontend outside Docker)
- An [OpenRouteService](https://openrouteservice.org/dev/#/signup) API key

## Environment Variables

```bash
cp .env.example .env
```

| Variable                | Required | Default                 | Description                  |
|-------------------------|----------|-------------------------|------------------------------|
| `DJANGO_SECRET_KEY`     | ✅       | —                       | Django secret key            |
| `ORS_API_KEY`           | ✅       | —                       | OpenRouteService key         |
| `DEBUG`                 | —        | `False`                 | Enable Django debug mode     |
| `DATABASE_URL`          | —        | local postgres          | Postgres connection string   |
| `REDIS_URL`             | —        | `redis://redis:6379/0`  | Redis connection string      |
| `DJANGO_ALLOWED_HOSTS`  | —        | `localhost,127.0.0.1`   | Comma-separated hosts        |
| `CORS_ALLOWED_ORIGINS`  | —        | `http://localhost:5173` | Comma-separated origins      |
| `LOG_LEVEL`             | —        | `INFO`                  | `DEBUG` / `INFO` / `WARNING` |

## Docker (recommended)

```bash
make build     # build api + worker images
make up        # start all 5 services
make migrate   # run database migrations
make seed      # optional: seed dev data
```

Services started:

| Service    | Port | Purpose                        |
|------------|------|--------------------------------|
| `api`      | 8000 | Django REST API                |
| `worker`   | —    | Celery HOS simulation worker   |
| `web`      | 5173 | React frontend (Vite dev)      |
| `redis`    | 6379 | Message broker + geocode cache |
| `postgres` | 5432 | Persistent storage             |

Verify: `curl http://localhost:8000/api/health/` → `{"status": "ok"}`

## Frontend (outside Docker)

```bash
cd app/frontend
cp .env.example .env.local    # set VITE_API_URL=http://localhost:8000
npm install
npm run dev                   # http://localhost:5173
```

## Running Tests

```bash
make test                      # pytest inside api container
cd app/frontend && npm test    # Vitest
```

## DevContainer (VS Code)

Open the repo in VS Code and select **Reopen in Container** when prompted.
The devcontainer builds the backend image, installs frontend deps, and
forwards ports 8000, 5173, 5432, and 6379 automatically.

## Deployment

**Backend — Railway**
1. Create a new project, add Postgres and Redis plugins.
2. Deploy `api` and `worker` as separate services from the same repo.
3. Set all required env vars from the table above.
4. Set `START_COMMAND` to `python manage.py migrate && gunicorn core.wsgi` for api,
   and `celery -A core worker --loglevel=info` for worker.

**Frontend — Vercel**
1. Import the repo, set root directory to `app/frontend`.
2. Set `VITE_API_URL` to your Railway API public URL.