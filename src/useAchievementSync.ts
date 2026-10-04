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
 * Snabbspår (anropas efter varje logg i Profile): evaluerar
 * tillståndet och upsertar nysammanstälda badgar.
 *
 * Endast TILLÄGG, aldrig radering — snabbspåret saknar tier-gruppsdata
 * (tierParticipants: []), så evaluate() kan inte bedöma tävlingsbadgarna.
 * Att radera här skulle därmed felaktigt ta bort legitima tävlingsbadgar.
 * Radering sker enbart i reconcileAchievements (fullt spår, komplett data).
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

/**
 * Raderar badgar som tillståndet inte längre uppfyller. Scoped till
 * exakt denna användare + utmaning; challenge_logs (själva datan)
 * röras aldrig — detta korrigerar bara den härledda badgestatusen.
 */
export async function revokeAchievements(
  client: SupabaseClient,
  userId: string,
  challengeId: number,
  achievementIds: string[],
): Promise<void> {
  if (achievementIds.length === 0) return;
  const { error } = await client
    .from("user_achievements")
    .delete()
    .eq("user_id", userId)
    .eq("challenge_id", challengeId)
    .in("achievement_id", achievementIds);
  if (error) throw error;
}

/**
 * Full samordning (prisväggen, komplett data inkl. tier-grupp):
 * beviljar nya badgar OCH tar bort sådana som inte längre uppfylls.
 * Väggens garanti: den speglar alltid användarens aktuella data.
 * Säker även för andras väggar — raderingen är scoped till den
 * användare vars vägg som visas.
 */
export async function reconcileAchievements(
  client: SupabaseClient,
  userId: string,
  challengeId: number,
  state: ChallengeState,
): Promise<SyncResult> {
  const owned = await fetchOwnedAchievements(client, userId, challengeId);
  const satisfied = evaluate(state);
  const satisfiedSet = new Set(satisfied);
  const ownedIds = new Set(owned.map((entry) => entry.achievementId));
  const fresh = [...satisfied].filter((id) => !ownedIds.has(id));
  const stale = owned
    .filter((entry) => !satisfiedSet.has(entry.achievementId))
    .map((entry) => entry.achievementId);
  await grantAchievements(client, userId, challengeId, fresh);
  await revokeAchievements(client, userId, challengeId, stale);

  const now = new Date().toISOString();
  const kept = owned.filter((entry) => satisfiedSet.has(entry.achievementId));
  const merged: OwnedAchievement[] = [
    ...kept,
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

export function reconcileOwnAchievements(
  userId: string,
  challengeId: number,
  state: ChallengeState,
): Promise<SyncResult> {
  return reconcileAchievements(supabase, userId, challengeId, state);
}

export function markOwnAchievementsSeen(
  userId: string,
  challengeId: number,
): Promise<void> {
  return markAchievementsSeen(supabase, userId, challengeId);
}
