import { colors, spacing, typography } from "@/tokens";

const styles = {
  page: {
    minHeight: "100vh",
    background: colors.background,
  } as React.CSSProperties,

  // ── Grid ────────────────────────────────────────────────────────────────────
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 280px",
    gridTemplateRows: "480px auto",
    gap: spacing.md,
    padding: spacing.md,
    maxWidth: "1400px",
    margin: "0 auto",
  } as React.CSSProperties,

  gridMobile: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "260px auto auto",
    gap: spacing.md,
    padding: spacing.sm,
    maxWidth: "1400px",
    margin: "0 auto",
  } as React.CSSProperties,

  mapCell: {
    gridColumn: "1",
    gridRow: "1",
  } as React.CSSProperties,

  mapCellMobile: {
    gridColumn: "1",
    gridRow: "1",
  } as React.CSSProperties,

  sidebarCard: {
    gridColumn: "2",
    gridRow: "1",
    padding: spacing.md,
    overflow: "hidden",
  } as React.CSSProperties,

  sidebarCardMobile: {
    gridColumn: "1",
    gridRow: "2",
    padding: spacing.md,
    overflow: "hidden",
  } as React.CSSProperties,

  logsCell: {
    gridColumn: "1 / -1",
    gridRow: "2",
  } as React.CSSProperties,

  logsCellMobile: {
    gridColumn: "1",
    gridRow: "3",
  } as React.CSSProperties,

  sectionLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    color: colors.onSurfaceFaint,
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
    marginBottom: spacing.sm,
  } as React.CSSProperties,

  // ── Summary bar — desktop ────────────────────────────────────────────────────
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

  // ── Summary bar — mobile ─────────────────────────────────────────────────────
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

  // ── Shared stat typography ───────────────────────────────────────────────────
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

// ── Responsive selectors ─────────────────────────────────────────────────────

export function getGridStyles(isMobile: boolean) {
  return {
    grid: isMobile ? styles.gridMobile : styles.grid,
    mapCell: isMobile ? styles.mapCellMobile : styles.mapCell,
    sidebarCard: isMobile ? styles.sidebarCardMobile : styles.sidebarCard,
    logsCell: isMobile ? styles.logsCellMobile : styles.logsCell,
  };
}

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

export { styles };