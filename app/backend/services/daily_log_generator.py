"""
Daily Log Generator.

Slices a flat TimelineEvent list at UTC midnight boundaries to produce
one DailyLogSheet per calendar day. Hard-validates that every day's
totals sum to exactly Decimal('24.00').

Events that span midnight are split: the tail goes to day N, the head to day N+1.
"""

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP

from services.types import DailyLogSheet, DailyLogTotals, DutyStatus, EventKind, LogRemark, LogSegment, TimelineEvent


# ─── Output types ─────────────────────────────────────────────────────────────



# ─── Helpers ──────────────────────────────────────────────────────────────────

def _utc_midnight(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)


def _hhmm(dt: datetime) -> str:
    return dt.strftime("%H:%M")


def _round2(v: Decimal) -> Decimal:
    return v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _add_to_totals(totals: DailyLogTotals, status: DutyStatus, hours: Decimal) -> None:
    if status == DutyStatus.OFF_DUTY:
        totals.off_duty += hours
    elif status == DutyStatus.SLEEPER_BERTH:
        totals.sleeper += hours
    elif status == DutyStatus.DRIVING:
        totals.driving += hours
    elif status == DutyStatus.ON_DUTY_NOT_DRIVING:
        totals.on_duty += hours


_REMARK_LABELS: dict[EventKind, str] = {
    EventKind.PICKUP: "Pickup",
    EventKind.DROPOFF: "Dropoff",
    EventKind.FUEL_STOP: "Fuel stop",
    EventKind.REST_BREAK: "30-min rest break",
    EventKind.REST_10HR: "10-hr off-duty rest",
    EventKind.RESTART_34HR: "34-hr cycle restart",
}


# ─── Core slicing logic ───────────────────────────────────────────────────────

def _slice_event_into_days(
    event: TimelineEvent,
    sheets: dict[date, DailyLogSheet],
) -> None:
    """
    Insert an event into the sheets dict, splitting it at midnight if it
    spans more than one calendar day.
    """
    cursor = event.start
    remaining_hrs = event.duration_hrs

    while remaining_hrs > Decimal("0"):
        day = cursor.date()
        if day not in sheets:
            sheets[day] = DailyLogSheet(date=day)

        next_midnight = _utc_midnight(day + timedelta(days=1))
        hours_to_midnight = Decimal(
            str((next_midnight - cursor).total_seconds() / 3600)
        ).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)

        chunk_hrs = _round2(min(remaining_hrs, hours_to_midnight))
        if chunk_hrs <= Decimal("0"):
            break

        chunk_end = cursor + timedelta(seconds=float(chunk_hrs) * 3600)

        segment = LogSegment(
            status=event.status,
            start_hhmm=_hhmm(cursor),
            end_hhmm=_hhmm(chunk_end),
            duration_hrs=chunk_hrs,
            location=event.location,
        )
        sheets[day].segments.append(segment)
        _add_to_totals(sheets[day].totals, event.status, chunk_hrs)

        # Emit a remark on the first chunk of notable events
        if event.kind in _REMARK_LABELS and cursor == event.start:
            sheets[day].remarks.append(
                LogRemark(
                    time_hhmm=_hhmm(cursor),
                    note=f"{_REMARK_LABELS[event.kind]} — {event.location}".strip(" —"),
                )
            )

        remaining_hrs -= chunk_hrs
        cursor = next_midnight


def _fill_day_to_24(sheet: DailyLogSheet) -> None:
    """
    Pad the final event of a day forward to midnight if rounding leaves a gap.
    This keeps totals at exactly 24.00 without distorting actual duty times.
    """
    shortfall = Decimal("24.00") - _round2(sheet.totals.total)
    if shortfall <= Decimal("0"):
        return

    if sheet.segments:
        last = sheet.segments[-1]
        padded_hrs = _round2(last.duration_hrs + shortfall)
        sheet.segments[-1] = LogSegment(
            status=last.status,
            start_hhmm=last.start_hhmm,
            end_hhmm="00:00",   # extends to midnight
            duration_hrs=padded_hrs,
            location=last.location,
        )
        _add_to_totals(sheet.totals, last.status, shortfall)
    else:
        # Empty day (e.g. pure 34-hr restart spanning the date) — fill as OFF_DUTY
        sheet.segments.append(
            LogSegment(DutyStatus.OFF_DUTY, "00:00", "00:00", Decimal("24.00"))
        )
        sheet.totals.off_duty += Decimal("24.00")


def _validate_sheet(sheet: DailyLogSheet) -> None:
    total = _round2(sheet.totals.total)
    if total != Decimal("24.00"):
        raise ValueError(
            f"Daily log for {sheet.date} totals {total} hours, not 24.00. "
            "This violates FMCSA 395.8 and Architecture Rule #4. "
            "Simulation output rejected."
        )


# ─── Public API ───────────────────────────────────────────────────────────────

def build_daily_logs(timeline: list[TimelineEvent]) -> list[DailyLogSheet]:
    """
    Convert a flat ordered TimelineEvent list into one DailyLogSheet per calendar day.

    Steps:
        1. Slice every event at UTC midnight, distributing hours to the correct day.
        2. Pad the final segment of each day to reach exactly 24.00 hours.
        3. Hard-validate every sheet totals exactly 24.00 — raises ValueError if not.

    """
    if not timeline:
        return []

    sheets: dict[date, DailyLogSheet] = {}

    for event in timeline:
        _slice_event_into_days(event, sheets)

    for sheet in sheets.values():
        _fill_day_to_24(sheet)
        _validate_sheet(sheet)

    return sorted(sheets.values(), key=lambda s: s.date)