"""
Core Django settings for the Trucker Trip Planner.

All time math uses UTC. Local offsets apply only at render time (per Architecture Rule #3).
"""

import os
from decimal import Decimal
from pathlib import Path

import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-key-replace-in-production")

DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "rest_framework",
    "corsheaders",
    "api",
    "models.apps.ModelsConfig",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "core.urls"

DATABASES = {
    "default": dj_database_url.config(
        default=os.environ.get(
            "DATABASE_URL",
            "postgres://postgres:postgres@postgres:5432/trucker_trip_planner",
        ),
        conn_max_age=600,
    )
}

# All internal time math is UTC — never override this.
USE_TZ = True
TIME_ZONE = "UTC"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─── Redis ────────────────────────────────────────────────────────────────────
REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
    }
}

# ─── Celery ───────────────────────────────────────────────────────────────────
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", REDIS_URL)
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", REDIS_URL)
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TIMEZONE = "UTC"

# ─── CORS ─────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173"
).split(",")

# ─── REST Framework ───────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "EXCEPTION_HANDLER": "api.exceptions.custom_exception_handler",
}

# ─── HOS Constants (immutable — never change these values) ───────────────────
HOS_MAX_DRIVE_HOURS = Decimal("11")
HOS_DUTY_WINDOW_HOURS = Decimal("14")
HOS_BREAK_TRIGGER_HOURS = Decimal("8")
HOS_BREAK_DURATION_MINUTES = Decimal("30")
HOS_REST_DURATION_HOURS = Decimal("10")
HOS_CYCLE_CAP_HOURS = Decimal("70")
HOS_RESTART_DURATION_HOURS = Decimal("34")
HOS_SPEED_MPH = Decimal("55")
HOS_PICKUP_DURATION_HOURS = Decimal("1")
HOS_DROPOFF_DURATION_HOURS = Decimal("1")
HOS_FUEL_INTERVAL_MILES = Decimal("1000")
HOS_FUEL_STOP_MINUTES = Decimal("30")

# ─── OpenRouteService ─────────────────────────────────────────────────────────
ORS_API_KEY = os.environ.get("ORS_API_KEY", "")
ORS_BASE_URL = os.environ.get("ORS_BASE_URL", "https://api.openrouteservice.org")
ORS_GEOCODE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days