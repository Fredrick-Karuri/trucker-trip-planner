/**
 * Axios API client .
 * All backend communication goes through this module.
 */
import axios, { AxiosError } from "axios";
import type {
  ApiError,
  AuthTokens,
  TaskStatusResponse,
  TripHistoryPage,
  TripPlanRequest,
  TripPlanResponse,
} from "@/types";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginUser(payload: { email: string; password: string }): Promise<AuthTokens> {
  const { data } = await client.post<AuthTokens>("/api/auth/login/", payload);
  return data;
}

export async function registerUser(payload: {
  email: string; password: string; confirm_password: string;
}): Promise<AuthTokens> {
  const { data } = await client.post<AuthTokens>("/api/auth/register/", payload);
  return data;
}

// ─── Trip planning ────────────────────────────────────────────────────────────

export async function submitTripPlan(payload: TripPlanRequest): Promise<{ task_id: string; trip_id: string }> {
  const { data } = await client.post<{ task_id: string; trip_id: string }>("/api/trip/plan/", payload);
  return data;
}

export async function pollTaskStatus(taskId: string): Promise<TaskStatusResponse> {
  const { data } = await client.get<TaskStatusResponse>(`/api/trip/status/${taskId}/`);
  return data;
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function fetchTripHistory(page = 1): Promise<TripHistoryPage> {
  const { data } = await client.get<TripHistoryPage>(`/api/trips/?page=${page}`);
  return data;
}

export async function fetchTripDetail(tripId: string): Promise<TripPlanResponse> {
  const { data } = await client.get<TripPlanResponse>(`/api/trips/${tripId}/`);
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