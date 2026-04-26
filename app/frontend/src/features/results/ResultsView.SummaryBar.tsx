import {
  colors,
  spacing,
  typography,
} from "@/tokens";
import type { TripPlanResponse } from "@/types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import { Truck } from "@/components/icons";
import { NavBtn } from "./ResultsView.NavBtn";


// ─── Summary bar ──────────────────────────────────────────────────────────────

interface SummaryBarProps {
  summary: TripPlanResponse["summary"];
  dayCount: number;
  onReset: () => void;
}

export function SummaryBar({ summary, dayCount, onReset }: SummaryBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const eta = new Date(summary.eta).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const stats = [
    {
      label: "Total Miles",
      value: summary.total_miles.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      }),
    },
    {
      label: "Trip Duration",
      value: `${summary.total_duration_hrs.toFixed(1)} hrs`,
    },
    {
      label: "Drive Time",
      value: `${summary.total_drive_hrs?.toFixed(1) ?? "—"} hrs`,
    },
    { label: "ETA", value: eta },
    { label: "Log Days", value: String(dayCount) },
  ];

  return (
    <div
      className="no-print"
      style={{
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
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
          flexShrink: 0,
        }}
      >
        <Truck size={22} color={colors.primary} strokeWidth={2} />
        <span
          style={{
            fontSize: typography.sizeSm,
            fontWeight: typography.weightSemibold,
            color: colors.primary,
          }}
        >
          Trucker Trip Planner
        </span>
      </div>

      <div
        style={{
          width: "1px",
          height: "24px",
          background: colors.surfaceBorder,
        }}
      />

      {/* Stats */}
      <div
        style={{
          display: "flex",
          gap: spacing.xl,
          flexWrap: "wrap" as const,
          flex: 1,
        }}
      >
        {stats.map(({ label, value }) => (
          <div
            key={label}
            style={{
              display: "flex",
              flexDirection: "column" as const,
              gap: "1px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: colors.onSurfaceFaint,
                textTransform: "uppercase" as const,
                letterSpacing: "0.06em",
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontSize: typography.sizeSm,
                fontWeight: typography.weightSemibold,
                color: colors.onSurface,
                fontFamily: typography.fontMono,
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Right side actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
          flexShrink: 0,
        }}
      >
        {user && (
          <>
            <span
              style={{
                fontSize: typography.sizeXs,
                color: colors.onSurfaceFaint,
              }}
            >
              {user.email}
            </span>
            <NavBtn onClick={() => navigate("/history")}>History</NavBtn>
            <div
              style={{
                width: "1px",
                height: "16px",
                background: colors.surfaceBorder,
              }}
            />
            <NavBtn onClick={logout}>Logout</NavBtn>
            <div
              style={{
                width: "1px",
                height: "16px",
                background: colors.surfaceBorder,
              }}
            />
          </>
        )}
        <NavBtn onClick={onReset}>← New Trip</NavBtn>
      </div>
    </div>
  );
}