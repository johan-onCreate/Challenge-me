import { calculateEarnedPoints } from "./profileUtils";
import { toDateMs, fromDateMs } from "./statsUtils";

// ====================================================================
// ACHIEVEMENTS-MOTOR — ren modul, inga Supabase/React-importer.
//
// Katalogen nedan är ENDA KÄLLAN för badgarnas identitet (id, familj,
// titel, hint, emoji, mål, ordning) — både för motorn och UI:et.
// Seed-radarna i sql/achievements.sql speglar den här listan.
// ====================================================================

export type AchievementFamily =
  | "streak"
  | "perfect"
  | "volume"
  | "ascent"
  | "comp"
  | "troll"
  | "special";

export interface Achievement {
  id: string;
  family: AchievementFamily;
  title: string;
  hint: string;
  emoji: string;
  goal: number | null;
  sortOrder: number;
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  { id: "streak.7", family: "streak", title: "A Week… What a Week", hint: "7 dagar i rad", emoji: "🔥", goal: null, sortOrder: 1 },
  { id: "streak.14", family: "streak", title: "Two Weeks of Mild Insanity", hint: "14 dagar i rad", emoji: "🔥", goal: null, sortOrder: 2 },
  { id: "streak.21", family: "streak", title: "Three Weeks, Zero Regrets (Lying)", hint: "21 dagar i rad", emoji: "🔥", goal: null, sortOrder: 3 },
  { id: "streak.30", family: "streak", title: "One Month of Pure Madness", hint: "30 dagar i rad", emoji: "🌙", goal: null, sortOrder: 4 },
  { id: "streak.60", family: "streak", title: "Two Months? Are You Okay?", hint: "60 dagar i rad", emoji: "🧟", goal: null, sortOrder: 5 },
  { id: "perfect.run", family: "perfect", title: "The Human Metronome", hint: "Ensam dag missad, start till mål", emoji: "⏱️", goal: null, sortOrder: 6 },
  { id: "reps.500", family: "volume", title: "500 and Counting", hint: "500 totala reps", emoji: "💪", goal: null, sortOrder: 7 },
  { id: "reps.1k", family: "volume", title: "The Reptile", hint: "1 000 totala reps", emoji: "🦎", goal: null, sortOrder: 8 },
  { id: "reps.5k", family: "volume", title: "The Dinosaur", hint: "5 000 totala reps", emoji: "🦖", goal: null, sortOrder: 9 },
  { id: "ascent.bronze", family: "ascent", title: "Bronze: You Showed Up", hint: "1 000 totala reps", emoji: "🥉", goal: 1000, sortOrder: 10 },
  { id: "ascent.silver", family: "ascent", title: "Silver: Decent, Honestly", hint: "3 333 totala reps", emoji: "🥈", goal: 3333, sortOrder: 11 },
  { id: "ascent.gold", family: "ascent", title: "Gold: Okay, Respect", hint: "6 666 totala reps", emoji: "🥇", goal: 6666, sortOrder: 12 },
  { id: "ascent.platinum", family: "ascent", title: "Platinum: Absolutely Cooked", hint: "10 000 totala reps", emoji: "💎", goal: 10000, sortOrder: 13 },
  { id: "ascent.mythic", family: "ascent", title: "Mythic: Who Even Are You", hint: "20 000 totala reps", emoji: "🐉", goal: 20000, sortOrder: 14 },
  { id: "comp.plot_twist", family: "comp", title: "The Plot Twist", hint: "Bottenhalvan i halvtid → topp 3 i mål", emoji: "🎬", goal: null, sortOrder: 15 },
  { id: "comp.three_week_tyrant", family: "comp", title: "Three-Week Tyrant", hint: "Topp 3 i din grupp, tre veckor i rad", emoji: "👑", goal: null, sortOrder: 16 },
  { id: "comp.throne", family: "comp", title: "Take the Throne", hint: "Etta i din grupp när utmaningen slutar", emoji: "🏰", goal: null, sortOrder: 17 },
  { id: "troll.1", family: "troll", title: "Lazy Sloth", hint: "Exakt 1 rep på en dag", emoji: "🦥", goal: null, sortOrder: 18 },
  { id: "troll.2", family: "troll", title: "Now You're Just Messing With Me", hint: "Exakt 2 reps på en dag", emoji: "😤", goal: null, sortOrder: 19 },
  { id: "troll.3", family: "troll", title: "That's How It's Gonna Be, Huh?!", hint: "Exakt 3 reps på en dag", emoji: "😠", goal: null, sortOrder: 20 },
  { id: "troll.42", family: "troll", title: "The Answer to Everything", hint: "Exakt 42 reps på en dag", emoji: "🎰", goal: null, sortOrder: 21 },
  { id: "troll.666", family: "troll", title: "Imp", hint: "Exakt 666 reps på en dag", emoji: "😈", goal: null, sortOrder: 22 },
  { id: "xp.100", family: "special", title: "Baby XP", hint: "100 XP i utmaningen", emoji: "⭐", goal: null, sortOrder: 23 },
  { id: "day.combo", family: "special", title: "Rolling Thunder", hint: "3 dagar i rad med ökande reps", emoji: "🌪️", goal: null, sortOrder: 24 },
  { id: "date.dec24", family: "special", title: "Santa's Rep List", hint: "Logga en dag den 24 december", emoji: "🎅", goal: null, sortOrder: 25 },
  { id: "day.monster", family: "special", title: "Monster Day", hint: "250+ reps på en enda dag", emoji: "🌋", goal: null, sortOrder: 26 },
];

