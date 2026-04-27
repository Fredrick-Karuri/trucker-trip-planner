.PHONY: build up down logs logs-backend logs-worker logs-frontend shell test makemigrations migrate seed help

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f api

logs-worker:
	docker compose logs -f worker

logs-frontend:
	docker compose logs -f web

shell:
	docker compose exec api python manage.py shell

makemigrations:
	docker compose exec api python manage.py makemigrations

migrate:
	docker compose exec api python manage.py migrate

test-backend:
	docker compose exec api pytest -q

test-frontend:
	docker compose exec web npm test -- --run

test-property:
	docker compose exec api pytest -m property_based --tb=short

test:
	@echo "── Starting services ────────────"
	docker compose up -d
	@echo "── Dropping stale test DB ───────"
	$(MAKE) drop-testdb
	@echo "── Backend ──────────────────────"
	docker compose exec api pytest --tb=short
	@echo "── Frontend ─────────────────────"
	docker compose exec web npm test -- --run

drop-testdb:
	docker compose exec db psql -U postgres -c \
		"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'test_trucker_trip_planner' AND pid <> pg_backend_pid();" 2>/dev/null || true
	docker compose exec db psql -U postgres -c \
		"DROP DATABASE IF EXISTS test_trucker_trip_planner;" 2>/dev/null || true

flush-cache:
	docker compose exec redis redis-cli FLUSHDB

help:
	@echo ""
	@echo "Trucker Trip Planner — available commands:"
	@echo ""
	@echo "  make build            Build all Docker images"
	@echo "  make up               Start all services (detached)"
	@echo "  make down             Stop all services"
	@echo ""
	@echo "  make logs             Tail logs for all services"
	@echo "  make logs-backend     Tail API (Django) logs"
	@echo "  make logs-worker      Tail Celery worker logs"
	@echo "  make logs-frontend    Tail frontend (Vite) logs"
	@echo ""
	@echo "  make shell            Django shell"
	@echo "  make makemigrations   Create new migrations"
	@echo "  make migrate          Apply migrations"
	@echo "  make test             Run pytest"
	@echo "  make test-property    Run property-based (Hypothesis) tests only"
	@echo "  make flush-cache      Flush Redis cache"
	@echo ""