import { historyStyles as s } from "./history.styles";
import { colors, typography, spacing } from "@/tokens";


export function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div style={s.emptyState}>
      <div style={{ fontSize: "40px" }}>🚛</div>
      <div>
        <div style={{ fontSize: typography.sizeLg, fontWeight: typography.weightSemibold, color: colors.onSurface }}>
          No trips yet
        </div>
        <div style={{ fontSize: typography.sizeSm, color: colors.onSurfaceMuted, marginTop: spacing.xs }}>
          Plan your first trip to see it here.
        </div>
      </div>
      <button
        type="button"
        onClick={onNew}
        style={{
          padding: `${spacing.sm} ${spacing.xl}`,
          borderRadius: "8px",
          border: "none",
          background: colors.primary,
          color: colors.onPrimary,
          fontSize: typography.sizeMd,
          fontWeight: typography.weightMedium,
          fontFamily: typography.fontSans,
          cursor: "pointer",
        }}
      >
        Plan a Trip
      </button>
    </div>
  );
}