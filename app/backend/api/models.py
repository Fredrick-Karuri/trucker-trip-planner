"""
Database models.

All hour/time fields use DecimalField(max_digits=10, decimal_places=2) — never FloatField.
"""

import hashlib
import uuid
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models


class DutyStatus(models.TextChoices):
    OFF_DUTY = "OFF_DUTY", "Off Duty"
    SLEEPER_BERTH = "SLEEPER_BERTH", "Sleeper Berth"
    DRIVING = "DRIVING", "Driving"
    ON_DUTY_NOT_DRIVING = "ON_DUTY_NOT_DRIVING", "On Duty (Not Driving)"


class GeocodeCache(models.Model):
    """
    Caches OpenRouteService geocoding results.

    Uses a SHA-256 hash of the normalized address string as the primary key,
    enabling O(1) lookup without network calls for repeated addresses.
    """

    address_hash = models.CharField(max_length=64, primary_key=True)
    raw_address = models.TextField()
    display_name = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "geocode_cache"

    def __str__(self)->str:
        return f"{self.raw_address} → ({self.latitude}, {self.longitude})"

    @classmethod
    def make_hash(cls, address: str) -> str:
        normalized = address.strip().lower()
        return hashlib.sha256(normalized.encode()).hexdigest()


class Trip(models.Model):
    """Header record for a single trip simulation."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    current_location = models.TextField()
    pickup_location = models.TextField()
    dropoff_location = models.TextField()
    cycle_hours_used = models.DecimalField(max_digits=10, decimal_places=2)
    start_time = models.DateTimeField()
    total_miles = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    total_duration_hrs = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    eta = models.DateTimeField(null=True)
    route_geojson = models.JSONField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "trips"
        ordering = ["-created_at"]

    def __str__(self)->str:
        return f"Trip {self.id}: {self.current_location} → {self.dropoff_location}"


class TripSegment(models.Model):
    """
    A single duty-status event within a trip timeline.

    Represents one atomic state: e.g. DRIVING for 4 hours starting at 08:00 UTC.
    The continuous sequence of segments for a trip must have zero gaps.
    """

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="segments")
    status = models.CharField(max_length=24, choices=DutyStatus.choices)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration_hrs = models.DecimalField(max_digits=10, decimal_places=2)
    location_text = models.TextField(blank=True)
    sequence = models.PositiveIntegerField()

    class Meta:
        db_table = "trip_segments"
        ordering = ["sequence"]

    def __str__(self)->str:
        return f"{self.status} {self.start_time} → {self.end_time}"


class DailyLog(models.Model):
    """
    Aggregated 24-hour log sheet for one calendar day of a trip.

    The invariant total_off_duty + total_sleeper + total_driving + total_on_duty_nd
    must equal exactly Decimal('24.00'). This is enforced in clean() and in the
    Daily Log Generator service .
    """

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="daily_logs")
    date = models.DateField()
    total_off_duty = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    total_sleeper = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    total_driving = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    total_on_duty_nd = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    remarks = models.JSONField(default=list)

    class Meta:
        db_table = "daily_logs"
        ordering = ["date"]
        unique_together = [("trip", "date")]

    def clean(self)->None:
        total = (
            self.total_off_duty
            + self.total_sleeper
            + self.total_driving
            + self.total_on_duty_nd
        )
        if total != Decimal("24.00"):
            raise ValidationError(
                f"Daily log totals must equal exactly 24.00 hours. Got {total}. "
                "This is a legal compliance requirement (FMCSA 395.8)."
            )

    def __str__(self)->str:
        return f"DailyLog {self.date} — Trip {self.trip_id}"