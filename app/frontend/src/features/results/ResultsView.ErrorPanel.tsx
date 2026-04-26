import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "@/tokens";
import { ERROR_COPY } from "./utils";
import { Card } from "@/components";

interface ErrorPanelProps {
  message: string;
  onReset: () => void;
}

export function ErrorPanel({ message, onReset }: ErrorPanelProps) {
  const key =
    Object.keys(ERROR_COPY).find((k) => message.includes(k)) ?? "default";
  const copy = ERROR_COPY[key];
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xl,
      }}
    >
      <Card
        style={{
          maxWidth: "460px",
          width: "100%",
          padding: spacing.xl,
          textAlign: "center" as const,
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: spacing.md }}>🚫</div>
        <h2
          style={{
            fontSize: typography.sizeLg,
            fontWeight: typography.weightSemibold,
            color: colors.onSurface,
            margin: `0 0 ${spacing.sm}`,
          }}
        >
          {copy.title}
        </h2>
        <p
          style={{
            fontSize: typography.sizeSm,
            color: colors.onSurfaceMuted,
            marginBottom: spacing.lg,
          }}
        >
          {copy.body}
        </p>
        {message && message !== copy.body && (
          <p
            style={{
              fontSize: typography.sizeXs,
              color: colors.onSurfaceFaint,
              fontFamily: typography.fontMono,
              marginBottom: spacing.lg,
              padding: spacing.sm,
              background: colors.backgroundDeep,
              borderRadius: radius.sm,
            }}
          >
            {message}
          </p>
        )}
        <button
          onClick={onReset}
          type="button"
          style={{
            padding: `${spacing.sm} ${spacing.xl}`,
            borderRadius: radius.md,
            border: "none",
            background: colors.primary,
            color: colors.onPrimary,
            fontSize: typography.sizeMd,
            fontWeight: typography.weightMedium,
            fontFamily: typography.fontSans,
            cursor: "pointer",
            boxShadow: shadows.glow,
          }}
        >
          Try Again
        </button>
      </Card>
    </div>
  );
}
