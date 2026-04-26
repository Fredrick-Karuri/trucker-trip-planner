import { useState } from "react";
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
  const [panelOpen, setPanelOpen] = useState(true);

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

  const mapSection = isMobile ? styles.mapSectionMobile : styles.mapSection;

  return (
    <div style={styles.page}>
      <SummaryBar
        summary={result.summary}
        dayCount={result.daily_logs.length}
        onReset={onReset}
      />

      {/* Map — full width, 75vh desktop / 50vh mobile */}
      <div style={mapSection}>
        <MapRenderer result={result} />

        {/* Overlay timeline panel — desktop only */}
        {!isMobile && panelOpen && (
          <div style={styles.overlayPanel}>
            <div style={styles.overlayPanelInner}>
              <div style={styles.sectionLabel}>Stop Timeline</div>
              <StopTimeline stops={result.stops} />
            </div>
          </div>
        )}

        {/* Toggle button */}
        {!isMobile && (
          <button
            style={{
              ...styles.panelToggle,
              // shift left when panel is open so it doesn't overlap
              right: panelOpen ? "320px" : undefined,
            }}
            onClick={() => setPanelOpen((v) => !v)}
          >
            {panelOpen ? "Hide Stops ›" : "‹ Show Stops"}
          </button>
        )}
      </div>

      {/* Mobile: timeline stacks below map */}
      {isMobile && (
        <div style={{ padding: `${styles.sectionLabel.marginBottom} 12px` }}>
          <Card style={{ padding: "12px", marginBottom: "8px" }}>
            <div style={styles.sectionLabel}>Stop Timeline</div>
            <StopTimeline stops={result.stops} />
          </Card>
        </div>
      )}

      {/* ELD Logs — full width below */}
      <div style={styles.belowMap}>
        <div style={styles.sectionLabel}>ELD Daily Log Sheets</div>
        <LogTabs logs={result.daily_logs} />
      </div>
    </div>
  );
}