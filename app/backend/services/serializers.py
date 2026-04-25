"""
Result serialiser.

Converts native simulation types (RouteResult, TimelineEvent, DailyLogSheet)
into the plain dict that the Celery task returns and the API view sends as JSON.
Schema matches the TripPlanResponse TypeScript type exactly.
"""

from connectors.ors_client import RouteResult
from services.types import DailyLogSheet, TimelineEvent, EventKind


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
    EventKind.RESTART_34HR: "REST_10HR",   # rendered as a long rest on the map
}


def serialise_result(
    route: RouteResult,
    timeline: list[TimelineEvent],
    daily_logs: list[DailyLogSheet],
) -> dict[str, object]:
    """
    Produce the full TripPlanResponse-shaped dict from simulation outputs.

    All Decimal values are converted to float for JSON serialisation.
    All datetimes are emitted as ISO 8601 strings with Z suffix.
    """
    total_miles = float(route.total_miles)
    total_drive_hrs = sum(
        float(e.duration_hrs) for e in timeline if e.kind == EventKind.DRIVING
    )
    total_hrs = sum(float(e.duration_hrs) for e in timeline)
    eta = timeline[-1].end.strftime("%Y-%m-%dT%H:%M:%SZ") if timeline else ""

    stops = [
        {
            "type": _STOP_TYPE_LABELS[e.kind],
            "location": e.location,
            "arrival": e.start.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "duration_min": round(float(e.duration_hrs) * 60),
        }
        for e in timeline
        if e.kind in _STOP_KINDS
    ]

    logs = [
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