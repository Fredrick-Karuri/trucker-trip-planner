/**
 * ResultsView — full results layout after a successful simulation.
 *
 * Layout: sticky auth-aware summary bar → map (top) → stop timeline sidebar → tabbed ELD logs.
 * AUTH-08: summary bar shows driver email + logout + history link when authenticated.
 */
import {
  colors,
  radius,
  shadows,
  spacing,
  transitions,
  typography,
} from "@/tokens";
import { MapRenderer } from "@/features/map/MapRenderer";
import { LogTabs } from "@/features/logs/LogTabs";
import { Card, Spinner } from "@/components";
import type { TripPlanResponse } from "@/types";
import type { PlannerStatus } from "@/features/planner/useTripPlanner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";

// ─── Summary bar ──────────────────────────────────────────────────────────────

interface SummaryBarProps {
  summary: TripPlanResponse["summary"];
  dayCount: number;
  onReset: () => void;
}

function SummaryBar({ summary, dayCount, onReset }: SummaryBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const eta = new Date(summary.eta).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const stats = [
    {
      label: "Total Miles",
      value: summary.total_miles.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      }),
    },
    {
      label: "Trip Duration",
      value: `${summary.total_duration_hrs.toFixed(1)} hrs`,
    },
    {
      label: "Drive Time",
      value: `${summary.total_drive_hrs?.toFixed(1) ?? "—"} hrs`,
    },
    { label: "ETA", value: eta },
    { label: "Log Days", value: String(dayCount) },
  ];

  return (
    <div
      className="no-print"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: `${colors.backgroundDeep}f0`,
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${colors.surfaceBorder}`,
        padding: `${spacing.sm} ${spacing.lg}`,
        display: "flex",
        alignItems: "center",
        gap: spacing.xl,
        flexWrap: "wrap" as const,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
          flexShrink: 0,
        }}
      >
        <TruckIcon />
        <span
          style={{
            fontSize: typography.sizeSm,
            fontWeight: typography.weightSemibold,
            color: colors.primary,
          }}
        >
          Trucker Trip Planner
        </span>
      </div>

      <div
        style={{
          width: "1px",
          height: "24px",
          background: colors.surfaceBorder,
        }}
      />

      {/* Stats */}
      <div
        style={{
          display: "flex",
          gap: spacing.xl,
          flexWrap: "wrap" as const,
          flex: 1,
        }}
      >
        {stats.map(({ label, value }) => (
          <div
            key={label}
            style={{
              display: "flex",
              flexDirection: "column" as const,
              gap: "1px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: colors.onSurfaceFaint,
                textTransform: "uppercase" as const,
                letterSpacing: "0.06em",
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontSize: typography.sizeSm,
                fontWeight: typography.weightSemibold,
                color: colors.onSurface,
                fontFamily: typography.fontMono,
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Right side actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
          flexShrink: 0,
        }}
      >
        {user && (
          <>
            <span
              style={{
                fontSize: typography.sizeXs,
                color: colors.onSurfaceFaint,
              }}
            >
              {user.email}
            </span>
            <NavBtn onClick={() => navigate("/history")}>History</NavBtn>
            <div
              style={{
                width: "1px",
                height: "16px",
                background: colors.surfaceBorder,
              }}
            />
            <NavBtn onClick={logout}>Logout</NavBtn>
            <div
              style={{
                width: "1px",
                height: "16px",
                background: colors.surfaceBorder,
              }}
            />
          </>
        )}
        <NavBtn onClick={onReset}>← New Trip</NavBtn>
      </div>
    </div>
  );
}

function NavBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        padding: `6px ${spacing.md}`,
        borderRadius: radius.md,
        border: `1px solid ${colors.surfaceBorder}`,
        background: "transparent",
        color: colors.onSurfaceMuted,
        fontSize: typography.sizeSm,
        fontFamily: typography.fontSans,
        cursor: "pointer",
        transition: `all ${transitions.fast}`,
        whiteSpace: "nowrap" as const,
      }}
    >
      {children}
    </button>
  );
}

// ─── Loading + Error panels ───────────────────────────────────────────────────

function LoadingPanel({ message }: { message: string }) {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.lg,
      }}
    >
      <Spinner size={36} />
      <div style={{ textAlign: "center" as const }}>
        <div
          style={{
            fontSize: typography.sizeMd,
            color: colors.onSurface,
            fontWeight: typography.weightMedium,
          }}
        >
          {message}
        </div>
        <div
          style={{
            fontSize: typography.sizeSm,
            color: colors.onSurfaceMuted,
            marginTop: spacing.xs,
          }}
        >
          Running FMCSA HOS simulation…
        </div>
      </div>
    </div>
  );
}

const ERROR_COPY: Record<string, { title: string; body: string }> = {
  "400": {
    title: "Invalid Trip Details",
    body: "One or more addresses could not be found. Please check your locations and try again.",
  },
  "422": {
    title: "Route Unavailable",
    body: "No truck-accessible route exists between those locations. HGV restrictions may apply.",
  },
  "503": {
    title: "Routing Service Unavailable",
    body: "The mapping service is temporarily down. Please wait and try again.",
  },
  default: {
    title: "Something Went Wrong",
    body: "An unexpected error occurred during simulation.",
  },
};

interface ErrorPanelProps {
  message: string;
  onReset: () => void;
}

function ErrorPanel({ message, onReset }: ErrorPanelProps) {
  const key =
    Object.keys(ERROR_COPY).find((k) => message.includes(k)) ?? "default";
  const copy = ERROR_COPY[key];
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xl,
      }}
    >
      <Card
        style={{
          maxWidth: "460px",
          width: "100%",
          padding: spacing.xl,
          textAlign: "center" as const,
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: spacing.md }}>🚫</div>
        <h2
          style={{
            fontSize: typography.sizeLg,
            fontWeight: typography.weightSemibold,
            color: colors.onSurface,
            margin: `0 0 ${spacing.sm}`,
          }}
        >
          {copy.title}
        </h2>
        <p
          style={{
            fontSize: typography.sizeSm,
            color: colors.onSurfaceMuted,
            marginBottom: spacing.lg,
          }}
        >
          {copy.body}
        </p>
        {message && message !== copy.body && (
          <p
            style={{
              fontSize: typography.sizeXs,
              color: colors.onSurfaceFaint,
              fontFamily: typography.fontMono,
              marginBottom: spacing.lg,
              padding: spacing.sm,
              background: colors.backgroundDeep,
              borderRadius: radius.sm,
            }}
          >
            {message}
          </p>
        )}
        <button
          onClick={onReset}
          type="button"
          style={{
            padding: `${spacing.sm} ${spacing.xl}`,
            borderRadius: radius.md,
            border: "none",
            background: colors.primary,
            color: colors.onPrimary,
            fontSize: typography.sizeMd,
            fontWeight: typography.weightMedium,
            fontFamily: typography.fontSans,
            cursor: "pointer",
            boxShadow: shadows.glow,
          }}
        >
          Try Again
        </button>
      </Card>
    </div>
  );
}

// ─── Stop timeline ────────────────────────────────────────────────────────────

const STOP_ICONS: Record<string, string> = {
  ORIGIN: "📍",
  PICKUP: "📦",
  DROPOFF: "🏁",
  REST_10HR: "😴",
  BREAK_30MIN: "☕",
  FUEL_STOP: "⛽",
};

function StopTimeline({ stops }: { stops: TripPlanResponse["stops"] }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column" as const,
        gap: "2px",
        maxHeight: "300px",
        overflowY: "auto" as const,
      }}
    >
      {stops.map((stop, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: spacing.sm,
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: radius.sm,
            borderLeft: `2px solid ${colors.surfaceBorder}`,
          }}
        >
          <span style={{ fontSize: "14px", flexShrink: 0 }}>
            {STOP_ICONS[stop.type] ?? "📌"}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: typography.sizeXs,
                fontWeight: typography.weightMedium,
                color: colors.onSurface,
              }}
            >
              {stop.type.replace(/_/g, " ")}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: colors.onSurfaceFaint,
                fontFamily: typography.fontMono,
              }}
            >
              {new Date(stop.arrival).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              · {stop.duration_min} min
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main layout ──────────────────────────────────────────────────────────────

interface ResultsViewProps {
  result: TripPlanResponse | null;
  status: PlannerStatus;
  errorMessage?: string;
  onReset: () => void;
}

export function ResultsView({
  result,
  status,
  errorMessage,
  onReset,
}: ResultsViewProps) {
  if (status === "submitting" || status === "polling") {
    return (
      <LoadingPanel
        message={
          status === "submitting"
            ? "Submitting trip…"
            : "Calculating route & HOS schedule…"
        }
      />
    );
  }
  if (status === "error")
    return (
      <ErrorPanel message={errorMessage ?? "Unknown error"} onReset={onReset} />
    );
  if (!result) return null;

  return (
    <div style={{ minHeight: "100vh", background: colors.background }}>
      <SummaryBar
        summary={result.summary}
        dayCount={result.daily_logs.length}
        onReset={onReset}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gridTemplateRows: "480px auto",
          gap: spacing.md,
          padding: spacing.md,
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div style={{ gridColumn: "1", gridRow: "1" }}>
          <MapRenderer result={result} />
        </div>
        <Card
          style={{
            gridColumn: "2",
            gridRow: "1",
            padding: spacing.md,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: typography.sizeXs,
              fontWeight: typography.weightMedium,
              color: colors.onSurfaceFaint,
              textTransform: "uppercase" as const,
              letterSpacing: "0.07em",
              marginBottom: spacing.sm,
            }}
          >
            Stop Timeline
          </div>
          <StopTimeline stops={result.stops} />
        </Card>
        <div style={{ gridColumn: "1 / -1", gridRow: "2" }}>
          <div
            style={{
              fontSize: typography.sizeXs,
              fontWeight: typography.weightMedium,
              color: colors.onSurfaceFaint,
              textTransform: "uppercase" as const,
              letterSpacing: "0.07em",
              marginBottom: spacing.sm,
            }}
          >
            ELD Daily Log Sheets
          </div>
          <LogTabs logs={result.daily_logs} />
        </div>
      </div>
    </div>
  );
}

function TruckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={colors.primary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 5v3h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
