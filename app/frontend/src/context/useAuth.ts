import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import { AuthContextValue } from "./type";

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}