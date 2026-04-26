import { colors, radius, spacing, typography } from "@/tokens";

import type { TripPlanResponse } from "@/types";
import type { LucideIcon } from "lucide-react";
import { MapPin, Package, Flag, Bed, Coffee, Fuel } from "@/components/icons";

const STOP_ICONS: Record<string, LucideIcon> = {
  ORIGIN: MapPin,
  PICKUP: Package,
  DROPOFF: Flag,
  REST_10HR: Bed,
  BREAK_30MIN: Coffee,
  FUEL_STOP: Fuel,
};

export function StopTimeline({ stops }: { stops: TripPlanResponse["stops"] }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column" as const,
        gap: "2px",
        maxHeight: "300px",
        overflowY: "auto" as const,
      }}
    >
      {stops.map((stop, i) => {
        const Icon = STOP_ICONS[stop.type] ?? MapPin;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: spacing.sm,
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: radius.sm,
              borderLeft: `2px solid ${colors.surfaceBorder}`,
            }}
          >
            <span
              style={{ flexShrink: 0, display: "flex", alignItems: "center" }}
            >
              <Icon size={14} strokeWidth={2} color={colors.onSurfaceMuted} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: typography.sizeXs,
                  fontWeight: typography.weightMedium,
                  color: colors.onSurface,
                }}
              >
                {stop.type.replace(/_/g, " ")}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: colors.onSurfaceFaint,
                  fontFamily: typography.fontMono,
                }}
              >
                {new Date(stop.arrival).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {stop.duration_min} min
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}