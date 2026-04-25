/**
 * LogTabs — tabbed navigation across multiple daily ELD log sheets.
 *
 * Renders one tab per calendar day. The active sheet renders below the tabs.
 * Print styles (global.css) hide tabs and show only the active log sheet.
 */

import { useState } from "react";
import { LogSheet } from "./LogSheet";
import { colors, radius, spacing, transitions, typography } from "@/tokens";
import type { DailyLogEntry } from "@/types";

interface LogTabsProps {
  logs: DailyLogEntry[];
}

export function LogTabs({ logs }: LogTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!logs.length) return null;

  const activeLog = logs[activeIndex];

  return (
    <div>
      {/* Tab bar */}
      <div
        className="no-print"
        style={{
          display: "flex",
          gap: "4px",
          overflowX: "auto",
          paddingBottom: spacing.sm,
          marginBottom: spacing.sm,
          borderBottom: `1px solid ${colors.surfaceBorder}`,
        }}
      >
        {logs.map((log, i) => {
          const isActive = i === activeIndex;
          const dateObj = new Date(log.date + "T00:00:00Z");
          const short = dateObj.toLocaleDateString(undefined, {
            month: "short", day: "numeric", timeZone: "UTC",
          });
          const weekday = dateObj.toLocaleDateString(undefined, {
            weekday: "short", timeZone: "UTC",
          });

          return (
            <button
              key={log.date}
              role="tab"
              aria-selected={isActive}
              aria-controls={`log-panel-${i}`}
              id={`log-tab-${i}`}
              onClick={() => setActiveIndex(i)}
              style={{
                padding: `${spacing.xs} ${spacing.md}`,
                borderRadius: radius.md,
                border: `1px solid ${isActive ? colors.primary : colors.surfaceBorder}`,
                background: isActive ? `${colors.primary}22` : "transparent",
                color: isActive ? colors.primary : colors.onSurfaceMuted,
                fontSize: typography.sizeSm,
                fontWeight: isActive ? typography.weightSemibold : typography.weightNormal,
                fontFamily: typography.fontSans,
                cursor: "pointer",
                whiteSpace: "nowrap" as const,
                transition: `all ${transitions.fast}`,
                display: "flex",
                flexDirection: "column" as const,
                alignItems: "center",
                gap: "1px",
                minWidth: "56px",
              }}
            >
              <span style={{ fontSize: typography.sizeXs, opacity: 0.75 }}>{weekday}</span>
              <span>{short}</span>
              <span
                style={{
                  fontSize: "9px",
                  opacity: 0.6,
                  fontFamily: typography.fontMono,
                }}
              >
                Day {i + 1}
              </span>
            </button>
          );
        })}

        {/* Print current sheet button */}
        <button
          onClick={() => window.print()}
          style={{
            marginLeft: "auto",
            padding: `${spacing.xs} ${spacing.md}`,
            borderRadius: radius.md,
            border: `1px solid ${colors.surfaceBorder}`,
            background: "transparent",
            color: colors.onSurfaceMuted,
            fontSize: typography.sizeSm,
            fontFamily: typography.fontSans,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: spacing.xs,
            transition: `all ${transitions.fast}`,
            whiteSpace: "nowrap" as const,
          }}
          title="Print current log sheet"
        >
          <PrintIcon /> Print
        </button>
      </div>

      {/* Active log sheet panel */}
      <div
        id={`log-panel-${activeIndex}`}
        role="tabpanel"
        aria-labelledby={`log-tab-${activeIndex}`}
      >
        <LogSheet log={activeLog} />
      </div>
    </div>
  );
}

function PrintIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}