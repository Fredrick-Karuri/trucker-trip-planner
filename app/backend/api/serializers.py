"""DRF serializers for request validation and trip history responses."""
from __future__ import annotations

from decimal import Decimal

from rest_framework import serializers

from api.models import Trip


class TripPlanRequestSerializer(serializers.Serializer[dict[str, object]]):
    current_location = serializers.CharField(max_length=500)
    pickup_location = serializers.CharField(max_length=500)
    dropoff_location = serializers.CharField(max_length=500)
    cycle_hours_used = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        min_value=Decimal("0"), max_value=Decimal("70"),
    )
    start_time = serializers.DateTimeField()

    def validate_current_location(self, value: str) -> str:
        return value.strip()

    def validate_pickup_location(self, value: str) -> str:
        return value.strip()

    def validate_dropoff_location(self, value: str) -> str:
        return value.strip()


class TripSummarySerializer(serializers.ModelSerializer):
    """Compact trip card for the history list page."""

    log_days = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            "id",
            "created_at",
            "current_location",
            "pickup_location",
            "dropoff_location",
            "total_miles",
            "total_duration_hrs",
            "eta",
            "log_days",
        ]

    def get_log_days(self, obj: Trip) -> int:
        if obj.result_json:
            return len(obj.result_json.get("daily_logs", []))
        return 0