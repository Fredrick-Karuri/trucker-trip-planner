"""
Hours Of Service(HOS) Rules Engine.

Pure function: inputs → List[TimelineEvent]. No side effects, no DB calls,
no network calls.

Rule conflict priority:
    34-hr restart > 10-hr rest > 30-min break

All constants are imported from Django settings — never inlined here.
All time arithmetic is UTC .
All durations are Decimal — never float .
"""

from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import TYPE_CHECKING

from core.config import HOS

from connectors.open_routes_service import RouteResult, RouteLeg
from services.types import DutyStatus, EventKind, SimulationState, TimelineEvent

if TYPE_CHECKING:
    pass

# ─── Internal helpers ─────────────────────────────────────────────────────────

def _decimal_hours(td: timedelta) -> Decimal:
    """Convert a timedelta to Decimal hours, rounded to 4 decimal places."""
    return Decimal(str(td.total_seconds() / 3600)).quantize(
        Decimal("0.0001"), rounding=ROUND_HALF_UP
    )


def _hours_to_timedelta(hours: Decimal) -> timedelta:
    return timedelta(seconds=float(hours) * 3600)


def _event(
    kind: EventKind,
    status: DutyStatus,
    state: SimulationState,
    duration_hrs: Decimal,
    location: str = "",
    miles: Decimal = Decimal("0"),
) -> TimelineEvent:
    start = state.clock
    end = state.clock + _hours_to_timedelta(duration_hrs)
    state.clock = end
    return TimelineEvent(
        kind=kind,
        status=status,
        start=start,
        end=end,
        duration_hrs=duration_hrs,
        location=location,
        miles_driven=miles,
    )


def _needs_34hr_restart(state: SimulationState) -> bool:
    """Cycle cap hit — highest priority rest (Architecture Rule #7)."""
    return state.cycle_hours_used >= HOS.CYCLE_CAP_HOURS


def _needs_10hr_rest(state: SimulationState) -> bool:
    """Shift drive limit or duty window exhausted."""
    duty_elapsed = _decimal_hours(state.clock - state.duty_window_start)
    return (
        state.drive_hours_today >= HOS.MAX_DRIVE_HOURS
        or duty_elapsed >= HOS.DUTY_WINDOW_HOURS
    )


def _needs_30min_break(state: SimulationState) -> bool:
    """8 cumulative driving hours without a 30-min break."""
    return (
        state.cumulative_drive_since_break >= HOS.BREAK_TRIGGER_HOURS
        and not state.break_taken_after_reset
    )


def _inject_34hr_restart(
    state: SimulationState,
    timeline: list[TimelineEvent],
    location: str,
) -> None:
    duration = HOS.RESTART_DURATION_HOURS
    timeline.append(_event(EventKind.RESTART_34HR, DutyStatus.OFF_DUTY, state, duration, location))
    state.drive_hours_today = Decimal("0")
    state.cumulative_drive_since_break = Decimal("0")
    state.cycle_hours_used = Decimal("0")
    state.break_taken_after_reset = True
    state.duty_window_start = state.clock


def _inject_10hr_rest(
    state: SimulationState,
    timeline: list[TimelineEvent],
    location: str,
) -> None:
    duration = HOS.REST_DURATION_HOURS
    timeline.append(_event(EventKind.REST_10HR, DutyStatus.OFF_DUTY, state, duration, location))
    state.drive_hours_today = Decimal("0")
    state.cumulative_drive_since_break = Decimal("0")
    state.break_taken_after_reset = True
    state.duty_window_start = state.clock


def _inject_30min_break(
    state: SimulationState,
    timeline: list[TimelineEvent],
    location: str,
) -> None:
    duration = HOS.BREAK_DURATION_MINUTES / Decimal("60")
    timeline.append(_event(EventKind.REST_BREAK, DutyStatus.OFF_DUTY, state, duration, location))
    state.cumulative_drive_since_break = Decimal("0")
    state.break_taken_after_reset = True


def _inject_fuel_stop(
    state: SimulationState,
    timeline: list[TimelineEvent],
    location: str,
) -> None:
    duration = HOS.FUEL_STOP_MINUTES / Decimal("60")
    on_duty_duration = duration
    timeline.append(
        _event(EventKind.FUEL_STOP, DutyStatus.ON_DUTY_NOT_DRIVING, state, on_duty_duration, location)
    )
    state.miles_since_fuel = Decimal("0")
    # Fuel stop counts against the duty window but not driving clocks
    state.cycle_hours_used += on_duty_duration


def _check_and_inject_required_rest(
    state: SimulationState,
    timeline: list[TimelineEvent],
    location: str,
) -> None:
    """
    Inject the highest-priority required rest period before driving continues.
    Priority order: 34-hr restart > 10-hr rest > 30-min break.
    """
    if _needs_34hr_restart(state):
        _inject_34hr_restart(state, timeline, location)
    elif _needs_10hr_rest(state):
        _inject_10hr_rest(state, timeline, location)
    elif _needs_30min_break(state):
        _inject_30min_break(state, timeline, location)


