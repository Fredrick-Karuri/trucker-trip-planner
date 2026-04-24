/**
 * PlannerForm — collects trip inputs and triggers the HOS simulation.
 *
 * Four required fields: current location, pickup, dropoff, and cycle hours used.
 * Renders field-level errors from both client validation and API 400 responses.
 * Transitions to a loading state while the Celery task is processing.
 */

import { type CSSProperties, useEffect, useRef } from "react";
import { plannerStyles as s } from "./planner.styles";
import { type FormValues, type FormErrors } from "./useTripPlanner";
import { colors, transitions } from "@/tokens";

// ─── Icons (inline SVG — no icon library dep) ────────────────────────────────

function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconTruck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 5v3h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 1010 10" style={{ animation: "spin 0.8s linear infinite", transformOrigin: "center" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

// ─── Field component ─────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  error?: string;
  placeholder: string;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
  hint?: string;
  onChange: (v: string) => void;
}

function Field({ id, label, icon, value, error, placeholder, type = "text", min, max, step, hint, onChange }: FieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusStyle: CSSProperties = {
    borderColor: error ? colors.danger : colors.primary,
    boxShadow: error ? `0 0 0 3px ${colors.danger}22` : `0 0 0 3px ${colors.primary}22`,
  };

  return (
    <div>
      <label htmlFor={id} style={s.label}>{label}</label>
      <div style={s.inputWrapper}>
        <span style={s.inputIcon}>{icon}</span>
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error}
          style={s.input(!!error)}
          onFocus={(e) => Object.assign(e.currentTarget.style, focusStyle)}
          onBlur={(e) => Object.assign(e.currentTarget.style, { borderColor: error ? colors.danger : colors.surfaceBorder, boxShadow: "none" })}
        />
      </div>
      {hint && !error && <p style={s.cycleHint}>{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" style={s.errorText}>
          <IconAlert /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface PlannerFormProps {
  values: FormValues;
  errors: FormErrors;
  isLoading: boolean;
  pollingStatus: string;
  onFieldChange: (field: keyof FormValues, value: string) => void;
  onSubmit: () => void;
}

export function PlannerForm({ values, errors, isLoading, pollingStatus, onFieldChange, onSubmit }: PlannerFormProps) {
  const firstErrorRef = useRef<HTMLDivElement>(null);

  // Move focus to global error when it appears
  useEffect(() => {
    if (errors.global) firstErrorRef.current?.focus();
  }, [errors.global]);

  const buttonLabel = pollingStatus === "polling"
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
            Enter your trip details to generate a compliant ELD log and route plan.
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
            icon={<IconPin />}
            value={values.current_location}
            error={errors.current_location}
            placeholder="e.g. Chicago, IL"
            onChange={(v) => onFieldChange("current_location", v)}
          />
          <Field
            id="pickup_location"
            label="Pickup Location"
            icon={<IconTruck />}
            value={values.pickup_location}
            error={errors.pickup_location}
            placeholder="e.g. Indianapolis, IN"
            onChange={(v) => onFieldChange("pickup_location", v)}
          />
          <Field
            id="dropoff_location"
            label="Dropoff Location"
            icon={<IconPin />}
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
            icon={<IconClock />}
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
            icon={<IconCalendar />}
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
          {isLoading && <Spinner />}
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}