"""
API app — exposes all HTTP endpoints for the Trucker Trip Planner.
Trip planning routes, health checks, and request validation live here.
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})