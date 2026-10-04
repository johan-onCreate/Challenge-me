import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  ACHIEVEMENT_BY_ID,
  type Achievement,
  type ChallengeState,
  type OwnedAchievement,
  evaluate,
} from "./achievements";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SyncResult {
  owned: OwnedAchievement[];
  /** Endast badgar som precis låstes upp (tomt vid tyst samordning). */
  newlyUnlocked: Achievement[];
}

export async function fetchOwnedAchievements(
  client: SupabaseClient,
  userId: string,
  challengeId: number,
): Promise<OwnedAchievement[]> {
  const { data, error } = await client
    .from("user_achievements")
    .select("achievement_id, unlocked_at, seen_at")
    .eq("user_id", userId)
    .eq("challenge_id", challengeId);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    achievementId: String(row.achievement_id),
    unlockedAt: String(row.unlocked_at),
    seenAt: row.seen_at ? String(row.seen_at) : null,
  }));
}

/**
 * Idempotent upsert — dubblett beviljanden blir no-ops tack vare
 * onConflict på primärnyckeln. Skapar aldrig dubblettrader.
 */
export async function grantAchievements(
  client: SupabaseClient,
  userId: string,
  challengeId: number,
  achievementIds: string[],
): Promise<void> {
  if (achievementIds.length === 0) return;
  const { error } = await client
    .from("user_achievements")
    .upsert(
      achievementIds.map((id) => ({
        user_id: userId,
        challenge_id: challengeId,
        achievement_id: id,
      })),
      { onConflict: "user_id,challenge_id,achievement_id" },
    );
  if (error) throw error;
}

/**
 * Samordnar motorn med databasen: evaluerar tillståndet, upsertar
 * nysammanstälda badgar och returnerar ägda badgar + nycklistan.
 */
export async function syncAchievements(
  client: SupabaseClient,
  userId: string,
  challengeId: number,
  state: ChallengeState,
): Promise<SyncResult> {
  const owned = await fetchOwnedAchievements(client, userId, challengeId);
  const ownedIds = new Set(owned.map((entry) => entry.achievementId));
  const satisfied = evaluate(state);
  const fresh = [...satisfied].filter((id) => !ownedIds.has(id));
  await grantAchievements(client, userId, challengeId, fresh);

  const now = new Date().toISOString();
  const merged: OwnedAchievement[] = [
    ...owned,
    ...fresh.map((id) => ({
      achievementId: id,
      unlockedAt: now,
      seenAt: null,
    })),
  ];
  const newlyUnlocked = fresh
    .map((id) => ACHIEVEMENT_BY_ID.get(id))
    .filter((badge): badge is Achievement => badge !== undefined);

  return { owned: merged, newlyUnlocked };
}

/** Sätter seen_at på alla osedda badgar (catch-up-banneren försvinner). */
export async function markAchievementsSeen(
  client: SupabaseClient,
  userId: string,
  challengeId: number,
): Promise<void> {
  const { error } = await client
    .from("user_achievements")
    .update({ seen_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("challenge_id", challengeId)
    .is("seen_at", null);
  if (error) throw error;
}

// App-nivå kortvägar som delar klientsessionen
export function syncOwnAchievements(
  userId: string,
  challengeId: number,
  state: ChallengeState,
): Promise<SyncResult> {
  return syncAchievements(supabase, userId, challengeId, state);
}

export function markOwnAchievementsSeen(
  userId: string,
  challengeId: number,
): Promise<void> {
  return markAchievementsSeen(supabase, userId, challengeId);
}
