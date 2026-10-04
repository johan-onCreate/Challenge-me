import { describe, expect, it } from "vitest";
import type { ChallengeState } from "./achievements";
import {
  fetchOwnedAchievements,
  grantAchievements,
  markAchievementsSeen,
  syncAchievements,
} from "./useAchievementSync";

interface OwnedRow {
  achievement_id: string;
  unlocked_at: string;
  seen_at: string | null;
}

interface FakeCalls {
  tables: string[];
  upserts: Array<{ rows: Array<Record<string, unknown>>; onConflict?: string }>;
  updates: Array<Record<string, unknown>>;
}

/**
 * Minimal meningsfull efterbildning av supabase-klientens kedjestyling:
 * select/eq/is/update returnerar kedjan, upsert löser direkt, och
 * kedjan är then-able för await.
 */
function createFakeClient(
  ownedRows: OwnedRow[] = [],
  selectError: Error | null = null,
) {
  const calls: FakeCalls = { tables: [], upserts: [], updates: [] };

  const makeChain = () => {
    const terminal = () =>
      Promise.resolve({ data: selectError ? null : ownedRows, error: selectError });
    const chain: {
      select: () => typeof chain;
      eq: () => typeof chain;
      is: () => typeof chain;
      update: (value: Record<string, unknown>) => typeof chain;
      upsert: (
        rows: Array<Record<string, unknown>>,
        options?: { onConflict?: string },
      ) => Promise<{ data: unknown; error: null }>;
      then: (
        onfulfilled?: ((value: { data: unknown; error: unknown }) => unknown) | null,
        onrejected?: ((error: unknown) => unknown) | null,
      ) => Promise<unknown>;
    } = {
      select: () => chain,
      eq: () => chain,
      is: () => chain,
      update: (value) => {
        calls.updates.push(value);
        return chain;
      },
      upsert: (rows, options) => {
        calls.upserts.push({ rows, onConflict: options?.onConflict });
        return Promise.resolve({ data: rows, error: null });
      },
      then: (onfulfilled, onrejected) =>
        terminal().then(onfulfilled, onrejected),
    };
    return chain;
  };

  const client = {
    from: (table: string) => {
      calls.tables.push(table);
      if (table !== "user_achievements") {
        throw new Error(`Oväntad tabell: ${table}`);
      }
      return makeChain();
    },
  };

  return { client, calls };
}

function makeState(overrides: Partial<ChallengeState> = {}): ChallengeState {
  return {
    challengeId: 1,
    startKey: "2026-10-01",
    endKey: "2026-10-31",
    todayKey: "2026-10-15",
    totalReps: 600,
    earnedXp: 120,
    longestStreak: 10,
    daysMissed: 0,
    windowComplete: false,
    dayTotals: new Map<string, number>([["2026-10-05", 1]]),
    risingDays: 4,
    maxDay: 300,
    chosenTier: 1000,
    groupSize: 0,
    finalPlacement: 0,
    midPlacement: 0,
    top3WeekEnds: 0,
    ...overrides,
  };
}

describe("fetchOwnedAchievements", () => {
  it("maps rows to OwnedAchievement", async () => {
    const { client } = createFakeClient([
      {
        achievement_id: "troll.1",
        unlocked_at: "2026-10-05T10:00:00Z",
        seen_at: null,
      },
      {
        achievement_id: "xp.100",
        unlocked_at: "2026-10-06T11:30:00Z",
        seen_at: "2026-10-07T09:00:00Z",
      },
    ]);
    const owned = await fetchOwnedAchievements(client as never, "u-me", 1);
    expect(owned).toEqual([
      {
        achievementId: "troll.1",
        unlockedAt: "2026-10-05T10:00:00Z",
        seenAt: null,
      },
      {
        achievementId: "xp.100",
        unlockedAt: "2026-10-06T11:30:00Z",
        seenAt: "2026-10-07T09:00:00Z",
      },
    ]);
  });

  it("throws on query error", async () => {
    const boom = new Error("Böj ner");
    const { client } = createFakeClient([], boom);
    await expect(
      fetchOwnedAchievements(client as never, "u-me", 1),
    ).rejects.toThrow("Böj ner");
  });
});

describe("grantAchievements", () => {
  it("is a no-op for an empty list", async () => {
    const { client, calls } = createFakeClient();
    await grantAchievements(client as never, "u-me", 1, []);
    expect(calls.upserts).toEqual([]);
  });

  it("upserts with the composite key as conflict target", async () => {
    const { client, calls } = createFakeClient();
    await grantAchievements(client as never, "u-me", 7, ["troll.1", "xp.100"]);
    expect(calls.upserts).toEqual([
      {
        rows: [
          { user_id: "u-me", challenge_id: 7, achievement_id: "troll.1" },
          { user_id: "u-me", challenge_id: 7, achievement_id: "xp.100" },
        ],
        onConflict: "user_id,challenge_id,achievement_id",
      },
    ]);
  });
});

describe("syncAchievements", () => {
  it("grants only the missing badges and reports them as new", async () => {
    const { client, calls } = createFakeClient([
      { achievement_id: "reps.500", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
    ]);
    // Tillståndet uppfyller bl.a. reps.500, reps.1k? Nej (600 < 1000),
    // xp.100, streak.7, day.combo, troll.1, day.monster
    const result = await syncAchievements(client as never, "u-me", 1, makeState());

    const freshIds = calls.upserts[0]?.rows.map(
      (row) => row.achievement_id,
    ) as string[];
    expect(freshIds).not.toContain("reps.500");
    expect(freshIds).toContain("xp.100");
    expect(freshIds).toContain("streak.7");
    expect(freshIds).toContain("troll.1");

    const ownedIds = result.owned.map((entry) => entry.achievementId);
    expect(ownedIds).toContain("reps.500");
    expect(ownedIds).toContain("xp.100");
    expect(result.owned).toHaveLength(ownedIds.length);

    expect(result.newlyUnlocked.map((badge) => badge.id)).toEqual(freshIds);
    expect(result.newlyUnlocked.every((badge) => badge.title.length > 0)).toBe(true);
  });

  it("returns an empty unlock list when nothing is new", async () => {
    const satisfied = makeState();
    // Inga uppfyllda badgar utom dem som redan är ägda
    const { client, calls } = createFakeClient([
      { achievement_id: "xp.100", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
      { achievement_id: "streak.7", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
      { achievement_id: "troll.1", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
      { achievement_id: "day.combo", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
      { achievement_id: "day.monster", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
      { achievement_id: "reps.500", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
    ]);
    const result = await syncAchievements(client as never, "u-me", 1, satisfied);
    expect(calls.upserts).toEqual([]);
    expect(result.newlyUnlocked).toEqual([]);
    expect(result.owned).toHaveLength(6);
  });
});

describe("markAchievementsSeen", () => {
  it("updates only unseen rows for the user and challenge", async () => {
    const { client, calls } = createFakeClient();
    await markAchievementsSeen(client as never, "u-me", 7);
    expect(calls.updates).toHaveLength(1);
    expect(calls.updates[0].seen_at).toBeTruthy();
    expect(calls.tables).toEqual(["user_achievements"]);
  });
});
