/**
 * Style definitions for the auth feature.
 * All values sourced from tokens.ts — no hardcoded hex values here.
 */
import { colors, radius, shadows, spacing, transitions, typography } from "@/tokens";
import type { CSSProperties } from "react";

export const authStyles = {
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
    maxWidth: "440px",
    boxShadow: shadows.lg,
  } satisfies CSSProperties,

  logo: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  } satisfies CSSProperties,

  logoText: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
  } satisfies CSSProperties,

  tabRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "4px",
    background: colors.backgroundDeep,
    borderRadius: radius.md,
    padding: "4px",
    marginBottom: spacing.xl,
  } satisfies CSSProperties,

  tab: (active: boolean): CSSProperties => ({
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: radius.sm,
    border: "none",
    background: active ? colors.surface : "transparent",
    color: active ? colors.onSurface : colors.onSurfaceMuted,
    fontSize: typography.sizeSm,
    fontWeight: active ? typography.weightSemibold : typography.weightNormal,
    fontFamily: typography.fontSans,
    cursor: "pointer",
    transition: `all ${transitions.fast}`,
    boxShadow: active ? shadows.sm : "none",
  }),

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
  } satisfies CSSProperties,

  input: (hasError: boolean): CSSProperties => ({
    width: "100%",
    background: colors.backgroundDeep,
    border: `1px solid ${hasError ? colors.danger : colors.surfaceBorder}`,
    borderRadius: radius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    color: colors.onSurface,
    fontSize: typography.sizeMd,
    fontFamily: typography.fontSans,
    outline: "none",
    transition: `border-color ${transitions.fast}`,
    boxSizing: "border-box" as const,
  }),

  errorText: {
    fontSize: typography.sizeXs,
    color: colors.dangerLight,
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    boxShadow: loading ? "none" : shadows.glow,
    transition: `all ${transitions.fast}`,
  }),
} as const;