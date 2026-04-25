/**
 * LogSheet — complete single-day FMCSA ELD log sheet.
 *
 * Composes: header fields, SVG duty-status grid, per-status totals, remarks.
 * Print styles hide everything except this component (see global.css .no-print).
 */

import { logStyles as s, ROW_COLORS } from "./logs.styles";
import { LogSheetGrid } from "./LogSheetGrid";
import type { DailyLogEntry } from "@/types";

interface TotalsBarProps {
  totals: DailyLogEntry["totals"];
}

function TotalsBar({ totals }: TotalsBarProps) {
  const items = [
    { key: "off_duty",  label: "Off Duty",      color: ROW_COLORS.OFF_DUTY,          value: totals.off_duty },
    { key: "sleeper",   label: "Sleeper",        color: ROW_COLORS.SLEEPER_BERTH,     value: totals.sleeper },
    { key: "driving",   label: "Driving",        color: ROW_COLORS.DRIVING,           value: totals.driving },
    { key: "on_duty",   label: "On Duty (ND)",   color: ROW_COLORS.ON_DUTY_NOT_DRIVING, value: totals.on_duty },
  ];

  return (
    <div style={s.totalsRow}>
      {items.map(({ key, label, color, value }) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={s.totalDot(color)} />
          <span style={s.totalLabel}>{label}</span>
          <span style={s.totalValue}>{value.toFixed(2)}h</span>
        </div>
      ))}
    </div>
  );
}

interface LogSheetProps {
  log: DailyLogEntry;
  tripId?: string;
}

export function LogSheet({ log, tripId }: LogSheetProps) {
  const dateObj = new Date(log.date + "T00:00:00Z");
  const dateLabel = dateObj.toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div style={s.container} className="print-log-sheet">
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerField}>
          <span style={s.headerLabel}>Date</span>
          <span style={s.headerValue}>{dateLabel}</span>
        </div>
        <div style={s.headerField}>
          <span style={s.headerLabel}>Driver</span>
          <span style={s.headerValue}>Property Carrier</span>
        </div>
        <div style={s.headerField}>
          <span style={s.headerLabel}>Cycle Rule</span>
          <span style={s.headerValue}>70 hrs / 8 days</span>
        </div>
      </div>

      {/* 24-hour SVG grid */}
      <div style={s.gridWrapper}>
        <div style={s.gridTitle}>24-Hour Duty Status Record</div>
        <LogSheetGrid log={log} />
      </div>

      {/* Totals */}
      <TotalsBar totals={log.totals} />

      {/* Remarks */}
      {log.remarks.length > 0 && (
        <div style={s.remarksSection}>
          <div style={s.remarksTitle}>Remarks / Duty Changes</div>
          {log.remarks.map((r, i) => (
            <div key={i} style={s.remarkItem}>
              <span style={s.remarkTime}>{r.time}</span>
              <span>{r.note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}