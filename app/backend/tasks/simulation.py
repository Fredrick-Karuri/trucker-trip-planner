
"""
Celery tasks.

All simulation work runs here — never on the API thread.
The API enqueues a task and returns 202 immediately; the client polls for completion.
"""

from __future__ import annotations

import logging
from decimal import Decimal

from celery import shared_task
from celery.app.task import Task

from services.types import TripPlanResponse

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=0, name="tasks.simulate_trip") # type: ignore[misc]
def simulate_trip(
    self: Task,
    trip_id: str,
    current_location: str,
    pickup_location: str,
    dropoff_location: str,
    cycle_hours_used: str,
    start_time: str,
) -> TripPlanResponse:

    """
    Orchestrates the full trip simulation pipeline.
 
    Steps:
        1. Fetch HGV route from ORS
        2. Run the HOS Rules Engine
        3. Slice timeline into daily log sheets
        4. Validate every day sums to exactly 24.0 hours
        5. Persist result to Trip.result_json for history replay
        6. Return serialisable result dict
 
    Args:
        trip_id:          UUID of the pre-created Trip row.
        current_location: Human-readable origin address.
        pickup_location:  Human-readable pickup address.
        dropoff_location: Human-readable dropoff address.
        cycle_hours_used: Decimal string — hours consumed in current 8-day cycle.
        start_time:       ISO 8601 UTC departure timestamp.
    """
    from api.models import Trip
    from connectors.open_routes_service import fetch_route
    from services.hos_rules_engine import simulate
    from services.daily_log_generator import build_daily_logs
    from services.serializers import serialise_result

    logger.info(
        "simulate_trip started | task_id=%s | %s → %s → %s | cycle=%.2f",
        self.request.id,
        trip_id,
        current_location,
        pickup_location,
        dropoff_location,
        float(cycle_hours_used),
    )

    route = fetch_route(current_location, pickup_location, dropoff_location)
    timeline = simulate(route, Decimal(cycle_hours_used), start_time)
    daily_logs = build_daily_logs(timeline)
    result = serialise_result(route, timeline, daily_logs)

    # Persist for history replay
    Trip.objects.filter(id=trip_id).update(
        total_miles=result["summary"]["total_miles"],
        total_duration_hrs=result["summary"]["total_duration_hrs"],
        result_json=result,
    )

    logger.info(
        "simulate_trip complete | task=%s trip=%s | days=%d miles=%.1f",
        self.request.id, trip_id,
        len(daily_logs), float(route.total_miles),
    )

    return result