export const ACHIEVEMENT_BY_ID: ReadonlyMap<string, Achievement> = new Map(
  ACHIEVEMENTS.map((badge) => [badge.id, badge]),
);

export const FAMILIES: ReadonlyArray<{
  id: AchievementFamily;
  label: string;
}> = [
  { id: "streak", label: "Streaker" },
  { id: "perfect", label: "Perfekt runda" },
  { id: "volume", label: "Volym" },
  { id: "ascent", label: "Ascent" },
  { id: "comp", label: "Tävlan" },
  { id: "troll", label: "Trolling" },
  { id: "special", label: "Special" },
];

/** Santa's Rep List — byts ut en gång per år. */
export const DEC_24_KEY = "2026-12-24";
export const MONSTER_DAY_TARGET = 250;
export const MYTHIC_TARGET = 20_000;
export const TOTAL_BADGES = ACHIEVEMENTS.length;

// ====================================================================
// Datumhjälpare (rena) — date keys är 'YYYY-MM-DD' som appen redan använder.
// ====================================================================

const DAY_MS = 86_400_000;

export function addDays(dateKey: string, days: number): string {
  return fromDateMs(toDateMs(dateKey) + days * DAY_MS);
}

export function diffDays(fromKey: string, toKey: string): number {
  return Math.round((toDateMs(toKey) - toDateMs(fromKey)) / DAY_MS);
}

/** Alla datumkeys i intervallet [startKey, endKey]. Tomt om start > end. */
export function eachDay(startKey: string, endKey: string): string[] {
  const days: string[] = [];
  for (let key = startKey; key <= endKey; key = addDays(key, 1)) {
    days.push(key);
  }
  return days;
}

