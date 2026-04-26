/**
 * LogSheetGrid — renders a single 24-hour FMCSA duty-status grid as SVG.
 *
 * X-axis: 24 hourly columns × 4 quarter-hour slots = 96 time slots.
 * Y-axis: 4 rows — Off Duty, Sleeper Berth, Driving, On Duty (Not Driving).
 * Horizontal lines represent duty periods; vertical connectors mark status changes.
 *
 * The GRID constants in logs.styles.ts are the single source of truth for all
 * pixel math — the Vitest assertion `4hrs → 4/24 of chart width` passes because
 * of this centralisation.
 */

import { GRID, ROW_COLORS, ROW_INDEX, ROW_LABELS } from "./logs.styles";
import { colors } from "@/tokens";
import type { DailyLogEntry, LogSegment } from "@/types";

// ─── Hour-label row ───────────────────────────────────────────────────────────

function HourLabels() {
  return (
    <>
      {/* Quarter-hour tick marks */}
      {Array.from({ length: 24 * 4 }, (_, i) => {
        const x = GRID.LABEL_WIDTH + (i / (24 * 4)) * GRID.CHART_WIDTH;
        const isMajor = i % 4 === 0;
        const isHalf = i % 2 === 0 && i % 4 !== 0;
        return (
          <line
            key={i}
            x1={x} y1={GRID.HEADER_HEIGHT - (isMajor ? 10 : isHalf ? 6 : 3)}
            x2={x} y2={GRID.HEADER_HEIGHT}
            stroke={colors.surfaceBorder}
            strokeWidth={isMajor ? 1 : 0.5}
          />
        );
      })}

      {/* Hour number labels */}
      {Array.from({ length: 25 }, (_, h) => (
        <text
          key={h}
          x={GRID.hourX(h)}
          y={GRID.HEADER_HEIGHT - 12}
          textAnchor="middle"
          fontSize="9"
          fill={colors.onSurfaceFaint}
          fontFamily="JetBrains Mono, monospace"
        >
          {h === 0 ? "Mid" : h === 12 ? "Noon" : h === 24 ? "Mid" : h}
        </text>
      ))}
    </>
  );
}

// ─── Grid lines ───────────────────────────────────────────────────────────────

function GridLines() {
  return (
    <>
      {/* Horizontal row dividers */}
      {Array.from({ length: GRID.ROWS + 1 }, (_, r) => {
        const y = GRID.HEADER_HEIGHT + r * GRID.ROW_HEIGHT;
        return (
          <line
            key={r}
            x1={GRID.LABEL_WIDTH} y1={y}
            x2={GRID.WIDTH} y2={y}
            stroke={colors.surfaceBorder}
            strokeWidth={r === 0 || r === GRID.ROWS ? 1 : 0.5}
          />
        );
      })}

      {/* Vertical hour gridlines */}
      {Array.from({ length: 25 }, (_, h) => {
        const x = GRID.hourX(h);
        return (
          <line
            key={h}
            x1={x} y1={GRID.HEADER_HEIGHT}
            x2={x} y2={GRID.TOTAL_HEIGHT}
            stroke={colors.surfaceBorder}
            strokeWidth={h === 0 || h === 24 ? 1 : 0.3}
          />
        );
      })}
    </>
  );
}

// ─── Row labels ───────────────────────────────────────────────────────────────

function RowLabels() {
  return (
    <>
      {Object.entries(ROW_LABELS).map(([status, label]) => {
        const row = ROW_INDEX[status];
        const y = GRID.HEADER_HEIGHT + row * GRID.ROW_HEIGHT + GRID.ROW_HEIGHT / 2;
        const color = ROW_COLORS[status];
        return (
          <g key={status}>
            {/* Colour swatch */}
            <rect
              x={8} y={y - 5}
              width={6} height={10}
              rx={2} fill={color}
            />
            <text
              x={20} y={y + 4}
              fontSize="9.5"
              fill={colors.onSurfaceMuted}
              fontFamily="DM Sans, sans-serif"
            >
              {label}
            </text>
          </g>
        );
      })}
    </>
  );
}

// ─── Duty-status segments ─────────────────────────────────────────────────────

interface SegmentsProps {
  segments: LogSegment[];
}

function Segments({ segments }: SegmentsProps) {
  if (!segments.length) return null;

  const lines: React.ReactNode[] = [];
  const connectors: React.ReactNode[] = [];

  segments.forEach((seg, i) => {
    const row = ROW_INDEX[seg.status];
    if (row === undefined) return;

    const color = ROW_COLORS[seg.status];
    const y = GRID.HEADER_HEIGHT + row * GRID.ROW_HEIGHT + GRID.ROW_HEIGHT / 2;
    const x1 = GRID.minuteX(seg.start);
    const x2 = seg.end === "00:00" && seg.start !== "00:00"
      ? GRID.WIDTH  // segment extends to end of day
      : GRID.minuteX(seg.end);

    // Horizontal duty line
    lines.push(
      <line
        key={`line-${i}`}
        x1={x1} y1={y}
        x2={x2} y2={y}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
    );

    // Vertical connector from previous row to this row at the start time
    if (i > 0) {
      const prevRow = ROW_INDEX[segments[i - 1].status];
      if (prevRow !== undefined && prevRow !== row) {
        const prevY = GRID.HEADER_HEIGHT + prevRow * GRID.ROW_HEIGHT + GRID.ROW_HEIGHT / 2;
        connectors.push(
          <line
            key={`conn-${i}`}
            x1={x1} y1={prevY}
            x2={x1} y2={y}
            stroke={color}
            strokeWidth={1.5}
            strokeDasharray="3 2"
            opacity={0.7}
          />
        );
      }
    }
  });

  return <>{lines}{connectors}</>;
}

// ─── Public component ─────────────────────────────────────────────────────────

interface LogSheetGridProps {
  log: DailyLogEntry;
}

export function LogSheetGrid({ log }: LogSheetGridProps) {
  return (
<svg
  viewBox={`0 0 ${GRID.WIDTH} ${GRID.TOTAL_HEIGHT}`}
  width="100%"
  style={{ display: "block", overflow: "visible", minWidth: "560px" }}
  aria-label={`ELD duty-status grid for ${log.date}`}
  role="img"
>
      {/* Background */}
      <rect x={0} y={0} width={GRID.WIDTH} height={GRID.TOTAL_HEIGHT}
        fill={colors.backgroundDeep} rx={4}
      />

      <HourLabels />
      <GridLines />
      <RowLabels />
      <Segments segments={log.segments} />

      {/* Outer border */}
      <rect
        x={GRID.LABEL_WIDTH} y={GRID.HEADER_HEIGHT}
        width={GRID.CHART_WIDTH} height={GRID.ROWS * GRID.ROW_HEIGHT}
        fill="none"
        stroke={colors.surfaceBorder}
        strokeWidth={1}
      />
    </svg>
  );
}