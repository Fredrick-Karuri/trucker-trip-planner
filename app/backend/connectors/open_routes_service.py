"""
OpenRouteService API connector.

Wraps geocoding and HGV routing. All geocoded addresses are cached in Redis
using SHA-256(normalized_address) as the key.

Raises:
    GeocodingError   → 400 Bad Request  (address not found)
    RoutingError     → 422 Unprocessable (no HGV route between locations)
    ORSServiceError  → 503 Service Unavailable (ORS down or rate-limited)
"""

import hashlib
import json
import logging
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

import httpx
from django.conf import settings
from django.core.cache import cache
import polyline

logger = logging.getLogger(__name__)


class GeocodingError(Exception):
    """Raised when an address cannot be resolved to coordinates."""

    def __init__(self, field: str, address: str):
        self.field = field
        self.address = address
        super().__init__(f"Address not found for field '{field}': {address!r}")


class RoutingError(Exception):
    """Raised when no HGV-accessible route exists between the provided locations."""


class ORSServiceError(Exception):
    """Raised when OpenRouteService is unavailable or rate-limited."""


@dataclass(frozen=True)
class Coordinate:
    lat: Decimal
    lng: Decimal
    display_name: str


@dataclass(frozen=True)
class RouteLeg:
    """One segment of the full route (e.g. Current → Pickup)."""

    distance_miles: Decimal
    duration_hours: Decimal
    coordinates: list[list[float]]
    origin_name: str = ""
    dest_name: str = ""


@dataclass(frozen=True)
class RouteResult:
    leg_to_pickup: RouteLeg
    leg_to_dropoff: RouteLeg
    geojson: dict[str, Any]

    @property
    def total_miles(self) -> Decimal:
        return self.leg_to_pickup.distance_miles + self.leg_to_dropoff.distance_miles


def _cache_key(address: str) -> str:
    normalized = address.strip().lower()
    return f"geocode:{hashlib.sha256(normalized.encode()).hexdigest()}"


def geocode(address: str, field_name: str) -> Coordinate:
    """
    Resolve a human-readable address to lat/lng coordinates.

    Checks Redis cache first. On miss, queries ORS and stores the result.
    Cache TTL is 7 days (addresses rarely change).
    """
    key = _cache_key(address)
    cached = cache.get(key)
    if cached:
        data = json.loads(cached)
        return Coordinate(
            lat=Decimal(str(data["lat"])),
            lng=Decimal(str(data["lng"])),
            display_name=data["display_name"],
        )

    try:
        response = httpx.get(
            f"{settings.ORS_BASE_URL}/geocode/search",
            params={"api_key": settings.ORS_API_KEY, "text": address, "size": 1},
            timeout=10.0,
        )
    except httpx.TimeoutException as exc:
        raise ORSServiceError("OpenRouteService geocoding timed out.") from exc
    except httpx.RequestError as exc:
        raise ORSServiceError(f"OpenRouteService request failed: {exc}") from exc

    if response.status_code == 429:
        raise ORSServiceError("OpenRouteService rate limit reached.")
    if response.status_code >= 500:
        raise ORSServiceError(f"OpenRouteService returned {response.status_code}.")

    data = response.json()
    features = data.get("features", [])
    if not features:
        raise GeocodingError(field_name, address)

    props = features[0]["properties"]
    coords = features[0]["geometry"]["coordinates"]
    coordinate = Coordinate(
        lat=Decimal(str(coords[1])),
        lng=Decimal(str(coords[0])),
        display_name=props.get("label", address),
    )

    cache.set(
        key,
        json.dumps({"lat": str(coordinate.lat), "lng": str(coordinate.lng), "display_name": coordinate.display_name}),
        timeout=settings.ORS_GEOCODE_CACHE_TTL_SECONDS,
    )
    logger.info("Geocoded %r → (%s, %s)", address, coordinate.lat, coordinate.lng)
    return coordinate


