/**
 * App — root component for the Trucker Trip Planner.
 *
 * Owns top-level view state: PlannerForm until simulation succeeds,
 * then ResultsView. Passes onReset back so the driver can plan another trip.
 */

import { PlannerForm } from "@/features/planner/PlannerForm";
import { ResultsView } from "@/features/results/ResultsView";
import { useTripPlanner } from "@/features/planner/useTripPlanner";

export default function App() {
  const { values, errors, status, result, updateField, submit, reset, isLoading } =
    useTripPlanner();

  const showResults =
    status === "submitting" ||
    status === "polling" ||
    status === "error" ||
    status === "success";

  if (showResults) {
    return (
      <ResultsView
        result={result}
        status={status}
        errorMessage={errors.global}
        onReset={reset}
      />
    );
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