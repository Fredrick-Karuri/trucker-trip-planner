/**
 * Global design tokens for the Trucker Trip Planner.
 *
 * This is the ONLY file that may reference hex values directly.
 * Every component and feature style file imports from here — never hardcodes.
 */

export const colors = {
  primary: "#177E89",
  primaryDark: "#0f5a63",
  primaryLight: "#1a9aaa",
  deepTeal: "#1a4a4f",
  surface: "#323031",
  surfaceHover: "#3d3b3a",
  surfaceBorder: "#454342",
  background: "#1e1c1d",
  backgroundDeep: "#161415",
  onPrimary: "#ffffff",
  onSurface: "#f0eeec",
  onSurfaceMuted: "#9e9b99",
  onSurfaceFaint: "#5c5a58",

  // Status colours — used for duty-status labels and log sheet rows
  statusDriving: "#177E89",
  statusOffDuty: "#4a7c59",
  statusOnDuty: "#c9892a",
  statusSleeper: "#5a6fa8",

  // Semantic
  danger: "#c0392b",
  dangerLight: "#e74c3c",
  warning: "#e67e22",
  success: "#27ae60",
  info: "#2980b9",

  // Stop marker colours
  markerOrigin: "#177E89",
  markerPickup: "#c9892a",
  markerDropoff: "#e74c3c",
  markerRest: "#5a6fa8",
  markerBreak: "#4a7c59",
  markerFuel: "#8b6914",
} as const;

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
  "3xl": "64px",
} as const;

export const radius = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
} as const;

export const typography = {
  fontSans: "'DM Sans', sans-serif",
  fontMono: "'JetBrains Mono', monospace",

  sizeXs: "11px",
  sizeSm: "13px",
  sizeMd: "15px",
  sizeLg: "18px",
  sizeXl: "22px",
  size2xl: "28px",
  size3xl: "36px",

  weightNormal: "400",
  weightMedium: "500",
  weightSemibold: "600",
} as const;

export const transitions = {
  fast: "120ms ease",
  base: "200ms ease",
  slow: "350ms ease",
} as const;

export const shadows = {
  sm: "0 1px 3px rgba(0,0,0,0.4)",
  md: "0 4px 12px rgba(0,0,0,0.5)",
  lg: "0 8px 32px rgba(0,0,0,0.6)",
  glow: `0 0 20px rgba(23,126,137,0.35)`,
} as const;