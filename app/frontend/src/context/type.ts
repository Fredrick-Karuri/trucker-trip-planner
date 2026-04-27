import type { AuthTokens, User } from "@/types";

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  authReady: boolean;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
}