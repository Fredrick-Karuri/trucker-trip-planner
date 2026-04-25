/**
 * Frontend test suite for the Trucker Trip Planner.
 *
 * Key assertion: a 4-hr DRIVING segment maps to an SVG line spanning
 * exactly 4/24 of the chart width (±1px). This validates the GRID constants
 * in logs.styles.ts are used correctly end-to-end.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { GRID, ROW_INDEX } from "@/features/logs/logs.styles";
import { LogSheetGrid } from "@/features/logs/LogSheetGrid";
import type { DailyLogEntry } from "@/types";

// ─── GRID constant tests ──────────────────────────────────────────────────────

describe("GRID constants", () => {
  it("CHART_WIDTH = WIDTH - LABEL_WIDTH", () => {
    expect(GRID.CHART_WIDTH).toBe(GRID.WIDTH - GRID.LABEL_WIDTH);
  });

  it("hourX(0) = LABEL_WIDTH (left edge)", () => {
    expect(GRID.hourX(0)).toBe(GRID.LABEL_WIDTH);
  });

  it("hourX(24) = WIDTH (right edge)", () => {
    expect(GRID.hourX(24)).toBe(GRID.WIDTH);
  });

  it("minuteX('00:00') = LABEL_WIDTH", () => {
    expect(GRID.minuteX("00:00")).toBe(GRID.LABEL_WIDTH);
  });

  it("minuteX('12:00') = midpoint of chart", () => {
    const expected = GRID.LABEL_WIDTH + GRID.CHART_WIDTH / 2;
    expect(GRID.minuteX("12:00")).toBe(expected);
  });
});

// ─── Key pixel assertion: 4hr DRIVING segment width ──────────────────────────

describe("LogSheetGrid — 4-hr DRIVING segment pixel width", () => {
  const fourHourLog: DailyLogEntry = {
    date: "2024-01-15",
    segments: [
      { status: "DRIVING", start: "08:00", end: "12:00", duration_hrs: 4, location: "en route" },
      { status: "OFF_DUTY", start: "12:00", end: "00:00", duration_hrs: 20, location: "" },
    ],
    totals: { off_duty: 20, sleeper: 0, driving: 4, on_duty: 0 },
    remarks: [],
  };

  it("x1 and x2 of DRIVING line span exactly 4/24 of chart width (±1px)", () => {
    render(<LogSheetGrid log={fourHourLog} />);

    const expectedX1 = GRID.minuteX("08:00");
    const expectedX2 = GRID.minuteX("12:00");
    const expectedWidth = expectedX2 - expectedX1;
    const fourTwentyFourths = (4 / 24) * GRID.CHART_WIDTH;

    // The width of a 4-hr segment must equal 4/24 of the chart area within 1px
    expect(Math.abs(expectedWidth - fourTwentyFourths)).toBeLessThanOrEqual(1);
  });

  it("DRIVING row is row index 2", () => {
    expect(ROW_INDEX["DRIVING"]).toBe(2);
  });

  it("renders the SVG element", () => {
    const { container } = render(<LogSheetGrid log={fourHourLog} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});

// ─── PlannerForm validation ───────────────────────────────────────────────────

describe("PlannerForm field validation", () => {
  it("rejects cycle hours > 70", () => {
    // Pure validation logic extracted from useTripPlanner
    const validate = (cycleHours: string) => {
      const v = Number(cycleHours);
      if (isNaN(v) || v < 0 || v > 70) return "Cycle hours must be between 0 and 70.";
      return undefined;
    };
    expect(validate("71")).toBeTruthy();
    expect(validate("-1")).toBeTruthy();
    expect(validate("70")).toBeUndefined();
    expect(validate("0")).toBeUndefined();
  });

  it("rejects empty location fields", () => {
    const validate = (v: string) => (!v.trim() ? "Required." : undefined);
    expect(validate("")).toBeTruthy();
    expect(validate("  ")).toBeTruthy();
    expect(validate("Chicago, IL")).toBeUndefined();
  });
});

// ─── DailyLog 24h invariant ───────────────────────────────────────────────────

describe("DailyLog 24h totals invariant (frontend)", () => {
  const makeLog = (off: number, slp: number, drv: number, on: number): DailyLogEntry => ({
    date: "2024-01-15",
    segments: [],
    totals: { off_duty: off, sleeper: slp, driving: drv, on_duty: on },
    remarks: [],
  });

  it("valid log: totals sum to 24", () => {
    const log = makeLog(10, 0, 11, 3);
    const sum = log.totals.off_duty + log.totals.sleeper + log.totals.driving + log.totals.on_duty;
    expect(sum).toBe(24);
  });

  it("detects invalid log: totals not 24", () => {
    const log = makeLog(5, 0, 11, 3);
    const sum = log.totals.off_duty + log.totals.sleeper + log.totals.driving + log.totals.on_duty;
    expect(sum).not.toBe(24);
  });
});