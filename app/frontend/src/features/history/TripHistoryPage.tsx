/**
 * TripHistoryPage — paginated list of the driver's past trips.
 *
 * Each card shows route label, date, stats. Clicking loads the stored
 * result into ResultsView without re-running the simulation.
 */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { historyStyles as s } from "./history.styles";
import { fetchTripHistory } from "@/services/api";
import { Spinner } from "@/components";
import { colors, typography, spacing } from "@/tokens";
import type { TripHistoryItem, TripHistoryPage } from "@/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatEta(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface TripCardProps { trip: TripHistoryItem; onReplay: (id: string) => void }

function TripCard({ trip, onReplay }: TripCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ ...s.card, ...(hovered ? s.cardHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onReplay(trip.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onReplay(trip.id)}
      aria-label={`View trip from ${trip.current_location} to ${trip.dropoff_location}`}
    >
      <div>
        <div style={s.routeLabel}>
          <span>{trip.current_location}</span>
          <span style={s.routeArrow}>→</span>
          <span>{trip.pickup_location}</span>
          <span style={s.routeArrow}>→</span>
          <span>{trip.dropoff_location}</span>
        </div>
        <div style={s.dateText}>{formatDate(trip.created_at)}</div>
        <div style={s.metaRow}>
          {[
            { label: "Miles", value: trip.total_miles != null ? `${Math.round(Number(trip.total_miles)).toLocaleString()} mi` : "—" },
            { label: "Duration", value: trip.total_duration_hrs != null ? `${Number(trip.total_duration_hrs).toFixed(1)} hrs` : "—" },
            { label: "ETA", value: formatEta(trip.eta) },
            { label: "Log Days", value: String(trip.log_days) },
          ].map(({ label, value }) => (
            <div key={label} style={s.metaItem}>
              <span style={s.metaLabel}>{label}</span>
              <span style={s.metaValue}>{value}</span>
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onReplay(trip.id); }}
        style={s.replayBtn}
      >
        View →
      </button>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div style={s.emptyState}>
      <div style={{ fontSize: "40px" }}>🚛</div>
      <div>
        <div style={{ fontSize: typography.sizeLg, fontWeight: typography.weightSemibold, color: colors.onSurface }}>
          No trips yet
        </div>
        <div style={{ fontSize: typography.sizeSm, color: colors.onSurfaceMuted, marginTop: spacing.xs }}>
          Plan your first trip to see it here.
        </div>
      </div>
      <button
        type="button"
        onClick={onNew}
        style={{
          padding: `${spacing.sm} ${spacing.xl}`,
          borderRadius: "8px",
          border: "none",
          background: colors.primary,
          color: colors.onPrimary,
          fontSize: typography.sizeMd,
          fontWeight: typography.weightMedium,
          fontFamily: typography.fontSans,
          cursor: "pointer",
        }}
      >
        Plan a Trip
      </button>
    </div>
  );
}

export function TripHistoryPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState<TripHistoryPage | null>(null);
  const [trips, setTrips] = useState<TripHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (pageNum = 1, append = false) => {
    try {
      const data = await fetchTripHistory(pageNum);
      setPage(data);
      setTrips((prev) => append ? [...prev, ...data.results] : data.results);
    } catch {
      setError("Failed to load trip history.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const loadMore = useCallback(() => {
    if (!page || page.page >= page.total_pages) return;
    setLoadingMore(true);
    load(page.page + 1, true);
  }, [page, load]);

  const onReplay = useCallback((id: string) => {
    navigate(`/trips/${id}`);
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Trip History</h1>
          {page && (
            <div style={s.subtitle}>
              {page.count} trip{page.count !== 1 ? "s" : ""} planned
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            padding: `${spacing.xs} ${spacing.lg}`,
            borderRadius: "8px",
            border: `1px solid ${colors.surfaceBorder}`,
            background: "transparent",
            color: colors.onSurfaceMuted,
            fontSize: typography.sizeSm,
            fontFamily: typography.fontSans,
            cursor: "pointer",
          }}
        >
          + New Trip
        </button>
      </div>

      {error && (
        <div style={{ color: colors.dangerLight, marginBottom: spacing.lg, fontSize: typography.sizeSm }}>
          {error}
        </div>
      )}

      {trips.length === 0 ? (
        <EmptyState onNew={() => navigate("/")} />
      ) : (
        <>
          <div style={s.grid}>
            {trips.map((t) => (
              <TripCard key={t.id} trip={t} onReplay={onReplay} />
            ))}
          </div>
          {page && page.page < page.total_pages && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              style={s.loadMoreBtn}
            >
              {loadingMore ? "Loading…" : `Load more (${page.count - trips.length} remaining)`}
            </button>
          )}
        </>
      )}
    </div>
  );
}