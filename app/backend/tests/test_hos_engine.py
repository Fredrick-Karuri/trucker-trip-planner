"""
Unit tests for the HOS Rules Engine.

Three gold-standard scenarios plus property-based tests (Hypothesis).
Every test asserts: total_off + total_on + total_drive == Decimal('24.00') per day.
ORS is never called — all routes use the make_route fixture.
"""

from decimal import Decimal

from hypothesis import given, settings as h_settings
from hypothesis import strategies as st
import pytest

from services.daily_log_generator import build_daily_logs
from tests.conftest import make_route, START_TIME
from services.hos_rules_engine import simulate
from services.types import DailyLogSheet, DutyStatus, EventKind, TimelineEvent


# ─── Helpers ──────────────────────────────────────────────────────────────────

def assert_24h_invariant(daily_logs: list[DailyLogSheet]) -> None:
    """Core invariant: every day's totals must equal exactly 24.00 hours."""
    for log in daily_logs:
        total = (
            log.totals.off_duty
            + log.totals.sleeper
            + log.totals.driving
            + log.totals.on_duty
        )
        assert total == Decimal("24.00"), (
            f"Day {log.date}: totals sum to {total}, expected 24.00. "
            f"off={log.totals.off_duty} slp={log.totals.sleeper} "
            f"drv={log.totals.driving} on={log.totals.on_duty}"
        )


def events_of_kind(timeline: list[TimelineEvent], kind: EventKind) -> list[TimelineEvent]:
    return [e for e in timeline if e.kind == kind]


def total_drive_hours(timeline: list[TimelineEvent]) -> Decimal:
    result: Decimal = Decimal("0")
    for e in timeline:
        if e.kind == EventKind.DRIVING:
            result += e.duration_hrs
    return result


# ─── Scenario 1: Short Haul (300 mi total) ────────────────────────────────────

class TestShortHaul:
    """
    300 miles total. At 55 mph that is ~5.45 hrs of driving.
    No 30-min break required (under 8-hr threshold).
    One fuel stop at the pickup (exactly 300 mi from origin, resets counter).
    Pickup and dropoff are both 1-hr ON_DUTY_NOT_DRIVING events.
    """

    timeline: list[TimelineEvent]
    logs: list[DailyLogSheet]

    def setup_method(self) -> None:
        route = make_route(pickup_miles=300, dropoff_miles=0)
        self.timeline = simulate(route, Decimal("0"), START_TIME)
        self.logs = build_daily_logs(self.timeline)

    def test_24h_invariant(self) -> None:
        assert_24h_invariant(self.logs)

    def test_no_mandatory_rest_injected(self) -> None:
        rest_events = events_of_kind(self.timeline, EventKind.REST_10HR)
        assert len(rest_events) == 0, "Short haul should not trigger a 10-hr rest"

    def test_no_break_injected(self) -> None:
        breaks = events_of_kind(self.timeline, EventKind.REST_BREAK)
        assert len(breaks) == 0, "Under 8 hrs driving — no 30-min break required"

    def test_no_fuel_stop_under_1000_miles(self)->None:
        fuel = events_of_kind(self.timeline, EventKind.FUEL_STOP)
        assert len(fuel) == 0, "300-mile trip does not cross the 1,000-mile fuel threshold"

    def test_fuel_stop_is_on_duty_not_driving(self) -> None:
        for e in events_of_kind(self.timeline, EventKind.FUEL_STOP):
            assert e.status == DutyStatus.ON_DUTY_NOT_DRIVING

    def test_pickup_and_dropoff_present(self) -> None:
        assert len(events_of_kind(self.timeline, EventKind.PICKUP)) == 1
        assert len(events_of_kind(self.timeline, EventKind.DROPOFF)) == 1

    def test_drive_hours_under_11(self) -> None:
        assert total_drive_hours(self.timeline) <= Decimal("11")

    def test_timeline_has_no_gaps(self) -> None:
        for i in range(1, len(self.timeline)):
            assert self.timeline[i].start == self.timeline[i - 1].end, (
                f"Gap between event {i-1} and {i}"
            )


