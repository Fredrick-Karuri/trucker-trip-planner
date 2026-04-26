/**
 * Style definitions for the trip history feature.
 * All values sourced from tokens.ts.
 */
import { colors, radius, shadows, spacing, transitions, typography } from "@/tokens";
import type { CSSProperties } from "react";

export const historyStyles = {
  page: {
    minHeight: "100vh",
    background: colors.background,
    padding: `${spacing.xl} ${spacing.lg}`,
    maxWidth: "900px",
    margin: "0 auto",
  } satisfies CSSProperties,

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
    flexWrap: "wrap" as const,
    gap: spacing.md,
  } satisfies CSSProperties,

  title: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightSemibold,
    color: colors.onSurface,
    margin: 0,
  } satisfies CSSProperties,

  subtitle: {
    fontSize: typography.sizeSm,
    color: colors.onSurfaceMuted,
    marginTop: "2px",
  } satisfies CSSProperties,

  grid: {
    display: "flex",
    flexDirection: "column" as const,
    gap: spacing.md,
  } satisfies CSSProperties,

  card: {
    background: colors.surface,
    border: `1px solid ${colors.surfaceBorder}`,
    borderRadius: radius.lg,
    padding: spacing.lg,
    cursor: "pointer",
    transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}, transform ${transitions.fast}`,
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: spacing.md,
    alignItems: "center",
  } satisfies CSSProperties,

  cardHover: {
    borderColor: colors.primary,
    boxShadow: shadows.md,
    transform: "translateY(-1px)",
  } satisfies CSSProperties,

  routeLabel: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.onSurface,
    marginBottom: "4px",
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
  } satisfies CSSProperties,

  routeArrow: {
    color: colors.primary,
    fontSize: typography.sizeSm,
  } satisfies CSSProperties,

  metaRow: {
    display: "flex",
    gap: spacing.lg,
    flexWrap: "wrap" as const,
    marginTop: spacing.xs,
  } satisfies CSSProperties,

  metaItem: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1px",
  } satisfies CSSProperties,

  metaLabel: {
    fontSize: "10px",
    color: colors.onSurfaceFaint,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  } satisfies CSSProperties,

  metaValue: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.onSurface,
    fontFamily: typography.fontMono,
  } satisfies CSSProperties,

  dateText: {
    fontSize: typography.sizeXs,
    color: colors.onSurfaceFaint,
    marginTop: "2px",
  } satisfies CSSProperties,

  replayBtn: {
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: radius.md,
    border: `1px solid ${colors.primary}`,
    background: "transparent",
    color: colors.primary,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    fontFamily: typography.fontSans,
    cursor: "pointer",
    transition: `all ${transitions.fast}`,
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  } satisfies CSSProperties,

  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: `${spacing["3xl"]} ${spacing.xl}`,
    gap: spacing.lg,
    textAlign: "center" as const,
  } satisfies CSSProperties,

  loadMoreBtn: {
    width: "100%",
    marginTop: spacing.lg,
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: radius.md,
    border: `1px solid ${colors.surfaceBorder}`,
    background: "transparent",
    color: colors.onSurfaceMuted,
    fontSize: typography.sizeSm,
    fontFamily: typography.fontSans,
    cursor: "pointer",
    transition: `all ${transitions.fast}`,
  } satisfies CSSProperties,
} as const;