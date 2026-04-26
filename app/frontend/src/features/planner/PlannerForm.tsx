/**
 * PlannerForm — collects trip inputs and triggers the HOS simulation.
 *
 * Four required fields: current location, pickup, dropoff, and cycle hours used.
 * Renders field-level errors from both client validation and API 400 responses.
 * Transitions to a loading state while the Celery task is processing.
 */

import { useEffect, useRef } from "react";
import { plannerStyles as s } from "./planner.styles";
import { type FormValues, type FormErrors } from "./useTripPlanner";
import { colors, transitions } from "@/tokens";
import {
  MapPin,
  Truck,
  Clock,
  Calendar,
  Loader,
} from "@/components/icons";
import { Field } from "./PlannerForm.Field";

interface PlannerFormProps {
  values: FormValues;
  errors: FormErrors;
  isLoading: boolean;
  pollingStatus: string;
  onFieldChange: (field: keyof FormValues, value: string) => void;
  onSubmit: () => void;
}

export function PlannerForm({
  values,
  errors,
  isLoading,
  pollingStatus,
  onFieldChange,
  onSubmit,
}: PlannerFormProps) {
  const firstErrorRef = useRef<HTMLDivElement>(null);

  // Move focus to global error when it appears
  useEffect(() => {
    if (errors.global) firstErrorRef.current?.focus();
  }, [errors.global]);

  const buttonLabel =
    pollingStatus === "polling"
      ? "Calculating route…"
      : pollingStatus === "submitting"
        ? "Submitting…"
        : "Plan My Trip";

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Header */}
        <div style={s.header}>
          <p style={s.eyebrow}>FMCSA Compliant</p>
          <h1 style={s.title}>Trucker Trip Planner</h1>
          <p style={s.subtitle}>
            Enter your trip details to generate a compliant ELD log and route
            plan.
          </p>
        </div>

        {/* Global error */}
        {errors.global && (
          <div
            ref={firstErrorRef}
            tabIndex={-1}
            role="alert"
            style={s.globalError}
          >
            {errors.global}
          </div>
        )}

        {/* Location fields */}
        <div style={s.fieldGroup}>
          <Field
            id="current_location"
            label="Current Location"
            icon={<MapPin size={16} strokeWidth={2} />}
            value={values.current_location}
            error={errors.current_location}
            placeholder="e.g. Chicago, IL"
            onChange={(v) => onFieldChange("current_location", v)}
          />
          <Field
            id="pickup_location"
            label="Pickup Location"
            icon={<Truck size={16} strokeWidth={2} />}
            value={values.pickup_location}
            error={errors.pickup_location}
            placeholder="e.g. Indianapolis, IN"
            onChange={(v) => onFieldChange("pickup_location", v)}
          />
          <Field
            id="dropoff_location"
            label="Dropoff Location"
            icon={<MapPin size={16} strokeWidth={2} />}
            value={values.dropoff_location}
            error={errors.dropoff_location}
            placeholder="e.g. Nashville, TN"
            onChange={(v) => onFieldChange("dropoff_location", v)}
          />
        </div>

        <div style={s.divider} />

        {/* HOS + time fields */}
        <div style={{ ...s.fieldGroup, ...s.inlineRow }}>
          <Field
            id="cycle_hours_used"
            label="Cycle Hours Used"
            icon={<Clock size={16} strokeWidth={2} />}
            value={values.cycle_hours_used}
            error={errors.cycle_hours_used}
            placeholder="0"
            type="number"
            min="0"
            max="70"
            step="0.5"
            hint="Hours on duty this 8-day cycle (0–70)"
            onChange={(v) => onFieldChange("cycle_hours_used", v)}
          />
          <Field
            id="start_time"
            label="Departure Time"
            icon={<Calendar size={16} strokeWidth={2} />}
            value={values.start_time}
            error={errors.start_time}
            placeholder=""
            type="datetime-local"
            onChange={(v) => onFieldChange("start_time", v)}
          />
        </div>

        {/* Submit */}
        <button
          type="button"
          disabled={isLoading}
          onClick={onSubmit}
          style={s.submitButton(isLoading)}
          onMouseEnter={(e) => {
            if (!isLoading) {
              Object.assign(e.currentTarget.style, {
                background: colors.primaryDark,
                transform: "translateY(-1px)",
                transition: `all ${transitions.fast}`,
              });
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              Object.assign(e.currentTarget.style, {
                background: colors.primary,
                transform: "translateY(0)",
              });
            }
          }}
        >
          {isLoading && (
            <Loader
              size={18}
              strokeWidth={2.5}
              style={{ animation: "spin 0.8s linear infinite" }}
            />
          )}

          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
