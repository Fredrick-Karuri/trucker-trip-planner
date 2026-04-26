import { useRef } from "react";
import { colors } from "@/tokens";
import { AlertCircle } from "@/components/icons";

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

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[--color-on-surface-muted] mb-1 tracking-wide"
      >
        {label}
      </label>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-[--color-on-surface-faint]">
          {icon}
        </span>
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
          className={`
            w-full pl-10 pr-3 py-2 rounded-md text-sm
            bg-[--color-background-deep] text-[--color-on-surface]
            border transition-all outline-none
            placeholder:text-[--color-on-surface-faint]
            focus:ring-2
            ${error
              ? "border-[--color-danger] focus:border-[--color-danger] focus:ring-[--color-danger]/20"
              : "border-[--color-surface-border] focus:border-[--color-primary] focus:ring-[--color-primary]/20"
            }
          `}
          onFocus={(e) =>
            Object.assign(e.currentTarget.style, {
              borderColor: error ? colors.danger : colors.primary,
              boxShadow: error
                ? `0 0 0 3px ${colors.danger}22`
                : `0 0 0 3px ${colors.primary}22`,
            })
          }
          onBlur={(e) =>
            Object.assign(e.currentTarget.style, {
              borderColor: error ? colors.danger : colors.surfaceBorder,
              boxShadow: "none",
            })
          }
        />
      </div>

      {hint && !error && (
        <p className="mt-1 text-xs text-[--color-on-surface-faint]">{hint}</p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1 text-xs text-[--color-danger-light] flex items-center gap-1"
        >
          <AlertCircle size={12} strokeWidth={2.5} />
          {error}
        </p>
      )}
    </div>
  );
}