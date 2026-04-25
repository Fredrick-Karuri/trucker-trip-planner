/**
 * Style definitions for the planner feature.
 * All values sourced from tokens.ts — no hardcoded hex values here.
 */

import { colors, radius, shadows, spacing, transitions, typography } from "@/tokens";
import type { CSSProperties } from "react";

export const plannerStyles = {
  page: {
    minHeight: "100vh",
    background: colors.background,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  } satisfies CSSProperties,

  card: {
    background: colors.surface,
    borderRadius: radius.xl,
    border: `1px solid ${colors.surfaceBorder}`,
    padding: spacing["2xl"],
    width: "100%",
    maxWidth: "520px",
    boxShadow: shadows.lg,
  } satisfies CSSProperties,

  header: {
    marginBottom: spacing.xl,
  } satisfies CSSProperties,

  eyebrow: {
    fontFamily: typography.fontMono,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    color: colors.primary,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    marginBottom: spacing.sm,
  } satisfies CSSProperties,

  title: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightSemibold,
    color: colors.onSurface,
    lineHeight: "1.2",
    margin: 0,
  } satisfies CSSProperties,

  subtitle: {
    fontSize: typography.sizeSm,
    color: colors.onSurfaceMuted,
    marginTop: spacing.sm,
  } satisfies CSSProperties,

  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: spacing.md,
    marginBottom: spacing.lg,
  } satisfies CSSProperties,

  label: {
    display: "block",
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.onSurfaceMuted,
    marginBottom: spacing.xs,
    letterSpacing: "0.02em",
  } satisfies CSSProperties,

  inputWrapper: {
    position: "relative" as const,
  } satisfies CSSProperties,

  input: (hasError: boolean): CSSProperties => ({
    width: "100%",
    background: colors.backgroundDeep,
    border: `1px solid ${hasError ? colors.danger : colors.surfaceBorder}`,
    borderRadius: radius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    paddingLeft: "40px",
    color: colors.onSurface,
    fontSize: typography.sizeMd,
    fontFamily: typography.fontSans,
    outline: "none",
    transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
    boxSizing: "border-box" as const,
  }),

  inputIcon: {
    position: "absolute" as const,
    left: spacing.md,
    top: "50%",
    transform: "translateY(-50%)",
    color: colors.onSurfaceFaint,
    pointerEvents: "none" as const,
    display: "flex",
    alignItems: "center",
  } satisfies CSSProperties,

  errorText: {
    fontSize: typography.sizeXs,
    color: colors.dangerLight,
    marginTop: spacing.xs,
    display: "flex",
    alignItems: "center",
    gap: "4px",
  } satisfies CSSProperties,

  divider: {
    height: "1px",
    background: colors.surfaceBorder,
    margin: `${spacing.lg} 0`,
  } satisfies CSSProperties,

  submitButton: (loading: boolean): CSSProperties => ({
    width: "100%",
    background: loading ? colors.primaryDark : colors.primary,
    color: colors.onPrimary,
    border: "none",
    borderRadius: radius.md,
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    fontFamily: typography.fontSans,
    cursor: loading ? "not-allowed" : "pointer",
    transition: `background ${transitions.fast}, box-shadow ${transitions.fast}, transform ${transitions.fast}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    boxShadow: loading ? "none" : shadows.glow,
  }),

  inlineRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: spacing.md,
  } satisfies CSSProperties,

  cycleHint: {
    fontSize: typography.sizeXs,
    color: colors.onSurfaceFaint,
    marginTop: spacing.xs,
  } satisfies CSSProperties,

  globalError: {
    background: `${colors.danger}22`,
    border: `1px solid ${colors.danger}66`,
    borderRadius: radius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    color: colors.dangerLight,
    fontSize: typography.sizeSm,
    marginBottom: spacing.lg,
  } satisfies CSSProperties,
} as const;