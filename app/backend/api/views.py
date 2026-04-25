"""
API views.

POST /api/trip/plan/       — validates input, enqueues Celery task, returns 202
GET  /api/trip/status/:id/ — polls Celery result backend, returns task status

The API thread never runs simulation logic.
"""

from typing import cast

from celery import Task
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework.response import Response
from celery.result import AsyncResult
import logging

from api.serializers import TripPlanRequestSerializer
from tasks.simulation import simulate_trip

logger = logging.getLogger(__name__)


@api_view(["POST"]) 
def plan_trip(request: Request) -> Response:
    """
    Validate trip inputs and enqueue the HOS simulation task.

    Returns 202 Accepted with a task_id the client uses to poll for results.
    """
    serializer = TripPlanRequestSerializer(data=request.data)
    if not serializer.is_valid():
        field_errors = [
            {"field": field, "message": msgs[0]}
            for field, msgs in serializer.errors.items()
        ]
        return Response({"field_errors": field_errors}, status=400)

    data = serializer.validated_data

    task = cast(Task, simulate_trip).delay(
        current_location=data["current_location"],
        pickup_location=data["pickup_location"],
        dropoff_location=data["dropoff_location"],
        cycle_hours_used=str(data["cycle_hours_used"]),
        start_time=data["start_time"].isoformat(),
    )

    logger.info("Trip plan enqueued | task_id=%s", task.id)
    return Response({"task_id": task.id}, status=202)


@api_view(["GET"])
def trip_status(request: Request, task_id: str) -> Response:
    """
    Return the current state of a simulation task.

    Maps Celery states to the client-facing TaskStatusResponse schema.
    On FAILURE, surfaces the error message with the correct HTTP code.
    """
    from connectors.ors_client import GeocodingError, ORSServiceError, RoutingError

    result = AsyncResult(task_id)

    if result.state == "PENDING":
        return Response({"task_id": task_id, "status": "PENDING"})

    if result.state == "STARTED":
        return Response({"task_id": task_id, "status": "STARTED"})

    if result.state == "SUCCESS":
        return Response({"task_id": task_id, "status": "SUCCESS", "result": result.get()})

    if result.state == "FAILURE":
        exc = result.result
        error_message = str(exc) if exc else "Simulation failed."

        if isinstance(exc, GeocodingError):
            return Response({"task_id": task_id, "status": "FAILURE", "error": error_message}, status=400)
        if isinstance(exc, RoutingError):
            return Response({"task_id": task_id, "status": "FAILURE", "error": error_message}, status=422)
        if isinstance(exc, ORSServiceError):
            return Response({"task_id": task_id, "status": "FAILURE", "error": error_message}, status=503)

        return Response({"task_id": task_id, "status": "FAILURE", "error": error_message}, status=500)

    return Response({"task_id": task_id, "status": result.state})