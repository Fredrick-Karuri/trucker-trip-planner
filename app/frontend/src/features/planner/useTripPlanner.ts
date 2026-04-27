/**
 * useTripPlanner — manages the full lifecycle of a trip plan request.
 *
 * Handles form state, field-level validation, submission to the API,
 * and polling for the Celery task result. Returns a single clean
 * interface that the PlannerForm component binds to.
 */

import { useCallback, useRef, useState } from "react";
import { extractApiError, pollTaskStatus, submitTripPlan } from "@/services/api";
import type { ApiFieldError, TripPlanResponse, TripPlanRequest } from "@/types";

export interface FormValues {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  cycle_hours_used: string;
  start_time: string;
}

export interface FormErrors {
  current_location?: string;
  pickup_location?: string;
  dropoff_location?: string;
  cycle_hours_used?: string;
  start_time?: string;
  global?: string;
}

const INITIAL_VALUES: FormValues = {
  current_location: "",
  pickup_location: "",
  dropoff_location: "",
  cycle_hours_used: "0",
  start_time: new Date().toISOString().slice(0, 16),
};

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 120; // 3 minutes

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.current_location.trim()) {
    errors.current_location = "Current location is required.";
  }
  if (!values.pickup_location.trim()) {
    errors.pickup_location = "Pickup location is required.";
  }
  if (!values.dropoff_location.trim()) {
    errors.dropoff_location = "Dropoff location is required.";
  }

  const cycle = Number(values.cycle_hours_used);
  if (values.cycle_hours_used === "" || isNaN(cycle)) {
    errors.cycle_hours_used = "Enter a number between 0 and 70.";
  } else if (cycle < 0 || cycle > 70) {
    errors.cycle_hours_used = "Cycle hours must be between 0 and 70.";
  }

  if (!values.start_time) {
    errors.start_time = "Departure time is required.";
  }

  return errors;
}

function applyFieldErrors(base: FormErrors, fieldErrors: ApiFieldError[]): FormErrors {
  const updated = { ...base };
  for (const fe of fieldErrors) {
    const key = fe.field as keyof FormErrors;
    if (key in INITIAL_VALUES || key === "global") {
      updated[key] = fe.message;
    }
  }
  return updated;
}

export type PlannerStatus =
  | "idle"
  | "submitting"
  | "polling"
  | "success"
  | "error";

export function useTripPlanner() {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<PlannerStatus>("idle");
  const [result, setResult] = useState<TripPlanResponse | null>(null);
  const pollCount = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateField = useCallback(
    (field: keyof FormValues, value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      // Clear the error for this field on change
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const poll = useCallback(
    async (taskId: string,tripId: string) => {
      if (pollCount.current >= MAX_POLL_ATTEMPTS) {
        stopPolling();
        setStatus("error");
        setErrors({ global: "Simulation timed out. Please try again." });
        return;
      }

      pollCount.current += 1;

      try {
        const taskStatus = await pollTaskStatus(taskId);

        if (taskStatus.status === "SUCCESS" && taskStatus.result) {
          stopPolling();
          setResult({ ...taskStatus.result, trip_id: tripId });
          setStatus("success");
          return;
        }

        if (taskStatus.status === "FAILURE") {
          stopPolling();
          setStatus("error");
          setErrors({ global: taskStatus.error ?? "Simulation failed." });
          return;
        }

        // Still PENDING or STARTED — schedule next poll
        pollTimer.current = setTimeout(() => poll(taskId,tripId), POLL_INTERVAL_MS);
      } catch (err) {
        stopPolling();
        const apiError = extractApiError(err);
        setStatus("error");
        setErrors({ global: apiError.error ?? "Failed to check simulation status." });
      }
    },
    [stopPolling]
  );

  const submit = useCallback(async () => {
    const validationErrors = validateForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setStatus("submitting");
    setErrors({});
    pollCount.current = 0;

    const payload: TripPlanRequest = {
      current_location: values.current_location.trim(),
      pickup_location: values.pickup_location.trim(),
      dropoff_location: values.dropoff_location.trim(),
      cycle_hours_used: Number(values.cycle_hours_used),
      start_time: new Date(values.start_time).toISOString(),
    };

    try {
      const { task_id,trip_id } = await submitTripPlan(payload);
      setStatus("polling");
      poll(task_id,trip_id);
    } catch (err) {
      const apiError = extractApiError(err);
      setStatus("error");

      if (apiError.field_errors?.length) {
        setErrors(applyFieldErrors({}, apiError.field_errors));
      } else {
        setErrors({ global: apiError.error ?? "Submission failed. Please try again." });
      }
    }
  }, [values, poll]);

  const reset = useCallback(() => {
    stopPolling();
    setValues(INITIAL_VALUES);
    setErrors({});
    setStatus("idle");
    setResult(null);
    pollCount.current = 0;
  }, [stopPolling]);

  return {
    values,
    errors,
    status,
    result,
    updateField,
    submit,
    reset,
    isLoading: status === "submitting" || status === "polling",
  };
}