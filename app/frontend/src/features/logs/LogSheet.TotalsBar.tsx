
import { logStyles as s, ROW_COLORS } from "./logs.styles";
import type { DailyLogEntry } from "@/types";
interface TotalsBarProps {
  totals: DailyLogEntry["totals"];
}

export function TotalsBar({ totals }: TotalsBarProps) {
  const items = [
    {
      key: "off_duty",
      label: "Off Duty",
      color: ROW_COLORS.OFF_DUTY,
      value: totals.off_duty,
    },
    {
      key: "sleeper",
      label: "Sleeper",
      color: ROW_COLORS.SLEEPER_BERTH,
      value: totals.sleeper,
    },
    {
      key: "driving",
      label: "Driving",
      color: ROW_COLORS.DRIVING,
      value: totals.driving,
    },
    {
      key: "on_duty",
      label: "On Duty (ND)",
      color: ROW_COLORS.ON_DUTY_NOT_DRIVING,
      value: totals.on_duty,
    },
  ];

  return (
    <div style={s.totalsRow}>
      {items.map(({ key, label, color, value }) => (
        <div
          key={key}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <span style={s.totalDot(color)} />
          <span style={s.totalLabel}>{label}</span>
          <span style={s.totalValue}>{value.toFixed(2)}h</span>
        </div>
      ))}
    </div>
  );
}
