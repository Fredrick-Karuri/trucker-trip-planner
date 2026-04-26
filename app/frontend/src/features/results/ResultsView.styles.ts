import { colors, spacing, typography } from "@/tokens";

const styles = {
  page: {
    minHeight: "100vh",
    background: colors.background,
  } as React.CSSProperties,

  // ── Map-dominant layout ─────────────────────────────────────────────────────
  mapSection: {
    position: "relative" as const,
    width: "100%",
    height: "75vh",
    minHeight: "400px",
  } as React.CSSProperties,

  mapSectionMobile: {
    position: "relative" as const,
    width: "100%",
    height: "75vh",
    minHeight: "280px",
  } as React.CSSProperties,

  // Overlay panel — floats over the map on the right
  overlayPanel: {
    position: "absolute" as const,
    top: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    width: "300px",
    zIndex: 500,
    display: "flex",
    flexDirection: "column" as const,
    pointerEvents: "none" as const,
  } as React.CSSProperties,

  overlayPanelInner: {
    background: `${colors.surface}f0`,
    backdropFilter: "blur(12px)",
    border: `1px solid ${colors.surfaceBorder}`,
    borderRadius: "12px",
    padding: spacing.md,
    overflowY: "auto" as const,
    maxHeight: "100%",
    pointerEvents: "auto" as const,
    flex: 1,
  } as React.CSSProperties,

  // Below the map
  belowMap: {
    padding: `${spacing.md} ${spacing.md}`,
    maxWidth: "1400px",
    margin: "0 auto",
  } as React.CSSProperties,

  sectionLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    color: colors.onSurfaceFaint,
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
    marginBottom: spacing.sm,
  } as React.CSSProperties,

  // Toggle button for the overlay panel on desktop
  panelToggle: {
    position: "absolute" as const,
    top: spacing.md,
    right: spacing.md,
    zIndex: 501,
    background: `${colors.surface}f0`,
    backdropFilter: "blur(8px)",
    border: `1px solid ${colors.surfaceBorder}`,
    borderRadius: "8px",
    padding: `6px 12px`,
    fontSize: typography.sizeXs,
    color: colors.onSurface,
    cursor: "pointer",
    fontWeight: typography.weightMedium,
  } as React.CSSProperties,

  // ── Summary bar ────────────────────────────────────────────────────────────
  summaryBar: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: `${colors.backgroundDeep}f0`,
    backdropFilter: "blur(12px)",
    borderBottom: `1px solid ${colors.surfaceBorder}`,
    padding: `${spacing.sm} ${spacing.lg}`,
    display: "flex",
    alignItems: "center",
    gap: spacing.xl,
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  summaryBarMobile: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: `${colors.backgroundDeep}f0`,
    backdropFilter: "blur(12px)",
    borderBottom: `1px solid ${colors.surfaceBorder}`,
    padding: `${spacing.xs} ${spacing.md}`,
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
  } as React.CSSProperties,

  summaryStats: {
    display: "flex",
    gap: spacing.xl,
    flexWrap: "wrap" as const,
    flex: 1,
  } as React.CSSProperties,

  summaryActions: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
  } as React.CSSProperties,

  summaryBarTop: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    gap: spacing.sm,
  } as React.CSSProperties,

  summaryActionsMobile: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
    marginLeft: "auto",
    flexShrink: 0,
  } as React.CSSProperties,

  summaryInlineStats: {
    display: "flex",
    alignItems: "baseline",
    gap: spacing.md,
    flex: 1,
    overflow: "hidden",
  } as React.CSSProperties,

  summaryInlineStat: {
    display: "flex",
    alignItems: "baseline",
    gap: "2px",
    flexShrink: 0,
  } as React.CSSProperties,

  dividerV: {
    width: "1px",
    height: "24px",
    background: colors.surfaceBorder,
  } as React.CSSProperties,

  dividerVSm: {
    width: "1px",
    height: "16px",
    background: colors.surfaceBorder,
  } as React.CSSProperties,

  logo: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
  } as React.CSSProperties,

  logoText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  logoTextMobile: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
  } as React.CSSProperties,

  statItem: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1px",
  } as React.CSSProperties,

  statLabel: {
    fontSize: "10px",
    color: colors.onSurfaceFaint,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  } as React.CSSProperties,

  statLabelMobile: {
    fontSize: "9px",
    color: colors.onSurfaceFaint,
  } as React.CSSProperties,

  statValue: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.onSurface,
    fontFamily: typography.fontMono,
  } as React.CSSProperties,

  statValueMobile: {
    fontSize: "12px",
    fontWeight: typography.weightSemibold,
    color: colors.onSurface,
    fontFamily: typography.fontMono,
  } as React.CSSProperties,

  userEmail: {
    fontSize: typography.sizeXs,
    color: colors.onSurfaceFaint,
  } as React.CSSProperties,
} as const;

export function getSummaryBarStyles(isMobile: boolean) {
  return {
    bar: isMobile ? styles.summaryBarMobile : styles.summaryBar,
    logo: styles.logo,
    logoText: isMobile ? styles.logoTextMobile : styles.logoText,
    summaryBarTop: styles.summaryBarTop,
    inlineStats: styles.summaryInlineStats,
    inlineStat: styles.summaryInlineStat,
    stats: styles.summaryStats,
    actions: isMobile ? styles.summaryActionsMobile : styles.summaryActions,
    divider: isMobile ? styles.dividerVSm : styles.dividerV,
    statItem: styles.statItem,
    statLabel: isMobile ? styles.statLabelMobile : styles.statLabel,
    statValue: isMobile ? styles.statValueMobile : styles.statValue,
    userEmail: styles.userEmail,
  };
}

// Keep for any remaining imports
export function getGridStyles(_isMobile: boolean) {
  return {};
}

export { styles };