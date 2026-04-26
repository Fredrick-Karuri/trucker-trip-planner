import { type CSSProperties, useRef } from "react";
import { plannerStyles as s } from "./planner.styles";
import { colors } from "@/tokens";
import {AlertCircle} from "@/components/icons";

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

export function Field({
  id,
  label,
  icon,
  value,
  error,
  placeholder,
  type = "text",
  min,
  max,
  step,
  hint,
  onChange,
}: FieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusStyle: CSSProperties = {
    borderColor: error ? colors.danger : colors.primary,
    boxShadow: error
      ? `0 0 0 3px ${colors.danger}22`
      : `0 0 0 3px ${colors.primary}22`,
  };

  return (
    <div>
      <label htmlFor={id} style={s.label}>
        {label}
      </label>
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
          onBlur={(e) =>
            Object.assign(e.currentTarget.style, {
              borderColor: error ? colors.danger : colors.surfaceBorder,
              boxShadow: "none",
            })
          }
        />
      </div>
      {hint && !error && <p style={s.cycleHint}>{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" style={s.errorText}>
          <AlertCircle size={12} strokeWidth={2.5} /> {error}
        </p>
      )}
    </div>
  );
}