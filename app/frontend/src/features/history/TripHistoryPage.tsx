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
import { EmptyState } from "./History.EmptyState";
import { TripCard } from "./History.TripCard";


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