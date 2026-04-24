"""
DRF serializers for the Trucker Trip Planner API.

Request validation lives here. Business logic lives in services/.
"""

from decimal import Decimal
from rest_framework import serializers


class TripPlanRequestSerializer(serializers.Serializer):
    current_location = serializers.CharField(max_length=500)
    pickup_location = serializers.CharField(max_length=500)
    dropoff_location = serializers.CharField(max_length=500)
    cycle_hours_used = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0"),
        max_value=Decimal("70"),
    )
    start_time = serializers.DateTimeField()

    def validate_current_location(self, value):
        return value.strip()

    def validate_pickup_location(self, value):
        return value.strip()

    def validate_dropoff_location(self, value):
        return value.strip()