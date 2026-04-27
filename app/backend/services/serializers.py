"""
Result serialiser.

Converts native simulation types (RouteResult, TimelineEvent, DailyLogSheet)
into the plain dict that the Celery task returns and the API view sends as JSON.
Schema matches the TripPlanResponse TypeScript type exactly .


polyline based on cumulative miles at the time of each stop. This enables
BoundsFitter on the frontend to zoom the map to the full route correctly.
"""

from decimal import Decimal

from connectors.open_routes_service import RouteResult
from services.types import DailyLogDict, DailyLogSheet, EventKind, StopDict, TimelineEvent, TripPlanResponse


_STOP_KINDS = {
    EventKind.PICKUP,
    EventKind.DROPOFF,
    EventKind.FUEL_STOP,
    EventKind.REST_BREAK,
    EventKind.REST_10HR,
    EventKind.RESTART_34HR,
}

_STOP_TYPE_LABELS: dict[EventKind, str] = {
    EventKind.PICKUP: "PICKUP",
    EventKind.DROPOFF: "DROPOFF",
    EventKind.FUEL_STOP: "FUEL_STOP",
    EventKind.REST_BREAK: "BREAK_30MIN",
    EventKind.REST_10HR: "REST_10HR",
    EventKind.RESTART_34HR: "REST_10HR",
}


def _interpolate_coord(
    coords: list[list[float]],
    total_route_miles: Decimal,
    target_miles: Decimal,
) -> tuple[float, float] | None:
    """
    Return the [lng, lat] coordinate at `target_miles` along the polyline.

    Uses linear interpolation between consecutive coordinate pairs weighted
    by the fraction of total route miles. Returns None if coords is empty.
    """
    if not coords or total_route_miles <= Decimal("0"):
        return None

    if target_miles <= Decimal("0"):
        return float(coords[0][1]), float(coords[0][0])

    if target_miles >= total_route_miles:
        return float(coords[-1][1]), float(coords[-1][0])

    # Approximate each segment as an equal share of total miles
    n_segments = len(coords) - 1
    if n_segments == 0:
        return float(coords[0][1]), float(coords[0][0])

    fraction = float(target_miles / total_route_miles)
    segment_idx = min(int(fraction * n_segments), n_segments - 1)
    segment_frac = (fraction * n_segments) - segment_idx

    c0 = coords[segment_idx]
    c1 = coords[segment_idx + 1]
    lng = c0[0] + (c1[0] - c0[0]) * segment_frac
    lat = c0[1] + (c1[1] - c0[1]) * segment_frac
    return lat, lng


def serialise_result(
    route: RouteResult,
    timeline: list[TimelineEvent],
    daily_logs: list[DailyLogSheet],
) -> TripPlanResponse:
    """
    Produce the full TripPlanResponse-shaped dict from simulation outputs.

    All Decimal values are converted to float for JSON serialisation.
    All datetimes are emitted as ISO 8601 strings with Z suffix.
    Stop objects include lat/lng so the frontend map can zoom to the route.
    """
    total_miles = float(route.total_miles)
    total_drive_hrs = sum(
        float(e.duration_hrs) for e in timeline if e.kind == EventKind.DRIVING
    )
    total_hrs = sum(float(e.duration_hrs) for e in timeline)
    eta = timeline[-1].end.strftime("%Y-%m-%dT%H:%M:%SZ") if timeline else ""

    all_coords = route.geojson["geometry"]["coordinates"]
    total_miles_dec = route.total_miles

    # Track cumulative miles through the timeline to interpolate stop positions
    cumulative_miles = Decimal("0")
    stops:list[StopDict] = []
    for e in timeline:
        cumulative_miles += e.miles_driven
        if e.kind not in _STOP_KINDS:
            continue

        coord = _interpolate_coord(all_coords, total_miles_dec, cumulative_miles)
        stop: StopDict = {
            "type": _STOP_TYPE_LABELS[e.kind],
            "location": e.location,
            "arrival": e.start.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "duration_min": round(float(e.duration_hrs) * 60),
        }
        if coord is not None:
            stop["lat"] = round(coord[0], 6)
            stop["lng"] = round(coord[1], 6)
        stops.append(stop)

    logs:list[DailyLogDict] = [
        {
            "date": sheet.date.isoformat(),
            "segments": [
                {
                    "status": seg.status.value,
                    "start": seg.start_hhmm,
                    "end": seg.end_hhmm,
                    "duration_hrs": float(seg.duration_hrs),
                    "location": seg.location,
                }
                for seg in sheet.segments
            ],
            "totals": {
                "off_duty": float(sheet.totals.off_duty),
                "sleeper": float(sheet.totals.sleeper),
                "driving": float(sheet.totals.driving),
                "on_duty": float(sheet.totals.on_duty),
            },
            "remarks": [
                {"time": r.time_hhmm, "note": r.note}
                for r in sheet.remarks
            ],
        }
        for sheet in daily_logs
    ]

    return {
        "summary": {
            "total_miles": total_miles,
            "total_duration_hrs": round(total_hrs, 2),
            "total_drive_hrs": round(total_drive_hrs, 2),
            "eta": eta,
        },
        "route": {"geojson": route.geojson},
        "stops": stops,
        "daily_logs": logs,
    }