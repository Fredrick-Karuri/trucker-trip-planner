"""
Custom DRF exception handler.

Maps the connector's typed exceptions to the correct HTTP status codes
  GeocodingError   → 400 Bad Request
  RoutingError     → 422 Unprocessable Entity
  ORSServiceError  → 503 Service Unavailable
"""
from typing import Any

from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import exception_handler

from connectors.open_routes_service import GeocodingError, ORSServiceError, RoutingError


def custom_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    if isinstance(exc, GeocodingError):
        return Response(
            {"field_errors": [{"field": exc.field, "message": f"Address not found: {exc.address!r}"}]},
            status=400,
        )
    if isinstance(exc, RoutingError):
        return Response({"error": str(exc)}, status=422)
    if isinstance(exc, ORSServiceError):
        return Response({"error": "Routing service temporarily unavailable. Please try again."}, status=503)

    return exception_handler(exc, context)