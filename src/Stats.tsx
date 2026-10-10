import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import AchievementsWall from "./components/AchievementsWall";
import { StatsDashboard } from "./components/stats/StatsDashboard";
import { loadStatsData } from "./statsData";
import type { StatsResult } from "./statsData";

export { StatsDashboard } from "./components/stats/StatsDashboard";

function StatsContent({ userId }: { userId?: string }) {
  const [result, setResult] = useState<StatsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "priser" ? "priser" : "stats";

  const loadStats = useCallback(() => loadStatsData(userId), [userId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const statsResult = await loadStats();
        if (!cancelled) setResult(statsResult);
      } catch {
        if (!cancelled) {
          setError(
            "Kunde inte hämta statistik. Kontrollera din anslutning och försök igen.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadStats, retry]);

  const retryLoad = () => {
    setLoading(true);
    setError(null);
    setRetry((count) => count + 1);
  };

  if (loading) {
    return (
      <p className="text-sm text-content-fainter animate-pulse text-center py-6">
        Hämtar statistik...
      </p>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 space-y-3">
        <p className="text-sm text-danger">{error}</p>
        <button
          type="button"
          onClick={retryLoad}
          className="text-xs bg-btn text-on-btn hover:bg-btn-hover px-3 py-1.5 font-medium rounded-lg transition-colors"
        >
          Försök igen
        </button>
      </div>
    );
  }

  if (!result) return null;

  const tabButtonClass = (active: boolean) =>
    `px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
      active
        ? "bg-raised text-content shadow-sm"
        : "text-content-muted hover:text-content"
    }`;

  return (
    <div className="space-y-5">
      <div className="flex w-fit gap-1 rounded-xl border border-outline-soft bg-inset p-1">
        <button
          type="button"
          onClick={() => setSearchParams({})}
          className={tabButtonClass(activeTab === "stats")}
        >
          Statistik
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: "priser" })}
          className={tabButtonClass(activeTab === "priser")}
        >
          Priser 🏆
        </button>
      </div>

      {activeTab === "stats" ? (
        <StatsDashboard data={result.data} title={result.title} />
      ) : (
        <AchievementsWall
          userId={result.wall.selectedUserId}
          isOwn={result.wall.selectedUserId === result.wall.currentUserId}
          challenge={result.wall.activeChallenge}
        />
      )}
    </div>
  );
}

function Stats() {
  const { userId } = useParams<{ userId: string }>();
  return <StatsContent key={userId || "current"} userId={userId} />;
}

export default Stats;
