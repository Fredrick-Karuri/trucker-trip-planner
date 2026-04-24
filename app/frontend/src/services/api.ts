/**
 * Axios API client for the Trucker Trip Planner.
 *
 * All communication with the Django backend goes through this module.
 * Base URL is injected via VITE_API_URL at build time.
 */

import axios, { AxiosError } from "axios";
import type {
  ApiError,
  TaskStatusResponse,
  TripPlanRequest,
} from "@/types/";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

// ─── Trip planning ────────────────────────────────────────────────────────────

/** Submit a trip plan. Returns a task_id immediately (202 Accepted). */
export async function submitTripPlan(payload: TripPlanRequest): Promise<{ task_id: string }> {
  const { data } = await client.post<{ task_id: string }>("/api/trip/plan/", payload);
  return data;
}

/** Poll for simulation result by task ID. */
export async function pollTaskStatus(taskId: string): Promise<TaskStatusResponse> {
  const { data } = await client.get<TaskStatusResponse>(`/api/trip/status/${taskId}/`);
  return data;
}

// ─── Error helpers ────────────────────────────────────────────────────────────

export function extractApiError(err: unknown): ApiError {
  if (err instanceof AxiosError && err.response?.data) {
    return err.response.data as ApiError;
  }
  return { error: "An unexpected error occurred. Please try again." };
}

export function isServiceUnavailable(err: unknown): boolean {
  return err instanceof AxiosError && err.response?.status === 503;
}

export default client;