# ─── Scenario 2: OTR (1,100 + 900 = 2,000 mi) ────────────────────────────────

class TestOTR:
    """
    2,000 miles total. At 55 mph: ~36 hrs driving.
    Requires multiple 10-hr rests, at least one 30-min break,
    and at least 2 fuel stops.
    """

    timeline: list[TimelineEvent]
    logs: list[DailyLogSheet]

    def setup_method(self) -> None:
        route = make_route(pickup_miles=1100, dropoff_miles=900)
        self.timeline = simulate(route, Decimal("0"), START_TIME)
        self.logs = build_daily_logs(self.timeline)

    def test_24h_invariant(self) -> None:
        assert_24h_invariant(self.logs)

    def test_multiple_10hr_rests(self) -> None:
        rests = events_of_kind(self.timeline, EventKind.REST_10HR)
        assert len(rests) >= 2, f"Expected ≥2 rests for 2,000-mi trip, got {len(rests)}"

    def test_30min_break_injected(self) -> None:
        breaks = events_of_kind(self.timeline, EventKind.REST_BREAK)
        assert len(breaks) >= 1, "30-min break must be injected after 8 hrs driving"

    def test_at_least_two_fuel_stops(self) -> None:
        fuel = events_of_kind(self.timeline, EventKind.FUEL_STOP)
        assert len(fuel) >= 2, f"Expected ≥2 fuel stops for 2,000 mi, got {len(fuel)}"

    def test_no_single_drive_chunk_exceeds_11hrs(self) -> None:
        for e in events_of_kind(self.timeline, EventKind.DRIVING):
            assert e.duration_hrs <= Decimal("11"), (
                f"Single driving event of {e.duration_hrs} hrs exceeds the 11-hr limit"
            )

    def test_multiple_log_days_generated(self) -> None:
        assert len(self.logs) >= 2, "A 2,000-mi trip must span multiple log days"

    def test_timeline_has_no_gaps(self) -> None:
        for i in range(1, len(self.timeline)):
            assert self.timeline[i].start == self.timeline[i - 1].end

    def test_pickup_and_dropoff_present(self) -> None:
        assert len(events_of_kind(self.timeline, EventKind.PICKUP)) == 1
        assert len(events_of_kind(self.timeline, EventKind.DROPOFF)) == 1


# ─── Scenario 3: Cycle Reset (70 hrs used) ────────────────────────────────────

class TestCycleReset:
    """
    Driver starts with 70 hrs used — the cycle cap is already hit.
    The engine must inject a 34-hr restart BEFORE any driving begins.
    This is the highest priority rule.
    """

    timeline: list[TimelineEvent]
    logs: list[DailyLogSheet]

    def setup_method(self) -> None:
        route = make_route(pickup_miles=100, dropoff_miles=100)
        self.timeline = simulate(route, Decimal("70"), START_TIME)
        self.logs = build_daily_logs(self.timeline)

    def test_24h_invariant(self) -> None:
        assert_24h_invariant(self.logs)

    def test_34hr_restart_is_first_event(self) -> None:
        assert self.timeline[0].kind == EventKind.RESTART_34HR, (
            "When cycle cap is hit, 34-hr restart must be the very first event"
        )

    def test_34hr_restart_duration(self) -> None:
        restart = self.timeline[0]
        assert restart.duration_hrs == Decimal("34"), (
            f"Restart must be exactly 34 hrs, got {restart.duration_hrs}"
        )

    def test_34hr_restart_is_off_duty(self) -> None:
        assert self.timeline[0].status == DutyStatus.OFF_DUTY

    def test_driving_occurs_after_restart(self) -> None:
        restart_end = self.timeline[0].end
        drive_events = events_of_kind(self.timeline, EventKind.DRIVING)
        assert len(drive_events) > 0
        for e in drive_events:
            assert e.start >= restart_end, "No driving may occur before the restart ends"

    def test_cycle_resets_after_restart(self) -> None:
        """After restart, cycle hours should be zero so normal driving proceeds."""
        drive_events = events_of_kind(self.timeline, EventKind.DRIVING)
        total = total_drive_hours(drive_events)  
        assert total > Decimal("0"), "Driver should be able to drive after reset"

    def test_no_immediate_second_restart(self) -> None:
        """200-mi trip should not require a second restart after the first."""
        restarts = events_of_kind(self.timeline, EventKind.RESTART_34HR)
        assert len(restarts) == 1


