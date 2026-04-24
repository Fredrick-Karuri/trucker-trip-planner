"""Root URL configuration for the Trucker Trip Planner."""

from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"status": "ok", "service": "trucker-trip-planner-api"})


urlpatterns = [
    path("api/health/", health),
    path("api/", include("api.urls")),
]