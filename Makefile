.PHONY: build up down logs shell test makemigrations migrate

build:
	docker compose build

up:
	docker compose up

down:
	docker compose down

logs:
	docker compose logs -f

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