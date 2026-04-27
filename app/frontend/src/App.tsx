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
import { TripReplayPage } from "@/features/results/TripReplayPage";
import { AuthProvider } from "./context/AuthProvider";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthForm />} />
          <Route
            path="/"
            element={<ProtectedRoute><TripHistoryPage /></ProtectedRoute>}
          />
          <Route
            path="/trips/:tripId"
            element={<ProtectedRoute><TripReplayPage /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}