# ─── regression: short trip OFF_DUTY padding ──────────────────────────
 
class TestShortTripOffDutyPadding:
    """
    Regression: a trip that ends mid-day must pad remaining
    hours as OFF_DUTY, not ON_DUTY_NOT_DRIVING.
 
    292 miles at 55 mph ≈ 5.31 hrs driving.
    Plus 1 hr pickup + 1 hr dropoff = ~7.31 hrs total on-duty activity.
    Remaining ~16.69 hrs of the day MUST be OFF_DUTY per FMCSA 395.8.
    """
 
    def setup_method(self)->None:
        route = make_route(pickup_miles=292, dropoff_miles=0)
        self.timeline = simulate(route, Decimal("0"), START_TIME)
        self.logs = build_daily_logs(self.timeline)
 
    def test_24h_invariant(self)->None:
        assert_24h_invariant(self.logs)
 
    def test_off_duty_hours_dominate(self)->None:
        day = self.logs[0]
        assert day.totals.off_duty >= Decimal("9.00"), (
            f"Short trip must leave ≥9h as OFF_DUTY, got {day.totals.off_duty}"
        )
 
    def test_on_duty_nd_is_only_loading_time(self)->None:
        day = self.logs[0]
        assert day.totals.on_duty <= Decimal("3.00"), (
            f"ON_DUTY_NOT_DRIVING should be ≤3h (pickup+dropoff), got {day.totals.on_duty}"
        )
 
    def test_last_segment_is_off_duty(self)->None:
        last_seg = self.logs[0].segments[-1]
        assert last_seg.status == DutyStatus.OFF_DUTY, (
            f"Last segment must be OFF_DUTY, got {last_seg.status}"
        )


# ─── Property-based tests (Hypothesis) ───────────────────────────────────────
@pytest.mark.property_based
class TestProperties:
    """
    Random inputs must never crash the engine and must always produce
    daily logs that sum to exactly 24.00 hours.
    """

    @given(
        pickup_miles=st.floats(min_value=10, max_value=2500, allow_nan=False, allow_infinity=False),
        dropoff_miles=st.floats(min_value=0, max_value=2500, allow_nan=False, allow_infinity=False),
        cycle_hours=st.floats(min_value=0, max_value=70, allow_nan=False, allow_infinity=False),
    )
    @h_settings(max_examples=80, deadline=5000)
    def test_never_crashes_always_24h(  
        self,
        pickup_miles: float,
        dropoff_miles: float,
        cycle_hours: float,
    ) -> None:
        route = make_route(pickup_miles=pickup_miles, dropoff_miles=dropoff_miles)
        timeline = simulate(route, Decimal(str(round(cycle_hours, 2))), START_TIME)
        logs = build_daily_logs(timeline)

        assert len(logs) >= 1
        assert_24h_invariant(logs)

    @given(
        cycle_hours=st.floats(min_value=0, max_value=70, allow_nan=False, allow_infinity=False),
    )
    @h_settings(max_examples=40, deadline=5000)
    def test_no_timeline_gaps_regardless_of_cycle( 
        self,
        cycle_hours: float,
    ) -> None:
        route = make_route(pickup_miles=500, dropoff_miles=500)
        timeline = simulate(route, Decimal(str(round(cycle_hours, 2))), START_TIME)
        for i in range(1, len(timeline)):
            assert timeline[i].start == timeline[i - 1].end, (
                f"Gap detected at event {i} with cycle_hours={cycle_hours}"
            )