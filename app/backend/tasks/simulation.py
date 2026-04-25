
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

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=0, name="tasks.simulate_trip") # type: ignore[misc]
def simulate_trip(
    self: Task,
    current_location: str,
    pickup_location: str,
    dropoff_location: str,
    cycle_hours_used: str,
    start_time: str,
) -> dict[str, object]:

    """
    Orchestrates the full trip simulation pipeline.

    Steps:
        1. Fetch HGV route from ORS (two legs: current→pickup, pickup→dropoff)
        2. Run the HOS Rules Engine over the route legs
        3. Slice the timeline into daily log sheets (midnight-bounded)
        4. Validate every daily log sums to exactly 24.0 hours
        5. Return the complete serialisable result dict
    """
    from connectors.ors_client import fetch_route
    from services.hos_rules_engine import simulate
    from services.daily_log_generator import build_daily_logs
    from services.serializers import serialise_result

    logger.info(
        "simulate_trip started | task_id=%s | %s → %s → %s | cycle=%.2f",
        self.request.id,
        current_location,
        pickup_location,
        dropoff_location,
        float(cycle_hours_used),
    )

    route = fetch_route(current_location, pickup_location, dropoff_location)
    timeline = simulate(route, Decimal(cycle_hours_used), start_time)
    daily_logs = build_daily_logs(timeline)
    result = serialise_result(route, timeline, daily_logs)

    logger.info(
        "simulate_trip complete | task_id=%s | days=%d | miles=%.1f",
        self.request.id,
        len(daily_logs),
        float(route.total_miles),
    )

    return result