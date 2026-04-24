"""
Custom DRF exception handler.

Maps the connector's typed exceptions to the correct HTTP status codes
per the system design error handling spec (p.18):
  GeocodingError   → 400 Bad Request
  RoutingError     → 422 Unprocessable Entity
  ORSServiceError  → 503 Service Unavailable
"""

from typing import Any, Optional
from rest_framework.response import Response
from rest_framework.views import exception_handler

from connectors.ors_client import GeocodingError, ORSServiceError, RoutingError


def custom_exception_handler(exc: Exception, context: dict[str, Any]) -> Optional[Response]:
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