from django.http import HttpRequest, HttpResponseRedirect, JsonResponse
from django.urls import include, path


def health(_request: HttpRequest) -> JsonResponse:
    return JsonResponse({"status": "ok", "service": "trucker-trip-planner-api"})


urlpatterns = [
    path("", lambda request: HttpResponseRedirect("/api/health/")),
    path("api/health/", health),
    path("api/", include("api.urls")),
]