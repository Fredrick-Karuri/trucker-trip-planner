# core/config.py
from decimal import Decimal

# ─── HOS Constants (immutable — never change these values) ───────────────────
HOS_MAX_DRIVE_HOURS = Decimal("11")
HOS_DUTY_WINDOW_HOURS = Decimal("14")
HOS_BREAK_TRIGGER_HOURS = Decimal("8")
HOS_BREAK_DURATION_MINUTES = Decimal("30")
HOS_REST_DURATION_HOURS = Decimal("10")
HOS_CYCLE_CAP_HOURS = Decimal("70")
HOS_RESTART_DURATION_HOURS = Decimal("34")
HOS_SPEED_MPH = Decimal("55")
HOS_PICKUP_DURATION_HOURS = Decimal("1")
HOS_DROPOFF_DURATION_HOURS = Decimal("1")
HOS_FUEL_INTERVAL_MILES = Decimal("1000")
HOS_FUEL_STOP_MINUTES = Decimal("30")