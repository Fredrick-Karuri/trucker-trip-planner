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

test:
	docker compose exec api python -m pytest tests/

seed:
	docker compose exec api python scripts/seed.py

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
	@echo "  make seed             Seed the database"
	@echo "  make test             Run pytest"
	@echo ""