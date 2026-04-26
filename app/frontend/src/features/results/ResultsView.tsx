/**
 * ResultsView — full results layout after a successful simulation.
 *
 * Layout: sticky auth-aware summary bar → map (top) → stop timeline sidebar → tabbed ELD logs.
 * summary bar shows driver email + logout + history link when authenticated.
 */
import {
  colors,
  spacing,
  typography,
} from "@/tokens";
import { MapRenderer } from "@/features/map/MapRenderer";
import { LogTabs } from "@/features/logs/LogTabs";
import { Card } from "@/components";
import type { TripPlanResponse } from "@/types";
import type { PlannerStatus } from "@/features/planner/useTripPlanner";
import { SummaryBar } from "./ResultsView.SummaryBar";
import { LoadingPanel } from "./ResultsView.LoadingPanel";
import { ErrorPanel } from "./ResultsView.ErrorPanel";
import { StopTimeline } from "./ResultsView.StopTimeline";

interface ResultsViewProps {
  result: TripPlanResponse | null;
  status: PlannerStatus;
  errorMessage?: string;
  onReset: () => void;
}

export function ResultsView({
  result,
  status,
  errorMessage,
  onReset,
}: ResultsViewProps) {
  if (status === "submitting" || status === "polling") {
    return (
      <LoadingPanel
        message={
          status === "submitting"
            ? "Submitting trip…"
            : "Calculating route & HOS schedule…"
        }
      />
    );
  }
  if (status === "error")
    return (
      <ErrorPanel message={errorMessage ?? "Unknown error"} onReset={onReset} />
    );
  if (!result) return null;

  return (
    <div style={{ minHeight: "100vh", background: colors.background }}>
      <SummaryBar
        summary={result.summary}
        dayCount={result.daily_logs.length}
        onReset={onReset}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gridTemplateRows: "480px auto",
          gap: spacing.md,
          padding: spacing.md,
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div style={{ gridColumn: "1", gridRow: "1" }}>
          <MapRenderer result={result} />
        </div>
        <Card
          style={{
            gridColumn: "2",
            gridRow: "1",
            padding: spacing.md,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: typography.sizeXs,
              fontWeight: typography.weightMedium,
              color: colors.onSurfaceFaint,
              textTransform: "uppercase" as const,
              letterSpacing: "0.07em",
              marginBottom: spacing.sm,
            }}
          >
            Stop Timeline
          </div>
          <StopTimeline stops={result.stops} />
        </Card>
        <div style={{ gridColumn: "1 / -1", gridRow: "2" }}>
          <div
            style={{
              fontSize: typography.sizeXs,
              fontWeight: typography.weightMedium,
              color: colors.onSurfaceFaint,
              textTransform: "uppercase" as const,
              letterSpacing: "0.07em",
              marginBottom: spacing.sm,
            }}
          >
            ELD Daily Log Sheets
          </div>
          <LogTabs logs={result.daily_logs} />
        </div>
      </div>
    </div>
  );
}
