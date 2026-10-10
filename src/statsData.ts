import { createClient } from "@supabase/supabase-js";
import type { WallChallenge } from "./components/AchievementsWall";
import {
  calculateStats,
  toDateKey,
  toLocalDateKey,
  type ChallengeLog,
  type ChallengeSummary,
  type StatsData,
} from "./statsUtils";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface StatsResult {
  data: StatsData;
  title: string;
  wall: {
    selectedUserId: string;
    currentUserId: string;
    activeChallenge: WallChallenge | null;
  };
}

export async function loadStatsData(userId?: string): Promise<StatsResult> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Ingen inloggad användare");
  const selectedUserId = userId || user.id;
  let selectedTitle = "Min statistik";

  if (selectedUserId !== user.id) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("alias, full_name")
      .eq("id", selectedUserId)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) throw new Error("Användaren hittades inte");
    selectedTitle = `${
      profile.alias || profile.full_name || "Användarens"
    } statistik`;
  }

  const { data: userChallenges, error: userChallengesError } = await supabase
    .from("user_challenges")
    .select("challenge_id, chosen_tier")
    .eq("user_id", selectedUserId);
  if (userChallengesError) throw userChallengesError;
  const { data: challengeRows, error: challengeRowsError } = await supabase
    .from("challenges")
    .select("id, title, points, is_active, start_date, end_date");
  if (challengeRowsError) throw challengeRowsError;
  const { data: logs, error: logsError } = await supabase
    .from("challenge_logs")
    .select("challenge_id, amount, logged_at")
    .eq("user_id", selectedUserId);
  if (logsError) throw logsError;

  const challengeById = new Map(
    (challengeRows || []).map((challenge) => [challenge.id, challenge]),
  );
  const totalsByChallenge = new Map<number, number>();
  logs?.forEach((log) => {
    totalsByChallenge.set(
      log.challenge_id,
      (totalsByChallenge.get(log.challenge_id) || 0) + log.amount,
    );
  });

  const summaries: ChallengeSummary[] = (userChallenges || [])
    .map((entry) => {
      const challenge = challengeById.get(entry.challenge_id);
      if (!challenge) return null;
      return {
        challengeId: challenge.id,
        title: challenge.title,
        points: challenge.points,
        chosenTier: entry.chosen_tier || "",
        totalAmount: totalsByChallenge.get(challenge.id) || 0,
      };
    })
    .filter((entry): entry is ChallengeSummary => entry !== null);

  const logEntries: ChallengeLog[] = (logs || []).map((log) => ({
    challengeId: log.challenge_id,
    amount: log.amount,
    loggedAt: log.logged_at,
  }));

  const activeRow = (challengeRows || []).find(
    (challenge) => challenge.is_active === true,
  );
  const activeChallenge: WallChallenge | null = activeRow
    ? {
        id: activeRow.id,
        title: activeRow.title,
        points: activeRow.points,
        startKey: toDateKey(String(activeRow.start_date)),
        endKey: toDateKey(String(activeRow.end_date)),
      }
    : null;

  return {
    data: calculateStats(logEntries, summaries, toLocalDateKey(new Date())),
    title: selectedTitle,
    wall: {
      selectedUserId,
      currentUserId: user.id,
      activeChallenge,
    },
  };
}
