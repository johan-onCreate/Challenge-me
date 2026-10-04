import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ACHIEVEMENT_BY_ID,
  FAMILIES,
  TOTAL_BADGES,
  buildChallengeState,
  buildWallBadges,
  type Achievement,
  type TierParticipant,
  type WallBadge,
} from "../achievements";
import { toLocalDateKey, toDateKey } from "../statsUtils";
import {
  markAchievementsSeen,
  reconcileAchievements,
} from "../useAchievementSync";
import { BadgeCard } from "./BadgeCard";
import { burstConfetti } from "../confetti";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface WallChallenge {
  id: number;
  title: string;
  points: number;
  startKey: string;
  endKey: string;
}

interface WallData {
  badges: WallBadge[];
  earnedCount: number;
  unseen: Achievement[];
}

/**
 * Hämtar allt väggdatabasbehov i tre parallella frågor, bygger
 * ChallengeState, samordnar fullt (beviljar saknade + tar bort
 * badgar som inte längre uppfylls) och mappar till väggkort.
 */
async function loadWallData(
  userId: string,
  challenge: WallChallenge,
): Promise<WallData> {
  const [entryResult, participantsResult, logsResult] = await Promise.all([
    supabase
      .from("user_challenges")
      .select("chosen_tier")
      .eq("user_id", userId)
      .eq("challenge_id", challenge.id)
      .maybeSingle(),
    supabase
      .from("user_challenges")
      .select("user_id, chosen_tier")
      .eq("challenge_id", challenge.id),
    supabase
      .from("challenge_logs")
      .select("user_id, amount, logged_at")
      .eq("challenge_id", challenge.id),
  ]);
  if (entryResult.error) throw entryResult.error;
  if (participantsResult.error) throw participantsResult.error;
  if (logsResult.error) throw logsResult.error;

  const totalsByUser = new Map<string, Map<string, number>>();
  (logsResult.data ?? []).forEach((log) => {
    const ownerKey = String(log.user_id);
    const day = toDateKey(String(log.logged_at));
    let map = totalsByUser.get(ownerKey);
    if (!map) {
      map = new Map<string, number>();
      totalsByUser.set(ownerKey, map);
    }
    map.set(day, (map.get(day) ?? 0) + Number(log.amount));
  });

  const chosenTier = entryResult.data?.chosen_tier ?? "";
  const participants: TierParticipant[] = (participantsResult.data ?? [])
    .filter((row) => String(row.chosen_tier ?? "") === chosenTier)
    .map((row) => ({
      userId: String(row.user_id),
      dayTotals: totalsByUser.get(String(row.user_id)) ?? new Map<string, number>(),
    }));

  const state = buildChallengeState({
    challengeId: challenge.id,
    startKey: challenge.startKey,
    endKey: challenge.endKey,
    todayKey: toLocalDateKey(new Date()),
    userId,
    userDayTotals: totalsByUser.get(userId) ?? new Map<string, number>(),
    chosenTier,
    points: challenge.points,
    tierParticipants: participants,
  });

  // Full samordning: beviljar nya badgar OCH tar bort sådana som inte
  // längre uppfylls — väggen speglar alltid användarens aktuella data.
  // Idempotent och scoped till den visa användaren (egen eller andras vägg).
  const { owned: merged } = await reconcileAchievements(
    supabase,
    userId,
    challenge.id,
    state,
  );

  const unseen = merged
    .filter((entry) => entry.seenAt === null)
    .map((entry) => ACHIEVEMENT_BY_ID.get(entry.achievementId))
    .filter((badge): badge is Achievement => badge !== undefined);

  return {
    badges: buildWallBadges(state, merged),
    earnedCount: merged.length,
    unseen,
  };
}

/** Rent renderingslager — enbart mottar färdiga väggkort. */
export function WallGrid({ badges }: { badges: WallBadge[] }) {
  return (
    <div className="space-y-6">
      {FAMILIES.map((family) => {
        const items = badges.filter(
          (badge) => badge.achievement.family === family.id,
        );
        if (items.length === 0) return null;
        return (
          <section key={family.id} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-accent" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-content-secondary">
                {family.label}
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((badge) => (
                <BadgeCard
                  key={badge.achievement.id}
                  achievement={badge.achievement}
                  state={badge.state}
                  progress={badge.progress}
                  unlockedAt={badge.unlockedAt}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

interface AchievementsWallProps {
  userId: string;
  isOwn: boolean;
  challenge: WallChallenge | null;
}

export default function AchievementsWall({
  userId,
  isOwn,
  challenge,
}: AchievementsWallProps) {
  const [data, setData] = useState<WallData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!challenge) return;
    let cancelled = false;

    (async () => {
      try {
        const result = await loadWallData(userId, challenge);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Kunde inte hämta prisväggen. Kontrollera din anslutning och försök igen.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, challenge, retry]);

  const markSeen = async () => {
    if (!data || !challenge) return;
    setData({ ...data, unseen: [] });
    try {
      await markAchievementsSeen(supabase, userId, challenge.id);
    } catch {
      // Icke-kritiskt: banneren visar sig igen vid nästa laddning
    }
  };

  const celebrateUnseen = async () => {
    if (!data) return;
    data.unseen.forEach((_badge, index) => {
      setTimeout(() => burstConfetti(), index * 350);
    });
    await markSeen();
  };

  const retryLoad = () => {
    setLoading(true);
    setError(null);
    setRetry((count) => count + 1);
  };

  if (!challenge) {
    return (
      <div className="rounded-xl border border-dashed border-outline bg-inset py-10 text-center text-sm text-content-faint">
        Ingen aktiv utmaning just nu.
      </div>
    );
  }

  if (loading) {
    return (
      <p className="animate-pulse py-6 text-center text-sm text-content-fainter">
        Hämtar priser...
      </p>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p className="text-sm text-danger">{error}</p>
        <button
          type="button"
          onClick={retryLoad}
          className="rounded-lg bg-btn px-3 py-1.5 text-xs font-medium text-on-btn transition-colors hover:bg-btn-hover"
        >
          Försök igen
        </button>
      </div>
    );
  }

  if (!data) return null;

  const progressPercent = Math.round((data.earnedCount / TOTAL_BADGES) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-xl font-bold tracking-tight text-content">
          Priser 🏆
        </h3>
        <p className="mt-0.5 text-xs text-content-faint">
          {challenge.title} — badgar för just den här utmaningen.
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-content-secondary">
            {data.earnedCount} av {TOTAL_BADGES}
          </p>
          <p className="text-[11px] font-semibold text-content-faint">
            {progressPercent}%
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full border border-outline-soft bg-inset">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {isOwn && data.unseen.length > 0 && (
        <div className="space-y-2.5 rounded-xl border border-warning-soft-border bg-warning-soft p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold text-warning-soft-text">🎉 Nya priser!</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void celebrateUnseen()}
                className="rounded-lg bg-btn px-3 py-1.5 text-xs font-medium text-on-btn transition-colors hover:bg-btn-hover"
              >
                Fira 🎉
              </button>
              <button
                type="button"
                onClick={() => void markSeen()}
                className="rounded-lg border border-outline px-3 py-1.5 text-xs font-medium text-content-secondary transition-colors hover:bg-inset"
              >
                OK
              </button>
            </div>
          </div>
          <p className="text-xs text-warning-soft-text">
            {data.unseen.map((badge) => badge.title).join(" · ")}
          </p>
        </div>
      )}

      <WallGrid badges={data.badges} />
    </div>
  );
}
