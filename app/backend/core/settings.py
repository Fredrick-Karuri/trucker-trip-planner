"""
Core Django settings for the Trucker Trip Planner.

All time math uses UTC. Local offsets apply only at render time (per Architecture Rule #3).
"""

import os
from pathlib import Path
import dj_database_url
import environ
from core.logging import configure_logging

configure_logging(level=os.environ.get("LOG_LEVEL", "INFO"))

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    LOG_LEVEL=(str, "INFO"),
)
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG      = env("DJANGO_DEBUG")

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
        default=str(env("DATABASE_URL")),
        conn_max_age=600,
    )
}

# All internal time math is UTC — never override this.
USE_TZ = True
TIME_ZONE = "UTC"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─── Redis ────────────────────────────────────────────────────────────────────
REDIS_URL = env("REDIS_URL")
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
    }
}

# ─── Celery ───────────────────────────────────────────────────────────────────
CELERY_BROKER_URL     = env("CELERY_BROKER_URL")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND")
CELERY_TASK_SERIALIZER   = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT    = ["json"]
CELERY_TIMEZONE          = "UTC"

# ─── CORS ─────────────────────────────────────────────────────────────────────
ALLOWED_HOSTS        = env.list("DJANGO_ALLOWED_HOSTS")
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")

# ─── REST Framework ───────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES":   ["rest_framework.parsers.JSONParser"],
    "EXCEPTION_HANDLER":        "api.exceptions.custom_exception_handler",
}

# ─── OpenRouteService ─────────────────────────────────────────────────────────
ORS_API_KEY                   = env("ORS_API_KEY")
ORS_BASE_URL                  = env("ORS_BASE_URL")
ORS_GEOCODE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days