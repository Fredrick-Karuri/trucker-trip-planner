"""Celery application for the Trucker Trip Planner worker."""

import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

app = Celery("trucker_trip_planner")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()