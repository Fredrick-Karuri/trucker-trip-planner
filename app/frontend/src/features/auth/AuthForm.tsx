/**
 * AuthForm — tabbed register / login card.
 *
 * Shared card layout matching PlannerForm. Tabs toggle between modes.
 * Field-level and global errors from both client validation and API responses
 * are rendered inline. On success, useAuthForm navigates to "/".
 */
import { useState } from "react";
import { authStyles as s } from "./auth.styles";
import { useAuthForm, type AuthMode } from "./useAuthForm";
import { colors } from "@/tokens";
import { Truck, Loader } from "@/components/icons";

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  error?: string;
  placeholder: string;
  onChange: (v: string) => void;
}

function Field({ id, label, type = "text", value, error, placeholder, onChange }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label htmlFor={id} style={s.label}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={error ? `${id}-err` : undefined}
        aria-invalid={!!error}
        style={{
          ...s.input(!!error),
          ...(focused ? {
            borderColor: error ? colors.danger : colors.primary,
            boxShadow: `0 0 0 3px ${error ? colors.danger : colors.primary}22`,
          } : {}),
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {error && <p id={`${id}-err`} role="alert" style={s.errorText}>{error}</p>}
    </div>
  );
}

interface ModeFormProps { mode: AuthMode }

function ModeForm({ mode }: ModeFormProps) {
  const { values, errors, loading, updateField, submit } = useAuthForm(mode);

  return (
    <>
      {errors.global && (
        <div role="alert" style={s.globalError}>{errors.global}</div>
      )}
      <div style={s.fieldGroup}>
        <Field
          id="email" label="Email address" type="email"
          value={values.email} error={errors.email}
          placeholder="driver@example.com"
          onChange={(v) => updateField("email", v)}
        />
        <Field
          id="password" label="Password" type="password"
          value={values.password} error={errors.password}
          placeholder="Min. 8 characters"
          onChange={(v) => updateField("password", v)}
        />
        {mode === "register" && (
          <Field
            id="confirm_password" label="Confirm password" type="password"
            value={values.confirm_password} error={errors.confirm_password}
            placeholder="Repeat password"
            onChange={(v) => updateField("confirm_password", v)}
          />
        )}
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={submit}
        style={s.submitButton(loading)}
      >
        {loading && 

        <Loader size={16} strokeWidth={2.5} style={{ animation: "spin 0.8s linear infinite" }} />

        }
        {loading
          ? mode === "login" ? "Signing in…" : "Creating account…"
          : mode === "login" ? "Sign In" : "Create Account"}
      </button>
    </>
  );
}

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("login");

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <Truck size={22} color={colors.primary} strokeWidth={2} />

          <span style={s.logoText}>Trucker Trip Planner</span>
        </div>

        <div style={s.tabRow}>
          {(["login", "register"] as AuthMode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              style={s.tab(mode === m)}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <ModeForm key={mode} mode={mode} />
      </div>
    </div>
  );
}