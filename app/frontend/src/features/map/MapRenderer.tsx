/**
 * MapRenderer — draws the HGV route polyline and annotated stop markers.
 *
 * Uses react-leaflet with OpenStreetMap tiles (free, no API key required).
 * Markers are colour-coded by stop type; clicking shows arrival time + duration.
 * The map auto-fits its bounds to the full route on first render.
 */

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { mapStyles as s, MARKER_COLORS, MARKER_LABELS } from "./map.styles";
import { colors } from "@/tokens";
import type { TripStop, TripPlanResponse } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatArrival(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Auto-fit bounds ──────────────────────────────────────────────────────────

function BoundsFitter({ positions }: { positions: LatLngExpression[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (!fitted.current && positions.length > 1) {
      map.fitBounds(positions as LatLngBoundsExpression, { padding: [40, 40] });
      fitted.current = true;
    }
  }, [map, positions]);

  return null;
}

// ─── Origin marker (no stop in API stops array) ───────────────────────────────

function OriginMarker({ coords }: { coords: [number, number] }) {
  return (
    <CircleMarker
      center={coords}
      radius={10}
      pathOptions={{
        color: MARKER_COLORS.ORIGIN,
        fillColor: MARKER_COLORS.ORIGIN,
        fillOpacity: 1,
        weight: 2,
      }}
    >
      <Popup>
        <div style={s.popup}>
          <div style={s.popupTitle}>Origin</div>
          <div style={s.popupMeta}>Trip start point</div>
        </div>
      </Popup>
    </CircleMarker>
  );
}

// ─── Stop markers ─────────────────────────────────────────────────────────────

interface StopMarkerProps {
  stop: TripStop;
  index: number;
}

function StopMarker({ stop, index }: StopMarkerProps) {
  const color = MARKER_COLORS[stop.type] ?? colors.onSurfaceMuted;
  const label = MARKER_LABELS[stop.type] ?? stop.type;
  const isRest = stop.type === "REST_10HR";

  if (!stop.lat || !stop.lng) return null;

  return (
    <CircleMarker
      center={[stop.lat, stop.lng]}
      radius={isRest ? 9 : 8}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: 0.9,
        weight: 2,
      }}
    >
      <Popup>
        <div style={s.popup}>
          <div style={s.popupTitle}>{label}</div>
          <div style={s.popupMeta}>
            <div>Stop #{index + 1}</div>
            <div>Arrival: {formatArrival(stop.arrival)}</div>
            <div>Duration: {formatDuration(stop.duration_min)}</div>
            {stop.location && <div>{stop.location}</div>}
          </div>
        </div>
      </Popup>
    </CircleMarker>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function MapLegend() {
  const entries = [
    { color: MARKER_COLORS.ORIGIN, label: "Origin" },
    { color: MARKER_COLORS.PICKUP, label: "Pickup" },
    { color: MARKER_COLORS.DROPOFF, label: "Dropoff" },
    { color: MARKER_COLORS.REST_10HR, label: "10-hr Rest" },
    { color: MARKER_COLORS.BREAK_30MIN, label: "30-min Break" },
    { color: MARKER_COLORS.FUEL_STOP, label: "Fuel Stop" },
  ];
  return (
    <div style={s.legendContainer}>
      {entries.map(({ color, label }) => (
        <div key={label} style={s.legendItem}>
          <span style={s.legendDot(color)} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface MapRendererProps {
  result: TripPlanResponse;
}

export function MapRenderer({ result }: MapRendererProps) {
  const geojsonCoords: [number, number][] =
    result.route.geojson.geometry.coordinates.map(
      ([lng, lat]) => [lat, lng] as [number, number]
    );

  // Fall back to first coordinate if no stop has lat/lng populated
  const defaultCenter: LatLngExpression =
    geojsonCoords[0] ?? [39.5, -98.35]; // geographic centre of USA

  return (
    <div style={s.container}>
      <MapContainer
        center={defaultCenter}
        zoom={6}
        style={s.mapEl}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={19}
        />

        {/* Route polyline */}
        {geojsonCoords.length > 1 && (
          <>
            <BoundsFitter positions={geojsonCoords} />
            {/* Shadow line for depth */}
            <Polyline
              positions={geojsonCoords}
              pathOptions={{ color: "#000", weight: 6, opacity: 0.3 }}
            />
            {/* Main route line */}
            <Polyline
              positions={geojsonCoords}
              pathOptions={{
                color: colors.primary,
                weight: 3,
                opacity: 0.9,
              }}
            />
          </>
        )}

        {/* Origin marker */}
        {geojsonCoords[0] && <OriginMarker coords={geojsonCoords[0]} />}

        {/* Stop markers */}
        {result.stops.map((stop, i) => (
          <StopMarker key={`${stop.type}-${i}`} stop={stop} index={i} />
        ))}
      </MapContainer>

      <MapLegend />
    </div>
  );
}