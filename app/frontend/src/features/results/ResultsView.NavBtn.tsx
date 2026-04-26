
import {
  colors,
  radius,
  spacing,
  transitions,
  typography,
} from "@/tokens";

export function NavBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        padding: `6px ${spacing.md}`,
        borderRadius: radius.md,
        border: `1px solid ${colors.surfaceBorder}`,
        background: "transparent",
        color: colors.onSurfaceMuted,
        fontSize: typography.sizeSm,
        fontFamily: typography.fontSans,
        cursor: "pointer",
        transition: `all ${transitions.fast}`,
        whiteSpace: "nowrap" as const,
      }}
    >
      {children}
    </button>
  );
}