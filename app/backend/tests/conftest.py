"""
Pytest configuration and shared fixtures for the Trucker Trip Planner test suite.

ORS is always mocked — no live API calls (Development Guideline).
Every test that produces a simulation result must assert the 24.0h invariant.
"""

import os
from datetime import datetime, timezone
from decimal import Decimal

import django
import pytest

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
os.environ.setdefault("DATABASE_URL", "sqlite:///test.db")
django.setup()

from connectors.ors_client import RouteResult, RouteLeg


def make_route(
    pickup_miles: float = 300.0,
    dropoff_miles: float = 300.0,
) -> RouteResult:
    """
    Build a synthetic RouteResult without calling ORS.

    Duration is calculated from miles / 55 mph to match the engine's speed constant.
    """
    def leg(miles: float) -> RouteLeg:
        m = Decimal(str(miles))
        return RouteLeg(
            distance_miles=m,
            duration_hours=(m / Decimal("55")).quantize(Decimal("0.0001")),
            coordinates=[[0.0, 0.0], [1.0, 1.0]],
        )

    return RouteResult(
        leg_to_pickup=leg(pickup_miles),
        leg_to_dropoff=leg(dropoff_miles),
        geojson={"type": "Feature", "geometry": {"type": "LineString", "coordinates": []}, "properties": {}},
    )


START_TIME = "2024-01-15T08:00:00Z"
START_DT = datetime(2024, 1, 15, 8, 0, 0, tzinfo=timezone.utc)


@pytest.fixture
def short_haul_route():
    """300 mi each leg — fits in a single shift, no break required."""
    return make_route(pickup_miles=300, dropoff_miles=0)


@pytest.fixture
def otr_route():
    """1,100 mi each leg — requires multiple rests and at least 2 fuel stops."""
    return make_route(pickup_miles=1100, dropoff_miles=900)


@pytest.fixture
def cycle_reset_route():
    """Short route used with cycle_hours_used=70 to trigger 34-hr restart."""
    return make_route(pickup_miles=100, dropoff_miles=100)