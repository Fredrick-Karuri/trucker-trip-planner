import { useEffect, useRef } from "react";
import { plannerStyles as s } from "./planner.styles";
import { colors, transitions } from "@/tokens";
import { MapPin, Truck, Clock, Calendar, Loader } from "@/components/icons";
import { Field } from "./PlannerForm.Field";
import { type FormValues, type FormErrors } from "./useTripPlanner";

interface PlannerFormProps {
  values: FormValues;
  errors: FormErrors;
  isLoading: boolean;
  pollingStatus: string;
  onFieldChange: (field: keyof FormValues, value: string) => void;
  onSubmit: () => void;
  open?: boolean;
  onClose?: () => void;
}

export function PlannerForm({
  values,
  errors,
  isLoading,
  pollingStatus,
  onFieldChange,
  onSubmit,
  open,
  onClose,
}: PlannerFormProps) {
  const firstErrorRef = useRef<HTMLDivElement>(null);
  const isModal = open !== undefined;

  useEffect(() => {
    if (errors.global) firstErrorRef.current?.focus();
  }, [errors.global]);

  // Trap Escape key when used as modal
  useEffect(() => {
    if (!isModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isModal, onClose]);

  if (isModal && !open) return null;

  const buttonLabel =
    pollingStatus === "polling"
      ? "Calculating route…"
      : pollingStatus === "submitting"
        ? "Submitting…"
        : "Plan My Trip";

  const card = (
    <div style={s.card}>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close planner"
          style={s.closeButton}
        >
          ✕
        </button>
      )}

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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

      <button
        type="button"
        disabled={isLoading}
        onClick={onSubmit}
        style={s.submitButton(isLoading)}
        onMouseEnter={(e) => {
          if (!isLoading)
            Object.assign(e.currentTarget.style, {
              background: colors.primaryDark,
              transform: "translateY(-1px)",
              transition: `all ${transitions.fast}`,
            });
        }}
        onMouseLeave={(e) => {
          if (!isLoading)
            Object.assign(e.currentTarget.style, {
              background: colors.primary,
              transform: "translateY(0)",
            });
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
  );

  if (!isModal) return <div style={s.page}>{card}</div>;

  return (
    <>
      <div onClick={onClose} style={s.backdrop} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Plan new trip"
        style={s.modalShell}
      >
        <div onClick={(e) => e.stopPropagation()}>{card}</div>
      </div>
    </>
  );
}