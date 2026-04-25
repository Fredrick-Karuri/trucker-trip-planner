"""
Shared types for the simulation pipeline.

All time values use Decimal(10,2) — never float.
All timestamps are UTC datetimes.
"""

from dataclasses import dataclass, field
from datetime import datetime, date
from decimal import Decimal
from enum import Enum


class DutyStatus(str, Enum):
    OFF_DUTY = "OFF_DUTY"
    SLEEPER_BERTH = "SLEEPER_BERTH"
    DRIVING = "DRIVING"
    ON_DUTY_NOT_DRIVING = "ON_DUTY_NOT_DRIVING"


class EventKind(str, Enum):
    DRIVING = "DRIVING"
    PICKUP = "PICKUP"
    DROPOFF = "DROPOFF"
    FUEL_STOP = "FUEL_STOP"
    REST_BREAK = "REST_BREAK"
    REST_10HR = "REST_10HR"
    RESTART_34HR = "RESTART_34HR"


@dataclass
class TimelineEvent:
    """One atomic duty-status period in the trip simulation output."""

    kind: EventKind
    status: DutyStatus
    start: datetime
    end: datetime
    duration_hrs: Decimal
    location: str = ""
    miles_driven: Decimal = Decimal("0")


@dataclass
class SimulationState:
    """
    Mutable cursor advanced by the HOS rules engine on every event.

    All accumulators are Decimal to prevent floating-point drift across
    multi-day simulations.
    """

    clock: datetime
    drive_hours_today: Decimal = Decimal("0")
    duty_window_start: datetime = field(default_factory=datetime.utcnow)
    cumulative_drive_since_break: Decimal = Decimal("0")
    cycle_hours_used: Decimal = Decimal("0")
    miles_since_fuel: Decimal = Decimal("0")
    total_miles_driven: Decimal = Decimal("0")
    break_taken_after_reset: bool = True


@dataclass
class LogSegment:
    """One duty-status band within a single calendar day, ready for SVG rendering."""

    status: DutyStatus
    start_hhmm: str
    end_hhmm: str
    duration_hrs: Decimal
    location: str = ""


@dataclass
class LogRemark:
    time_hhmm: str
    note: str


@dataclass
class DailyLogTotals:
    off_duty: Decimal = Decimal("0")
    sleeper: Decimal = Decimal("0")
    driving: Decimal = Decimal("0")
    on_duty: Decimal = Decimal("0")

    @property
    def total(self) -> Decimal:
        return self.off_duty + self.sleeper + self.driving + self.on_duty


@dataclass
class DailyLogSheet:
    """Complete data for one FMCSA 24-hour log sheet."""

    date: date
    segments: list[LogSegment] = field(default_factory=list)
    totals: DailyLogTotals = field(default_factory=DailyLogTotals)
    remarks: list[LogRemark] = field(default_factory=list)