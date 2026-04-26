
import { colors } from "@/tokens";
import type { TripPlanResponse } from "@/types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import {  History, LogOut, X, PlusCircle  } from "@/components/icons";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  summary: TripPlanResponse["summary"];
  dayCount: number;
  eta: string;
  onReset: () => void;
}

export function BottomSheet({ open, onClose, summary, dayCount, eta, onReset }: BottomSheetProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const stats = [
    { label: "Total Miles", value: summary.total_miles.toLocaleString(undefined, { maximumFractionDigits: 0 }) + " mi" },
    { label: "Duration",    value: summary.total_duration_hrs.toFixed(1) + " hrs" },
    { label: "Drive Time",  value: (summary.total_drive_hrs?.toFixed(1) ?? "—") + " hrs" },
    { label: "ETA",         value: eta },
    { label: "Log Days",    value: String(dayCount) },
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sheet */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-[999]
          rounded-t-2xl border-t border-x
          transition-transform duration-300 ease-out
          ${open ? "translate-y-0" : "translate-y-full"}
        `}
        style={{
          background: colors.surface,
          borderColor: colors.surfaceBorder,
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: colors.surfaceBorder }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-sm font-semibold" style={{ color: colors.onSurface }}>
            Trip Details
          </span>
          <button onClick={onClose} style={{ color: colors.onSurfaceMuted }}>
            <X size={18} />
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 px-5 pb-4">
          {stats.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: colors.onSurfaceFaint }}>
                {label}
              </span>
              <span className="text-sm font-semibold font-mono" style={{ color: colors.onSurface }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-5" style={{ height: 1, background: colors.surfaceBorder }} />

        {/* Actions */}
        <div className="flex flex-col gap-1 px-5 py-3">
          {user && (
            <div className="text-xs pb-2" style={{ color: colors.onSurfaceFaint }}>
              {user.email}
            </div>
          )}
          {user && (
            <button
              onClick={() => { navigate("/history"); onClose(); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left transition-colors"
              style={{ color: colors.onSurface }}
            >
              <History size={16} style={{ color: colors.primary }} />
              Trip History
            </button>
          )}
          <button
            onClick={() => { onReset(); onClose(); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left"
            style={{ color: colors.onSurface }}
          >

            <PlusCircle size={16} />
            New Trip
          </button>
          {user && (
            <button
              onClick={() => { logout(); onClose(); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left"
              style={{ color: colors.onSurfaceMuted }}
            >
              <LogOut size={16} />
              Logout
            </button>
          )}
        </div>

        {/* Safe area spacer */}
        <div className="pb-safe h-6" />
      </div>
    </>
  );
}
