/**
 * Shared UI primitives.
 *
 * Rules:
 * - Components own no business logic — props in, rendered output out.
 * - All styling consumes tokens; no feature-specific colors here.
 * - Each export is a single self-contained component.
 */

import type { CSSProperties, ReactNode } from "react";
import { colors, radius, shadows} from "@/tokens";


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