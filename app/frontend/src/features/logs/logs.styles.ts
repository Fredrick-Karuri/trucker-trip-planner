/**
 * Style definitions for the ELD log sheet feature.
 * All values sourced from tokens.ts — no hardcoded hex values here.
 */

import { colors, radius, spacing, typography } from "@/tokens";
import type { CSSProperties } from "react";

export const logStyles = {
  container: {
    width: "100%",
    background: colors.surface,
    borderRadius: radius.lg,
    border: `1px solid ${colors.surfaceBorder}`,
    overflow: "hidden",
  } satisfies CSSProperties,

  header: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: spacing.md,
    padding: `${spacing.md} ${spacing.lg}`,
    borderBottom: `1px solid ${colors.surfaceBorder}`,
    background: colors.backgroundDeep,
  } satisfies CSSProperties,

  headerField: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  } satisfies CSSProperties,

  headerLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    color: colors.onSurfaceFaint,
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
  } satisfies CSSProperties,

  headerValue: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.onSurface,
    fontFamily: typography.fontMono,
  } satisfies CSSProperties,

gridWrapper: {
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
  margin: `0 -${spacing.md}`,   // bleed to card edges so scroll feels natural
  padding: `0 ${spacing.md}`,
} satisfies CSSProperties,
  gridTitle: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    color: colors.onSurfaceFaint,
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
    marginBottom: spacing.sm,
  } satisfies CSSProperties,

  totalsRow: {
    display: "flex",
    gap: spacing.md,
    padding: `${spacing.sm} ${spacing.lg}`,
    borderTop: `1px solid ${colors.surfaceBorder}`,
    background: colors.backgroundDeep,
    flexWrap: "wrap" as const,
  } satisfies CSSProperties,

  totalItem: (): CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
    fontSize: typography.sizeSm,
  }),

  totalDot: (color: string): CSSProperties => ({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  }),

  totalLabel: {
    color: colors.onSurfaceMuted,
    fontSize: typography.sizeXs,
  } satisfies CSSProperties,

  totalValue: {
    color: colors.onSurface,
    fontWeight: typography.weightMedium,
    fontFamily: typography.fontMono,
    fontSize: typography.sizeSm,
  } satisfies CSSProperties,

  remarksSection: {
    padding: `${spacing.sm} ${spacing.lg} ${spacing.lg}`,
    borderTop: `1px solid ${colors.surfaceBorder}`,
  } satisfies CSSProperties,

  remarksTitle: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    color: colors.onSurfaceFaint,
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
    marginBottom: spacing.sm,
  } satisfies CSSProperties,

  remarkItem: {
    display: "flex",
    gap: spacing.md,
    fontSize: typography.sizeSm,
    color: colors.onSurfaceMuted,
    paddingBottom: "4px",
    borderBottom: `1px solid ${colors.surfaceBorder}22`,
    marginBottom: "4px",
  } satisfies CSSProperties,

  remarkTime: {
    fontFamily: typography.fontMono,
    fontSize: typography.sizeXs,
    color: colors.primary,
    minWidth: "42px",
    paddingTop: "2px",
  } satisfies CSSProperties,
} as const;

// SVG grid constants — drive these from here so the Vitest pixel assertion works
export const GRID = {
  WIDTH: 720,           // SVG viewBox width for 24h grid
  ROW_HEIGHT: 32,       // px per duty-status row
  HEADER_HEIGHT: 24,    // px for hour labels row
  ROWS: 4,             // OFF_DUTY, SLEEPER, DRIVING, ON_DUTY_ND
  LABEL_WIDTH: 140,    // px for row label column
  get TOTAL_HEIGHT() { return this.HEADER_HEIGHT + this.ROWS * this.ROW_HEIGHT; },
  get CHART_WIDTH() { return this.WIDTH - this.LABEL_WIDTH; },
  hourX(h: number): number {
    return this.LABEL_WIDTH + (h / 24) * this.CHART_WIDTH;
  },
  minuteX(hhmm: string): number {
    const [hh, mm] = hhmm.split(":").map(Number);
    return this.LABEL_WIDTH + ((hh + mm / 60) / 24) * this.CHART_WIDTH;
  },
} as const;

// Row index for each duty status
export const ROW_INDEX: Record<string, number> = {
  OFF_DUTY: 0,
  SLEEPER_BERTH: 1,
  DRIVING: 2,
  ON_DUTY_NOT_DRIVING: 3,
};

// Row colours from tokens — no inline hex
export const ROW_COLORS: Record<string, string> = {
  OFF_DUTY: colors.statusOffDuty,
  SLEEPER_BERTH: colors.statusSleeper,
  DRIVING: colors.statusDriving,
  ON_DUTY_NOT_DRIVING: colors.statusOnDuty,
};

export const ROW_LABELS: Record<string, string> = {
  OFF_DUTY: "1. Off Duty",
  SLEEPER_BERTH: "2. Sleeper Berth",
  DRIVING: "3. Driving",
  ON_DUTY_NOT_DRIVING: "4. On Duty (ND)",
};