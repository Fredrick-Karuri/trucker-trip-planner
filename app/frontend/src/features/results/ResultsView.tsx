import { MapRenderer } from "@/features/map/MapRenderer";
import { LogTabs } from "@/features/logs/LogTabs";
import { Card } from "@/components";
import type { TripPlanResponse } from "@/types";
import type { PlannerStatus } from "@/features/planner/useTripPlanner";
import { SummaryBar } from "./ResultsView.SummaryBar";
import { LoadingPanel } from "./ResultsView.LoadingPanel";
import { ErrorPanel } from "./ResultsView.ErrorPanel";
import { StopTimeline } from "./ResultsView.StopTimeline";
import { styles } from "./ResultsView.styles";
import { useIsMobile } from "@/hooks/useIsMobile";

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
  const isMobile = useIsMobile();

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

  const grid = isMobile ? styles.gridMobile : styles.grid;
  const mapCell = isMobile ? styles.mapCellMobile : styles.mapCell;
  const sidebarCard = isMobile ? styles.sidebarCardMobile : styles.sidebarCard;
  const logsCell = isMobile ? styles.logsCellMobile : styles.logsCell;

  return (
    <div style={styles.page}>
      <SummaryBar
        summary={result.summary}
        dayCount={result.daily_logs.length}
        onReset={onReset}
      />
      <div style={grid}>
        <div style={mapCell}>
          <MapRenderer result={result} />
        </div>
        <Card style={sidebarCard}>
          <div style={styles.sectionLabel}>Stop Timeline</div>
          <StopTimeline stops={result.stops} />
        </Card>
        <div style={logsCell}>
          <div style={styles.sectionLabel}>ELD Daily Log Sheets</div>
          <LogTabs logs={result.daily_logs} />
        </div>
      </div>
    </div>
  );
}