/**
 * App — root component with react-router-dom routing.
 *
 * Routes:
 *   /           → PlannerForm / ResultsView (protected)
 *   /login      → AuthForm (public)
 *   /history    → TripHistoryPage (protected)
 *   /trips/:id  → ResultsView replayed from stored result (protected)
 */
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthForm } from "@/features/auth/AuthForm";
import { TripHistoryPage } from "@/features/history/TripHistoryPage";
import { PlannerForm } from "@/features/planner/PlannerForm";
import { ResultsView } from "@/features/results/ResultsView";
import { useTripPlanner } from "@/features/planner/useTripPlanner";
import { TripReplayPage } from "@/features/results/TripReplayPage";
import { AuthProvider } from "./context/AuthProvider";

function PlannerRoot() {
  const { values, errors, status, result, updateField, submit, reset, isLoading } =
    useTripPlanner();

  const showResults =
    status === "submitting" || status === "polling" ||
    status === "error" || status === "success";

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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthForm />} />
          <Route path="/" element={<ProtectedRoute><PlannerRoot /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><TripHistoryPage /></ProtectedRoute>} />
          <Route path="/trips/:tripId" element={<ProtectedRoute><TripReplayPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}