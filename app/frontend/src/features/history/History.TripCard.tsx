import { useState } from "react";
import { historyStyles as s } from "./history.styles";
import type { TripHistoryItem } from "@/types";
import { formatDate, formatEta } from "./utils";

interface TripCardProps {
  trip: TripHistoryItem;
  onReplay: (id: string) => void;
}

export function TripCard({ trip, onReplay }: TripCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ ...s.card, ...(hovered ? s.cardHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onReplay(trip.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onReplay(trip.id)}
      aria-label={`View trip from ${trip.current_location} to ${trip.dropoff_location}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div style={s.routeLabel}>
            <span>{trip.current_location}</span>
            <span style={s.routeArrow}>→</span>
            <span>{trip.pickup_location}</span>
            <span style={s.routeArrow}>→</span>
            <span>{trip.dropoff_location}</span>
          </div>
          <div style={s.dateText}>{formatDate(trip.created_at)}</div>
          <div style={s.metaRow}>
            {[
              {
                label: "Miles",
                value:
                  trip.total_miles != null
                    ? `${Math.round(Number(trip.total_miles)).toLocaleString()} mi`
                    : "—",
              },
              {
                label: "Duration",
                value:
                  trip.total_duration_hrs != null
                    ? `${Number(trip.total_duration_hrs).toFixed(1)} hrs`
                    : "—",
              },
              { label: "ETA", value: formatEta(trip.eta) },
              { label: "Log Days", value: String(trip.log_days) },
            ].map(({ label, value }) => (
              <div key={label} style={s.metaItem}>
                <span style={s.metaLabel}>{label}</span>
                <span style={s.metaValue}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReplay(trip.id);
          }}
          className="w-full sm:w-auto flex-shrink-0"
          style={s.replayBtn}
        >
          View →
        </button>
      </div>
    </div>
  );
}