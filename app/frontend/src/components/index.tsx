/**
 * Shared UI primitives for the Trucker Trip Planner.
 *
 * Rules:
 * - Components own no business logic — props in, rendered output out.
 * - All styling consumes tokens; no feature-specific colors here.
 * - Each export is a single self-contained component.
 */

import type { CSSProperties, ReactNode } from "react";
import { colors, radius, shadows, spacing, transitions, typography } from "@/tokens";
import type { DutyStatus } from "@/types";

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
}

export function Button({
  children, onClick, variant = "primary", disabled = false, fullWidth = false, type = "button",
}: ButtonProps) {
  const base: CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: spacing.xs, padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: radius.md, fontSize: typography.sizeMd, fontWeight: typography.weightMedium,
    fontFamily: typography.fontSans, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1, border: "1px solid transparent",
    transition: `all ${transitions.fast}`,
    width: fullWidth ? "100%" : undefined,
  };
  const variants: Record<string, CSSProperties> = {
    primary:   { background: colors.primary, color: colors.onPrimary, boxShadow: shadows.glow },
    secondary: { background: colors.surface, color: colors.onSurface, borderColor: colors.surfaceBorder },
    ghost:     { background: "transparent", color: colors.onSurfaceMuted, borderColor: "transparent" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

const BADGE_COLORS: Record<DutyStatus, { bg: string; text: string }> = {
  DRIVING:             { bg: `${colors.statusDriving}22`,  text: colors.statusDriving },
  OFF_DUTY:            { bg: `${colors.statusOffDuty}22`,  text: colors.statusOffDuty },
  ON_DUTY_NOT_DRIVING: { bg: `${colors.statusOnDuty}22`,   text: colors.statusOnDuty },
  SLEEPER_BERTH:       { bg: `${colors.statusSleeper}22`,  text: colors.statusSleeper },
};

interface BadgeProps { status: DutyStatus }

export function Badge({ status }: BadgeProps) {
  const c = BADGE_COLORS[status];
  const labels: Record<DutyStatus, string> = {
    DRIVING: "Driving", OFF_DUTY: "Off Duty",
    ON_DUTY_NOT_DRIVING: "On Duty (ND)", SLEEPER_BERTH: "Sleeper",
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: radius.full,
      fontSize: typography.sizeXs, fontWeight: typography.weightMedium,
      background: c.bg, color: c.text,
    }}>
      {labels[status]}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps { children: ReactNode; style?: CSSProperties }

export function Card({ children, style }: CardProps) {
  return (
    <div style={{
      background: colors.surface, borderRadius: radius.lg,
      border: `1px solid ${colors.surfaceBorder}`,
      boxShadow: shadows.sm, ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

interface SpinnerProps { size?: number; color?: string }

export function Spinner({ size = 24, color = colors.primary }: SpinnerProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: "spin 0.8s linear infinite", transformOrigin: "center", display: "block" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M12 2a10 10 0 1010 10" />
    </svg>
  );
}

// ─── StatusIcon ───────────────────────────────────────────────────────────────

interface StatusIconProps { status: DutyStatus; size?: number }

export function StatusIcon({ status, size = 16 }: StatusIconProps) {
  const c = BADGE_COLORS[status].text;
  const icons: Record<DutyStatus, JSX.Element> = {
    DRIVING: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    OFF_DUTY: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    ON_DUTY_NOT_DRIVING: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    SLEEPER_BERTH: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17h18M3 17V7h18v10M7 12h2m4 0h4"/>
      </svg>
    ),
  };
  return icons[status];
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ style }: { style?: CSSProperties }) {
  return (
    <hr style={{
      border: "none", borderTop: `1px solid ${colors.surfaceBorder}`,
      margin: `${spacing.md} 0`, ...style,
    }} />
  );
}