def _fetch_hgv_route(origin: Coordinate, destination: Coordinate) -> RouteLeg:
    """
    Fetch an HGV-profile route between two coordinates from ORS.

    The driving-hgv profile respects truck constraints: bridge heights,
    weight limits, and restricted roads. Using driving-car would produce
    illegal and impossible routes for an 18-wheeler.
    """
    body = {
        "coordinates": [
            [float(origin.lng), float(origin.lat)],
            [float(destination.lng), float(destination.lat)],
        ],
        "units": "mi",
        "geometry_simplify": False,
    }

    try:
        response = httpx.post(
            f"{settings.ORS_BASE_URL}/v2/directions/driving-hgv",
            json=body,
            headers={"Authorization": settings.ORS_API_KEY, "Content-Type": "application/json"},
            timeout=15.0,
        )
    except httpx.TimeoutException as exc:
        raise ORSServiceError("OpenRouteService routing timed out.") from exc
    except httpx.RequestError as exc:
        raise ORSServiceError(f"OpenRouteService routing request failed: {exc}") from exc

    if response.status_code == 429:
        raise ORSServiceError("OpenRouteService rate limit reached.")
    if response.status_code == 404:
        raise RoutingError("No HGV-accessible route found between the provided locations.")
    if response.status_code >= 500:
        raise ORSServiceError(f"OpenRouteService returned {response.status_code}.")

    data = response.json()
    routes = data.get("routes", [])
    if not routes:
        raise RoutingError("No HGV-accessible route found between the provided locations.")

    summary = routes[0]["summary"]
    distance_miles = Decimal(str(round(summary["distance"], 2)))

    # Fall back to distance / 55 mph if ORS duration is unavailable.
    if summary.get("duration"):
        duration_hours = Decimal(str(round(summary["duration"] / 3600, 4)))
    else:
        duration_hours = distance_miles / Decimal("55")

    geometry = routes[0]["geometry"]
    if isinstance(geometry, str):
        coordinates = [[lng, lat] for lat, lng in polyline.decode(geometry)]
    elif isinstance(geometry, dict):
        coordinates = geometry.get("coordinates", [])
    else:
        coordinates = []


    if not coordinates:
        raise RoutingError(
            "OpenRouteService returned a route with no geometry coordinates. "
            "The HGV profile may not cover this road segment."
        )

    return RouteLeg(
        distance_miles=distance_miles,
        duration_hours=duration_hours,
        coordinates=coordinates,
    )

def fetch_route(
    current_location: str,
    pickup_location: str,
    dropoff_location: str,
) -> RouteResult:
    origin = geocode(current_location, "current_location")
    pickup = geocode(pickup_location, "pickup_location")
    dropoff = geocode(dropoff_location, "dropoff_location")

    raw_leg_to_pickup = _fetch_hgv_route(origin, pickup)
    raw_leg_to_dropoff = _fetch_hgv_route(pickup, dropoff)

    leg_to_pickup = RouteLeg(
        distance_miles=raw_leg_to_pickup.distance_miles,
        duration_hours=raw_leg_to_pickup.duration_hours,
        coordinates=raw_leg_to_pickup.coordinates,
        origin_name=origin.display_name,
        dest_name=pickup.display_name,
    )
    leg_to_dropoff = RouteLeg(
        distance_miles=raw_leg_to_dropoff.distance_miles,
        duration_hours=raw_leg_to_dropoff.duration_hours,
        coordinates=raw_leg_to_dropoff.coordinates,
        origin_name=pickup.display_name,
        dest_name=dropoff.display_name,
    )

    all_coords = leg_to_pickup.coordinates + leg_to_dropoff.coordinates[1:]

    geojson = {
        "type": "Feature",
        "geometry": {"type": "LineString", "coordinates": all_coords},
        "properties": {
            "origin": origin.display_name,
            "pickup": pickup.display_name,
            "dropoff": dropoff.display_name,
            "total_miles": float(leg_to_pickup.distance_miles + leg_to_dropoff.distance_miles),
        },
    }

    return RouteResult(
        leg_to_pickup=leg_to_pickup,
        leg_to_dropoff=leg_to_dropoff,
        geojson=geojson,
    )