"""
API views.

POST /api/trip/plan/          — validate input, enqueue Celery task, return 202
GET  /api/trip/status/:id/    — poll Celery result backend
GET  /api/trips/              — paginated trip history (auth required)
GET  /api/trips/:trip_id/     — full stored result for replay (auth required)
"""
from __future__ import annotations

import logging
from typing import cast

from celery import Task
from celery.result import AsyncResult
from django.core.paginator import Paginator
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from api.models import Trip
from api.serializers import TripPlanRequestSerializer, TripSummarySerializer
from tasks.simulation import simulate_trip

logger = logging.getLogger(__name__)

PAGE_SIZE = 20


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def plan_trip(request: Request) -> Response:
    """Validate trip inputs, enqueue the HOS simulation, return 202 + task_id."""
    serializer = TripPlanRequestSerializer(data=request.data)
    if not serializer.is_valid():
        field_errors = [
            {"field": f, "message": msgs[0]}
            for f, msgs in serializer.errors.items()
        ]
        return Response({"field_errors": field_errors}, status=400)

    data = serializer.validated_data

    # Persist a Trip row immediately so history shows pending trips
    trip = Trip.objects.create(
        user=request.user,
        current_location=data["current_location"],
        pickup_location=data["pickup_location"],
        dropoff_location=data["dropoff_location"],
        cycle_hours_used=data["cycle_hours_used"],
        start_time=data["start_time"],
    )

    task = cast(Task, simulate_trip).delay(
        trip_id=str(trip.id),
        current_location=data["current_location"],
        pickup_location=data["pickup_location"],
        dropoff_location=data["dropoff_location"],
        cycle_hours_used=str(data["cycle_hours_used"]),
        start_time=data["start_time"].isoformat(),
    )


    logger.info("Trip plan enqueued | trip=%s task=%s user=%s", trip.id, task.id, request.user)
    return Response({"task_id": task.id, "trip_id": str(trip.id)}, status=202)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def trip_status(request: Request, task_id: str) -> Response:
    """Return current state of a simulation task."""
    result = AsyncResult(task_id)

    if result.state in ("PENDING", "STARTED"):
        return Response({"task_id": task_id, "status": result.state})

    if result.state == "SUCCESS":
        return Response({"task_id": task_id, "status": "SUCCESS", "result": result.get()})

    if result.state == "FAILURE":
        exc = result.result
        from connectors.ors_client import GeocodingError, ORSServiceError, RoutingError
        error_message = str(exc) if exc else "Simulation failed."
        if isinstance(exc, GeocodingError):
            return Response({"task_id": task_id, "status": "FAILURE", "error": error_message}, status=400)
        if isinstance(exc, RoutingError):
            return Response({"task_id": task_id, "status": "FAILURE", "error": error_message}, status=422)
        if isinstance(exc, ORSServiceError):
            return Response({"task_id": task_id, "status": "FAILURE", "error": error_message}, status=503)
        return Response({"task_id": task_id, "status": "FAILURE", "error": error_message}, status=500)

    return Response({"task_id": task_id, "status": result.state})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def trip_history(request: Request) -> Response:
    """Paginated list of the authenticated driver's past trips."""
    trips = Trip.objects.filter(user=request.user, result_json__isnull=False)
    paginator = Paginator(trips, PAGE_SIZE)
    page_num = request.query_params.get("page", 1)
    page = paginator.get_page(page_num)
    return Response({
        "count": paginator.count,
        "total_pages": paginator.num_pages,
        "page": page.number,
        "results": TripSummarySerializer(list(page.object_list), many=True).data
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def trip_detail(request: Request, trip_id: str) -> Response:
    """Return full stored simulation result for replay — no re-simulation."""
    try:
        trip = Trip.objects.get(id=trip_id, user=request.user)
    except Trip.DoesNotExist:
        return Response({"error": "Trip not found."}, status=404)

    if not trip.result_json:
        return Response({"error": "Simulation result not yet available."}, status=404)

    return Response({"trip_id": str(trip.id), **trip.result_json})