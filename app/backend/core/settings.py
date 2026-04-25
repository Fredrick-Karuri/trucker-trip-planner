"""
Core Django settings for the Trucker Trip Planner.

All time math uses UTC. Local offsets apply only at render time (per Architecture Rule #3).
"""

from decimal import Decimal
import os
from pathlib import Path
import dj_database_url
from core.logging import configure_logging

configure_logging(level=os.environ.get("LOG_LEVEL", "INFO"))

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
DEBUG       = os.environ.get("DJANGO_DEBUG", "False") == "True"


INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "rest_framework",
    "corsheaders",
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "core.urls"

DATABASES = {
    "default": dj_database_url.config(
        default=os.environ["DATABASE_URL"],
        conn_max_age=600,
    )
}

# All internal time math is UTC — never override this.
USE_TZ = True
TIME_ZONE = "UTC"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─── Redis ────────────────────────────────────────────────────────────────────
REDIS_URL            = os.environ["REDIS_URL"]

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
    }
}

# ─── Celery ───────────────────────────────────────────────────────────────────
CELERY_BROKER_URL     = os.environ.get("CELERY_BROKER_URL", REDIS_URL)
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", REDIS_URL)
CELERY_TASK_SERIALIZER   = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT    = ["json"]
CELERY_TIMEZONE          = "UTC"

# ─── CORS ─────────────────────────────────────────────────────────────────────
ALLOWED_HOSTS        = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost").split(",")
CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")


# ─── REST Framework ───────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES":   ["rest_framework.parsers.JSONParser"],
    "EXCEPTION_HANDLER":        "api.exceptions.custom_exception_handler",
}

# ─── OpenRouteService ─────────────────────────────────────────────────────────
ORS_API_KEY          = os.environ["ORS_API_KEY"]
ORS_BASE_URL         = os.environ.get("ORS_BASE_URL", "https://api.openrouteservice.org")
ORS_GEOCODE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days

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