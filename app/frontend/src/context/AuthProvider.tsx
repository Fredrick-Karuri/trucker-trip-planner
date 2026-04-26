
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import client from "@/services/api";
import type { AuthTokens, User } from "@/types";
import { AuthContext } from "./AuthContext";

// ─── Storage keys ─────────────────────────────────────────────────────────────

const ACCESS_KEY = "ttp_access";
const REFRESH_KEY = "ttp_refresh";
const USER_KEY = "ttp_user";


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  });

  const isRefreshing = useRef(false);
  const failedQueue = useRef<Array<(token: string) => void>>([]);

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const login = useCallback((tokens: AuthTokens) => {
    localStorage.setItem(ACCESS_KEY, tokens.access);
    localStorage.setItem(REFRESH_KEY, tokens.refresh);
    localStorage.setItem(USER_KEY, JSON.stringify(tokens.user));
    setUser(tokens.user);
  }, []);

  // ── Axios interceptors ──────────────────────────────────────────────────────
  useEffect(() => {
    const reqId = client.interceptors.request.use((config) => {
      const token = localStorage.getItem(ACCESS_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    const resId = client.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config;
        if (error.response?.status !== 401 || original._retry) {
          return Promise.reject(error);
        }
        original._retry = true;

        if (isRefreshing.current) {
          return new Promise((resolve) => {
            failedQueue.current.push((token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(client(original));
            });
          });
        }

        isRefreshing.current = true;
        const refresh = localStorage.getItem(REFRESH_KEY);

        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL ?? ""}/api/auth/refresh/`,
            { refresh }
          );
          const newAccess: string = data.access;
          localStorage.setItem(ACCESS_KEY, newAccess);
          failedQueue.current.forEach((cb) => cb(newAccess));
          failedQueue.current = [];
          original.headers.Authorization = `Bearer ${newAccess}`;
          return client(original);
        } catch {
          logout();
          return Promise.reject(error);
        } finally {
          isRefreshing.current = false;
        }
      }
    );

    return () => {
      client.interceptors.request.eject(reqId);
      client.interceptors.response.eject(resId);
    };
  }, [logout]);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, login, logout }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
