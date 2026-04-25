/**
 * App — root component for the Trucker Trip Planner.
 *
 * Owns the top-level view state: the planner form is shown until a simulation
 * completes successfully, at which point the results view takes over.
 * Passing `onReset` back into the results view lets the driver plan another trip.
 */

import { PlannerForm } from "@/features/planner/PlannerForm";
import { useTripPlanner } from "@/features/planner/useTripPlanner";
import type { TripPlanResponse } from "@/types";

// Results view is built in Sprint 3 (ELD-16). This placeholder keeps the
// app fully functional end-to-end from Sprint 1 so the planner + polling
// loop can be tested immediately without waiting for the results UI.
function ResultsPlaceholder({
  result,
  onReset,
}: {
  result: TripPlanResponse;
  onReset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        padding: "32px",
        fontFamily: "'DM Sans', sans-serif",
        color: "#f0eeec",
      }}
    >
      <h2 style={{ fontSize: "24px", fontWeight: 600, margin: 0 }}>
        Trip Planned ✓
      </h2>
      <p style={{ color: "#9e9b99", margin: 0 }}>
        {result.summary.total_miles} miles · {result.summary.total_duration_hrs} hrs ·{" "}
        {result.daily_logs.length} day{result.daily_logs.length !== 1 ? "s" : ""}
      </p>
      <p style={{ color: "#5c5a58", fontSize: "13px", margin: 0 }}>
        Map + ELD log sheets render here in Sprint 3.
      </p>
      <button
        onClick={onReset}
        style={{
          marginTop: "8px",
          padding: "10px 24px",
          background: "#177E89",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "15px",
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Plan Another Trip
      </button>
    </div>
  );
}

export default function App() {
  const { values, errors, status, result, updateField, submit, reset, isLoading } =
    useTripPlanner();

  if (status === "success" && result) {
    return <ResultsPlaceholder result={result} onReset={reset} />;
  }

  return (
    <PlannerForm
      values={values}
      errors={errors}
      isLoading={isLoading}
      pollingStatus={status}
      onFieldChange={updateField}
      onSubmit={submit}
    />
  );
}