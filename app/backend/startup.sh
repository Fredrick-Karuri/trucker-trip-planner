#!/bin/bash
set -e

if [ "$SERVICE_TYPE" = "worker" ]; then
  exec celery -A core worker --loglevel=info --concurrency=2
else
  python manage.py migrate --noinput
  exec gunicorn core.wsgi:application --bind 0.0.0.0:${PORT:-8000}
fi