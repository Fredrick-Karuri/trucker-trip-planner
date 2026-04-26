/**
 * AuthContext — JWT auth state + Axios interceptor wiring.
 *
 * Exposes useAuth() to any component. Axios request interceptor injects
 * the Bearer token. Response interceptor silently refreshes on 401 and
 * retries once — if refresh fails, calls logout().
 */