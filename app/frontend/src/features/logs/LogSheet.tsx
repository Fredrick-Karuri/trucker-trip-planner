/**
 * LogSheet — complete single-day FMCSA ELD log sheet.
 *
 * Composes: header fields, SVG duty-status grid, per-status totals, remarks.
 * Print styles hide everything except this component (see global.css .no-print).
 */

import { TotalsBar } from "./LodSheet.TotalsBar";
import { logStyles as s } from "./logs.styles";
import { LogSheetGrid } from "./LogSheetGrid";
import type { DailyLogEntry } from "@/types";

interface LogSheetProps {
  log: DailyLogEntry;
  tripId?: string;
}

export function LogSheet({ log, tripId }: LogSheetProps) {
  const dateObj = new Date(log.date + "T00:00:00Z");
  const dateLabel = dateObj.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
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
        <div style={{ minWidth: "560px" }}>
          <div style={s.gridTitle}>24-Hour Duty Status Record</div>
          <LogSheetGrid log={log} />
        </div>
      </div>

      {/* Totals — scrollable too on mobile */}
      <div style={{ overflowX: "auto" }}>
        <TotalsBar totals={log.totals} />
      </div>
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
