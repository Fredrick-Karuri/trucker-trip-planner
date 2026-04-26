import { useState } from "react";
import { colors } from "@/tokens";
import type { TripPlanResponse } from "@/types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import { NavBtn } from "./ResultsView.NavBtn";
import { getSummaryBarStyles } from "./ResultsView.styles";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Truck, RotateCcw, MoreVertical } from "@/components/icons";
import { BottomSheet } from "./ResultsView.BottomSheet";

interface SummaryBarProps {
  summary: TripPlanResponse["summary"];
  dayCount: number;
  onReset: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SummaryBar({ summary, dayCount, onReset }: SummaryBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const s = getSummaryBarStyles(isMobile);
  const [sheetOpen, setSheetOpen] = useState(false);

  const eta = new Date(summary.eta).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const mobileStats = [
    { label: "mi",   value: summary.total_miles.toLocaleString(undefined, { maximumFractionDigits: 0 }) },
    { label: "hrs",  value: summary.total_duration_hrs.toFixed(1) },
    { label: "days", value: String(dayCount) },
  ];

  const desktopStats = [
    { label: "Total Miles", value: summary.total_miles.toLocaleString(undefined, { maximumFractionDigits: 0 }) },
    { label: "Duration",    value: `${summary.total_duration_hrs.toFixed(1)} hrs` },
    { label: "Drive Time",  value: `${summary.total_drive_hrs?.toFixed(1) ?? "—"} hrs` },
    { label: "ETA",         value: eta },
    { label: "Log Days",    value: String(dayCount) },
  ];

  // ── Mobile ────────────────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <>
        <div className="no-print" style={s.bar}>
          <div style={s.summaryBarTop}>
            {/* Logo */}
            <div style={s.logo}>
              <Truck size={16} color={colors.primary} strokeWidth={2} />
              <span style={s.logoText}>TTP</span>
            </div>

            {/* Inline stats */}
            <div style={s.inlineStats}>
              {mobileStats.map(({ label, value }) => (
                <div key={label} style={s.inlineStat}>
                  <span style={s.statValue}>{value}</span>
                  <span style={s.statLabel}>{label}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
              <button
                onClick={onReset}
                className="flex items-center justify-center w-8 h-8 rounded-md border"
                style={{ borderColor: colors.surfaceBorder, color: colors.onSurfaceMuted }}
                title="New Trip"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => setSheetOpen(true)}
                className="flex items-center justify-center w-8 h-8 rounded-md border"
                style={{ borderColor: colors.surfaceBorder, color: colors.onSurfaceMuted }}
                title="More"
              >
                <MoreVertical size={14} />
              </button>
            </div>
          </div>
        </div>

        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          summary={summary}
          dayCount={dayCount}
          eta={eta}
          onReset={onReset}
        />
      </>
    );
  }

  // ── Desktop ───────────────────────────────────────────────────────────────

  return (
    <div className="no-print" style={s.bar}>
      <div style={s.logo}>
        <Truck size={22} color={colors.primary} strokeWidth={2} />
        <span style={s.logoText}>Trucker Trip Planner</span>
      </div>

      <div style={s.divider} />

      <div style={s.stats}>
        {desktopStats.map(({ label, value }) => (
          <div key={label} style={s.statItem}>
            <span style={s.statLabel}>{label}</span>
            <span style={s.statValue}>{value}</span>
          </div>
        ))}
      </div>

      <div style={s.actions}>
        {user && (
          <>
            <span style={s.userEmail}>{user.email}</span>
            <NavBtn onClick={() => navigate("/history")}>History</NavBtn>
            <div style={s.divider} />
            <NavBtn onClick={logout}>Logout</NavBtn>
            <div style={s.divider} />
          </>
        )}
        <NavBtn onClick={onReset}>← New Trip</NavBtn>
      </div>
    </div>
  );
}