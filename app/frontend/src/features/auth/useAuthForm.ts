/**
 * useAuthForm — manages register/login form state, validation, and submission.
 */
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "@/services/api";
import { extractApiError } from "@/services/api";
import type { ApiFieldError } from "@/types";
import { useAuth } from "@/context/useAuth";

export type AuthMode = "login" | "register";

interface FormValues {
  email: string;
  password: string;
  confirm_password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirm_password?: string;
  global?: string;
}

const EMPTY: FormValues = { email: "", password: "", confirm_password: "" };

function validate(values: FormValues, mode: AuthMode): FormErrors {
  const errors: FormErrors = {};
  if (!values.email.trim()) errors.email = "Email is required.";
  else if (!/\S+@\S+\.\S+/.test(values.email)) errors.email = "Enter a valid email.";
  if (!values.password) errors.password = "Password is required.";
  else if (values.password.length < 8) errors.password = "Password must be at least 8 characters.";
  if (mode === "register" && values.password !== values.confirm_password) {
    errors.confirm_password = "Passwords do not match.";
  }
  return errors;
}

export function useAuthForm(mode: AuthMode) {
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const updateField = useCallback((field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const submit = useCallback(async () => {
    const clientErrors = validate(values, mode);
    if (Object.keys(clientErrors).length) { setErrors(clientErrors); return; }

    setLoading(true);
    setErrors({});
    try {
      const tokens = mode === "login"
        ? await loginUser({ email: values.email, password: values.password })
        : await registerUser({ email: values.email, password: values.password, confirm_password: values.confirm_password });
      login(tokens);
      navigate("/");
    } catch (err) {
      const apiError = extractApiError(err);
      if (apiError.field_errors?.length) {
        const mapped: FormErrors = {};
        apiError.field_errors.forEach((fe: ApiFieldError) => {
          (mapped as Record<string, string>)[fe.field] = fe.message;
        });
        setErrors(mapped);
      } else {
        setErrors({ global: apiError.error ?? "Something went wrong." });
      }
    } finally {
      setLoading(false);
    }
  }, [values, mode, login, navigate]);

  return { values, errors, loading, updateField, submit };
}