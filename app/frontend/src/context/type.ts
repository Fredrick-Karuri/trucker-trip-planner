import type { AuthTokens, User } from "@/types";

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
}