def _drive_leg(
    leg: RouteLeg,
    state: SimulationState,
    timeline: list[TimelineEvent],
    origin_label: str,
    dest_label: str,
) -> None:
    """
    Advance the driver through a single route leg, inserting all required
    HOS interruptions (rests, breaks, fuel stops) as they come due.

    The leg is sliced into the maximum driveable chunk at each step —
    no chunk ever exceeds the hours remaining before the next required stop.
    """
    miles_remaining = leg.distance_miles
    speed = HOS.SPEED_MPH

    while miles_remaining > Decimal("0"):
        # ── Before each driving chunk, satisfy any pending rest obligations ──
        _check_and_inject_required_rest(state, timeline, origin_label)

        # ── Compute the maximum miles driveable before the next interrupt ──
        hours_to_drive_limit = HOS.MAX_DRIVE_HOURS - state.drive_hours_today
        hours_to_duty_window = HOS.DUTY_WINDOW_HOURS - _decimal_hours(
            state.clock - state.duty_window_start
        )
        hours_to_break = (
            HOS.BREAK_TRIGGER_HOURS - state.cumulative_drive_since_break
            if not state.break_taken_after_reset
            else HOS.BREAK_TRIGGER_HOURS
        )
        hours_to_fuel = (HOS.FUEL_INTERVAL_MILES - state.miles_since_fuel) / speed
        hours_to_cycle_cap = (HOS.CYCLE_CAP_HOURS - state.cycle_hours_used)

        # The minimum of all limits is how long we can drive in this chunk
        max_drive_hours = min(
            hours_to_drive_limit,
            hours_to_duty_window,
            hours_to_break,
            hours_to_fuel,
            hours_to_cycle_cap,
            miles_remaining / speed,
        )

        # Guard against zero or negative — means a rest is immediately required
        if max_drive_hours <= Decimal("0"):
            _check_and_inject_required_rest(state, timeline, origin_label)
            continue

        chunk_hours = max_drive_hours.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
        chunk_miles = (chunk_hours * speed).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        # Don't overshoot the leg
        chunk_miles = min(chunk_miles, miles_remaining)
        chunk_hours = (chunk_miles / speed).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)

        location_label = origin_label if miles_remaining == leg.distance_miles else "en route"

        timeline.append(
            _event(
                EventKind.DRIVING,
                DutyStatus.DRIVING,
                state,
                chunk_hours,
                location_label,
                chunk_miles,
            )
        )

        # Advance all accumulators
        state.drive_hours_today += chunk_hours
        state.cumulative_drive_since_break += chunk_hours
        state.cycle_hours_used += chunk_hours
        state.miles_since_fuel += chunk_miles
        state.total_miles_driven += chunk_miles
        miles_remaining -= chunk_miles
        state.break_taken_after_reset = False

        # Fuel stop triggered mid-leg?
        if state.miles_since_fuel >= HOS.FUEL_INTERVAL_MILES:
            _inject_fuel_stop(state, timeline, "en route")


# ─── Public API ───────────────────────────────────────────────────────────────

def simulate(
    route: RouteResult,
    cycle_hours_used: Decimal,
    start_time_iso: str,
) -> list[TimelineEvent]:
    """
    Run the FMCSA HOS simulation for a two-leg trip.

    This is a pure function: the same inputs always produce the same output.
    No database access, no network calls, no random values.

    Args:
        route:            Geocoded route with two legs (current→pickup, pickup→dropoff).
        cycle_hours_used: Hours already consumed in the driver's 8-day cycle.
        start_time_iso:   ISO 8601 UTC departure time string.

    Returns:
        Ordered list of TimelineEvents covering the complete journey,
        including all required rests, breaks, fuel stops, and duty changes.
        The sequence has zero time gaps between consecutive events.
    """
    start_dt = datetime.fromisoformat(start_time_iso.replace("Z", "+00:00"))
    if start_dt.tzinfo is None:
        start_dt = start_dt.replace(tzinfo=timezone.utc)

    state = SimulationState(
        clock=start_dt,
        duty_window_start=start_dt,
        cycle_hours_used=cycle_hours_used,
        break_taken_after_reset=True,
    )
    timeline: list[TimelineEvent] = []

    # ── Leg 1: Current location → Pickup ──────────────────────────────────────
    _drive_leg(route.leg_to_pickup, state, timeline, "origin", "pickup")

    # ── Pickup: 1 hr ON_DUTY_NOT_DRIVING ──────────────────────────────────────
    pickup_duration = HOS.PICKUP_DURATION_HOURS
    timeline.append(
        _event(EventKind.PICKUP, DutyStatus.ON_DUTY_NOT_DRIVING, state, pickup_duration, "pickup")
    )
    state.cycle_hours_used += pickup_duration

    # ── Leg 2: Pickup → Dropoff ────────────────────────────────────────────────
    _drive_leg(route.leg_to_dropoff, state, timeline, "pickup", "dropoff")

    # ── Dropoff: 1 hr ON_DUTY_NOT_DRIVING ─────────────────────────────────────
    dropoff_duration = HOS.DROPOFF_DURATION_HOURS
    timeline.append(
        _event(EventKind.DROPOFF, DutyStatus.ON_DUTY_NOT_DRIVING, state, dropoff_duration, "dropoff")
    )

    return timeline