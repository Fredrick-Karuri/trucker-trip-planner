/**
 * Shared TypeScript types for the Trucker Trip Planner.
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

// ─── Trip request / response ──────────────────────────────────────────────────

export interface TripPlanRequest {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  cycle_hours_used: number;
  start_time: string;
}

export type DutyStatus =
  | "OFF_DUTY"
  | "SLEEPER_BERTH"
  | "DRIVING"
  | "ON_DUTY_NOT_DRIVING";

export type StopType =
  | "ORIGIN"
  | "PICKUP"
  | "DROPOFF"
  | "REST_10HR"
  | "BREAK_30MIN"
  | "FUEL_STOP";

export interface TripStop {
  type: StopType;
  location: string;
  arrival: string;
  duration_min: number;
  lat?: number;
  lng?: number;
}

export interface LogSegment {
  status: DutyStatus;
  start: string;
  end: string;
  duration_hrs: number;
  location?: string;
}

export interface LogRemark {
  time: string;
  note: string;
}

export interface DailyLogEntry {
  date: string;
  segments: LogSegment[];
  totals: {
    off_duty: number;
    sleeper: number;
    driving: number;
    on_duty: number;
  };
  remarks: LogRemark[];
}

export interface TripSummary {
  total_miles: number;
  total_duration_hrs: number;
  total_drive_hrs: number;
  eta: string;
}

export interface TripPlanResponse {
  trip_id: string;
  summary: TripSummary;
  route: { geojson: GeoJSON.Feature<GeoJSON.LineString> };
  stops: TripStop[];
  daily_logs: DailyLogEntry[];
}

// ─── History ──────────────────────────────────────────────────────────────────

export interface TripHistoryItem {
  id: string;
  created_at: string;
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  total_miles: number | null;
  total_duration_hrs: number | null;
  eta: string | null;
  log_days: number;
}

export interface TripHistoryPage {
  count: number;
  total_pages: number;
  page: number;
  results: TripHistoryItem[];
}

// ─── Task polling ─────────────────────────────────────────────────────────────

export type TaskStatus = "PENDING" | "STARTED" | "SUCCESS" | "FAILURE";

export interface TaskStatusResponse {
  task_id: string;
  status: TaskStatus;
  result?: TripPlanResponse;
  error?: string;
}

// ─── API errors ───────────────────────────────────────────────────────────────

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiError {
  error?: string;
  field_errors?: ApiFieldError[];
}