# core/hos_config.py
from decimal import Decimal
from dataclasses import dataclass

# ─── HOS Constants (immutable — never change these values) ───────────────────

@dataclass(frozen=True)
class HOSConfig:
    MAX_DRIVE_HOURS: Decimal = Decimal("11")
    DUTY_WINDOW_HOURS: Decimal = Decimal("14")
    BREAK_TRIGGER_HOURS: Decimal = Decimal("8")
    BREAK_DURATION_MINUTES: Decimal = Decimal("30")
    REST_DURATION_HOURS: Decimal = Decimal("10")
    CYCLE_CAP_HOURS: Decimal = Decimal("70")
    RESTART_DURATION_HOURS: Decimal = Decimal("34")
    SPEED_MPH: Decimal = Decimal("55")
    PICKUP_DURATION_HOURS: Decimal = Decimal("1")
    DROPOFF_DURATION_HOURS: Decimal = Decimal("1")
    FUEL_INTERVAL_MILES: Decimal = Decimal("1000")
    FUEL_STOP_MINUTES: Decimal = Decimal("30")


HOS = HOSConfig()