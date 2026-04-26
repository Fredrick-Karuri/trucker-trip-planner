

import {
  colors,
  spacing,
  typography,
} from "@/tokens";
import { Spinner } from "@/components";

export function LoadingPanel({ message }: { message: string }) {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.lg,
      }}
    >
      <Spinner size={36} />
      <div style={{ textAlign: "center" as const }}>
        <div
          style={{
            fontSize: typography.sizeMd,
            color: colors.onSurface,
            fontWeight: typography.weightMedium,
          }}
        >
          {message}
        </div>
        <div
          style={{
            fontSize: typography.sizeSm,
            color: colors.onSurfaceMuted,
            marginTop: spacing.xs,
          }}
        >
          Running FMCSA HOS simulation…
        </div>
      </div>
    </div>
  );
}