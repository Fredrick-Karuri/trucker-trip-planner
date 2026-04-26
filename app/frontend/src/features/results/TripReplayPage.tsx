/**
 * TripReplayPage — loads a stored trip result by ID and renders ResultsView.
 * No re-simulation: data comes directly from Trip.result_json.
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchTripDetail } from "@/services/api";
import { ResultsView } from "./ResultsView";
import { Spinner } from "@/components";
import { colors, spacing } from "@/tokens";
import type { TripPlanResponse } from "@/types";

export function TripReplayPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<TripPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;
    fetchTripDetail(tripId)
      .then(setResult)
      .catch(() => setError("Trip not found or not yet complete."));
  }, [tripId]);

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.lg,
          color: colors.onSurfaceMuted,
        }}
      >
        <div>{error}</div>
        <button
          type="button"
          onClick={() => navigate("/history")}
          style={{
            padding: `${spacing.xs} ${spacing.lg}`,
            borderRadius: "8px",
            border: `1px solid ${colors.surfaceBorder}`,
            background: "transparent",
            color: colors.onSurfaceMuted,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ← Back to History
        </button>
      </div>
    );
  }

  if (!result) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <ResultsView
      result={result}
      status="success"
      onReset={() => navigate("/history")}
    />
  );
}