/** Längsta sträckan med på varandra följande loggade dagar i fönstret. */
export function longestConsecutiveRun(
  loggedDays: ReadonlySet<string>,
  startKey: string,
  endKey: string,
): number {
  let best = 0;
  let run = 0;
  for (const day of eachDay(startKey, endKey)) {
    run = loggedDays.has(day) ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

/** Antal icke-loggade dagar i fönstret [startKey, endKey]. */
export function countMissedDays(
  loggedDays: ReadonlySet<string>,
  startKey: string,
  endKey: string,
): number {
  let missed = 0;
  for (const day of eachDay(startKey, endKey)) {
    if (!loggedDays.has(day)) missed += 1;
  }
  return missed;
}

/**
 * Längsta sträckan med på varandra följande dagar med strikt ökande reps.
 * En ologgad dag bryter sträckan; en dag som inte ökar startar om vid 1.
 */
export function longestRisingRun(
  dayTotals: ReadonlyMap<string, number>,
  startKey: string,
  endKey: string,
): number {
  let best = 0;
  let run = 0;
  let previous = Number.NEGATIVE_INFINITY;
  for (const day of eachDay(startKey, endKey)) {
    const amount = dayTotals.get(day);
    if (amount === undefined) {
      run = 0;
      previous = Number.NEGATIVE_INFINITY;
    } else if (amount > previous) {
      run += 1;
      previous = amount;
    } else {
      run = 1;
      previous = amount;
    }
    if (run > best) best = run;
  }
  return best;
}

// ====================================================================
// Tier-grupp (för tävlingsbadgarna)
// ====================================================================

export interface TierParticipant {
  userId: string;
  dayTotals: ReadonlyMap<string, number>;
}

function cumulativeUpTo(participant: TierParticipant, upToKey: string): number {
  let total = 0;
  participant.dayTotals.forEach((amount, day) => {
    if (day <= upToKey) total += amount;
  });
  return total;
}

/**
 * Ranking av tier-gruppen per ackumulerade reps upp till och med upToKey.
 * Oavgjorda placeringar avgörs deterministiskt via userId.
 */
export function rankAtDate(
  participants: ReadonlyArray<TierParticipant>,
  userId: string,
  upToKey: string,
): { groupSize: number; placement: number } {
  const totals = new Map<string, number>();
  participants.forEach((participant) => {
    totals.set(participant.userId, cumulativeUpTo(participant, upToKey));
  });
  const sorted = [...participants].sort((a, b) => {
    const diff = (totals.get(b.userId) ?? 0) - (totals.get(a.userId) ?? 0);
    if (diff !== 0) return diff;
    return a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0;
  });
  const index = sorted.findIndex((participant) => participant.userId === userId);
  return {
    groupSize: participants.length,
    placement: index >= 0 ? index + 1 : participants.length,
  };
}

/**
 * Veckoslutsspäckar: varje söndag i [startKey, min(endKey, todayKey)]
 * plus det sista (dels)veckoslutet = min(endKey, todayKey).
 */
export function weekEndSnapshots(
  startKey: string,
  endKey: string,
  todayKey: string,
): string[] {
  const limit = todayKey < endKey ? todayKey : endKey;
  if (limit < startKey) return [];
  const snapshots: string[] = [];
  const firstSundayOffset =
    (7 - new Date(`${startKey}T00:00:00Z`).getUTCDay()) % 7;
  for (
    let cursor = addDays(startKey, firstSundayOffset);
    cursor <= limit;
    cursor = addDays(cursor, 7)
  ) {
    snapshots.push(cursor);
  }
  if (snapshots[snapshots.length - 1] !== limit) {
    snapshots.push(limit);
  }
  return snapshots;
}

/** Längsta sträckan med på varandra följande veckoslut där man är topp 3. */
export function top3WeekEndStreak(
  participants: ReadonlyArray<TierParticipant>,
  userId: string,
  startKey: string,
  endKey: string,
  todayKey: string,
): number {
  if (participants.length < 2) return 0;
  let best = 0;
  let run = 0;
  for (const snapshot of weekEndSnapshots(startKey, endKey, todayKey)) {
    const { placement } = rankAtDate(participants, userId, snapshot);
    run = placement <= 3 ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

/** Mittenpunkt i utmaningen (start + (slut − start) / 2). */
export function midpointKey(startKey: string, endKey: string): string {
  return addDays(startKey, Math.floor(diffDays(startKey, endKey) / 2));
}

// ====================================================================
// ChallengeState — allt motorn behöver veta om en användare i en utmaning
// ====================================================================

export interface ChallengeState {
  challengeId: number;
  startKey: string;
  endKey: string;
  todayKey: string;
  totalReps: number;
  earnedXp: number;
  longestStreak: number;
  daysMissed: number;
  windowComplete: boolean;
  dayTotals: ReadonlyMap<string, number>;
  risingDays: number;
  maxDay: number;
  chosenTier: number;
  groupSize: number;
  finalPlacement: number;
  midPlacement: number;
  top3WeekEnds: number;
}

export interface BuildStateInput {
  challengeId: number;
  startKey: string;
  endKey: string;
  todayKey: string;
  userId: string;
  userDayTotals: ReadonlyMap<string, number>;
  chosenTier: string;
  points: number;
  /** Samma tier-grupp (inkl. användaren själv). Tomt = okänd grupp. */
  tierParticipants: ReadonlyArray<TierParticipant>;
}

export function buildChallengeState(input: BuildStateInput): ChallengeState {
  const {
    challengeId,
    startKey,
    endKey,
    todayKey,
    userId,
    userDayTotals,
    chosenTier,
    points,
    tierParticipants,
  } = input;

  const activeEnd = todayKey < endKey ? todayKey : endKey;
  const loggedDays = new Set(userDayTotals.keys());

  let totalReps = 0;
  let maxDay = 0;
  userDayTotals.forEach((amount) => {
    totalReps += amount;
    if (amount > maxDay) maxDay = amount;
  });

  const hasGroup = tierParticipants.length >= 2;
  const midKey = midpointKey(startKey, endKey);

  return {
    challengeId,
    startKey,
    endKey,
    todayKey,
    totalReps,
    earnedXp: calculateEarnedPoints(totalReps, chosenTier, points),
    longestStreak: longestConsecutiveRun(loggedDays, startKey, activeEnd),
    daysMissed: countMissedDays(loggedDays, startKey, activeEnd),
    windowComplete: todayKey > endKey,
    dayTotals: userDayTotals,
    risingDays: longestRisingRun(userDayTotals, startKey, activeEnd),
    maxDay,
    chosenTier: Number.parseInt(chosenTier, 10) || 0,
    groupSize: tierParticipants.length,
    finalPlacement: hasGroup
      ? rankAtDate(tierParticipants, userId, activeEnd).placement
      : 0,
    midPlacement:
      hasGroup && midKey <= todayKey
        ? rankAtDate(tierParticipants, userId, midKey).placement
        : 0,
    top3WeekEnds: top3WeekEndStreak(
      tierParticipants,
      userId,
      startKey,
      endKey,
      todayKey,
    ),
  };
}

// ====================================================================
// evaluate() — returnerar id:n på alla badgar som är uppnådda
// ====================================================================

export function evaluate(state: ChallengeState): ReadonlySet<string> {
  const earned = new Set<string>();
  const grant = (id: string, met: boolean) => {
    if (met) earned.add(id);
  };

  const hasDayAt = (amount: number) => {
    let found = false;
    state.dayTotals.forEach((value) => {
      if (value === amount) found = true;
    });
    return found;
  };

  // Streaker
  grant("streak.7", state.longestStreak >= 7);
  grant("streak.14", state.longestStreak >= 14);
  grant("streak.21", state.longestStreak >= 21);
  grant("streak.30", state.longestStreak >= 30);
  grant("streak.60", state.longestStreak >= 60);

  // Perfekt runda (kräver slutfört fönstre + noll missade dagar)
  grant("perfect.run", state.windowComplete && state.daysMissed === 0);

  // Volym
  grant("reps.500", state.totalReps >= 500);
  grant("reps.1k", state.totalReps >= 1000);
  grant("reps.5k", state.totalReps >= 5000);

  // Ascent — ren volym: alla trappsteg går på totala reps, oavsett vald nivå.
  // (Nivåbyten påverkar aldrig badgarna — och badgar tas aldrig ifrån.)
  ACHIEVEMENTS.forEach((badge) => {
    if (
      badge.family === "ascent" &&
      badge.goal !== null &&
      state.totalReps >= badge.goal
    ) {
      earned.add(badge.id);
    }
  });

  // Tävlan (kräver grupp ≥ 2)
  const hasRealGroup = state.groupSize >= 2;
  grant(
    "comp.plot_twist",
    hasRealGroup &&
      state.windowComplete &&
      state.midPlacement > state.groupSize / 2 &&
      state.finalPlacement <= 3,
  );
  grant("comp.three_week_tyrant", hasRealGroup && state.top3WeekEnds >= 3);
  grant(
    "comp.throne",
    hasRealGroup && state.windowComplete && state.finalPlacement === 1,
  );

  // Trolling (exakta dagssummor, dagsens sista värde gäller)
  grant("troll.1", hasDayAt(1));
  grant("troll.2", hasDayAt(2));
  grant("troll.3", hasDayAt(3));
  grant("troll.42", hasDayAt(42));
  grant("troll.666", hasDayAt(666));

  // Special
  grant("xp.100", state.earnedXp >= 100);
  grant("day.combo", state.risingDays >= 3);
  grant("date.dec24", state.dayTotals.has(DEC_24_KEY));
  grant("day.monster", state.maxDay >= MONSTER_DAY_TARGET);

  return earned;
}

// ====================================================================
// progressFor() — progressrad för pågående badgar; null = bara hint
// ====================================================================

export type BadgeProgress =
  | { kind: "count"; current: number; target: number }
  | { kind: "text"; text: string };

export function progressFor(
  id: string,
  state: ChallengeState,
): BadgeProgress | null {
  switch (id) {
    case "streak.7":
      return { kind: "count", current: state.longestStreak, target: 7 };
    case "streak.14":
      return { kind: "count", current: state.longestStreak, target: 14 };
    case "streak.21":
      return { kind: "count", current: state.longestStreak, target: 21 };
    case "streak.30":
      return { kind: "count", current: state.longestStreak, target: 30 };
    case "streak.60":
      return { kind: "count", current: state.longestStreak, target: 60 };
    case "reps.500":
      return { kind: "count", current: state.totalReps, target: 500 };
    case "reps.1k":
      return { kind: "count", current: state.totalReps, target: 1000 };
    case "reps.5k":
      return { kind: "count", current: state.totalReps, target: 5000 };
    case "xp.100":
      return { kind: "count", current: state.earnedXp, target: 100 };
    case "day.monster":
      return { kind: "count", current: state.maxDay, target: MONSTER_DAY_TARGET };
    case "ascent.bronze":
    case "ascent.silver":
    case "ascent.gold":
    case "ascent.platinum":
    case "ascent.mythic": {
      const goal = ACHIEVEMENT_BY_ID.get(id)?.goal;
      if (!goal) return null;
      return { kind: "count", current: state.totalReps, target: goal };
    }
    case "perfect.run":
      return {
        kind: "text",
        text:
          state.daysMissed === 0
            ? "Inga missade dagar än"
            : `${state.daysMissed} missade dagar`,
      };
    case "comp.throne":
    case "comp.three_week_tyrant":
      return state.groupSize >= 2
        ? { kind: "text", text: `Du är #${state.finalPlacement} i din grupp` }
        : null;
    case "comp.plot_twist":
      return state.groupSize >= 2 && state.midPlacement > 0
        ? { kind: "text", text: `Du var #${state.midPlacement} i halvtid` }
        : null;
    default:
      // troll.* och date.dec24 — hinten är skämmen, ingen progress
      return null;
  }
}

// ====================================================================
// Vägghjälpare (rena)
// ====================================================================

export interface OwnedAchievement {
  achievementId: string;
  unlockedAt: string;
  seenAt: string | null;
}

export type BadgeCardState = "earned" | "progress" | "locked";

export interface WallBadge {
  achievement: Achievement;
  state: BadgeCardState;
  progress: BadgeProgress | null;
  unlockedAt?: string;
}

/** Mappar katalogen till väggkort baserat på tillstånd + ägda badgar. */
export function buildWallBadges(
  state: ChallengeState,
  owned: ReadonlyArray<OwnedAchievement>,
): WallBadge[] {
  const ownedById = new Map(owned.map((entry) => [entry.achievementId, entry]));
  return ACHIEVEMENTS.map((badge) => {
    const row = ownedById.get(badge.id);
    if (row) {
      return {
        achievement: badge,
        state: "earned" as const,
        progress: null,
        unlockedAt: row.unlockedAt,
      };
    }
    const progress = progressFor(badge.id, state);
    return progress
      ? { achievement: badge, state: "progress" as const, progress }
      : { achievement: badge, state: "locked" as const, progress: null };
  });
}
