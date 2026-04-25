/**
 * Shared TypeScript types for the Trucker Trip Planner.
 * These mirror the API contract defined in the system design (p.16–17).
 */

// ─── Request ──────────────────────────────────────────────────────────────────

export interface TripPlanRequest {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  cycle_hours_used: number;
  start_time: string; // ISO 8601 with Z suffix
}

// ─── Response ─────────────────────────────────────────────────────────────────

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
  arrival: string; // ISO 8601
  duration_min: number;
  lat?: number;
  lng?: number;
}

export interface LogSegment {
  status: DutyStatus;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  duration_hrs: number;
  location?: string;
}

export interface LogRemark {
  time: string; // "HH:MM"
  note: string;
}

export interface DailyLogEntry {
  date: string; // "YYYY-MM-DD"
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
  eta: string; // ISO 8601
}

export interface TripPlanResponse {
  trip_id: string;
  summary: TripSummary;
  route: {
    geojson: GeoJSON.Feature<GeoJSON.LineString>;
  };
  stops: TripStop[];
  daily_logs: DailyLogEntry[];
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