/**
 * Style definitions for the map feature.
 * All values sourced from tokens.ts — no hardcoded hex values here.
 */

import { colors, radius, shadows, spacing, typography } from "@/tokens";
import type { CSSProperties } from "react";

export const mapStyles = {
  container: {
    position: "relative" as const,
    width: "100%",
    height: "100%",
    borderRadius: radius.lg,
    overflow: "hidden",
    background: colors.backgroundDeep,
    border: `1px solid ${colors.surfaceBorder}`,
  } satisfies CSSProperties,

  mapEl: {
    width: "100%",
    height: "100%",
  } satisfies CSSProperties,

  popup: {
    background: colors.surface,
    border: `1px solid ${colors.surfaceBorder}`,
    borderRadius: radius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    boxShadow: shadows.md,
    minWidth: "160px",
  } satisfies CSSProperties,

  popupTitle: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.onSurface,
    marginBottom: "2px",
  } satisfies CSSProperties,

  popupMeta: {
    fontSize: typography.sizeXs,
    color: colors.onSurfaceMuted,
    lineHeight: "1.5",
  } satisfies CSSProperties,

  legendContainer: {
    position: "absolute" as const,
    bottom: spacing.md,
    left: spacing.md,
    zIndex: 400,
    background: `${colors.surface}ee`,
    backdropFilter: "blur(8px)",
    border: `1px solid ${colors.surfaceBorder}`,
    borderRadius: radius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  } satisfies CSSProperties,

  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    fontSize: typography.sizeXs,
    color: colors.onSurfaceMuted,
  } satisfies CSSProperties,

  legendDot: (color: string): CSSProperties => ({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  }),

  loadingOverlay: {
    position: "absolute" as const,
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: `${colors.backgroundDeep}cc`,
    zIndex: 999,
    fontSize: typography.sizeSm,
    color: colors.onSurfaceMuted,
    gap: spacing.sm,
  } satisfies CSSProperties,
} as const;

// Marker colour map — keyed by stop type from the API
export const MARKER_COLORS: Record<string, string> = {
  ORIGIN: colors.markerOrigin,
  PICKUP: colors.markerPickup,
  DROPOFF: colors.markerDropoff,
  REST_10HR: colors.markerRest,
  BREAK_30MIN: colors.markerBreak,
  FUEL_STOP: colors.markerFuel,
};

export const MARKER_LABELS: Record<string, string> = {
  ORIGIN: "Origin",
  PICKUP: "Pickup (1 hr loading)",
  DROPOFF: "Dropoff (1 hr unloading)",
  REST_10HR: "10-hr Rest",
  BREAK_30MIN: "30-min Break",
  FUEL_STOP: "Fuel Stop (30 min)",
};